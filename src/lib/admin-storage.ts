import type { Room } from './types'
import { ROOMS } from './constants'

const ROOMS_KEY    = 'ybm_rooms'
const BLOCKED_KEY  = 'ybm_blocked'
const SESSION_KEY  = 'ybm_admin_session'

export interface BlockedPeriod {
  id: string
  date: string
  start_time?: string  // undefined → 종일 차단
  end_time?: string
  note?: string
}

// ── 방 관리 ─────────────────────────────────────────
export function getRooms(): Room[] {
  if (typeof window === 'undefined') return ROOMS
  try {
    const raw = localStorage.getItem(ROOMS_KEY)
    if (!raw) {
      localStorage.setItem(ROOMS_KEY, JSON.stringify(ROOMS))
      return ROOMS
    }
    return JSON.parse(raw)
  } catch {
    return ROOMS
  }
}

export function saveRooms(rooms: Room[]): void {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
}

export function addRoom(name: string): Room {
  const rooms = getRooms()
  const room: Room = { id: `room-${Date.now()}`, name: name.trim(), is_active: true }
  saveRooms([...rooms, room])
  return room
}

export function toggleRoom(id: string): void {
  saveRooms(getRooms().map(r => r.id === id ? { ...r, is_active: !r.is_active } : r))
}

// ── 차단 관리 ────────────────────────────────────────
export function getBlocked(): BlockedPeriod[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addBlock(data: Omit<BlockedPeriod, 'id'>): void {
  const all = getBlocked()
  localStorage.setItem(BLOCKED_KEY, JSON.stringify([...all, { id: `blk-${Date.now()}`, ...data }]))
}

export function removeBlock(id: string): void {
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(getBlocked().filter(b => b.id !== id)))
}

export function isSlotBlocked(date: string, time: string): boolean {
  const h = parseInt(time)
  return getBlocked().some(b => {
    if (b.date !== date) return false
    if (!b.start_time) return true                          // 종일 차단
    return h >= parseInt(b.start_time) && h < parseInt(b.end_time ?? '24')
  })
}

// ── 관리자 인증 ──────────────────────────────────────
const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin1234'

export function checkPassword(pw: string): boolean {
  return pw === ADMIN_PW
}

export function loginAdmin(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(SESSION_KEY) === '1'
}
