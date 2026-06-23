'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Booking, Room, SelectedSlot } from '@/lib/types'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { bookingsForDate } from '@/lib/storage'
import { getRooms, getBlocked } from '@/lib/admin-storage'
import DateTabs from '@/components/DateTabs'
import BookingGrid from '@/components/BookingGrid'
import BookingModal from '@/components/BookingModal'
import MyBookingsView from '@/components/MyBookingsView'

type Tab = 'grid' | 'mine'

export default function Home() {
  const today = new Date().toLocaleDateString('sv-SE')
  const [tab, setTab]                   = useState<Tab>('grid')
  const [date, setDate]                 = useState(today)
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [rooms, setRooms]               = useState<Room[]>([])
  const [blockedPeriods, setBlocked]    = useState<BlockedPeriod[]>([])
  const [slot, setSlot]                 = useState<SelectedSlot | null>(null)
  const [editTarget, setEditTarget]     = useState<Booking | null>(null)

  useEffect(() => {
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

  function closeModal() {
    setSlot(null)
    setEditTarget(null)
  }

  function onSaved() {
    closeModal()
    refresh()
  }

  return (
    <div className="flex flex-col h-svh bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <h1 className="text-base font-bold text-gray-900">청년성서모임 공간 예약</h1>
        <a href="/admin" className="text-[11px] text-gray-300 hover:text-gray-500">관리자</a>
      </header>

      <div className="flex bg-white border-b border-gray-100 px-4 gap-1">
        {([['grid', '공간 예약'], ['mine', '내 예약']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
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
      ) : (
        <MyBookingsView onEdit={openEdit} />
      )}

      {(slot !== null || editTarget !== null) && (
        <BookingModal
          slot={slot}
          editTarget={editTarget}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
