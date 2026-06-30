// 브라우저 → 서버 Route Handler 호출 래퍼.
// 제출/조회는 service_role 보호 라우트를 거친다(직접 supabase 접근 X).
import type { AnswerValue, FormSubmission } from './form-types'

const ADMIN_TOKEN_KEY = 'ybm_admin_token'

export async function submitForm(
  formId: string,
  values: Record<string, AnswerValue>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, values }),
    })
    const json = await res.json()
    return json
  } catch {
    return { ok: false, error: '네트워크 오류가 발생했습니다.' }
  }
}

function adminToken(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? ''
}

export async function fetchSubmissions(formId: string): Promise<FormSubmission[]> {
  const res = await fetch(`/api/admin/submissions?formId=${encodeURIComponent(formId)}`, {
    headers: { 'x-admin-token': adminToken() },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('관리자 인증이 만료되었습니다. 다시 로그인해주세요.')
    throw new Error('제출 목록 조회에 실패했습니다.')
  }
  const json = await res.json()
  return json.submissions ?? []
}

export async function deleteSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/submissions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': adminToken() },
  })
  if (!res.ok) throw new Error('삭제에 실패했습니다.')
}
