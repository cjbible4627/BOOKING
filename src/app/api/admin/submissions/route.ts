import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function authed(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  const expected = process.env.ADMIN_PASSWORD
  return !!expected && token === expected
}

export async function GET(request: NextRequest) {
  if (!authed(request)) {
    return Response.json({ ok: false, error: '인증되지 않았습니다.' }, { status: 401 })
  }
  const formId = request.nextUrl.searchParams.get('formId')
  if (!formId) {
    return Response.json({ ok: false, error: 'formId가 필요합니다.' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('form_submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })
  if (error) {
    return Response.json({ ok: false, error: '조회에 실패했습니다.' }, { status: 500 })
  }
  return Response.json({ ok: true, submissions: data ?? [] })
}

export async function DELETE(request: NextRequest) {
  if (!authed(request)) {
    return Response.json({ ok: false, error: '인증되지 않았습니다.' }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return Response.json({ ok: false, error: 'id가 필요합니다.' }, { status: 400 })
  }
  const { error } = await getSupabaseAdmin().from('form_submissions').delete().eq('id', id)
  if (error) {
    return Response.json({ ok: false, error: '삭제에 실패했습니다.' }, { status: 500 })
  }
  return Response.json({ ok: true })
}
