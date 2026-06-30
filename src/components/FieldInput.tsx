'use client'
import type { FormField, AnswerValue } from '@/lib/form-types'

interface Props {
  field: FormField
  value: AnswerValue
  onChange: (v: AnswerValue) => void
}

const INPUT = 'w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-blue-600'

export default function FieldInput({ field, value, onChange }: Props) {
  const { type, options, placeholder } = field

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
