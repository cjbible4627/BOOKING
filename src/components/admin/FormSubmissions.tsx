'use client'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import type { FormDef, FormRound, FormSubmission, AnswerEntry } from '@/lib/form-types'
import { getRounds } from '@/lib/form-storage'
import { fetchSubmissions, deleteSubmission, cleanupFiles } from '@/lib/form-client'

interface Props { form: FormDef }

// 답변 값을 사람이 읽는 문자열로
function fmtValue(e: AnswerEntry): string {
  const v = e.value
  if (e.type === 'agree') return v === true ? '동의' : '미동의'
  if (e.type === 'checkbox') return Array.isArray(v) ? v.join(', ') : ''
  if (e.type === 'file') return v ? String(v) : '(없음)'
  if (v === null || v === undefined) return ''
  return String(v)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR')
}

export default function FormSubmissions({ form }: Props) {
  const [subs, setSubs]     = useState<FormSubmission[]>([])
  const [rounds, setRounds] = useState<FormRound[]>([])
  const [roundFilter, setRoundFilter] = useState<string>('all') // 'all' | roundId | 'none'
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [zipping, setZipping] = useState(false)
  const [indZipping, setIndZipping] = useState(false)
  const [confirmCleanup, setConfirmCleanup] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [ss, rs] = await Promise.all([fetchSubmissions(form.id), getRounds(form.id)])
      setSubs(ss)
      setRounds(rs)
    } catch (e) {
      setError(e instanceof Error ? e.message : '조회에 실패했습니다.')
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [form.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function roundName(id: string | null): string {
    if (!id) return '미지정'
    return rounds.find(r => r.id === id)?.name ?? '(삭제된 회차)'
  }

  const useRounds = form.open_mode === 'period'
  const filtered = subs.filter(s =>
    roundFilter === 'all' ? true
    : roundFilter === 'none' ? !s.round_id
    : s.round_id === roundFilter,
  )

  async function handleDelete(id: string) {
    await deleteSubmission(id)
    setSubs(prev => prev.filter(s => s.id !== id))
    setConfirmDel(null)
    setOpenId(null)
  }

  // 컬럼 = (회차) + 모든 제출 스냅샷의 라벨 합집합(등장순) + 제출일시
  function buildTable(): { headers: string[]; rows: string[][] } {
    const labels: string[] = []
    for (const s of filtered) {
      for (const f of s.answers.fields) {
        if (!labels.includes(f.label || '(제목 없음)')) labels.push(f.label || '(제목 없음)')
      }
    }
    const headers = [...(useRounds ? ['회차'] : []), ...labels, '제출일시']
    const rows = filtered.map(s => {
      const byLabel = new Map(s.answers.fields.map(f => [f.label || '(제목 없음)', fmtValue(f)]))
      return [
        ...(useRounds ? [roundName(s.round_id)] : []),
        ...labels.map(l => byLabel.get(l) ?? ''),
        fmtDate(s.created_at),
      ]
    })
    return { headers, rows }
  }

  function roundSuffix() {
    if (roundFilter === 'all') return ''
    if (roundFilter === 'none') return '_미지정'
    return `_${roundName(roundFilter)}`
  }

  function downloadCSV() {
    if (filtered.length === 0) return
    const { headers, rows } = buildTable()
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers, ...rows].map(r => r.map(esc).join(','))
    const today = new Date().toLocaleDateString('sv-SE')
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${form.title}_신청목록${roundSuffix()}_${today}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // 첨부파일 ZIP 다운로드
  async function downloadZip() {
    const fileEntries: { name: string; url: string }[] = []
    filtered.forEach((s, idx) => {
      s.answers.fields.forEach((f) => {
        if (f.type === 'file' && f.value && typeof f.value === 'string' && !f.value.startsWith('(')) {
          const rawName = decodeURIComponent(f.value.split('/').pop() ?? 'file')
          fileEntries.push({ name: `${filtered.length - idx}_${rawName}`, url: f.value })
        }
      })
    })
    if (fileEntries.length === 0) {
      alert('이 목록에 첨부 파일이 없습니다.')
      return
    }
    setZipping(true)
    try {
      const zip = new JSZip()
      await Promise.all(
        fileEntries.map(async ({ name, url }) => {
          const res = await fetch(url)
          if (res.ok) zip.file(name, await res.blob())
        }),
      )
      const blob = await zip.generateAsync({ type: 'blob' })
      const today = new Date().toLocaleDateString('sv-SE')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${form.title}_첨부파일${roundSuffix()}_${today}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert('ZIP 생성 중 오류가 발생했습니다.')
    }
    setZipping(false)
  }

  async function downloadIndividualZip() {
    if (filtered.length === 0) return
    setIndZipping(true)
    try {
      const zip = new JSZip()
      filtered.forEach((s, idx) => {
        const num = String(filtered.length - idx).padStart(3, '0')
        const firstVal = s.answers.fields.find(f => fmtValue(f).trim() !== '')
        const namePart = firstVal ? fmtValue(firstVal).slice(0, 20).replace(/[\\/:*?"<>|]/g, '_') : s.id.slice(0, 8)
        const roundPart = useRounds ? `[${roundName(s.round_id)}] ` : ''

        const lines: string[] = [
          `■ ${form.title}`,
          `${roundPart}제출일시: ${fmtDate(s.created_at)}`,
          '─'.repeat(40),
          '',
          ...s.answers.fields.map(f => `▶ ${f.label || '(제목 없음)'}\n${fmtValue(f) || '(없음)'}`),
          '',
          '─'.repeat(40),
        ]

        zip.file(`${num}_${namePart}.txt`, lines.join('\n'))
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const today = new Date().toLocaleDateString('sv-SE')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${form.title}_개별신청서${roundSuffix()}_${today}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert('ZIP 생성 중 오류가 발생했습니다.')
    }
    setIndZipping(false)
  }

  async function handleCleanup() {
    setCleaning(true)
    setCleanupResult(null)
    try {
      const rid = roundFilter === 'all' || roundFilter === 'none' ? undefined : roundFilter
      const result = await cleanupFiles(form.id, rid)
      setCleanupResult(`파일 ${result.deleted}개 삭제 완료 (제출 ${result.updated}건 업데이트)`)
      await load()
    } catch (e) {
      setCleanupResult(e instanceof Error ? e.message : '오류가 발생했습니다.')
    }
    setCleaning(false)
    setConfirmCleanup(false)
  }

  function downloadExcel() {
    if (filtered.length === 0) return
    const { headers: HEADERS, rows: dataRows } = buildTable()
    const rows: (string | number)[][] = [HEADERS, ...dataRows]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = HEADERS.map(h => ({ wch: h === '제출일시' ? 20 : Math.max(10, h.length + 4) }))
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    HEADERS.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: ci })
      if (ws[ref]) ws[ref].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '1B5FA3' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    })
    for (let r = 1; r < rows.length; r++) {
      const zebra = r % 2 === 0 ? 'F5F7FA' : 'FFFFFF'
      HEADERS.forEach((_, ci) => {
        const ref = XLSX.utils.encode_cell({ r, c: ci })
        if (ws[ref]) ws[ref].s = {
          fill: { patternType: 'solid', fgColor: { rgb: zebra } },
          font: { color: { rgb: '333333' } },
          alignment: { vertical: 'center', wrapText: true },
          border: { bottom: { style: 'thin', color: { rgb: 'E0E0E0' } } },
        }
      })
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '신청목록')
    const today = new Date().toLocaleDateString('sv-SE')
    XLSX.writeFile(wb, `${form.title}_신청목록${roundSuffix()}_${today}.xlsx`)
  }

  return (
    <div className="px-4 py-4 max-w-2xl">
      {/* 회차 필터 */}
      {useRounds && rounds.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-500">회차</span>
          <select
            value={roundFilter}
            onChange={e => { setRoundFilter(e.target.value); setOpenId(null) }}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">전체</option>
            {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            <option value="none">미지정</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          제출&nbsp;<span className="font-bold text-gray-900">{filtered.length}건</span>
          {roundFilter !== 'all' && <span className="text-gray-400"> / 전체 {subs.length}</span>}
        </p>
        {filtered.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              ⬇ CSV
            </button>
            <button
              onClick={downloadExcel}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              ⬇ 엑셀
            </button>
            <button
              onClick={downloadIndividualZip}
              disabled={indZipping}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
            >
              {indZipping ? '⏳ 압축 중...' : '📋 개별 ZIP'}
            </button>
          </div>
        )}
      </div>

      {/* 첨부파일 백업 & 정리 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={downloadZip}
          disabled={zipping || filtered.length === 0}
          className="flex items-center gap-1 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {zipping ? '⏳ 압축 중...' : '📦 첨부파일 ZIP'}
        </button>
        <button
          onClick={() => { setConfirmCleanup(true); setCleanupResult(null) }}
          disabled={filtered.length === 0}
          className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
        >
          🗑 파일 일괄 삭제
        </button>
      </div>

      {cleanupResult && (
        <div className="mb-3 px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-700 font-semibold">{cleanupResult}</div>
      )}

      {confirmCleanup && (
        <div className="mb-4 border-2 border-red-200 rounded-2xl p-4 bg-red-50">
          <p className="text-sm font-bold text-red-700 mb-1">⚠️ 첨부파일 일괄 삭제</p>
          <p className="text-xs text-red-600 mb-3">
            {roundFilter !== 'all' && roundFilter !== 'none'
              ? `[${roundName(roundFilter)}] 회차`
              : '현재 보이는 전체'} 첨부파일을 Storage에서 삭제하고, 답변에 "(파일 삭제됨)"으로 표시합니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmCleanup(false)}
              className="flex-1 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white"
            >
              취소
            </button>
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="flex-1 py-2 text-xs font-bold text-white bg-red-500 rounded-lg disabled:opacity-50"
            >
              {cleaning ? '삭제 중...' : '삭제 확인'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500 bg-red-50 rounded-2xl px-4">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-300 text-sm py-12 bg-gray-50 rounded-2xl">
          {subs.length === 0 ? '아직 제출된 신청이 없습니다.' : '이 회차에 제출이 없습니다.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((s, idx) => {
            const first = s.answers.fields.find(f => fmtValue(f).trim() !== '')
            const isOpen = openId === s.id
            return (
              <div key={s.id} className="rounded-2xl border-2 border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      #{filtered.length - idx} {first ? `· ${fmtValue(first)}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {fmtDate(s.created_at)}
                      {useRounds && <span className="ml-1.5 text-blue-500 font-semibold">· {roundName(s.round_id)}</span>}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs ml-2">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 border-t border-gray-100">
                    <dl className="flex flex-col gap-2 pt-3">
                      {s.answers.fields.map((f, i) => (
                        <div key={i}>
                          <dt className="text-[11px] font-semibold text-gray-400">{f.label || '(제목 없음)'}</dt>
                          <dd className="text-sm text-gray-800 whitespace-pre-wrap">
                            {f.type === 'file' && f.value ? (
                              <a
                                href={String(f.value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 font-semibold underline underline-offset-2"
                              >
                                📎 {decodeURIComponent(String(f.value).split('/').pop() ?? '파일 보기')}
                              </a>
                            ) : (
                              fmtValue(f) || <span className="text-gray-300">—</span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {confirmDel === s.id ? (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setConfirmDel(null)} className="flex-1 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg">취소</button>
                        <button onClick={() => handleDelete(s.id)} className="flex-1 py-2 text-xs font-bold text-white bg-red-500 rounded-lg">삭제 확인</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(s.id)} className="mt-3 text-xs font-bold text-red-500">제출 삭제</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
