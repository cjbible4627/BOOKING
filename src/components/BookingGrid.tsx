'use client'
import { useState } from 'react'
import type { Booking, Room, SelectedSlot } from '@/lib/types'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { checkSlotBlocked } from '@/lib/admin-storage'
import { TIME_SLOTS, GROUP_COLORS } from '@/lib/constants'

interface Props {
  date: string
  bookings: Booking[]
  rooms: Room[]
  blockedPeriods: BlockedPeriod[]
  onSlotClick: (slot: SelectedSlot) => void
}

function isPast(date: string, time: string): boolean {
  return new Date(`${date}T${time}:00`) <= new Date()
}

function getBookingAt(bookings: Booking[], roomId: string, time: string): Booking | undefined {
  const h = parseInt(time)
  return bookings.find(
    b => b.room_id === roomId && parseInt(b.start_time) <= h && parseInt(b.end_time) > h,
  )
}

function roomName(rooms: Room[], id: string): string {
  return rooms.find(r => r.id === id)?.name ?? id
}

interface PopupProps {
  booking: Booking
  rooms: Room[]
  onClose: () => void
}

function BookingPopup({ booking, rooms, onClose }: PopupProps) {
  const colors = GROUP_COLORS[booking.group_stage]
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl px-5 py-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
              {booking.group_stage}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {booking.start_time}–{booking.end_time}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* 상세 */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">장소</span>
            <span className="font-medium text-gray-800">{roomName(rooms, booking.room_id)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">리더</span>
            <span className="font-medium text-gray-800">
              {booking.leader_name} ({booking.baptismal_name})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">인원</span>
            <span className="font-medium text-gray-800">{booking.member_count}명</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingGrid({ date, bookings, rooms, blockedPeriods, onSlotClick }: Props) {
  const today = new Date().toLocaleDateString('sv-SE')
  const activeRooms = rooms.filter(r => r.is_active)
  const [popup, setPopup] = useState<Booking | null>(null)

  return (
    <>
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="border-collapse text-xs w-full" style={{ minWidth: '320px' }}>
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="w-[52px] border border-gray-200 bg-gray-50 py-2 text-gray-400 font-normal text-[11px]">
                시간
              </th>
              {activeRooms.map(r => (
                <th key={r.id} className="border border-gray-200 bg-gray-50 py-2 text-gray-700 font-semibold text-[12px] text-center">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(time => {
              const past    = date === today ? isPast(date, time) : date < today
              const blocked = !past && checkSlotBlocked(blockedPeriods, date, time)

              return (
                <tr key={time} className={past || blocked ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-200 text-center text-gray-400 text-[11px] py-1 w-[52px] align-middle">
                    {time}
                  </td>
                  {activeRooms.map(room => {
                    const booking = getBookingAt(bookings, room.id, time)

                    if (booking && booking.start_time !== time) return null

                    if (booking) {
                      const span = parseInt(booking.end_time) - parseInt(booking.start_time)
                      const c = GROUP_COLORS[booking.group_stage]
                      return (
                        <td
                          key={room.id}
                          rowSpan={span}
                          className={`border border-gray-200 ${c.cell} align-top p-1.5 cursor-pointer active:opacity-80`}
                          onClick={() => setPopup(booking)}
                        >
                          <div className="leading-tight">
                            <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mb-1 ${c.badge}`}>
                              {booking.group_stage}
                            </div>
                            <div className={`font-semibold truncate text-[11px] ${c.name}`}>
                              {booking.leader_name}
                            </div>
                            <div className={`truncate text-[10px] ${c.sub}`}>
                              {booking.member_count}명
                            </div>
                          </div>
                        </td>
                      )
                    }

                    if (past || blocked) {
                      return (
                        <td key={room.id} className={`border border-gray-200 h-12 ${blocked ? 'bg-red-50' : 'bg-gray-50'}`}>
                          {blocked && <span className="flex items-center justify-center h-full text-[10px] text-red-300">차단</span>}
                        </td>
                      )
                    }

                    return (
                      <td
                        key={room.id}
                        className="border border-gray-200 h-12 text-center text-gray-300 text-lg cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors select-none"
                        onClick={() => onSlotClick({ room_id: room.id, date, start_time: time })}
                      >
                        +
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {popup && (
        <BookingPopup
          booking={popup}
          rooms={rooms}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  )
}
