'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room } from '@/lib/types'
import { upcomingBookings } from '@/lib/storage'
import { getRooms } from '@/lib/admin-storage'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
}

function groupByDate(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>()
  for (const b of bookings) {
    const list = map.get(b.date) ?? []
    list.push(b)
    map.set(b.date, list)
  }
  return map
}

export default function AllBookingsView() {
  const today = new Date().toLocaleDateString('sv-SE')
  const [rooms, setRooms]       = useState<Room[]>([])
  const [grouped, setGrouped]   = useState<Map<string, Booking[]>>(new Map())
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getRooms(), upcomingBookings(today)]).then(([r, b]) => {
      setRooms(r)
      setGrouped(groupByDate(b))
      setLoading(false)
    })
  }, [])

  function roomName(id: string) {
    return rooms.find(r => r.id === id)?.name ?? id
  }

  if (loading) {
    return <p className="text-center text-gray-400 text-sm mt-12">불러오는 중...</p>
  }

  if (grouped.size === 0) {
    return <p className="text-center text-gray-400 text-sm mt-12">예정된 예약이 없습니다.</p>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {[...grouped.entries()].map(([date, bookings]) => (
        <div key={date} className="mb-5">
          {/* 날짜 헤더 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-700">{formatDate(date)}</span>
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {bookings.length}건
            </span>
          </div>

          {/* 예약 카드 목록 */}
          <div className="space-y-1.5">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2.5">
                {/* 시간 */}
                <div className="text-[11px] text-blue-500 font-semibold w-[72px] flex-shrink-0 text-center">
                  {b.start_time}–{b.end_time}
                </div>
                {/* 구분선 */}
                <div className="w-px h-8 bg-blue-200 flex-shrink-0" />
                {/* 내용 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-800">{roomName(b.room_id)}</span>
                    <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                      {b.group_stage}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {b.leader_name} ({b.baptismal_name}) · {b.member_count}명
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
