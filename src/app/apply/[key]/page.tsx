'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FormWithFields } from '@/lib/form-types'
import { isFormOpenNow, periodStatus } from '@/lib/form-types'
import { getFormByKey } from '@/lib/form-storage'
import FormRenderer from '@/components/FormRenderer'

export default function ApplyPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params)
  const router = useRouter()
  const [form, setForm]       = useState<FormWithFields | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFormByKey(key).then((f) => {
      setForm(f)
      setLoading(false)
    })
  }, [key])

  return (
    <div className="min-h-svh bg-white">
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
