import { supabase } from './supabase'

export interface PrivacySettings {
  intro: string
  items: string
  footer: string
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['privacy_intro', 'privacy_items', 'privacy_footer'])
  const map: Record<string, string> = {}
  data?.forEach(r => { map[r.key] = r.value })
  return {
    intro:  map['privacy_intro']  ?? '',
    items:  map['privacy_items']  ?? '',
    footer: map['privacy_footer'] ?? '',
  }
}

export async function updatePrivacySetting(key: string, value: string): Promise<void> {
  await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
}

// 예약 접수 시작 시각 — ISO 8601 문자열 또는 null(제한 없음)
export async function getBookingOpenAt(): Promise<string | null> {
  const { data } = await supabase.from('settings').select('value').eq('key', 'booking_open_at').maybeSingle()
  return data?.value ?? null
}

export async function setBookingOpenAt(value: string | null): Promise<void> {
  if (value === null) {
    await supabase.from('settings').delete().eq('key', 'booking_open_at')
  } else {
    await supabase.from('settings').upsert({ key: 'booking_open_at', value, updated_at: new Date().toISOString() })
  }
}
