// 폼 정의/질문 CRUD — anon 클라이언트 사용 (비민감 데이터).
// 제출(form_submissions)은 서버 라우트 경유 → form-client.ts 참고.
import { supabase } from './supabase'
import type { FormDef, FormField, FormWithFields, FieldType } from './form-types'
import { isFormOpenNow } from './form-types'

// ── 공개 ─────────────────────────────────────────────
export async function getOpenForms(): Promise<FormDef[]> {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('is_active', true)
    .eq('is_open', true)
    .order('sort_order')
  if (error) return []
  // 기간 모집은 현재 날짜가 기간 내일 때만 노출
  return (data ?? []).filter(f => isFormOpenNow(f))
}

export async function getFormByKey(key: string): Promise<FormWithFields | null> {
  const { data: form, error } = await supabase
    .from('forms')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .maybeSingle()
  if (error || !form) return null

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', form.id)
    .order('sort_order')

  return { ...form, fields: fields ?? [] }
}

// ── 관리자: 폼 정의 ──────────────────────────────────
export async function getAllForms(): Promise<FormDef[]> {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) return []
  return data ?? []
}

export async function createForm(title: string, key: string): Promise<FormDef> {
  // 정렬 맨 뒤로
  const { data: max } = await supabase
    .from('forms')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sort_order = (max?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('forms')
    .insert({ title: title.trim(), key: key.trim(), sort_order, is_open: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateForm(
  id: string,
  patch: Partial<Pick<FormDef, 'title' | 'description' | 'is_open' | 'open_mode' | 'open_start' | 'open_end'>>,
): Promise<void> {
  const { error } = await supabase.from('forms').update(patch).eq('id', id)
  if (error) throw error
}

export async function toggleFormOpen(id: string, is_open: boolean): Promise<void> {
  await supabase.from('forms').update({ is_open }).eq('id', id)
}

export async function deleteForm(id: string): Promise<void> {
  // soft delete
  await supabase.from('forms').update({ is_active: false }).eq('id', id)
}

export async function reorderForms(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from('forms').update({ sort_order: i + 1 }).eq('id', id),
    ),
  )
}

// ── 관리자: 질문 ─────────────────────────────────────
export async function getFields(formId: string): Promise<FormField[]> {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')
  if (error) return []
  return data ?? []
}

export async function addField(formId: string, type: FieldType = 'short'): Promise<FormField> {
  const { data: max } = await supabase
    .from('form_fields')
    .select('sort_order')
    .eq('form_id', formId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sort_order = (max?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('form_fields')
    .insert({ form_id: formId, label: '', type, options: [], required: false, sort_order })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateField(
  id: string,
  patch: Partial<Pick<FormField, 'label' | 'type' | 'options' | 'required' | 'placeholder'>>,
): Promise<void> {
  const { error } = await supabase.from('form_fields').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteField(id: string): Promise<void> {
  await supabase.from('form_fields').delete().eq('id', id)
}

export async function reorderFields(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from('form_fields').update({ sort_order: i + 1 }).eq('id', id),
    ),
  )
}
