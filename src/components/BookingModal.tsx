'use client'
import { useState, useEffect } from 'react'
import type { SelectedSlot, GroupStage, Booking, UserIdentity } from '@/lib/types'
import { ROOMS, OP_END } from '@/lib/constants'
import { createBooking, updateBooking } from '@/lib/storage'

interface Props {
  slot: SelectedSlot | null
  editTarget: Booking | null
  identity: UserIdentity
  onClose: () => void
  onSaved: () => void
}

function roomName(id: string) {
  return ROOMS.find((r) => r.id === id)?.name ?? id
}

function endOptions(startTime: string): string[] {
  const startH = parseInt(startTime)
  return Array.from(
    { length: Math.min(4, OP_END - startH) },
    (_, i) => `${String(startH + i + 1).padStart(2, '0')}:00`,
  )
}

export default function BookingModal({ slot, editTarget, identity, onClose, onSaved }: Props) {
  const isEdit = !!editTarget
  const [memberCount, setMemberCount] = useState('')
  const [endTime, setEndTime]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const source = isEdit ? editTarget : slot

  useEffect(() => {
    if (!source) return
    if (isEdit && editTarget) {
      setMemberCount(String(editTarget.member_count))
      setEndTime(editTarget.end_time)
    } else {
      const opts = endOptions(slot!.start_time)
      setEndTime(opts.length >= 2 ? opts[1] : opts[0])
      setMemberCount('')
    }
    setError('')
  }, [source])

  if (!source) return null

  const startTime = isEdit ? editTarget!.start_time : slot!.start_time
  const date      = isEdit ? editTarget!.date       : slot!.date
  const roomId    = isEdit ? editTarget!.room_id    : slot!.room_id
  const endOpts   = endOptions(startTime)

  async function handleSubmit() {
    const mc = parseInt(memberCount)
    if (!memberCount || isNaN(mc) || mc < 1) return setError('원명수를 입력해주세요.')

    const data = {
      room_id: roomId,
      date,
      start_time: startTime,
      end_time: endTime,
      leader_name: identity.name,
      baptismal_name: identity.baptismal,
      group_stage: identity.groupStage,
      member_count: mc,
      pin: identity.pin,
    }

    setLoading(true)
    setError('')
    const result = isEdit
      ? await updateBooking(editTarget!.id, data)
      : await createBooking(data)
    setLoading(false)

    if (!result.ok) return setError(result.error ?? '예약에 실패했습니다.')
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-t-2xl px-5 pt-4 pb-8 shadow-xl">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <h2 className="text-base font-bold text-gray-800 mb-3">
          {isEdit ? '예약 수정' : '공간 예약'}
        </h2>

        {/* 예약자 정보 */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-4 text-xs text-gray-600 flex gap-3">
          <span className="font-medium text-gray-800">{identity.name} ({identity.baptismal})</span>
          <span>·</span>
          <span>{identity.groupStage}</span>
        </div>

        {/* 장소·시간 */}
        <div className="flex gap-2 mb-4 text-sm text-gray-600 bg-blue-50 rounded-xl px-3 py-2">
          <span className="font-medium text-blue-700">{roomName(roomId)}</span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span>{startTime}</span>
        </div>

        {/* 종료 시간 */}
        <label className="block mb-3">
          <span className="text-xs text-gray-500 mb-1 block">종료 시간</span>
          <div className="flex gap-2">
            {endOpts.map((t) => (
              <button
                key={t}
                onClick={() => setEndTime(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  endTime === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </label>

        {/* 원명수 */}
        <label className="block mb-4">
          <span className="text-xs text-gray-500 mb-1 block">그룹 원명수</span>
          <input
            type="number"
            min={1}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            value={memberCount}
            onChange={(e) => setMemberCount(e.target.value)}
            placeholder="0"
          />
        </label>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? '저장 중...' : isEdit ? '수정하기' : '예약하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
