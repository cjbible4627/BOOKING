'use client'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import type { FormDef, FormSubmission, AnswerEntry } from '@/lib/form-types'
import { fetchSubmissions, deleteSubmission } from '@/lib/form-client'

interface Props { form: FormDef }

// 답변 값을 사람이 읽는 문자열로
function fmtValue(e: AnswerEntry): string {
  const v = e.value
  if (e.type === 'agree') return v === true ? '동의' : '미동의'
  if (e.type === 'checkbox') return Array.isArray(v) ? v.join(', ') : ''
  if (v === null || v === undefined) return ''
  return String(v)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR')
}

export default function FormSubmissions({ form }: Props) {
  const [subs, setSubs]     = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setSubs(await fetchSubmissions(form.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '조회에 실패했습니다.')
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [form.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    await deleteSubmission(id)
    setSubs(prev => prev.filter(s => s.id !== id))
    setConfirmDel(null)
    setOpenId(null)
  }

  // 컬럼 = 모든 제출 스냅샷의 라벨 합집합(등장순) — 삭제된 질문 응답도 보존
  function buildTable(): { headers: string[]; rows: string[][] } {
    const labels: string[] = []
    for (const s of subs) {
      for (const f of s.answers.fields) {
        if (!labels.includes(f.label || '(제목 없음)')) labels.push(f.label || '(제목 없음)')
      }
    }
    const headers = [...labels, '제출일시']
    const rows = subs.map(s => {
      const byLabel = new Map(s.answers.fields.map(f => [f.label || '(제목 없음)', fmtValue(f)]))
      return [...labels.map(l => byLabel.get(l) ?? ''), fmtDate(s.created_at)]
    })
    return { headers, rows }
  }

  function downloadCSV() {
    if (subs.length === 0) return
    const { headers, rows } = buildTable()
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers, ...rows].map(r => r.map(esc).join(','))
    const today = new Date().toLocaleDateString('sv-SE')
    // BOM 추가 → 엑셀에서 한글 깨짐 방지
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${form.title}_신청목록_${today}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function downloadExcel() {
    if (subs.length === 0) return
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
    XLSX.writeFile(wb, `${form.title}_신청목록_${today}.xlsx`)
  }

  return (
    <div className="px-4 py-4 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          제출&nbsp;<span className="font-bold text-gray-900">{subs.length}건</span>
        </p>
        {subs.length > 0 && (
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
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500 bg-red-50 rounded-2xl px-4">{error}</div>
      ) : subs.length === 0 ? (
        <div className="text-center text-gray-300 text-sm py-12 bg-gray-50 rounded-2xl">
          아직 제출된 신청이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {subs.map((s, idx) => {
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
                      #{subs.length - idx} {first ? `· ${fmtValue(first)}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400">{fmtDate(s.created_at)}</p>
                  </div>
                  <span className="text-gray-400 text-xs ml-2">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 border-t border-gray-100">
                    <dl className="flex flex-col gap-2 pt-3">
                      {s.answers.fields.map((f, i) => (
                        <div key={i}>
                          <dt className="text-[11px] font-semibold text-gray-400">{f.label || '(제목 없음)'}</dt>
                          <dd className="text-sm text-gray-800 whitespace-pre-wrap">{fmtValue(f) || <span className="text-gray-300">—</span>}</dd>
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
