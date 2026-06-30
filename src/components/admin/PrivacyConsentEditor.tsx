'use client'
import { useState, useEffect } from 'react'
import { getPrivacySettings, updatePrivacySetting } from '@/lib/settings-storage'

function PrivacyPreview({ intro, items, footer }: { intro: string; items: string; footer: string }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-sm text-gray-700 leading-relaxed">
      <p className="font-bold text-gray-900 mb-2 text-center">개인정보 제공 및 활용 동의</p>
      {intro && (
        <p className="mb-3 text-xs text-gray-600 whitespace-pre-wrap">{intro}</p>
      )}
      {items && (
        <div className="border border-gray-300 rounded-xl p-3 mb-3 text-xs text-gray-600 space-y-1.5 bg-white">
          <p className="font-semibold text-gray-800 text-center mb-2">{'< 개인정보 수집 및 활용 관련 고지 사항 >'}</p>
          {items.split('\n').filter(Boolean).map((item, i) => (
            <p key={i}>• {item}</p>
          ))}
        </div>
      )}
      {footer && (
        <p className="text-xs text-center text-gray-600 mb-3">{footer}</p>
      )}
      <label className="flex items-center gap-2 cursor-pointer justify-center">
        <input type="checkbox" disabled className="w-4 h-4 accent-blue-600" />
        <span className="text-sm font-semibold text-gray-800">동의합니다</span>
      </label>
    </div>
  )
}

export default function PrivacyConsentEditor() {
  const [intro,  setIntro]  = useState('')
  const [items,  setItems]  = useState('')
  const [footer, setFooter] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [open,   setOpen]   = useState(false)
  const [tab,    setTab]    = useState<'edit' | 'preview'>('edit')

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

          {/* 탭 */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setTab('edit')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === 'edit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              편집
            </button>
            <button
              onClick={() => setTab('preview')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === 'preview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              미리보기
            </button>
          </div>

          {tab === 'edit' ? (
            <>
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
            </>
          ) : (
            <PrivacyPreview intro={intro} items={items} footer={footer} />
          )}
        </div>
      )}
    </div>
  )
}
