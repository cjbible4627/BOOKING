import type { Booking, NewBooking } from './types'
import { isSlotBlocked } from './admin-storage'

const KEY = 'ybm_bookings'

function randId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function toHour(t: string): number {
  return parseInt(t.split(':')[0], 10)
}

function overlaps(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string,
): boolean {
  return toHour(aStart) < toHour(bEnd) && toHour(aEnd) > toHour(bStart)
}

export function loadBookings(): Booking[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(bookings: Booking[]) {
  localStorage.setItem(KEY, JSON.stringify(bookings))
}

export function bookingsForDate(date: string): Booking[] {
  return loadBookings().filter((b) => b.date === date)
}

export function myBookings(name: string, baptismal: string): Booking[] {
  return loadBookings().filter(
    (b) => b.leader_name === name && b.baptismal_name === baptismal,
  )
}

export function createBooking(data: NewBooking): { ok: boolean; error?: string; booking?: Booking } {
  const all = loadBookings()
  const conflict = all.find(
    (b) =>
      b.room_id === data.room_id &&
      b.date === data.date &&
      overlaps(b.start_time, b.end_time, data.start_time, data.end_time),
  )
  if (conflict) return { ok: false, error: '해당 시간에 이미 예약이 있습니다.' }
  if (isSlotBlocked(data.date, data.start_time)) return { ok: false, error: '해당 날짜·시간은 예약이 차단되어 있습니다.' }

  const booking: Booking = { id: randId(), ...data, created_at: new Date().toISOString() }
  save([...all, booking])
  return { ok: true, booking }
}

export function updateBooking(id: string, data: Partial<NewBooking>): { ok: boolean; error?: string } {
  const all = loadBookings()
  const idx = all.findIndex((b) => b.id === id)
  if (idx === -1) return { ok: false, error: '예약을 찾을 수 없습니다.' }

  const updated = { ...all[idx], ...data }
  const conflict = all.find(
    (b, i) =>
      i !== idx &&
      b.room_id === updated.room_id &&
      b.date === updated.date &&
      overlaps(b.start_time, b.end_time, updated.start_time, updated.end_time),
  )
  if (conflict) return { ok: false, error: '해당 시간에 이미 예약이 있습니다.' }

  all[idx] = updated
  save(all)
  return { ok: true }
}

export function cancelBooking(id: string) {
  save(loadBookings().filter((b) => b.id !== id))
}
