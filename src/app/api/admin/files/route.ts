import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { AnswerEntry } from '@/lib/form-types'

export const dynamic = 'force-dynamic'

function authed(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  const expected = process.env.ADMIN_PASSWORD
  return !!expected && token === expected
}

// Public URL → Storage path (form-attachments/…)
function pathFromUrl(url: string): string | null {
  try {
    const marker = '/object/public/form-attachments/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.slice(idx + marker.length))
  } catch {
    return null
  }
}

// POST /api/admin/files
// body: { formId: string; roundId?: string }
// 1. 해당 formId(+roundId) 제출 조회
// 2. file 타입 답변의 Storage 파일 삭제
// 3. answers JSONB 업데이트 — "(파일 삭제됨)"
export async function POST(request: NextRequest) {
  if (!authed(request)) {
    return Response.json({ ok: false, error: '인증되지 않았습니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const formId: string | undefined = body?.formId
  const roundId: string | undefined = body?.roundId // undefined = 전체

  if (!formId) {
    return Response.json({ ok: false, error: 'formId가 필요합니다.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 1. 제출 조회
  let query = supabase
    .from('form_submissions')
    .select('id, answers')
    .eq('form_id', formId)

  if (roundId) query = query.eq('round_id', roundId)

  const { data: submissions, error: fetchErr } = await query
  if (fetchErr) {
    return Response.json({ ok: false, error: '조회에 실패했습니다.' }, { status: 500 })
  }

  if (!submissions || submissions.length === 0) {
    return Response.json({ ok: true, deleted: 0, updated: 0 })
  }

  const storagePaths: string[] = []
  let updatedCount = 0

  for (const sub of submissions) {
    const fields: AnswerEntry[] = sub.answers?.fields ?? []
    let changed = false

    const newFields = fields.map((f) => {
      if (f.type === 'file' && f.value && typeof f.value === 'string') {
        const p = pathFromUrl(f.value)
        if (p) storagePaths.push(p)
        changed = true
        return { ...f, value: '(파일 삭제됨)' }
      }
      return f
    })

    if (changed) {
      const { error: updErr } = await supabase
        .from('form_submissions')
        .update({ answers: { ...sub.answers, fields: newFields } })
        .eq('id', sub.id)
      if (!updErr) updatedCount++
    }
  }

  // 2. Storage 파일 삭제
  let deletedCount = 0
  if (storagePaths.length > 0) {
    // 최대 100개씩 배치 삭제
    for (let i = 0; i < storagePaths.length; i += 100) {
      const batch = storagePaths.slice(i, i + 100)
      const { error: delErr } = await supabase.storage
        .from('form-attachments')
        .remove(batch)
      if (!delErr) deletedCount += batch.length
    }
  }

  return Response.json({ ok: true, deleted: deletedCount, updated: updatedCount })
}
