'use client'
import { useState, useEffect } from 'react'
import type { FormWithRound } from '@/lib/form-types'
import {
  getAllForms, createForm, toggleFormOpen, deleteForm, reorderForms,
} from '@/lib/form-storage'
import FormBuilder from './FormBuilder'
import FormSubmissions from './FormSubmissions'
import FormStats from './FormStats'
import FormPreviewTab from './FormPreviewTab'
import PrivacyConsentEditor from './PrivacyConsentEditor'

type Sub = 'fields' | 'submissions' | 'stats' | 'preview'

export default function FormManager() {
  const [forms, setForms]       = useState<FormWithRound[]>([])
  const [selected, setSelected] = useState<FormWithRound | null>(null)
  const [sub, setSub]           = useState<Sub>('fields')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  async function load() {
    setForms(await getAllForms())
  }
  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    const key = `form-${Date.now()}`
    await createForm(newTitle.trim(), key)
    setNewTitle('')
    await load()
    setCreating(false)
  }

  async function handleToggle(f: FormWithRound) {
    await toggleFormOpen(f.id, !f.is_open)
    setForms(prev => prev.map(x => x.id === f.id ? { ...x, is_open: !x.is_open } : x))
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...forms]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setForms(next)
    await reorderForms(next.map(f => f.id))
  }

  async function handleDelete(id: string) {
    await deleteForm(id)
    setConfirmDel(null)
    if (selected?.id === id) setSelected(null)
    await load()
  }

  // ── 폼 상세 (질문 편집 / 제출 목록) ──
  if (selected) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => setSelected(null)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200"
          >
            ‹
          </button>
          <span className="font-extrabold text-gray-900 text-[15px]">{selected.title}</span>
        </div>

        <div className="flex gap-1 px-4 border-b border-gray-100">
          {([['fields', '질문 편집'], ['submissions', '제출 목록'], ['stats', '통계'], ['preview', '미리보기']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSub(id)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                sub === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {sub === 'fields'      && <FormBuilder form={selected} />}
        {sub === 'submissions' && <FormSubmissions form={selected} />}
        {sub === 'stats'       && <FormStats form={selected} />}
        {sub === 'preview'     && <FormPreviewTab form={selected} />}
      </div>
    )
  }

  // ── 폼 목록 ──
  return (
    <div className="px-4 py-4 max-w-2xl">
      <p className="text-xs text-gray-500 mb-4">신청서를 만들고 질문을 직접 구성할 수 있습니다. 모집을 켜면 메인 화면에 노출됩니다.</p>

      <PrivacyConsentEditor />

      {/* 새 폼 생성 */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="새 신청서 이름"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newTitle.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
        >
          + 생성
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center text-gray-300 text-sm py-12 bg-gray-50 rounded-2xl">
          등록된 신청서가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {forms.map((f, i) => (
            <div key={f.id} className="rounded-2xl border-2 border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                {/* 순서 */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    className="w-6 h-5 flex items-center justify-center text-gray-500 bg-gray-100 rounded text-xs disabled:opacity-30">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === forms.length - 1}
                    className="w-6 h-5 flex items-center justify-center text-gray-500 bg-gray-100 rounded text-xs disabled:opacity-30">▼</button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{f.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {f.open_mode === 'period'
                      ? (f.current_round
                          ? `현재 회차: ${f.current_round.name}`
                          : '회차 모집 (회차 미지정)')
                      : '상시 모집'}
                  </p>
                </div>

                {/* 모집 토글 */}
                <button
                  onClick={() => handleToggle(f)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    f.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {f.is_open ? '모집중' : '모집중지'}
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setSelected(f); setSub('fields') }}
                  className="flex-1 py-2 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg active:bg-blue-50"
                >
                  질문 편집
                </button>
                <button
                  onClick={() => { setSelected(f); setSub('submissions') }}
                  className="flex-1 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg active:bg-gray-50"
                >
                  제출 목록
                </button>
                {confirmDel === f.id ? (
                  <>
                    <button onClick={() => setConfirmDel(null)} className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg">취소</button>
                    <button onClick={() => handleDelete(f.id)} className="px-3 py-2 text-xs font-bold text-white bg-red-500 rounded-lg">삭제</button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDel(f.id)}
                    className="px-3 py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg active:bg-red-50"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
