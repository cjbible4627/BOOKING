'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { FormField, AnswerValue } from '@/lib/form-types'

interface Props {
  field: FormField
  value: AnswerValue
  onChange: (v: AnswerValue) => void
}

const INPUT = 'w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-blue-600'

function FileInput({ field, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const fileName = value ? decodeURIComponent(String(value).split('/').pop() ?? '') : ''

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    setUploading(true)
    setUploadError('')
    const safeName = file.name.replace(/\s+/g, '_')
    const path = `${field.form_id}/${Date.now()}_${safeName}`
    const { error } = await supabase.storage.from('form-attachments').upload(path, file)
    if (error) {
      setUploadError('업로드에 실패했습니다. 다시 시도해주세요.')
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('form-attachments').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="flex items-center gap-2 border-2 border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
          <span className="text-2xl">📎</span>
          <span className="flex-1 text-sm font-medium text-blue-800 truncate">{fileName}</span>
          <button
            type="button"
            onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = '' }}
            className="text-xs text-red-400 font-bold flex-shrink-0"
          >
            삭제
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm font-semibold text-gray-500 flex items-center justify-center gap-2 active:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? (
            <><span className="animate-spin">⏳</span> 업로드 중...</>
          ) : (
            <><span>📎</span> 파일 선택 (최대 5MB)</>
          )}
        </button>
      )}
      {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
    </div>
  )
}

export default function FieldInput({ field, value, onChange }: Props) {
  const { type, options, placeholder } = field

  if (type === 'file') return <FileInput field={field} value={value} onChange={onChange} />

  switch (type) {
    case 'long':
      return (
        <textarea
          className={INPUT + ' min-h-[96px] resize-y'}
          placeholder={placeholder ?? ''}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          className={INPUT}
          placeholder={placeholder ?? ''}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'date':
      return (
        <input
          type="date"
          className={INPUT}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'tel':
      return (
        <input
          type="tel"
          inputMode="tel"
          className={INPUT}
          placeholder={placeholder ?? '010-0000-0000'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'email':
      return (
        <input
          type="email"
          inputMode="email"
          className={INPUT}
          placeholder={placeholder ?? 'example@email.com'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'dropdown':
      return (
        <select
          className={INPUT + ' bg-white'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">선택하세요</option>
          {options.map((o, i) => (
            <option key={i} value={o}>{o}</option>
          ))}
        </select>
      )

    case 'radio':
      return (
        <div className="flex flex-col gap-2">
          {options.map((o, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                value === o ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                className="w-4 h-4 accent-blue-600"
                checked={value === o}
                onChange={() => onChange(o)}
              />
              <span className="text-sm font-medium text-gray-800">{o}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      const toggle = (o: string) =>
        onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])
      return (
        <div className="flex flex-col gap-2">
          {options.map((o, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                arr.includes(o) ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600"
                checked={arr.includes(o)}
                onChange={() => toggle(o)}
              />
              <span className="text-sm font-medium text-gray-800">{o}</span>
            </label>
          ))}
        </div>
      )
    }

    case 'agree':
      return (
        <label
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
            value === true ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <input
            type="checkbox"
            className="w-4 h-4 accent-blue-600"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-800">동의합니다</span>
        </label>
      )

    case 'short':
    default:
      return (
        <input
          type="text"
          className={INPUT}
          placeholder={placeholder ?? ''}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
