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

const IDENTITY_KEY = 'ybm_identity'
type Tab = 'grid' | 'mine' | 'all' | 'resources'

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

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? 'null')
      if (saved?.name) setIdentity(saved)
    } catch {}
    getRooms().then(setRooms)
    getBlocked().then(setBlocked)
    getNotices('booking').then(setBookingNotices)
  }, [])

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
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900 truncate">
                {identity.name} ({identity.baptismal})
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem(IDENTITY_KEY)
                  setIdentity(null)
                }}
                className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 flex-shrink-0"
              >
                변경
              </button>
            </div>
            <span className="text-[11px] text-gray-400">{identity.groupStage}</span>
          </div>
        </div>
        <a href="/admin" className="text-[11px] text-gray-300 hover:text-gray-500 flex-shrink-0">관리자</a>
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
