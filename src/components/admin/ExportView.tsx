'use client'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import type { Booking, Room } from '@/lib/types'
import type { GroupStage } from '@/lib/types'
import { bookingsInRange } from '@/lib/storage'
import { getRooms } from '@/lib/admin-storage'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

// Excel cell colors (light fill per group stage)
const XL_BG: Record<GroupStage, string> = {
  '창세기':   'B5D4F4',
  '탈출기':   'C0DD97',
  '마르코':   'F7C1C1',
  '요한':     'D3D1C7',
  '사도행전': 'FAC775',
  '이사야':   'F4C0D1',
}
const XL_FG: Record<GroupStage, string> = {
  '창세기':   '0C447C',
  '탈출기':   '27500A',
  '마르코':   '791F1F',
  '요한':     '2C2C2A',
  '사도행전': '412402',
  '이사야':   '4B1528',
}
// Preview row bg (lighter)
const PREVIEW_BG: Record<GroupStage, string> = {
  '창세기':   '#E6F1FB',
  '탈출기':   '#EAF3DE',
  '마르코':   '#FCEBEB',
  '요한':     '#F1EFE8',
  '사도행전': '#FAEEDA',
  '이사야':   '#FBEAF0',
}

type Preset = 'thisMonth' | 'lastMonth' | 'thisWeek' | 'custom'

function getMonthRange(offset = 0): [string, string] {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  const y = d.getFullYear(), m = d.getMonth()
  const last = new Date(y, m + 1, 0).getDate()
  const pad  = (n: number) => String(n).padStart(2, '0')
  return [`${y}-${pad(m + 1)}-01`, `${y}-${pad(m + 1)}-${pad(last)}`]
}

function getWeekRange(): [string, string] {
  const d   = new Date()
  const dow = d.getDay()
  const sun = new Date(d); sun.setDate(d.getDate() - dow)
  const sat = new Date(d); sat.setDate(d.getDate() + (6 - dow))
  return [sun.toLocaleDateString('sv-SE'), sat.toLocaleDateString('sv-SE')]
}

const HEADERS = ['날짜', '요일', '시작', '종료', '방', '그룹과정', '리더', '세례명', '인원', '예약일시']
const COL_W   = [13, 5, 7, 7, 12, 10, 10, 10, 6, 20]

