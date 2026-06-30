'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkPassword, loginAdmin } from '@/lib/admin-storage'

export default function AdminLoginPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    if (checkPassword(pw)) {
      loginAdmin()
      // 서버 API(신청서 제출 조회) 인증용 토큰 저장
      sessionStorage.setItem('ybm_admin_token', pw)
      router.push('/admin/dashboard')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
      setPw('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-1">관리자 로그인</h1>
        <p className="text-xs text-gray-400 mb-5">청년성서모임 공간 예약 관리</p>
        <input
          type="password"
          autoFocus
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-blue-400"
          placeholder="비밀번호"
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          로그인
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full mt-2 py-2 text-xs text-gray-400"
        >
          일반 예약 화면으로
        </button>
      </div>
    </div>
  )
}
