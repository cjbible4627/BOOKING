// ⚠️ 서버 전용 — service_role 키를 사용합니다. RLS를 우회하므로
// 클라이언트 컴포넌트('use client')에서 절대 import 하지 마세요.
// Route Handler(app/api/**/route.ts)에서만 사용합니다.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// 지연 생성: 모듈 import 시점이 아니라 첫 호출 시 생성한다.
// (빌드 중 빈 키로 createClient가 throw하는 것을 방지)
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.')
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _client
}
