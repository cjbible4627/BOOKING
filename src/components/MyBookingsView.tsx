'use client'
import { useState, useEffect } from 'react'
import type { Booking, UserIdentity } from '@/lib/types'
import { ROOMS } from '@/lib/constants'
import { myBookings, cancelBooking } from '@/lib/storage'

interface Props {
  identity: UserIdentity
  onEdit: (booking: Booking) => void
}

function roomName(id: string) {
  return ROOMS.find((r) => r.id === id)?.name ?? id
}

function formatDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`
}

export default function MyBookingsView({ identity, onEdit }: Props) {
  const [bookings, setBookings]   = useState<Booking[] | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pinInput, setPinInput]   = useState('')
  const [pinError, setPinError]   = useState('')
  const [loading, setLoading]     = useState(false)

  async function load() {
    setLoading(true)
    const result = await myBookings(identity.name, identity.baptismal)
    setBookings(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCancel(booking: Booking) {
    if (pinInput !== booking.pin) {
      setPinError('비밀번호가 맞지 않습니다.')
      return
    }
    await cancelBooking(booking.id)
    setBookings((prev) => prev?.filter((b) => b.id !== booking.id) ?? null)
    setConfirmId(null)
    setPinInput('')
    setPinError('')
  }

  function openConfirm(id: string) {
    setConfirmId(id)
    setPinInput('')
    setPinError('')
  }

  const today    = new Date().toLocaleDateString('sv-SE')
  const upcoming = bookings?.filter((b) => b.date >= today) ?? []
  const past     = bookings?.filter((b) => b.date < today)  ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm mt-8">불러오는 중...</p>
        ) : bookings === null || bookings.length === 0 ? (
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
                    pinInput={pinInput}
                    pinError={pinError}
                    onEdit={() => onEdit(b)}
                    onAskCancel={() => openConfirm(b.id)}
                    onPinChange={(v) => { setPinInput(v); setPinError('') }}
                    onCancelConfirm={() => handleCancel(b)}
                    onCancelDismiss={() => { setConfirmId(null); setPinInput(''); setPinError('') }}
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
                    pinInput={pinInput}
                    pinError={pinError}
                    onEdit={() => {}}
                    onAskCancel={() => {}}
                    onPinChange={() => {}}
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
  pinInput: string
  pinError: string
  onEdit: () => void
  onAskCancel: () => void
  onPinChange: (v: string) => void
  onCancelConfirm: () => void
  onCancelDismiss: () => void
}

function BookingCard({
  booking, isPast, confirmId, pinInput, pinError,
  onEdit, onAskCancel, onPinChange, onCancelConfirm, onCancelDismiss,
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
          {booking.group_stage} · {booking.member_count}명
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
        <div className="border-t border-gray-100 bg-red-50 px-4 py-3">
          <p className="text-xs text-gray-600 mb-2">개인 비밀번호를 입력해 취소를 확인하세요.</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2 bg-white focus:outline-none focus:border-red-300"
            placeholder="●●●●"
            value={pinInput}
            onChange={(e) => onPinChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {pinError && <p className="text-red-500 text-xs mb-2">{pinError}</p>}
          <div className="flex gap-2">
            <button onClick={onCancelDismiss} className="flex-1 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl bg-white">
              아니오
            </button>
            <button onClick={onCancelConfirm} className="flex-1 py-2 text-xs text-red-600 font-bold border border-red-200 rounded-xl">
              예약 취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
