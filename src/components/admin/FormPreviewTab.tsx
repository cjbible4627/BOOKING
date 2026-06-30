'use client'
import { useState, useEffect } from 'react'
import type { FormWithRound, FormWithFields } from '@/lib/form-types'
import { getFields } from '@/lib/form-storage'
import FormRenderer from '@/components/FormRenderer'

export default function FormPreviewTab({ form }: { form: FormWithRound }) {
  const [formWithFields, setFormWithFields] = useState<FormWithFields | null>(null)

  useEffect(() => {
    getFields(form.id).then(fields => {
      setFormWithFields({ ...form, fields })
    })
  }, [form.id])

  if (!formWithFields) {
    return <div className="py-16 text-center text-gray-300 text-sm">불러오는 중...</div>
  }

  return (
    <div className="border-t border-gray-100">
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-amber-600">👁 미리보기 모드 — 실제 제출되지 않습니다</span>
      </div>
      <FormRenderer form={formWithFields} preview />
    </div>
  )
}