export default function ExportView() {
  const [rooms, setRooms]       = useState<Room[]>([])
  const [preset, setPreset]     = useState<Preset>('thisMonth')
  const [from, setFrom]         = useState(() => getMonthRange(0)[0])
  const [to, setTo]             = useState(() => getMonthRange(0)[1])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(false)
  const [fetched, setFetched]   = useState(false)

  useEffect(() => { getRooms().then(setRooms) }, [])

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p === 'thisMonth') { const [f, t] = getMonthRange(0);  setFrom(f); setTo(t) }
    if (p === 'lastMonth') { const [f, t] = getMonthRange(-1); setFrom(f); setTo(t) }
    if (p === 'thisWeek')  { const [f, t] = getWeekRange();    setFrom(f); setTo(t) }
  }

  async function fetchData() {
    if (!from || !to || from > to) return
    setLoading(true)
    const data = await bookingsInRange(from, to)
    setBookings(data)
    setFetched(true)
    setLoading(false)
  }

  function roomName(id: string) {
    return rooms.find(r => r.id === id)?.name ?? id
  }

  function downloadExcel() {
    if (bookings.length === 0) return

    // Build data
    const rows: (string | number)[][] = [HEADERS]
    for (const b of bookings) {
      const d = new Date(b.date + 'T00:00:00')
      rows.push([
        b.date,
        DOW[d.getDay()],
        b.start_time,
        b.end_time,
        roomName(b.room_id),
        b.group_stage,
        b.leader_name,
        b.baptismal_name,
        b.member_count,
        new Date(b.created_at).toLocaleString('ko-KR'),
      ])
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws['!cols'] = COL_W.map(wch => ({ wch }))

    // Freeze header row
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

    // Header styles
    HEADERS.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: ci })
      if (!ws[ref]) ws[ref] = { v: HEADERS[ci], t: 's' }
      ws[ref].s = {
        font:      { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill:      { patternType: 'solid', fgColor: { rgb: '1B5FA3' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    })

    // Data row styles
    bookings.forEach((b, ri) => {
      const row = ri + 1
      const zebra = row % 2 === 0 ? 'F5F7FA' : 'FFFFFF'

      HEADERS.forEach((_, ci) => {
        const ref = XLSX.utils.encode_cell({ r: row, c: ci })
        if (!ws[ref]) return
        const isGroup = ci === 5

        ws[ref].s = {
          fill: {
            patternType: 'solid',
            fgColor: { rgb: isGroup ? XL_BG[b.group_stage] : zebra },
          },
          font: isGroup
            ? { bold: true, color: { rgb: XL_FG[b.group_stage] } }
            : { color: { rgb: '333333' } },
          alignment: {
            horizontal: [1, 2, 3, 8].includes(ci) ? 'center' : 'left',
            vertical: 'center',
          },
          border: {
            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
            right:  { style: 'thin', color: { rgb: 'E0E0E0' } },
          },
        }
      })
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '예약현황')
    XLSX.writeFile(wb, `예약현황_${from}_${to}.xlsx`)
  }

  return (
    <div className="px-4 py-4 max-w-2xl">

      {/* 기간 프리셋 */}
      <p className="text-sm font-bold text-gray-800 mb-3">기간 선택</p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {([
          ['thisMonth', '이번 달'],
          ['lastMonth', '지난 달'],
          ['thisWeek',  '이번 주'],
          ['custom',    '직접 입력'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => applyPreset(id)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              preset === id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 날짜 입력 */}
      <div className="flex gap-2 mb-3">
        <label className="flex-1">
          <span className="text-xs text-gray-400 mb-1 block">시작일</span>
          <input
            type="date"
            value={from}
            onChange={e => { setFrom(e.target.value); setPreset('custom') }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </label>
        <label className="flex-1">
          <span className="text-xs text-gray-400 mb-1 block">종료일</span>
          <input
            type="date"
            value={to}
            onChange={e => { setTo(e.target.value); setPreset('custom') }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </label>
      </div>

      <button
        onClick={fetchData}
        disabled={loading || !from || !to || from > to}
        className="w-full py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium mb-5 disabled:opacity-40 hover:bg-gray-700"
      >
        {loading ? '조회 중...' : '조회'}
      </button>

      {/* 결과 */}
      {fetched && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              조회된 예약&nbsp;
              <span className="font-bold text-gray-900">{bookings.length}건</span>
            </p>
            {bookings.length > 0 && (
              <button
                onClick={downloadExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-transform"
              >
                ⬇ 엑셀 다운로드
              </button>
            )}
          </div>

          {bookings.length === 0 ? (
            <div className="text-center text-gray-300 text-sm py-10 bg-gray-50 rounded-2xl">
              해당 기간에 예약이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="border-collapse text-xs" style={{ minWidth: '520px' }}>
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {['날짜', '요일', '시작', '종료', '방', '그룹과정', '리더', '세례명', '인원'].map(h => (
                      <th key={h} className="px-2 py-2 text-center font-semibold whitespace-nowrap border-r border-blue-500 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => {
                    const d = new Date(b.date + 'T00:00:00')
                    return (
                      <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100 whitespace-nowrap">{b.date}</td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100">{DOW[d.getDay()]}</td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100">{b.start_time}</td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100">{b.end_time}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100 whitespace-nowrap">{roomName(b.room_id)}</td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: PREVIEW_BG[b.group_stage],
                              color: '#' + XL_FG[b.group_stage],
                            }}
                          >
                            {b.group_stage}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 border-b border-gray-100 whitespace-nowrap">{b.leader_name}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100 whitespace-nowrap">{b.baptismal_name}</td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100">{b.member_count}명</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
