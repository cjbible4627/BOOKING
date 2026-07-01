'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room, SelectedSlot } from '@/lib/types'
import { loadBookings, cancelBooking } from '@/lib/storage'
import { getRooms, getBlocked } from '@/lib/admin-storage'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { GROUP_COLORS } from '@/lib/constants'
import AdminBookingModal from './AdminBookingModal'
import BookingGrid from '@/components/BookingGrid'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`
}

export default function AdminBookings() {
  const today = new Date().toLocaleDateString('sv-SE')
  const [date, setDate]               = useState(today)
  const [bookings, setBookings]       = useState<Booking[]>([])
  const [rooms, setRooms]             = useState<Room[]>([])
  const [blocked, setBlocked]         = useState<BlockedPeriod[]>([])
  const [confirmId, setConfirmId]     = useState<string | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState<Booking | null>(null)
  const [defaultSlot, setDefaultSlot] = useState<SelectedSlot | undefined>(undefined)
  const [viewMode, setViewMode]       = useState<'list' | 'grid'>('list')

  useEffect(() => {
    getRooms().then(setRooms)
    getBlocked().then(setBlocked)
  }, [])

  function reload() {
    loadBookings().then(all => {
      setBookings(
        all
          .filter(b => b.date === date)
          .sort((a, b) => `${a.room_id}${a.start_time}`.localeCompare(`${b.room_id}${b.start_time}`))
      )
    })
  }

  useEffect(reload, [date])

  function openCreate(slot?: SelectedSlot) {
    setEditTarget(null)
    setDefaultSlot(slot)
    setModalOpen(true)
  }

  function openEdit(b: Booking) {
    setEditTarget(b)
    setDefaultSlot(undefined)
    setModalOpen(true)
  }

  function handleSaved() {
    setModalOpen(false)
    setEditTarget(null)
    setDefaultSlot(undefined)
    reload()
  }

  function roomName(id: string) {
    return rooms.find(r => r.id === id)?.name ?? id
  }

  async function handleCancel(id: string) {
    await cancelBooking(id)
    setBookings(prev => prev.filter(b => b.id !== id))
    setConfirmId(null)
  }

  const isToday = date === today

  return (
    <div className="flex flex-col h-full">

      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => setDate(d => addDays(d, -1))}
          className="w-8 h-8 flex items-center justify-center text-black font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200"
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <span className="font-extrabold text-black text-[15px]">{fmtDate(date)}</span>
        </div>

        <button
          onClick={() => setDate(d => addDays(d, 1))}
          className="w-8 h-8 flex items-center justify-center text-black font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200"
        >
          ›
        </button>

        {!isToday && (
          <button
            onClick={() => setDate(today)}
            className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg px-2.5 py-1.5 ml-1"
          >
            오늘
          </button>
        )}
      </div>

      {/* 예약 수 배지 + 뷰 토글 + 추가 버튼 */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-extrabold text-black">예약 현황</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          bookings.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {bookings.length}건
        </span>

        {/* 뷰 토글 */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 ml-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 text-xs font-bold transition-colors ${
              viewMode === 'list' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1 text-xs font-bold border-l border-gray-200 transition-colors ${
              viewMode === 'grid' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'
            }`}
          >
            그리드
          </button>
        </div>

        <button
          onClick={() => openCreate()}
          className="ml-auto text-xs font-bold text-white bg-blue-600 rounded-lg px-3 py-1.5 active:scale-95 transition-transform"
        >
          + 예약 추가
        </button>
      </div>

      {/* 콘텐츠 */}
      {viewMode === 'list' ? (
        /* 목록 뷰 */
        <div className="px-4 pt-1 pb-6 overflow-y-auto flex-1">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-3xl">📭</span>
              <p className="text-sm font-semibold text-gray-400">이 날 예약이 없습니다.</p>
            </div>
          ) : (
            bookings.map(b => {
              const c = GROUP_COLORS[b.group_stage]
              return (
                <div
                  key={b.id}
                  className="rounded-2xl border-2 border-gray-200 mb-3 overflow-hidden"
                >
                  {/* 카드 본문 */}
                  <div className="flex">
                    {/* 그룹 색상 바 */}
                    <div className={`w-1.5 flex-shrink-0 ${c.cell}`} />

                    <div className="flex-1 px-4 py-3">
                      {/* 상단 행: 방 이름 + 시간 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-black text-[13px]">
                          {roomName(b.room_id)}
                        </span>
                        <span className="text-xs font-bold text-black bg-gray-100 px-2.5 py-1 rounded-full">
                          {b.start_time} ~ {b.end_time}
                        </span>
                      </div>

                      {/* 하단 행: 그룹 단계 배지 + 리더 정보 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                          {b.group_stage}
                        </span>
                        <span className="text-[12px] font-bold text-black">
                          {b.leader_name}
                          <span className="font-semibold text-gray-500 ml-1">({b.baptismal_name})</span>
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500">
                          · {b.member_count}명
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 수정 / 강제 취소 버튼 */}
                  {confirmId !== b.id ? (
                    <div className="flex border-t-2 border-gray-200">
                      <button
                        onClick={() => openEdit(b)}
                        className="flex-1 py-2.5 text-xs text-blue-600 font-bold bg-white active:bg-blue-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setConfirmId(b.id)}
                        className="flex-1 py-2.5 text-xs text-red-500 font-bold border-l-2 border-gray-200 bg-white active:bg-red-50"
                      >
                        강제 취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex border-t-2 border-gray-200 bg-red-50">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 py-2.5 text-xs text-gray-600 font-semibold"
                      >
                        아니오
                      </button>
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="flex-1 py-2.5 text-xs text-white font-bold bg-red-500 border-l-2 border-red-300"
                      >
                        취소 확인
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* 그리드 뷰 */
        <div className="flex-1 overflow-hidden px-2 pb-4">
          <BookingGrid
            date={date}
            bookings={bookings}
            rooms={rooms}
            blockedPeriods={blocked}
            onSlotClick={(slot) => openCreate(slot)}
            onBookingClick={(b) => openEdit(b)}
          />
        </div>
      )}

      {modalOpen && (
        <AdminBookingModal
          editTarget={editTarget}
          rooms={rooms}
          defaultDate={date}
          defaultSlot={defaultSlot}
          onClose={() => { setModalOpen(false); setEditTarget(null); setDefaultSlot(undefined) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
