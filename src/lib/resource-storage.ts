import type { Resource } from './types'
import { supabase } from './supabase'

export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function addLink(title: string, url: string): Promise<void> {
  await supabase.from('resources').insert({ type: 'link', title, url })
}

export async function uploadFile(file: File, title: string): Promise<void> {
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('resources')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (upErr) throw upErr

  const { data: urlData } = supabase.storage.from('resources').getPublicUrl(path)

  const { error: dbErr } = await supabase.from('resources').insert({
    type: 'file',
    title,
    url: urlData.publicUrl,
    file_name: file.name,
    file_size: file.size,
  })
  if (dbErr) throw dbErr
}

export async function updateResourceTitle(id: string, title: string): Promise<void> {
  await supabase.from('resources').update({ title }).eq('id', id)
}

export async function deleteResource(id: string): Promise<void> {
  await supabase.from('resources').update({ is_active: false }).eq('id', id)
}
