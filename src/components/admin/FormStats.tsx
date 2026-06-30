'use client'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import type { FormDef, FormField, FormRound, FormSubmission } from '@/lib/form-types'
import { CHOICE_TYPES } from '@/lib/form-types'
import { getFields, getRounds } from '@/lib/form-storage'
import { fetchSubmissions } from '@/lib/form-client'

interface Props { form: FormDef }

function dateOf(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE') // YYYY-MM-DD (local)
}

interface Dist { label: string; type: string; rows: { option: string; count: number }[] }

export default function FormStats({ form }: Props) {
  const [fields, setFields] = useState<FormField[]>([])
  const [rounds, setRounds] = useState<FormRound[]>([])
  const [allSubs, setAllSubs] = useState<FormSubmission[]>([])
  const [roundFilter, setRoundFilter] = useState<string>('all') // 'all' | roundId | 'none'
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const [fs, rs, ss] = await Promise.all([getFields(form.id), getRounds(form.id), fetchSubmissions(form.id)])
      setFields(fs); setRounds(rs); setAllSubs(ss)
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
  const subs = allSubs.filter(s =>
    roundFilter === 'all' ? true
    : roundFilter === 'none' ? !s.round_id
    : s.round_id === roundFilter,
  )

  const total = subs.length

  // 일별 추이
  const dailyMap = new Map<string, number>()
  for (const s of subs) {
    const d = dateOf(s.created_at)
    dailyMap.set(d, (dailyMap.get(d) ?? 0) + 1)
  }
  const daily = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const maxDaily = Math.max(1, ...daily.map(d => d[1]))

  // 질문별 응답 분포 (선택형)
  const dists: Dist[] = fields
    .filter(f => CHOICE_TYPES.includes(f.type))
    .map(f => {
      const counts = new Map<string, number>()
      f.options.forEach(o => counts.set(o, 0))
      for (const s of subs) {
        const ans = s.answers.fields.find(a => a.field_id === f.id)
        if (!ans) continue
        const v = ans.value
        const picked = Array.isArray(v) ? v : (v === null || v === undefined || v === '' ? [] : [String(v)])
        for (const p of picked) counts.set(p, (counts.get(p) ?? 0) + 1)
      }
      return { label: f.label || '(제목 없음)', type: f.type, rows: [...counts.entries()].map(([option, count]) => ({ option, count })) }
    })

  function makeHeaderSheet(data: (string | number)[][]): XLSX.WorkSheet {
    const ws = XLSX.utils.aoa_to_sheet(data)
    const ncols = data[0]?.length ?? 1
    ws['!cols'] = Array.from({ length: ncols }, (_, i) => ({ wch: [20, 18, 8, 8][i] ?? 14 }))
    for (let c = 0; c < ncols; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      if (ws[ref]) ws[ref].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '1B5FA3' } },
        alignment: { horizontal: 'center' },
      }
    }
    return ws
  }

  function fmtValue(type: string, v: unknown): string {
    if (type === 'agree') return v === true ? '동의' : '미동의'
    if (type === 'checkbox') return Array.isArray(v) ? (v as string[]).join(', ') : ''
    if (type === 'file') return v ? String(v) : '(없음)'
    if (type === 'group') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return ''
      return Object.entries(v as Record<string, string>).map(([k, val]) => `${k}: ${val}`).join(' / ')
    }
    if (v === null || v === undefined) return ''
    return String(v)
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new()
    const suffix = roundFilter === 'all' ? '' : roundFilter === 'none' ? '_미지정' : `_${roundName(roundFilter)}`
    const today = new Date().toLocaleDateString('sv-SE')

    // ① 요약
    const summaryData: (string | number)[][] = [
      ['항목', '값'],
      ['신청서', form.title],
      ['필터', roundFilter === 'all' ? '전체' : roundFilter === 'none' ? '미지정' : roundName(roundFilter)],
      ['총 신청', total],
    ]
    XLSX.utils.book_append_sheet(wb, makeHeaderSheet(summaryData), '요약')

    // ② 전체 신청 목록
    if (subs.length > 0) {
      const labels: string[] = []
      for (const s of subs) {
        for (const f of s.answers.fields) {
          if (!labels.includes(f.label || '(제목 없음)')) labels.push(f.label || '(제목 없음)')
        }
      }
      const listHeaders = [...(useRounds ? ['회차'] : []), ...labels, '제출일시']
      const listRows = subs.map(s => {
        const byLabel = new Map(s.answers.fields.map(f => [f.label || '(제목 없음)', fmtValue(f.type, f.value)]))
        return [
          ...(useRounds ? [roundName(s.round_id)] : []),
          ...labels.map(l => byLabel.get(l) ?? ''),
          new Date(s.created_at).toLocaleString('ko-KR'),
        ]
      })
      const listWs = makeHeaderSheet([listHeaders, ...listRows])
      listWs['!cols'] = listHeaders.map(h => ({ wch: Math.max(10, h.length + 4) }))
      listWs['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
      for (let r = 1; r <= listRows.length; r++) {
        const zebra = r % 2 === 0 ? 'F5F7FA' : 'FFFFFF'
        listHeaders.forEach((_, ci) => {
          const ref = XLSX.utils.encode_cell({ r, c: ci })
          if (listWs[ref]) listWs[ref].s = {
            fill: { patternType: 'solid', fgColor: { rgb: zebra } },
            alignment: { vertical: 'center', wrapText: true },
            border: { bottom: { style: 'thin', color: { rgb: 'E0E0E0' } } },
          }
        })
      }
      XLSX.utils.book_append_sheet(wb, listWs, '신청목록')
    }

    // ③ 질문별 분포
    if (dists.length > 0) {
      const distRows: (string | number)[][] = [['질문', '옵션', '응답수', '비율(%)']]
      for (const d of dists) {
        const sum = d.rows.reduce((s, r) => s + r.count, 0)
        d.rows.forEach((r, i) => {
          distRows.push([i === 0 ? d.label : '', r.option, r.count, sum ? Math.round((r.count / sum) * 1000) / 10 : 0])
        })
      }
      XLSX.utils.book_append_sheet(wb, makeHeaderSheet(distRows), '질문별분포')
    }

    // ④ 일별 추이
    const dailyRows: (string | number)[][] = [['날짜', '신청수'], ...daily.map(([d, c]) => [d, c])]
    XLSX.utils.book_append_sheet(wb, makeHeaderSheet(dailyRows), '일별추이')

    XLSX.writeFile(wb, `${form.title}_신청통계${suffix}_${today}.xlsx`)
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
  if (error)   return <div className="py-10 mx-4 text-center text-sm text-red-500 bg-red-50 rounded-2xl px-4">{error}</div>

  return (
    <div className="px-4 py-4 max-w-2xl">
      {/* 회차 필터 */}
      {useRounds && rounds.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-500">회차</span>
          <select
            value={roundFilter}
            onChange={e => setRoundFilter(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">전체</option>
            {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            <option value="none">미지정</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">총 신청 <span className="font-bold text-gray-900">{total}건</span></p>
        <button
          onClick={downloadExcel}
          disabled={total === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform disabled:opacity-40"
        >
          ⬇ 통계 엑셀
        </button>
      </div>

      {total === 0 ? (
        <div className="text-center text-gray-300 text-sm py-12 bg-gray-50 rounded-2xl">아직 제출된 신청이 없습니다.</div>
      ) : (
        <>
          {/* 일별 추이 */}
          <section className="mb-6">
            <p className="text-sm font-bold text-gray-800 mb-3">일별 신청 추이</p>
            <div className="flex items-end gap-1.5 h-28 overflow-x-auto pb-1">
              {daily.map(([d, c]) => (
                <div key={d} className="flex flex-col items-center gap-1 h-full justify-end flex-shrink-0" style={{ minWidth: 28 }} title={`${d}: ${c}건`}>
                  <span className="text-[10px] font-bold text-gray-700">{c}</span>
                  <div className="w-5 rounded-t-md bg-blue-500" style={{ height: `${(c / maxDaily) * 100}%`, minHeight: 4 }} />
                  <span className="text-[9px] text-gray-400">{d.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 질문별 분포 */}
          {dists.length === 0 ? (
            <p className="text-xs text-gray-400">선택형 질문이 없어 응답 분포를 표시할 수 없습니다.</p>
          ) : (
            <section className="flex flex-col gap-5">
              {dists.map((d, di) => {
                const sum = d.rows.reduce((s, r) => s + r.count, 0)
                const max = Math.max(1, ...d.rows.map(r => r.count))
                return (
                  <div key={di}>
                    <p className="text-sm font-bold text-gray-800 mb-2">{d.label}</p>
                    <div className="flex flex-col gap-2">
                      {d.rows.map((r, ri) => (
                        <div key={ri} className="flex items-center gap-2">
                          <span className="w-24 text-xs font-medium text-gray-600 truncate flex-shrink-0">{r.option}</span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-md" style={{ width: `${(r.count / max) * 100}%` }} />
                          </div>
                          <span className="w-16 text-right text-xs font-bold text-gray-800 flex-shrink-0">
                            {r.count}건 <span className="text-gray-400 font-medium">{sum ? Math.round((r.count / sum) * 100) : 0}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}
    </div>
  )
}
