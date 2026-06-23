'use client'
import { useState, useEffect } from 'react'
import type { Booking } from '@/lib/types'
import { ROOMS } from '@/lib/constants'
import { myBookings, cancelBooking } from '@/lib/storage'

interface Props {
  onEdit: (booking: Booking) => void
}

function roomName(id: string) {
  return ROOMS.find((r) => r.id === id)?.name ?? id
}

function formatDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`
}

export default function MyBookingsView({ onEdit }: Props) {
  const [name, setName] = useState('')
  const [baptismal, setBaptismal] = useState('')
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function search() {
    if (!name.trim() || !baptismal.trim()) return
    const result = myBookings(name.trim(), baptismal.trim())
    result.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
    setBookings(result)
  }

  function handleCancel(id: string) {
    cancelBooking(id)
    setBookings((prev) => prev?.filter((b) => b.id !== id) ?? null)
    setConfirmId(null)
  }

  const today = new Date().toLocaleDateString('sv-SE')
  const upcoming = bookings?.filter((b) => b.date >= today) ?? []
  const past = bookings?.filter((b) => b.date < today) ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Lookup form */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500 mb-2">이름과 세례명으로 내 예약을 조회합니다.</p>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="봉사자 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="세례명"
            value={baptismal}
            onChange={(e) => setBaptismal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        <button
          onClick={search}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          조회
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {bookings === null ? (
          <p className="text-center text-gray-400 text-sm mt-8">이름과 세례명을 입력해 조회하세요.</p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">예약 내역이 없습니다.</p>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium mb-2">예정된 예약</p>
                {upcoming.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    isPast={false}
                    confirmId={confirmId}
                    onEdit={() => onEdit(b)}
                    onAskCancel={() => setConfirmId(b.id)}
                    onCancelConfirm={() => handleCancel(b.id)}
                    onCancelDismiss={() => setConfirmId(null)}
                  />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium mt-4 mb-2">지난 예약</p>
                {past.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    isPast
                    confirmId={confirmId}
                    onEdit={() => {}}
                    onAskCancel={() => {}}
                    onCancelConfirm={() => {}}
                    onCancelDismiss={() => {}}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  booking: Booking
  isPast: boolean
  confirmId: string | null
  onEdit: () => void
  onAskCancel: () => void
  onCancelConfirm: () => void
  onCancelDismiss: () => void
}

function BookingCard({
  booking, isPast, confirmId,
  onEdit, onAskCancel, onCancelConfirm, onCancelDismiss,
}: CardProps) {
  const isConfirming = confirmId === booking.id
  return (
    <div className={`rounded-2xl border mb-3 overflow-hidden ${isPast ? 'border-gray-100 opacity-60' : 'border-blue-100'}`}>
      <div className={`px-4 py-3 ${isPast ? 'bg-gray-50' : 'bg-blue-50'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-gray-800">{roomName(booking.room_id)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(booking.date)} · {booking.start_time} ~ {booking.end_time}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
            {isPast ? '완료' : '예정'}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {booking.group_stage} · {booking.member_count}명 · {booking.leader_name}({booking.baptismal_name})
        </div>
      </div>

      {!isPast && !isConfirming && (
        <div className="flex divide-x divide-gray-100 border-t border-gray-100">
          <button onClick={onEdit} className="flex-1 py-2.5 text-xs text-blue-600 font-medium text-center">
            수정
          </button>
          <button onClick={onAskCancel} className="flex-1 py-2.5 text-xs text-red-500 font-medium text-center">
            취소
          </button>
        </div>
      )}
      {isConfirming && (
        <div className="flex divide-x divide-gray-100 border-t border-gray-100 bg-red-50">
          <button onClick={onCancelDismiss} className="flex-1 py-2.5 text-xs text-gray-500 font-medium text-center">
            아니오
          </button>
          <button onClick={onCancelConfirm} className="flex-1 py-2.5 text-xs text-red-600 font-bold text-center">
            예약 취소
          </button>
        </div>
      )}
    </div>
  )
}
