// 폼 정의/질문 CRUD — anon 클라이언트 사용 (비민감 데이터).
// 제출(form_submissions)은 서버 라우트 경유 → form-client.ts 참고.
import { supabase } from './supabase'
import type { FormDef, FormField, FormRound, FormWithFields, FormWithRound, FieldType } from './form-types'
import { isFormOpenNow } from './form-types'

// 현재 회차를 임베드하는 select 구문 (FK: forms.current_round_id → form_rounds.id)
const FORM_WITH_ROUND = '*, current_round:current_round_id(*)'

// ── 공개 ─────────────────────────────────────────────
export async function getOpenForms(): Promise<FormWithRound[]> {
  const { data, error } = await supabase
    .from('forms')
    .select(FORM_WITH_ROUND)
    .eq('is_active', true)
    .eq('is_open', true)
    .order('sort_order')
  if (error) return []
  // 회차제는 현재 회차 기간 내일 때만 노출
  return ((data ?? []) as unknown as FormWithRound[]).filter(f => isFormOpenNow(f, f.current_round))
}

export async function getFormByKey(key: string): Promise<FormWithFields | null> {
  const { data: form, error } = await supabase
    .from('forms')
    .select(FORM_WITH_ROUND)
    .eq('key', key)
    .eq('is_active', true)
    .maybeSingle()
  if (error || !form) return null

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', (form as { id: string }).id)
    .order('sort_order')

  return { ...(form as unknown as FormWithRound), fields: fields ?? [] }
}

// ── 관리자: 폼 정의 ──────────────────────────────────
export async function getAllForms(): Promise<FormWithRound[]> {
  const { data, error } = await supabase
    .from('forms')
    .select(FORM_WITH_ROUND)
    .eq('is_active', true)
    .order('sort_order')
  if (error) return []
  return (data ?? []) as unknown as FormWithRound[]
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
  patch: Partial<Pick<FormDef, 'title' | 'description' | 'is_open' | 'open_mode' | 'current_round_id'>>,
): Promise<void> {
  const { error } = await supabase.from('forms').update(patch).eq('id', id)
  if (error) throw error
}

// ── 관리자: 회차 ─────────────────────────────────────
export async function getRounds(formId: string): Promise<FormRound[]> {
  const { data, error } = await supabase
    .from('form_rounds')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')
  if (error) return []
  return data ?? []
}

export async function addRound(
  formId: string,
  name: string,
  open_start: string | null,
  open_end: string | null,
): Promise<FormRound> {
  const { data: max } = await supabase
    .from('form_rounds')
    .select('sort_order')
    .eq('form_id', formId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sort_order = (max?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('form_rounds')
    .insert({ form_id: formId, name: name.trim(), open_start, open_end, sort_order })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRound(
  id: string,
  patch: Partial<Pick<FormRound, 'name' | 'open_start' | 'open_end'>>,
): Promise<void> {
  const { error } = await supabase.from('form_rounds').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteRound(id: string): Promise<void> {
  await supabase.from('form_rounds').delete().eq('id', id)
}

export async function setCurrentRound(formId: string, roundId: string | null): Promise<void> {
  await supabase.from('forms').update({ current_round_id: roundId }).eq('id', formId)
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
