'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Notice } from '@/lib/types'
import type { FormDef } from '@/lib/form-types'
import { getNotices } from '@/lib/admin-storage'
import { getOpenForms } from '@/lib/form-storage'

export default function Home() {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [forms, setForms]     = useState<FormDef[]>([])

  useEffect(() => {
    getNotices().then(setNotices)
    getOpenForms().then(setForms)
  }, [])

  return (
    <div className="flex flex-col min-h-svh bg-white">
      {/* Header */}
      <header className="px-4 pt-5 pb-5 bg-white border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-symbol.jpg" alt="한처음 심볼" className="w-16 h-16 object-contain flex-shrink-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.jpg" alt="천주교청주교구청년성서모임 한처음" className="flex-1 min-w-0 object-contain object-left" style={{ height: '52px' }} />
          </div>
          <a href="/admin" className="text-xs font-bold text-gray-600 hover:text-gray-900 mt-2 flex-shrink-0 border border-gray-300 rounded-lg px-2.5 py-1">관리자</a>
        </div>
        <div className="mt-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl px-5 py-5 text-center">
          <h1 className="text-[24px] font-extrabold text-blue-800 leading-tight">청년성서모임 한처음</h1>
          <p className="text-sm font-medium text-blue-500 mt-1">예약 · 신청 통합 서비스</p>
        </div>
      </header>

      {/* 공지사항 */}
      <section className="px-4 pt-5 pb-3">
        <div className="border-2 border-red-200 rounded-2xl p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-extrabold text-red-600">📢 공지사항</span>
          </div>
          {notices.length === 0 ? (
            <div className="py-4 text-center text-red-300 text-sm">등록된 공지사항이 없습니다.</div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
              {notices.map((n) => (
                <div key={n.id} className="bg-red-100 rounded-xl px-4 py-3">
                  <p className="text-base text-red-900 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-red-400 mt-1.5">{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 메뉴 카드 */}
      <section className="px-4 pb-10 flex-1">
        <p className="text-base font-extrabold text-black mb-3">바로가기</p>

        {/* 공간 예약 — 대표 카드 */}
        <button
          onClick={() => router.push('/booking')}
          className="w-full flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-5 mb-3 text-left active:scale-[0.99] transition-transform"
        >
          <span className="text-3xl">🗓️</span>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">그룹공부 공간 예약</p>
            <p className="text-xs font-medium text-blue-100 mt-0.5">방 · 시간대 예약하기</p>
          </div>
          <span className="text-white text-xl">›</span>
        </button>

        {/* 신청서 카드 */}
        {forms.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {forms.map((f) => (
              <button
                key={f.id}
                onClick={() => router.push(`/apply/${f.key}`)}
                className="flex flex-col gap-2 rounded-2xl border-2 border-gray-200 px-4 py-4 text-left active:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">📝</span>
                <p className="text-sm font-bold text-gray-900 leading-snug">{f.title}</p>
                <span className="text-[11px] font-bold text-green-600">
                  {f.open_mode === 'period' && f.open_end ? `~${f.open_end.slice(5).replace('-', '/')}까지 ›` : '모집중 ›'}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <footer className="py-4 text-center">
        <p className="text-[11px] text-gray-300 font-medium">Made by 김영섭 대건안드레아</p>
      </footer>
    </div>
  )
}
