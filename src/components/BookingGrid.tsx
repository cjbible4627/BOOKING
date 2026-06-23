'use client'
import type { Booking, Room, SelectedSlot } from '@/lib/types'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { checkSlotBlocked } from '@/lib/admin-storage'
import { TIME_SLOTS } from '@/lib/constants'

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

export default function BookingGrid({ date, bookings, rooms, blockedPeriods, onSlotClick }: Props) {
  const today = new Date().toLocaleDateString('sv-SE')
  const activeRooms = rooms.filter(r => r.is_active)

  return (
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
                    return (
                      <td key={room.id} rowSpan={span}
                        className="border border-gray-200 bg-blue-50 align-top p-1 cursor-default">
                        <div className="text-blue-800 leading-tight">
                          <div className="font-semibold truncate">{booking.leader_name}</div>
                          <div className="text-blue-500 truncate">{booking.baptismal_name}</div>
                          <div className="text-blue-600 mt-0.5">{booking.group_stage} · {booking.member_count}명</div>
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
                    <td key={room.id}
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
  )
}
