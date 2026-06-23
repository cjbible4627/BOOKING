'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { GroupStage, Notice, UserIdentity } from '@/lib/types'
import { GROUP_STAGES } from '@/lib/constants'
import { getNotices } from '@/lib/admin-storage'

const IDENTITY_KEY = 'ybm_identity'

export default function Home() {
  const router = useRouter()
  const [notices, setNotices]         = useState<Notice[]>([])
  const [name, setName]               = useState('')
  const [baptismal, setBaptismal]     = useState('')
  const [groupStage, setGroupStage]   = useState<GroupStage>('창세기')
  const [pin, setPin]                 = useState('')
  const [error, setError]             = useState('')

  useEffect(() => {
    getNotices().then(setNotices)
    try {
      const saved: UserIdentity = JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? '{}')
      if (saved.name)       setName(saved.name)
      if (saved.baptismal)  setBaptismal(saved.baptismal)
      if (saved.groupStage) setGroupStage(saved.groupStage)
      if (saved.pin)        setPin(saved.pin)
    } catch {}
  }, [])

  function handleEnter() {
    if (!name.trim())     return setError('이름을 입력해주세요.')
    if (!baptismal.trim()) return setError('세례명을 입력해주세요.')
    if (!/^\d{4}$/.test(pin)) return setError('개인 비밀번호는 숫자 4자리입니다.')

    const identity: UserIdentity = {
      name: name.trim(),
      baptismal: baptismal.trim(),
      groupStage,
      pin,
    }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
    router.push('/booking')
  }

  return (
    <div className="flex flex-col min-h-svh bg-white">
      {/* Header */}
      <header className="px-4 pt-5 pb-5 bg-white border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          {/* 로고 테두리 박스 */}
          <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-symbol.jpg" alt="한처음 심볼" className="w-16 h-16 object-contain flex-shrink-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.jpg" alt="천주교청주교구청년성서모임 한처음" className="flex-1 min-w-0 object-contain object-left" style={{ height: '52px' }} />
          </div>
          <a href="/admin" className="text-xs font-bold text-gray-600 hover:text-gray-900 mt-2 flex-shrink-0 border border-gray-300 rounded-lg px-2.5 py-1">관리자</a>
        </div>
        <div className="mt-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl px-5 py-5 text-center">
          <h1 className="text-[26px] font-extrabold text-blue-800 leading-tight">
            &lsquo;그룹공부&rsquo; 예약
          </h1>
          <p className="text-sm font-medium text-blue-500 mt-1">장소 : 가톨릭 청소년 센터</p>
        </div>
      </header>

      {/* 공지사항 */}
      <section className="px-4 pt-5 pb-3">
        <div className="border-2 border-red-200 rounded-2xl p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-extrabold text-red-600">📢 공지사항</span>
          </div>

          {notices.length === 0 ? (
            <div className="py-4 text-center text-red-300 text-sm">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {notices.map((n) => (
                <div key={n.id} className="bg-red-100 rounded-xl px-4 py-3">
                  <p className="text-base text-red-900 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-red-400 mt-1.5">
                    {new Date(n.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-4 my-4 border-t border-gray-100" />

      {/* 그룹봉사자 입력란 */}
      <section className="px-4 pb-10 flex-1">
        <p className="text-base font-extrabold text-black mb-4">그룹봉사자</p>

        <div className="flex gap-3 mb-4">
          <label className="flex-1">
            <span className="text-sm font-semibold text-gray-700 mb-1.5 block">이름</span>
            <input
              className="w-full border-2 border-gray-800 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-blue-600"
              placeholder="최양업"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex-1">
            <span className="text-sm font-semibold text-gray-700 mb-1.5 block">세례명</span>
            <input
              className="w-full border-2 border-gray-800 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-blue-600"
              placeholder="토마스"
              value={baptismal}
              onChange={(e) => setBaptismal(e.target.value)}
            />
          </label>
        </div>

        <label className="block mb-4">
          <span className="text-sm font-semibold text-gray-700 mb-1.5 block">그룹과정</span>
          <select
            className="w-full border-2 border-gray-800 rounded-xl px-4 py-3 text-base font-medium bg-white focus:outline-none focus:border-blue-600"
            value={groupStage}
            onChange={(e) => setGroupStage(e.target.value as GroupStage)}
          >
            {GROUP_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="block mb-5">
          <span className="text-sm font-semibold text-gray-700 mb-1.5 block">개인 비밀번호 (숫자 4자리)</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full border-2 border-gray-800 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-blue-600 tracking-widest"
            placeholder="●●●●"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <p className="text-xs font-medium text-gray-500 mt-1.5">예약 취소·수정 시 사용됩니다.</p>
        </label>

        {error && <p className="text-red-500 text-sm font-semibold mb-3">{error}</p>}

        <button
          onClick={handleEnter}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-bold"
        >
          예약하러 가기
        </button>
      </section>
    </div>
  )
}
