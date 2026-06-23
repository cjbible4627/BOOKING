import type { Booking, NewBooking } from './types'
import { supabase } from './supabase'

export async function bookingsForDate(date: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', date)
    .order('start_time')
  if (error) throw error
  return data ?? []
}

export async function myBookings(name: string, baptismal: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('leader_name', name)
    .eq('baptismal_name', baptismal)
    .order('date')
    .order('start_time')
  if (error) throw error
  return data ?? []
}

export async function loadBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*')
  if (error) throw error
  return data ?? []
}

export async function upcomingBookings(from: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('date', from)
    .order('date')
    .order('start_time')
  if (error) throw error
  return data ?? []
}

export async function createBooking(data: NewBooking): Promise<{ ok: boolean; error?: string; booking?: Booking }> {
  const { data: inserted, error } = await supabase
    .from('bookings')
    .insert(data)
    .select()
    .single()
  if (error) {
    if (error.message.includes('booking_conflict')) {
      return { ok: false, error: '해당 시간에 이미 예약이 있습니다.' }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true, booking: inserted }
}

export async function updateBooking(id: string, data: Partial<NewBooking>): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('bookings').update(data).eq('id', id)
  if (error) {
    if (error.message.includes('booking_conflict')) {
      return { ok: false, error: '해당 시간에 이미 예약이 있습니다.' }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function cancelBooking(id: string): Promise<void> {
  await supabase.from('bookings').delete().eq('id', id)
}
