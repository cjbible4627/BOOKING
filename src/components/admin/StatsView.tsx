'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room, GroupStage } from '@/lib/types'
import { bookingsInRange } from '@/lib/storage'
import { getRooms } from '@/lib/admin-storage'
import { GROUP_COLORS, GROUP_STAGES } from '@/lib/constants'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

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

function hours(b: Booking): number {
  return Math.max(0, parseInt(b.end_time) - parseInt(b.start_time))
}

export default function StatsView() {
  const [rooms, setRooms]       = useState<Room[]>([])
  const [preset, setPreset]     = useState<Preset>('thisMonth')
  const [from, setFrom]         = useState(() => getMonthRange(0)[0])
  const [to, setTo]             = useState(() => getMonthRange(0)[1])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(false)
  const [fetched, setFetched]   = useState(false)

  useEffect(() => { getRooms().then(setRooms) }, [])
  // 최초 진입 시 이번 달 자동 조회
  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── 집계 ──────────────────────────────────────────
  const total      = bookings.length
  const totalHours = bookings.reduce((s, b) => s + hours(b), 0)
  const totalMembers = bookings.reduce((s, b) => s + b.member_count, 0)
  const avgMembers = total > 0 ? Math.round((totalMembers / total) * 10) / 10 : 0

  // 방별
  const byRoom = rooms.map(r => ({
    id: r.id,
    name: r.name,
    count: bookings.filter(b => b.room_id === r.id).length,
  }))
  // rooms에 없는 room_id 보정
  bookings.forEach(b => {
    if (!byRoom.some(r => r.id === b.room_id)) {
      byRoom.push({ id: b.room_id, name: roomName(b.room_id), count: bookings.filter(x => x.room_id === b.room_id).length })
    }
  })
  const maxRoom = Math.max(1, ...byRoom.map(r => r.count))

  // 그룹과정별
  const byStage = GROUP_STAGES.map(s => ({
    stage: s as GroupStage,
    count: bookings.filter(b => b.group_stage === s).length,
  }))
  const maxStage = Math.max(1, ...byStage.map(s => s.count))

  // 요일별
  const byDow = DOW.map((_, i) => bookings.filter(b => new Date(b.date + 'T00:00:00').getDay() === i).length)
  const maxDow = Math.max(1, ...byDow)

  // 시간대별 (08~23)
  const slots = Array.from({ length: 16 }, (_, i) => 8 + i)
  const byHour = slots.map(h => bookings.filter(b => h >= parseInt(b.start_time) && h < parseInt(b.end_time)).length)
  const maxHour = Math.max(1, ...byHour)
  const peakHour = byHour.indexOf(maxHour)

  return (
    <div className="px-4 py-4 max-w-2xl">
      <p className="text-xs text-gray-500 mb-4">기간별 예약 통계를 확인할 수 있습니다.</p>

      {/* 기간 프리셋 */}
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

      {fetched && (
        total === 0 ? (
          <div className="text-center text-gray-300 text-sm py-10 bg-gray-50 rounded-2xl">
            해당 기간에 예약이 없습니다.
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-blue-700">{total}</p>
                <p className="text-[11px] font-semibold text-blue-500 mt-1">총 예약</p>
              </div>
              <div className="rounded-2xl border-2 border-green-100 bg-green-50 px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-green-700">{totalHours}</p>
                <p className="text-[11px] font-semibold text-green-500 mt-1">총 이용시간(h)</p>
              </div>
              <div className="rounded-2xl border-2 border-purple-100 bg-purple-50 px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-purple-700">{avgMembers}</p>
                <p className="text-[11px] font-semibold text-purple-500 mt-1">평균 인원</p>
              </div>
            </div>

            {/* 방별 */}
            <section className="mb-6">
              <p className="text-sm font-bold text-gray-800 mb-3">방별 예약</p>
              <div className="flex flex-col gap-2.5">
                {byRoom.map(r => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span className="w-20 text-xs font-semibold text-gray-700 truncate flex-shrink-0">{r.name}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-lg transition-all"
                        style={{ width: `${(r.count / maxRoom) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-gray-800 flex-shrink-0">{r.count}건</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 그룹과정별 */}
            <section className="mb-6">
              <p className="text-sm font-bold text-gray-800 mb-3">그룹과정별 예약</p>
              <div className="flex flex-col gap-2.5">
                {byStage.map(s => (
                  <div key={s.stage} className="flex items-center gap-2">
                    <span className={`w-16 text-[11px] font-bold px-2 py-0.5 rounded-full text-center flex-shrink-0 ${GROUP_COLORS[s.stage].badge}`}>
                      {s.stage}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all ${GROUP_COLORS[s.stage].badge}`}
                        style={{ width: `${(s.count / maxStage) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-gray-800 flex-shrink-0">{s.count}건</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 요일별 */}
            <section className="mb-6">
              <p className="text-sm font-bold text-gray-800 mb-3">요일별 예약</p>
              <div className="flex items-end gap-1.5 h-28">
                {byDow.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] font-bold text-gray-700">{c}</span>
                    <div
                      className={`w-full rounded-t-md transition-all ${i === 0 ? 'bg-red-400' : i === 6 ? 'bg-blue-400' : 'bg-gray-400'}`}
                      style={{ height: `${(c / maxDow) * 100}%`, minHeight: c > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[11px] font-semibold text-gray-500">{DOW[i]}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 시간대별 */}
            <section className="mb-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-800">시간대별 이용</p>
                <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  피크 {String(slots[peakHour]).padStart(2, '0')}:00
                </span>
              </div>
              <div className="flex items-end gap-[3px] h-24">
                {byHour.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${String(slots[i]).padStart(2, '0')}:00 — ${c}건`}>
                    <div
                      className={`w-full rounded-t-sm transition-all ${i === peakHour && c > 0 ? 'bg-orange-500' : 'bg-blue-300'}`}
                      style={{ height: `${(c / maxHour) * 100}%`, minHeight: c > 0 ? '3px' : '0' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-[9px] text-gray-400 font-medium">
                <span>08시</span><span>12시</span><span>16시</span><span>20시</span><span>23시</span>
              </div>
            </section>
          </>
        )
      )}
    </div>
  )
}
