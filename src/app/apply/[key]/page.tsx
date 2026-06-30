'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FormWithFields } from '@/lib/form-types'
import { isFormOpenNow, periodStatus } from '@/lib/form-types'
import { getFormByKey } from '@/lib/form-storage'
import FormRenderer from '@/components/FormRenderer'

function pad(n: number) { return String(n).padStart(2, '0') }

function Countdown({ openAt, title }: { openAt: Date; title: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff    = Math.max(0, openAt.getTime() - now.getTime())
  const days    = Math.floor(diff / 86400000)
  const hours   = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  const openStr = openAt.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-20 text-center">
      <span className="text-5xl mb-5">🔒</span>
      <h2 className="text-lg font-extrabold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-8">{openStr}부터 접수가 시작됩니다</p>

      <div className="flex items-end gap-3 mb-8">
        {days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{days}</span>
            <span className="text-xs font-semibold text-blue-400 mt-1">일</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{pad(hours)}</span>
          <span className="text-xs font-semibold text-blue-400 mt-1">시간</span>
        </div>
        <span className="text-2xl font-bold text-blue-300 pb-5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{pad(minutes)}</span>
          <span className="text-xs font-semibold text-blue-400 mt-1">분</span>
        </div>
        <span className="text-2xl font-bold text-blue-300 pb-5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700 tabular-nums">{pad(seconds)}</span>
          <span className="text-xs font-semibold text-blue-400 mt-1">초</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">접수 시작 시각이 되면 자동으로 신청서가 열립니다</p>
    </div>
  )
}

export default function ApplyPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params)
  const router = useRouter()
  const [form, setForm]   = useState<FormWithFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow]     = useState(() => new Date())

  useEffect(() => {
    getFormByKey(key).then((f) => {
      setForm(f)
      setLoading(false)
    })
  }, [key])

  // open_at 이 미래일 때만 1초 tick
  useEffect(() => {
    if (!form?.open_at) return
    if (new Date(form.open_at) <= new Date()) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [form?.open_at])

  const openAt  = form?.open_at ? new Date(form.open_at) : null
  const isLocked = openAt !== null && now < openAt

  return (
    <div className="min-h-svh bg-white flex flex-col">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-gray-800">신청서</span>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">불러오는 중...</div>
      ) : !form ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-2">
          <span className="text-4xl">🔍</span>
          <p className="text-sm font-semibold text-gray-500">존재하지 않는 신청서입니다.</p>
        </div>
      ) : isLocked ? (
        <Countdown openAt={openAt!} title={form.title} />
      ) : !isFormOpenNow(form, form.current_round) ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-2">
          <span className="text-4xl">{periodStatus(form, form.current_round) === 'before' ? '⏳' : '🔒'}</span>
          <p className="text-base font-bold text-gray-800">{form.title}</p>
          {periodStatus(form, form.current_round) === 'before' ? (
            <p className="text-sm text-gray-500">아직 모집 시작 전입니다.{form.current_round?.open_start ? ` (${form.current_round.open_start} 시작)` : ''}</p>
          ) : periodStatus(form, form.current_round) === 'after' ? (
            <p className="text-sm text-gray-500">모집이 마감되었습니다.</p>
          ) : (
            <p className="text-sm text-gray-500">현재 모집 중이 아닙니다.</p>
          )}
        </div>
      ) : (
        <FormRenderer form={form} />
      )}
    </div>
  )
}
