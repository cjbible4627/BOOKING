'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room } from '@/lib/types'
import { loadBookings, cancelBooking } from '@/lib/storage'
import { getRooms } from '@/lib/admin-storage'

export default function AdminBookings() {
  const today = new Date().toLocaleDateString('sv-SE')
  const [date, setDate]         = useState(today)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms]       = useState<Room[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => { getRooms().then(setRooms) }, [])

  useEffect(() => {
    loadBookings().then(all => {
      setBookings(
        all
          .filter(b => b.date === date)
          .sort((a, b) => `${a.room_id}${a.start_time}`.localeCompare(`${b.room_id}${b.start_time}`))
      )
    })
  }, [date])

  function roomName(id: string) {
    return rooms.find(r => r.id === id)?.name ?? id
  }

  async function handleCancel(id: string) {
    await cancelBooking(id)
    setBookings(prev => prev.filter(b => b.id !== id))
    setConfirmId(null)
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {bookings.length}건
        </span>
      </div>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">해당 날짜에 예약이 없습니다.</p>
      ) : (
        bookings.map(b => (
          <div key={b.id} className="rounded-2xl border border-gray-100 mb-3 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-gray-800">{roomName(b.room_id)}</span>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {b.start_time} ~ {b.end_time}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1.5 flex gap-2 flex-wrap">
                <span>{b.leader_name} ({b.baptismal_name})</span>
                <span>·</span>
                <span>{b.group_stage}</span>
                <span>·</span>
                <span>{b.member_count}명</span>
              </div>
            </div>

            {confirmId !== b.id ? (
              <button
                onClick={() => setConfirmId(b.id)}
                className="w-full py-2.5 text-xs text-red-500 font-medium border-t border-gray-100 bg-white hover:bg-red-50"
              >
                강제 취소
              </button>
            ) : (
              <div className="flex border-t border-gray-100 bg-red-50">
                <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 text-xs text-gray-500">
                  아니오
                </button>
                <button onClick={() => handleCancel(b.id)} className="flex-1 py-2.5 text-xs text-red-600 font-bold border-l border-red-100">
                  예약 취소 확인
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
