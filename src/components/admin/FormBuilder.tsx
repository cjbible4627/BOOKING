'use client'
import { useState, useEffect } from 'react'
import type { FormDef, FormField, FieldType, OpenMode } from '@/lib/form-types'
import { FIELD_TYPES, FIELD_TYPE_LABELS, CHOICE_TYPES } from '@/lib/form-types'
import {
  getFields, addField, updateField, deleteField, reorderFields, updateForm,
} from '@/lib/form-storage'

interface Props { form: FormDef }

export default function FormBuilder({ form }: Props) {
  const [fields, setFields] = useState<FormField[]>([])
  const [desc, setDesc]     = useState(form.description ?? '')
  const [openMode, setOpenMode]   = useState<OpenMode>(form.open_mode)
  const [openStart, setOpenStart] = useState(form.open_start ?? '')
  const [openEnd, setOpenEnd]     = useState(form.open_end ?? '')
  const [loading, setLoading] = useState(true)

  async function load() {
    setFields(await getFields(form.id))
    setLoading(false)
  }
  useEffect(() => { load() }, [form.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 로컬 상태 즉시 반영 + DB 저장
  function patchLocal(id: string, patch: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  async function handleAdd() {
    const f = await addField(form.id, 'short')
    setFields(prev => [...prev, f])
  }

  async function handleDelete(id: string) {
    await deleteField(id)
    setFields(prev => prev.filter(f => f.id !== id))
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...fields]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setFields(next)
    await reorderFields(next.map(f => f.id))
  }

  function changeType(f: FormField, type: FieldType) {
    const needsOpts = CHOICE_TYPES.includes(type)
    const options = needsOpts && f.options.length === 0 ? ['옵션 1'] : f.options
    patchLocal(f.id, { type, options })
    updateField(f.id, { type, options })
  }

  function setOption(f: FormField, idx: number, val: string) {
    const options = f.options.map((o, i) => i === idx ? val : o)
    patchLocal(f.id, { options })
  }
  function saveOptions(f: FormField) { updateField(f.id, { options: f.options }) }
  function addOption(f: FormField) {
    const options = [...f.options, `옵션 ${f.options.length + 1}`]
    patchLocal(f.id, { options }); updateField(f.id, { options })
  }
  function removeOption(f: FormField, idx: number) {
    const options = f.options.filter((_, i) => i !== idx)
    patchLocal(f.id, { options }); updateField(f.id, { options })
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
  }

  function changeMode(mode: OpenMode) {
    setOpenMode(mode)
    updateForm(form.id, { open_mode: mode })
  }

  return (
    <div className="px-4 py-4 max-w-2xl">
      {/* 모집 설정 */}
      <div className="rounded-2xl border-2 border-gray-200 p-4 mb-5">
        <span className="text-xs font-semibold text-gray-500 mb-2 block">모집 방식</span>
        <div className="flex gap-2 mb-1">
          {([['always', '상시 모집'], ['period', '기간 모집']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                openMode === m ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {openMode === 'period' && (
          <div className="flex gap-2 mt-3">
            <label className="flex-1">
              <span className="text-xs text-gray-400 mb-1 block">시작일</span>
              <input
                type="date"
                value={openStart}
                onChange={e => { setOpenStart(e.target.value); updateForm(form.id, { open_start: e.target.value || null }) }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-gray-400 mb-1 block">종료일</span>
              <input
                type="date"
                value={openEnd}
                onChange={e => { setOpenEnd(e.target.value); updateForm(form.id, { open_end: e.target.value || null }) }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </label>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-2">
          {openMode === 'period'
            ? '설정한 기간에만 홈 화면에 노출되고, 기간이 지나면 자동으로 마감됩니다.'
            : '게시 토글이 켜져 있는 동안 항상 노출됩니다.'}
          {' '}모집을 켜고 끄는 것은 목록의 “모집중/중지” 버튼에서.
        </p>
      </div>

      {/* 안내문구 */}
      <label className="block mb-5">
        <span className="text-xs font-semibold text-gray-500 mb-1.5 block">안내 문구 (선택)</span>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onBlur={e => updateForm(form.id, { description: e.target.value })}
          placeholder="신청서 상단에 표시할 안내 문구"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 min-h-[60px] resize-y"
        />
      </label>

      {/* 질문 목록 */}
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => (
          <div key={f.id} className="rounded-2xl border-2 border-gray-200 p-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-1">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="w-6 h-5 flex items-center justify-center text-gray-500 bg-gray-100 rounded text-xs disabled:opacity-30">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === fields.length - 1}
                  className="w-6 h-5 flex items-center justify-center text-gray-500 bg-gray-100 rounded text-xs disabled:opacity-30">▼</button>
              </div>

              <div className="flex-1 min-w-0">
                {/* 질문 라벨 */}
                <input
                  type="text"
                  value={f.label}
                  onChange={e => patchLocal(f.id, { label: e.target.value })}
                  onBlur={e => updateField(f.id, { label: e.target.value })}
                  placeholder="질문을 입력하세요"
                  className="w-full border-b-2 border-gray-200 px-1 py-1.5 text-sm font-medium focus:outline-none focus:border-blue-500 mb-2"
                />

                {/* 타입 + 필수 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <select
                    value={f.type}
                    onChange={e => changeType(f, e.target.value as FieldType)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
                  >
                    {FIELD_TYPES.map(t => (
                      <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => { const r = !f.required; patchLocal(f.id, { required: r }); updateField(f.id, { required: r }) }}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      f.required ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    필수
                  </button>

                  <button
                    onClick={() => handleDelete(f.id)}
                    className="ml-auto text-xs font-bold text-red-500 px-2.5 py-1.5 rounded-lg border border-red-200 active:bg-red-50"
                  >
                    삭제
                  </button>
                </div>

                {/* 선택지 편집 */}
                {CHOICE_TYPES.includes(f.type) && (
                  <div className="flex flex-col gap-1.5 mt-1 pl-1">
                    {f.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className="text-gray-300 text-xs">{f.type === 'checkbox' ? '☐' : '○'}</span>
                        <input
                          type="text"
                          value={o}
                          onChange={e => setOption(f, oi, e.target.value)}
                          onBlur={() => saveOptions(f)}
                          className="flex-1 border-b border-gray-200 px-1 py-1 text-xs focus:outline-none focus:border-blue-400"
                        />
                        <button onClick={() => removeOption(f, oi)} className="text-gray-400 text-xs px-1">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addOption(f)} className="text-xs text-blue-600 font-semibold text-left pl-5 mt-0.5">+ 선택지 추가</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-bold text-gray-500 active:bg-gray-50"
      >
        + 질문 추가
      </button>
    </div>
  )
}
