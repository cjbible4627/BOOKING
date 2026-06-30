'use client'
import { useState, useEffect } from 'react'
import type { FormWithFields, AnswerValue } from '@/lib/form-types'
import type { PrivacySettings } from '@/lib/settings-storage'
import { submitForm } from '@/lib/form-client'
import { getPrivacySettings } from '@/lib/settings-storage'
import FieldInput from './FieldInput'

interface Props {
  form: FormWithFields
  preview?: boolean
}

function isEmpty(type: string, v: AnswerValue): boolean {
  if (type === 'checkbox') return !Array.isArray(v) || v.length === 0
  if (type === 'agree')    return v !== true
  if (type === 'number')   return v === null || v === undefined || v === '' || Number.isNaN(Number(v))
  return v === null || v === undefined || String(v).trim() === ''
}

export default function FormRenderer({ form, preview }: Props) {
  const [values, setValues]   = useState<Record<string, AnswerValue>>({})
  const [agreed, setAgreed]   = useState(false)
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  useEffect(() => { getPrivacySettings().then(setPrivacy) }, [])

  function setValue(id: string, v: AnswerValue) {
    setValues((prev) => ({ ...prev, [id]: v }))
  }

  async function handleSubmit() {
    for (const f of form.fields) {
      if (f.required && isEmpty(f.type, values[f.id] ?? null)) {
        setError(`'${f.label || '필수 항목'}'을(를) 입력해주세요.`)
        return
      }
    }
    if (!agreed) {
      setError('개인정보 수집 및 활용에 동의해주세요.')
      return
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

          {/* 개인정보 수집 및 활용 동의 */}
          {privacy && (
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-sm text-gray-700 leading-relaxed">
              <p className="font-bold text-gray-900 mb-2 text-center">개인정보 제공 및 활용 동의</p>
              {privacy.intro && (
                <p className="mb-3 text-xs text-gray-600 whitespace-pre-wrap">{privacy.intro}</p>
              )}
              {privacy.items && (
                <div className="border border-gray-300 rounded-xl p-3 mb-3 text-xs text-gray-600 space-y-1.5 bg-white">
                  <p className="font-semibold text-gray-800 text-center mb-2">{'< 개인정보 수집 및 활용 관련 고지 사항 >'}</p>
                  {privacy.items.split('\n').filter(Boolean).map((item, i) => (
                    <p key={i}>• {item}</p>
                  ))}
                </div>
              )}
              {privacy.footer && (
                <p className="text-xs text-center text-gray-600 mb-3">{privacy.footer}</p>
              )}
              <label className="flex items-center gap-2 cursor-pointer justify-center">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-gray-800">동의합니다</span>
              </label>
            </div>
          )}

          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

          <button
            onClick={preview ? undefined : handleSubmit}
            disabled={loading || preview}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-bold disabled:opacity-50"
          >
            {preview ? '제출하기 (미리보기)' : loading ? '제출 중...' : '제출하기'}
          </button>
        </div>
      )}
    </div>
  )
}
