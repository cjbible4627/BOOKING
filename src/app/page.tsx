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
      <header className="px-4 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-medium tracking-wide mb-0.5">청년성서모임 한처음</p>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              &lsquo;그룹공부&rsquo; 예약
            </h1>
            <p className="text-[12px] text-gray-400 mt-1">장소 : 가톨릭 청소년 센터</p>
          </div>
          <a href="/admin" className="text-[11px] text-gray-300 hover:text-gray-500 mt-1">관리자</a>
        </div>
      </header>

      {/* 공지사항 */}
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-bold text-gray-800">📢 공지사항</span>
        </div>

        {notices.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl px-4 py-5 text-center text-gray-400 text-sm">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="bg-blue-50 rounded-2xl px-4 py-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.content}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mx-4 my-3 border-t border-gray-100" />

      {/* 신청자 입력란 */}
      <section className="px-4 pb-8 flex-1">
        <p className="text-sm font-bold text-gray-800 mb-3">신청자 입력</p>

        <div className="flex gap-2 mb-3">
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">이름</span>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">세례명</span>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              placeholder="요한"
              value={baptismal}
              onChange={(e) => setBaptismal(e.target.value)}
            />
          </label>
        </div>

        <label className="block mb-3">
          <span className="text-xs text-gray-500 mb-1 block">그룹과정</span>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400"
            value={groupStage}
            onChange={(e) => setGroupStage(e.target.value as GroupStage)}
          >
            {GROUP_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="text-xs text-gray-500 mb-1 block">개인 비밀번호 (숫자 4자리)</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 tracking-widest"
            placeholder="●●●●"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <p className="text-[11px] text-gray-400 mt-1">예약 취소·수정 시 사용됩니다.</p>
        </label>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleEnter}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold"
        >
          예약하러 가기
        </button>
      </section>
    </div>
  )
}
