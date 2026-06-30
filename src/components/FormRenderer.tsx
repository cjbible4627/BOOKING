'use client'
import { useState } from 'react'
import type { FormWithFields, AnswerValue } from '@/lib/form-types'
import { submitForm } from '@/lib/form-client'
import FieldInput from './FieldInput'

interface Props {
  form: FormWithFields
}

function isEmpty(type: string, v: AnswerValue): boolean {
  if (type === 'checkbox') return !Array.isArray(v) || v.length === 0
  if (type === 'agree')    return v !== true
  if (type === 'number')   return v === null || v === undefined || v === '' || Number.isNaN(Number(v))
  return v === null || v === undefined || String(v).trim() === ''
}

export default function FormRenderer({ form }: Props) {
  const [values, setValues] = useState<Record<string, AnswerValue>>({})
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  function setValue(id: string, v: AnswerValue) {
    setValues((prev) => ({ ...prev, [id]: v }))
  }

  async function handleSubmit() {
    // 필수 검증
    for (const f of form.fields) {
      if (f.required && isEmpty(f.type, values[f.id] ?? null)) {
        setError(`'${f.label || '필수 항목'}'을(를) 입력해주세요.`)
        return
      }
    }
    setLoading(true)
    setError('')
    const result = await submitForm(form.id, values)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? '제출에 실패했습니다.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <span className="text-5xl mb-4">✅</span>
        <h2 className="text-lg font-bold text-gray-900 mb-1">제출이 완료되었습니다</h2>
        <p className="text-sm text-gray-500">{form.title} 신청이 정상적으로 접수되었습니다.</p>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-extrabold text-gray-900 mb-1">{form.title}</h1>
      {form.description && (
        <p className="text-sm text-gray-500 whitespace-pre-wrap mb-6">{form.description}</p>
      )}
      {!form.description && <div className="mb-4" />}

      {form.fields.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-16 bg-gray-50 rounded-2xl">
          아직 등록된 질문이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {form.fields.map((f) => (
            <div key={f.id}>
              <label className="block mb-1.5">
                <span className="text-sm font-semibold text-gray-800">
                  {f.label || '(제목 없음)'}
                  {f.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </label>
              <FieldInput
                field={f}
                value={values[f.id] ?? (f.type === 'checkbox' ? [] : f.type === 'agree' ? false : '')}
                onChange={(v) => setValue(f.id, v)}
              />
            </div>
          ))}

          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-bold disabled:opacity-50"
          >
            {loading ? '제출 중...' : '제출하기'}
          </button>
        </div>
      )}
    </div>
  )
}
