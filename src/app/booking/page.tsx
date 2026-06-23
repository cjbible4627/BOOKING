'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Booking, Room, SelectedSlot, UserIdentity } from '@/lib/types'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { bookingsForDate } from '@/lib/storage'
import { getRooms, getBlocked } from '@/lib/admin-storage'
import DateTabs from '@/components/DateTabs'
import BookingGrid from '@/components/BookingGrid'
import BookingModal from '@/components/BookingModal'
import MyBookingsView from '@/components/MyBookingsView'
import AllBookingsView from '@/components/AllBookingsView'

const IDENTITY_KEY = 'ybm_identity'
type Tab = 'grid' | 'mine' | 'all'

export default function BookingPage() {
  const router = useRouter()
  const today = new Date().toLocaleDateString('sv-SE')

  const [identity, setIdentity]         = useState<UserIdentity | null>(null)
  const [tab, setTab]                   = useState<Tab>('grid')
  const [date, setDate]                 = useState(today)
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [rooms, setRooms]               = useState<Room[]>([])
  const [blockedPeriods, setBlocked]    = useState<BlockedPeriod[]>([])
  const [slot, setSlot]                 = useState<SelectedSlot | null>(null)
  const [editTarget, setEditTarget]     = useState<Booking | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? 'null')
      if (!saved?.name) { router.replace('/'); return }
      setIdentity(saved)
    } catch {
      router.replace('/')
    }
    getRooms().then(setRooms)
    getBlocked().then(setBlocked)
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

  if (!identity) return null

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
        <a href="/admin" className="text-[11px] text-gray-300 hover:text-gray-500 flex-shrink-0">관리자</a>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 px-4 gap-1">
        {([['grid', '공간 예약'], ['all', '전체 현황'], ['mine', '내 예약']] as const).map(([id, label]) => (
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
