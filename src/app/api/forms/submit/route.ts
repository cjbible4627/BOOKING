import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isFormOpenNow } from '@/lib/form-types'
import type { AnswerValue, AnswerEntry } from '@/lib/form-types'

export const dynamic = 'force-dynamic'

function isEmpty(type: string, v: AnswerValue): boolean {
  if (type === 'checkbox') return !Array.isArray(v) || v.length === 0
  if (type === 'agree')    return v !== true
  if (type === 'number')   return v === null || v === undefined || v === '' || Number.isNaN(Number(v))
  return v === null || v === undefined || String(v).trim() === ''
}

export async function POST(request: Request) {
  let body: { formId?: string; values?: Record<string, AnswerValue> }
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { formId, values } = body
  if (!formId || typeof values !== 'object' || values === null) {
    return Response.json({ ok: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // 폼 존재 + 모집중(게시 + 현재 회차 기간) 확인
  const { data: form, error: formErr } = await supabaseAdmin
    .from('forms')
    .select('id, is_open, is_active, open_mode, current_round_id, current_round:current_round_id(open_start, open_end)')
    .eq('id', formId)
    .maybeSingle()
  if (formErr || !form || !form.is_active) {
    return Response.json({ ok: false, error: '존재하지 않는 신청서입니다.' }, { status: 404 })
  }
  type RoundShape = { open_start: string | null; open_end: string | null }
  const f = form as unknown as { current_round_id: string | null; current_round: RoundShape | RoundShape[] | null }
  const currentRound = Array.isArray(f.current_round) ? (f.current_round[0] ?? null) : f.current_round
  if (!isFormOpenNow(form, currentRound)) {
    return Response.json({ ok: false, error: '현재 모집 기간이 아닙니다.' }, { status: 403 })
  }

  // 질문 로드 → 필수 검증 + 스냅샷 구성 (서버 신뢰)
  const { data: fields } = await supabaseAdmin
    .from('form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')

  const entries: AnswerEntry[] = []
  for (const f of fields ?? []) {
    const value = (values as Record<string, AnswerValue>)[f.id] ?? null
    if (f.required && isEmpty(f.type, value)) {
      return Response.json({ ok: false, error: `'${f.label || '필수 항목'}'을(를) 입력해주세요.` }, { status: 400 })
    }
    entries.push({ field_id: f.id, label: f.label, type: f.type, value })
  }

  const { error: insErr } = await supabaseAdmin
    .from('form_submissions')
    .insert({ form_id: formId, round_id: f.current_round_id, answers: { fields: entries } })
  if (insErr) {
    return Response.json({ ok: false, error: '제출에 실패했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
