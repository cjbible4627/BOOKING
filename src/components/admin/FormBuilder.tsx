'use client'
import { useState, useEffect } from 'react'
import type { FormDef, FormField, FormRound, FieldType, OpenMode } from '@/lib/form-types'
import { FIELD_TYPES, FIELD_TYPE_LABELS, CHOICE_TYPES } from '@/lib/form-types'
import {
  getFields, addField, updateField, deleteField, reorderFields, updateForm,
  getRounds, addRound, updateRound, deleteRound, setCurrentRound,
} from '@/lib/form-storage'

interface Props { form: FormDef }

export default function FormBuilder({ form }: Props) {
  const [fields, setFields] = useState<FormField[]>([])
  const [desc, setDesc]     = useState(form.description ?? '')
  const [openMode, setOpenMode]   = useState<OpenMode>(form.open_mode)
  const [rounds, setRounds]       = useState<FormRound[]>([])
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(form.current_round_id)
  const [newRoundName, setNewRoundName]     = useState('')
  const [newRoundStart, setNewRoundStart]   = useState('')
  const [newRoundEnd, setNewRoundEnd]       = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function load() {
    const [fs, rs] = await Promise.all([getFields(form.id), getRounds(form.id)])
    setFields(fs)
    setRounds(rs)
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

  // ── 회차 핸들러 ──
  async function handleAddRound() {
    if (!newRoundName.trim()) return
    const r = await addRound(form.id, newRoundName, newRoundStart || null, newRoundEnd || null)
    const next = [...rounds, r]
    setRounds(next)
    setNewRoundName(''); setNewRoundStart(''); setNewRoundEnd('')
    // 첫 회차면 자동으로 현재 회차 지정
    if (!currentRoundId) { setCurrentRoundId(r.id); await setCurrentRound(form.id, r.id) }
  }
  async function makeCurrent(id: string) {
    setCurrentRoundId(id)
    await setCurrentRound(form.id, id)
  }
  function patchRoundLocal(id: string, patch: Partial<FormRound>) {
    setRounds(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }
  async function handleDeleteRound(id: string) {
    await deleteRound(id)
    setRounds(prev => prev.filter(r => r.id !== id))
    if (currentRoundId === id) { setCurrentRoundId(null); await setCurrentRound(form.id, null) }
  }

  return (
    <div className="px-4 py-4 max-w-2xl">
      {/* 자동저장 인디케이터 */}
      <div className={`flex items-center justify-end mb-3 transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-xs text-green-600 font-semibold">✓ 저장됨</span>
      </div>

      {/* 모집 설정 */}
      <div className="rounded-2xl border-2 border-gray-200 p-4 mb-5">
        <span className="text-xs font-semibold text-gray-500 mb-2 block">모집 방식</span>
        <div className="flex gap-2 mb-1">
          {([['always', '상시 모집'], ['period', '회차 모집']] as const).map(([m, label]) => (
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

        {openMode === 'always' ? (
          <p className="text-[11px] text-gray-400 mt-2">
            게시 토글이 켜져 있는 동안 항상 노출됩니다. 모집을 켜고 끄는 것은 목록의 “모집중/중지” 버튼에서.
          </p>
        ) : (
          <div className="mt-3">
            <span className="text-xs font-semibold text-gray-500 mb-2 block">회차 관리</span>

            {/* 회차 목록 */}
            {rounds.length === 0 ? (
              <p className="text-[11px] text-gray-400 mb-3">아직 회차가 없습니다. 아래에서 첫 회차를 추가하세요.</p>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {rounds.map(r => {
                  const isCurrent = r.id === currentRoundId
                  return (
                    <div key={r.id} className={`rounded-xl border-2 p-2.5 ${isCurrent ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="text"
                          value={r.name}
                          onChange={e => patchRoundLocal(r.id, { name: e.target.value })}
                          onBlur={e => updateRound(r.id, { name: e.target.value })}
                          className="flex-1 min-w-0 border-b border-gray-200 px-1 py-0.5 text-sm font-bold focus:outline-none focus:border-blue-500 bg-transparent"
                        />
                        {isCurrent
                          ? <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">현재 회차</span>
                          : <button onClick={() => makeCurrent(r.id)} className="text-[10px] font-bold text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">현재로 지정</button>}
                        <button onClick={() => handleDeleteRound(r.id)} className="text-[10px] font-bold text-red-400 flex-shrink-0">삭제</button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={r.open_start ?? ''}
                          onChange={e => { patchRoundLocal(r.id, { open_start: e.target.value || null }); updateRound(r.id, { open_start: e.target.value || null }) }}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                        />
                        <span className="text-gray-400 text-xs self-center">~</span>
                        <input
                          type="date"
                          value={r.open_end ?? ''}
                          onChange={e => { patchRoundLocal(r.id, { open_end: e.target.value || null }); updateRound(r.id, { open_end: e.target.value || null }) }}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 새 회차 추가 */}
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-2.5">
              <input
                type="text"
                value={newRoundName}
                onChange={e => setNewRoundName(e.target.value)}
                placeholder="새 회차 이름 (예: 2026-1학기)"
                className="w-full border-b border-gray-200 px-1 py-1 text-sm focus:outline-none focus:border-blue-500 mb-2"
              />
              <div className="flex gap-2 mb-2">
                <input type="date" value={newRoundStart} onChange={e => setNewRoundStart(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400" />
                <span className="text-gray-400 text-xs self-center">~</span>
                <input type="date" value={newRoundEnd} onChange={e => setNewRoundEnd(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <button onClick={handleAddRound} disabled={!newRoundName.trim()}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-40">
                + 회차 추가
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-2">
              <b>현재 회차</b>의 기간에만 홈에 노출·접수되고, 새 제출은 현재 회차로 기록됩니다. 새 학기엔 회차를 추가하고 “현재로 지정”하세요. (게시 ON 필요)
            </p>
          </div>
        )}
      </div>

      {/* 안내문구 */}
      <label className="block mb-5">
        <span className="text-xs font-semibold text-gray-500 mb-1.5 block">안내 문구 (선택)</span>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onBlur={e => { updateForm(form.id, { description: e.target.value }); flashSaved() }}
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
                  onBlur={e => { updateField(f.id, { label: e.target.value }); flashSaved() }}
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
