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
