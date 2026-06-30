'use client'
import { useState, useEffect } from 'react'
import { getPrivacySettings, updatePrivacySetting } from '@/lib/settings-storage'

export default function PrivacyConsentEditor() {
  const [intro,  setIntro]  = useState('')
  const [items,  setItems]  = useState('')
  const [footer, setFooter] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [open,   setOpen]   = useState(false)

  useEffect(() => {
    getPrivacySettings().then(s => {
      setIntro(s.intro)
      setItems(s.items)
      setFooter(s.footer)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await Promise.all([
      updatePrivacySetting('privacy_intro',  intro),
      updatePrivacySetting('privacy_items',  items),
      updatePrivacySetting('privacy_footer', footer),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden mb-5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left"
      >
        <span className="text-sm font-semibold text-gray-700">🔒 개인정보 동의 문구 설정</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 flex flex-col gap-4">
          <p className="text-xs text-gray-400">모든 신청서 하단에 자동으로 표시되는 개인정보 동의 문구입니다.</p>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">본문 (서두)</label>
            <textarea
              rows={4}
              value={intro}
              onChange={e => setIntro(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">고지 사항 항목 (줄바꿈으로 구분)</label>
            <textarea
              rows={5}
              value={items}
              onChange={e => setItems(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">하단 문구</label>
            <input
              type="text"
              value={footer}
              onChange={e => setFooter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
          >
            {saved ? '✓ 저장됨' : saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
    </div>
  )
}
