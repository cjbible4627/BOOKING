'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room, GroupStage } from '@/lib/types'
import { GROUP_STAGES, TIME_SLOTS, OP_END } from '@/lib/constants'
import { createBooking, updateBooking } from '@/lib/storage'

interface Props {
  editTarget: Booking | null
  rooms: Room[]
  defaultDate: string
  onClose: () => void
  onSaved: () => void
}

function endOptions(startTime: string): string[] {
  const startH = parseInt(startTime)
  return Array.from(
    { length: OP_END - startH },
    (_, i) => `${String(startH + i + 1).padStart(2, '0')}:00`,
  )
}

export default function AdminBookingModal({ editTarget, rooms, defaultDate, onClose, onSaved }: Props) {
  const isEdit = !!editTarget
  const activeRooms = rooms.filter(r => r.is_active)

  const [roomId, setRoomId]           = useState('')
  const [date, setDate]               = useState(defaultDate)
  const [startTime, setStartTime]     = useState(TIME_SLOTS[0])
  const [endTime, setEndTime]         = useState('')
  const [leaderName, setLeaderName]   = useState('')
  const [baptismalName, setBaptismal] = useState('')
  const [groupStage, setGroupStage]   = useState<GroupStage>(GROUP_STAGES[0])
  const [memberCount, setMemberCount] = useState('')
  const [pin, setPin]                 = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    if (isEdit && editTarget) {
      setRoomId(editTarget.room_id)
      setDate(editTarget.date)
      setStartTime(editTarget.start_time)
      setEndTime(editTarget.end_time)
      setLeaderName(editTarget.leader_name)
      setBaptismal(editTarget.baptismal_name)
      setGroupStage(editTarget.group_stage)
      setMemberCount(String(editTarget.member_count))
      setPin(editTarget.pin)
    } else {
      setRoomId(activeRooms[0]?.id ?? '')
      setDate(defaultDate)
      setStartTime(TIME_SLOTS[0])
      const opts = endOptions(TIME_SLOTS[0])
      setEndTime(opts.length >= 2 ? opts[1] : opts[0])
      setLeaderName('')
      setBaptismal('')
      setGroupStage(GROUP_STAGES[0])
      setMemberCount('')
      setPin('')
    }
    setError('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget])

  // 시작 시간 변경 시 종료 시간 자동 보정
  function handleStartChange(t: string) {
    setStartTime(t)
    const opts = endOptions(t)
    if (!opts.includes(endTime)) {
      setEndTime(opts.length >= 2 ? opts[1] : opts[0])
    }
  }

  async function handleSubmit() {
    if (!roomId) return setError('방을 선택해주세요.')
    if (!leaderName.trim()) return setError('봉사자 이름을 입력해주세요.')
    if (!baptismalName.trim()) return setError('세례명을 입력해주세요.')
    if (endTime <= startTime) return setError('종료 시간이 시작 시간보다 늦어야 합니다.')
    const mc = parseInt(memberCount)
    if (!memberCount || isNaN(mc) || mc < 1) return setError('원명수를 입력해주세요.')
    if (!/^\d{4}$/.test(pin)) return setError('PIN 4자리를 입력해주세요.')

    const data = {
      room_id: roomId,
      date,
      start_time: startTime,
      end_time: endTime,
      leader_name: leaderName.trim(),
      baptismal_name: baptismalName.trim(),
      group_stage: groupStage,
      member_count: mc,
      pin,
    }

    setLoading(true)
    setError('')
    const result = isEdit
      ? await updateBooking(editTarget!.id, data)
      : await createBooking(data)
    setLoading(false)

    if (!result.ok) return setError(result.error ?? '저장에 실패했습니다.')
    onSaved()
  }

  const endOpts = endOptions(startTime)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-t-2xl px-5 pt-4 pb-8 shadow-xl max-h-[92svh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <h2 className="text-base font-bold text-gray-800 mb-4">
          {isEdit ? '예약 수정 (관리자)' : '예약 직접 등록 (관리자)'}
        </h2>

        {/* 방 */}
        <label className="block mb-3">
          <span className="text-xs text-gray-500 mb-1 block">방</span>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            {activeRooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>

        {/* 날짜 */}
        <label className="block mb-3">
          <span className="text-xs text-gray-500 mb-1 block">날짜</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </label>

        {/* 시간 */}
        <div className="flex gap-2 mb-3">
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">시작</span>
            <select
              value={startTime}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">종료</span>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {endOpts.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        {/* 봉사자 / 세례명 */}
        <div className="flex gap-2 mb-3">
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">봉사자 이름</span>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="최양업"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </label>
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">세례명</span>
            <input
              type="text"
              value={baptismalName}
              onChange={(e) => setBaptismal(e.target.value)}
              placeholder="토마스"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </label>
        </div>

        {/* 그룹과정 */}
        <label className="block mb-3">
          <span className="text-xs text-gray-500 mb-1 block">그룹과정</span>
          <div className="flex gap-1.5 flex-wrap">
            {GROUP_STAGES.map(s => (
              <button
                key={s}
                onClick={() => setGroupStage(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  groupStage === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </label>

        {/* 원명수 / PIN */}
        <div className="flex gap-2 mb-4">
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">그룹 원명수</span>
            <input
              type="number"
              min={1}
              value={memberCount}
              onChange={(e) => setMemberCount(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </label>
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">PIN 4자리</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </label>
        </div>

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
            {loading ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
