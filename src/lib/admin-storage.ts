import type { Room, Notice } from './types'
import { ROOMS } from './constants'
import { supabase } from './supabase'

const SESSION_KEY = 'ybm_admin_session'

export interface BlockedPeriod {
  id: string
  date: string
  start_time?: string
  end_time?: string
  note?: string
}

// ── 방 관리 ─────────────────────────────────────────
export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at')
  if (error) return ROOMS
  return data ?? ROOMS
}

export async function addRoom(name: string): Promise<Room> {
  const id = `room-${Date.now()}`
  const { data, error } = await supabase
    .from('rooms')
    .insert({ id, name: name.trim(), is_active: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleRoom(id: string): Promise<void> {
  const { data } = await supabase.from('rooms').select('is_active').eq('id', id).single()
  if (!data) return
  await supabase.from('rooms').update({ is_active: !data.is_active }).eq('id', id)
}

// ── 차단 관리 ────────────────────────────────────────
export async function getBlocked(): Promise<BlockedPeriod[]> {
  const { data, error } = await supabase.from('blocked_periods').select('*').order('date')
  if (error) return []
  return (data ?? []).map(b => ({
    id: b.id,
    date: b.date,
    start_time: b.start_time ?? undefined,
    end_time: b.end_time ?? undefined,
    note: b.note ?? undefined,
  }))
}

export async function addBlock(data: Omit<BlockedPeriod, 'id'>): Promise<void> {
  const id = `blk-${Date.now()}`
  await supabase.from('blocked_periods').insert({ id, ...data })
}

export async function removeBlock(id: string): Promise<void> {
  await supabase.from('blocked_periods').delete().eq('id', id)
}

export function checkSlotBlocked(blocks: BlockedPeriod[], date: string, time: string): boolean {
  const h = parseInt(time)
  return blocks.some(b => {
    if (b.date !== date) return false
    if (!b.start_time) return true
    return h >= parseInt(b.start_time) && h < parseInt(b.end_time ?? '24')
  })
}

// ── 공지사항 관리 ────────────────────────────────────
export async function getNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function addNotice(content: string): Promise<void> {
  await supabase.from('notices').insert({ content })
}

export async function removeNotice(id: string): Promise<void> {
  await supabase.from('notices').update({ is_active: false }).eq('id', id)
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
