'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Booking, Room, SelectedSlot, UserIdentity, Notice } from '@/lib/types'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { bookingsForDate } from '@/lib/storage'
import { getRooms, getBlocked, getNotices } from '@/lib/admin-storage'
import DateTabs from '@/components/DateTabs'
import BookingGrid from '@/components/BookingGrid'
import BookingModal from '@/components/BookingModal'
import MyBookingsView from '@/components/MyBookingsView'
import AllBookingsView from '@/components/AllBookingsView'
import ResourceView from '@/components/ResourceView'
import IdentityGate from '@/components/IdentityGate'
import { getBookingOpenAt } from '@/lib/settings-storage'

const IDENTITY_KEY = 'ybm_identity'
type Tab = 'grid' | 'mine' | 'all' | 'resources'

function pad(n: number) { return String(n).padStart(2, '0') }

function Countdown({ openAt }: { openAt: Date }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, openAt.getTime() - now.getTime())
  const days    = Math.floor(diff / 86400000)
  const hours   = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  const openStr = openAt.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
      <span className="text-5xl mb-5">🔒</span>
      <h2 className="text-lg font-extrabold text-gray-900 mb-1">예약 접수 준비 중</h2>
      <p className="text-sm text-gray-500 mb-8">{openStr}부터 접수가 시작됩니다</p>

      <div className="flex items-end gap-3 mb-8">
        {days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{days}</span>
            <span className="text-xs font-semibold text-blue-400 mt-1">일</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{pad(hours)}</span>
          <span className="text-xs font-semibold text-blue-400 mt-1">시간</span>
        </div>
        <span className="text-2xl font-bold text-blue-300 pb-5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{pad(minutes)}</span>
          <span className="text-xs font-semibold text-blue-400 mt-1">분</span>
        </div>
        <span className="text-2xl font-bold text-blue-300 pb-5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{pad(seconds)}</span>
          <span className="text-xs font-semibold text-blue-400 mt-1">초</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">접수 시작 시각이 되면 자동으로 예약 화면이 열립니다</p>
    </div>
  )
}

export default function BookingPage() {
  const router = useRouter()
  const today = new Date().toLocaleDateString('sv-SE')

  const [identity, setIdentity]         = useState<UserIdentity | null>(null)
  const [tab, setTab]                   = useState<Tab>('grid')
  const [date, setDate]                 = useState(today)
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [rooms, setRooms]               = useState<Room[]>([])
  const [blockedPeriods, setBlocked]    = useState<BlockedPeriod[]>([])
  const [bookingNotices, setBookingNotices] = useState<Notice[]>([])
  const [slot, setSlot]                 = useState<SelectedSlot | null>(null)
  const [editTarget, setEditTarget]     = useState<Booking | null>(null)
  const [openAt, setOpenAt]             = useState<Date | null>(null)
  const [now, setNow]                   = useState(() => new Date())

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(IDENTITY_KEY) ?? 'null')
      if (saved?.name) setIdentity(saved)
    } catch {}
    getRooms().then(setRooms)
    getBlocked().then(setBlocked)
    getNotices('booking').then(setBookingNotices)
    getBookingOpenAt().then(val => { if (val) setOpenAt(new Date(val)) })
  }, [])

  // 카운트다운용 1초 tick — openAt 이 설정된 경우만
  useEffect(() => {
    if (!openAt) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [openAt])

  const refresh = useCallback(() => {
    bookingsForDate(date).then(setBookings)
  }, [date])

  useEffect(() => { refresh() }, [refresh])

  function openEdit(booking: Booking) {
    setEditTarget(booking)
    setSlot(null)
    setTab('grid')
  }

  function closeModal() { setSlot(null); setEditTarget(null) }
  function onSaved()    { closeModal(); refresh() }

  // 접수 시작 전이면 카운트다운 화면 (신원 입력 전에 먼저 표시)
  const isLocked = openAt !== null && now < openAt

  if (isLocked) {
    return (
      <div className="flex flex-col h-svh bg-white">
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => router.push('/')} className="text-gray-400 text-lg">←</button>
          <span className="text-sm font-bold text-gray-700">그룹공부 공간 예약</span>
          <div className="w-8" />
        </header>
        <Countdown openAt={openAt} />
      </div>
    )
  }

  if (!identity) return <IdentityGate onComplete={setIdentity} />

  return (
    <div className="flex flex-col h-svh bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="뒤로"
          >
            ←
          </button>
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate block">
              {identity.name} ({identity.baptismal})
            </span>
            <span className="text-[11px] text-gray-400">{identity.groupStage}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              sessionStorage.removeItem(IDENTITY_KEY)
              setIdentity(null)
            }}
            className="text-xs font-semibold text-blue-500 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 active:bg-blue-100"
          >
            정보 변경
          </button>
          <a href="/admin" className="text-[11px] text-gray-300 hover:text-gray-500">관리자</a>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 px-4 gap-1">
        {([['grid', '공간 예약'], ['all', '전체 현황'], ['mine', '내 예약'], ['resources', '자료실']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 예약 전용 공지사항 */}
      {bookingNotices.length > 0 && (
        <div className="mx-4 mt-3 mb-1 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col gap-1.5">
          <p className="text-xs font-extrabold text-orange-600">📢 공지사항</p>
          {bookingNotices.map(n => (
            <p key={n.id} className="text-sm text-orange-900 whitespace-pre-wrap">{n.content}</p>
          ))}
        </div>
      )}

      {tab === 'grid' ? (
        <>
          <DateTabs selected={date} onSelect={d => setDate(d)} />
          <BookingGrid
            date={date}
            bookings={bookings}
            rooms={rooms}
            blockedPeriods={blockedPeriods}
            onSlotClick={s => { setSlot(s); setEditTarget(null) }}
          />
        </>
      ) : tab === 'all' ? (
        <AllBookingsView />
      ) : tab === 'resources' ? (
        <ResourceView />
      ) : (
        <MyBookingsView identity={identity} onEdit={openEdit} />
      )}

      {(slot !== null || editTarget !== null) && (
        <BookingModal
          slot={slot}
          editTarget={editTarget}
          identity={identity}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
