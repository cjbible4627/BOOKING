'use client'
import { useState, useEffect } from 'react'
import type { SelectedSlot, GroupStage, Booking } from '@/lib/types'
import { ROOMS, GROUP_STAGES, OP_END } from '@/lib/constants'
import { createBooking, updateBooking } from '@/lib/storage'

interface Props {
  slot: SelectedSlot | null
  editTarget: Booking | null
  onClose: () => void
  onSaved: () => void
}

const LAST_USER_KEY = 'ybm_last_user'

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

export default function BookingModal({ slot, editTarget, onClose, onSaved }: Props) {
  const isEdit = !!editTarget
  const [leaderName, setLeaderName]       = useState('')
  const [baptismalName, setBaptismalName] = useState('')
  const [groupStage, setGroupStage]       = useState<GroupStage>('창세기')
  const [memberCount, setMemberCount]     = useState('')
  const [endTime, setEndTime]             = useState('')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  const source = isEdit ? editTarget : slot

  useEffect(() => {
    if (!source) return
    if (isEdit && editTarget) {
      setLeaderName(editTarget.leader_name)
      setBaptismalName(editTarget.baptismal_name)
      setGroupStage(editTarget.group_stage)
      setMemberCount(String(editTarget.member_count))
      setEndTime(editTarget.end_time)
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(LAST_USER_KEY) ?? '{}')
        setLeaderName(saved.leaderName ?? '')
        setBaptismalName(saved.baptismalName ?? '')
      } catch {}
      const opts = endOptions(slot!.start_time)
      setEndTime(opts.length >= 2 ? opts[1] : opts[0])
    }
    setError('')
  }, [source])

  if (!source) return null

  const startTime = isEdit ? editTarget!.start_time : slot!.start_time
  const date      = isEdit ? editTarget!.date       : slot!.date
  const roomId    = isEdit ? editTarget!.room_id    : slot!.room_id
  const endOpts   = endOptions(startTime)

  async function handleSubmit() {
    if (!leaderName.trim())  return setError('봉사자 이름을 입력해주세요.')
    if (!baptismalName.trim()) return setError('세례명을 입력해주세요.')
    const mc = parseInt(memberCount)
    if (!memberCount || isNaN(mc) || mc < 1) return setError('원명수를 입력해주세요.')

    localStorage.setItem(LAST_USER_KEY, JSON.stringify({
      leaderName: leaderName.trim(),
      baptismalName: baptismalName.trim(),
    }))

    const data = {
      room_id: roomId,
      date,
      start_time: startTime,
      end_time: endTime,
      leader_name: leaderName.trim(),
      baptismal_name: baptismalName.trim(),
      group_stage: groupStage,
      member_count: mc,
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

        <div className="flex gap-2 mb-4 text-sm text-gray-600 bg-blue-50 rounded-xl px-3 py-2">
          <span className="font-medium text-blue-700">{roomName(roomId)}</span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span>{startTime}</span>
        </div>

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

        <div className="flex gap-2 mb-3">
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">봉사자 이름</span>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="홍길동"
            />
          </label>
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">세례명</span>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={baptismalName}
              onChange={(e) => setBaptismalName(e.target.value)}
              placeholder="요한"
            />
          </label>
        </div>

        <label className="block mb-3">
          <span className="text-xs text-gray-500 mb-1 block">그룹 단계</span>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            value={groupStage}
            onChange={(e) => setGroupStage(e.target.value as GroupStage)}
          >
            {GROUP_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

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
            className="flex-2 flex-[2] py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? '저장 중...' : isEdit ? '수정하기' : '예약하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
