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
  const [agreed, setAgreed] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

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
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-sm text-gray-700 leading-relaxed">
            <p className="font-bold text-gray-900 mb-2 text-center">개인정보 제공 및 활용 동의</p>
            <p className="mb-3 text-xs text-gray-600">
              본인은 천주교 청주교구 청소년사목국에서 운영하는 청년성서모임에 참가 하면서 청소년사목국이 본인의 성명, 생년월일, 주소, 연락처, 부모님 연락, 본당활동단체 등에 관한 정보를 활용할 필요가 있다는 것을 이해하고 있으며, 이를 위해 「개인정보 보호법」등에 의해 보호되고 있는 본인에 관한 각종 정보자료를 제15조의 규정 등에 따라 청소년사목국에 제공하는데 동의합니다.
            </p>
            <div className="border border-gray-300 rounded-xl p-3 mb-3 text-xs text-gray-600 space-y-1.5 bg-white">
              <p className="font-semibold text-gray-800 text-center mb-2">{'< 개인정보 수집 및 활용 관련 고지 사항 >'}</p>
              <p>• <span className="font-medium">개인정보 수집 이용의 목적:</span> 교육 준비와 연락, 소속본당확인 등</p>
              <p>• <span className="font-medium">수집하려는 개인정보의 항목:</span> 인적사항, 주소, 연락처, 학교 및 직업 등</p>
              <p>• <span className="font-medium">개인정보의 보유 및 이용기간:</span> 수집 이용에 관한 동의일로부터 청년성서모임을 하는 동안 위 이용목적을 위하여 보유 이용됩니다.</p>
              <p>• 개인정보 보관 및 처리에 거부할 권리가 있으며, 거부할 경우 청년성서모임 활동이 제한됩니다.</p>
            </div>
            <p className="text-xs text-center text-gray-600 mb-3">위와 같이 본인의 개인정보를 수집 이용하는 것에 동의합니다.</p>
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
