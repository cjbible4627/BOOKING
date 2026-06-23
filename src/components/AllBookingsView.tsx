'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room } from '@/lib/types'
import type { GroupStage } from '@/lib/types'
import { bookingsInRange } from '@/lib/storage'
import { getRooms } from '@/lib/admin-storage'
import { GROUP_COLORS } from '@/lib/constants'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

const DOT_COLOR: Record<GroupStage, string> = {
  '창세기':   '#378ADD',
  '탈출기':   '#639922',
  '마르코':   '#E24B4A',
  '요한':     '#888780',
  '사도행전': '#EF9F27',
  '이사야':   '#D4537E',
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildGrid(year: number, month: number) {
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevLast    = new Date(year, month, 0).getDate()
  const cells: Array<{ iso: string; day: number; cur: boolean }> = []

  const py = month === 0 ? year - 1 : year
  const pm = month === 0 ? 11 : month - 1
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ iso: toIso(py, pm, prevLast - i), day: prevLast - i, cur: false })

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ iso: toIso(year, month, d), day: d, cur: true })

  const ny = month === 11 ? year + 1 : year
  const nm = month === 11 ? 0 : month + 1
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++)
    cells.push({ iso: toIso(ny, nm, d), day: d, cur: false })

  return cells
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`
}

export default function AllBookingsView() {
  const todayIso = new Date().toLocaleDateString('sv-SE')
  const now      = new Date()

  const [year, setYear]         = useState(now.getFullYear())
  const [month, setMonth]       = useState(now.getMonth())
  const [rooms, setRooms]       = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => { getRooms().then(setRooms) }, [])

  useEffect(() => {
    setLoading(true)
    const cells = buildGrid(year, month)
    bookingsInRange(cells[0].iso, cells[41].iso).then(data => {
      setBookings(data)
      setLoading(false)
    })
  }, [year, month])

  function prevMonth() {
    setSelected(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    setSelected(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const grouped = new Map<string, Booking[]>()
  for (const b of bookings) {
    const arr = grouped.get(b.date) ?? []
    arr.push(b)
    grouped.set(b.date, arr)
  }

  const cells        = buildGrid(year, month)
  const selectedList = selected ? (grouped.get(selected) ?? []) : []

  function roomName(id: string) {
    return rooms.find(r => r.id === id)?.name ?? id
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4 bg-white">

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center text-black text-xl font-bold"
        >
          ‹
        </button>
        <span className="font-extrabold text-black text-base">{year}년 {month + 1}월</span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center text-black text-xl font-bold"
        >
          ›
        </button>
      </div>

      {/* Calendar card — sky background wraps DOW header + grid only */}
      <div className="mx-4 mb-4 bg-sky-100 rounded-2xl overflow-hidden">

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 pt-3 px-2">
          {DOW.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] py-1 font-extrabold ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-600' : 'text-black'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <p className="text-center text-black font-semibold text-sm py-10">불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-7 px-2 gap-1 pb-3 pt-1">
            {cells.map((cell, i) => {
              const dayBks  = grouped.get(cell.iso) ?? []
              const isToday = cell.iso === todayIso
              const isSel   = cell.iso === selected
              const dow     = i % 7
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!cell.cur) return
                    setSelected(prev => prev === cell.iso ? null : cell.iso)
                  }}
                  className={`flex flex-col items-center pt-1.5 pb-1.5 rounded-xl min-h-[50px] transition-colors ${
                    cell.cur ? 'cursor-pointer' : 'opacity-25 pointer-events-none'
                  } ${isSel ? 'bg-blue-100' : 'bg-white'}`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-semibold ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : dow === 0
                          ? 'text-red-500'
                          : dow === 6
                            ? 'text-blue-500'
                            : 'text-black'
                    }`}
                  >
                    {cell.day}
                  </div>

                  {dayBks.length > 0 && (
                    <div className="flex flex-col gap-px w-[70%] mt-1">
                      {dayBks.slice(0, 3).map((b, j) => (
                        <div
                          key={j}
                          className="h-[3px] rounded-full w-full"
                          style={{ backgroundColor: DOT_COLOR[b.group_stage] }}
                        />
                      ))}
                      {dayBks.length > 3 && (
                        <span className="text-[8px] text-gray-500 font-bold text-center leading-none mt-px">
                          +{dayBks.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full bg-white rounded-t-2xl pt-2 shadow-2xl max-h-[65vh] flex flex-col border-t-2 border-black"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-black rounded-full mx-auto mb-4 opacity-20" />

            <div className="flex items-start justify-between px-5 mb-3">
              <div>
                <p className="font-extrabold text-black text-[15px]">
                  {fmtDate(selected)}
                </p>
                <p className="text-[12px] text-black font-semibold mt-0.5">
                  예약 {selectedList.length}건
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-black text-xl mt-0.5 leading-none font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto px-5">
              {selectedList.length === 0 ? (
                <p className="text-center text-black font-semibold text-sm py-8">
                  이 날 예약이 없습니다.
                </p>
              ) : (
                selectedList.map((b, i) => {
                  const c = GROUP_COLORS[b.group_stage]
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-3 py-3 ${
                        i < selectedList.length - 1 ? 'border-b-2 border-black' : ''
                      }`}
                    >
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${c.badge}`}>
                        {b.group_stage}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-black truncate">
                          {b.leader_name}
                          <span className="font-semibold text-black ml-1">
                            ({b.baptismal_name})
                          </span>
                        </p>
                        <p className="text-[11px] text-black font-semibold mt-0.5">
                          {b.start_time}–{b.end_time} · {b.member_count}명
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-black border border-black px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
                        {roomName(b.room_id)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
