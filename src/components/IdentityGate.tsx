'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { GroupStage, UserIdentity } from '@/lib/types'
import { GROUP_STAGES } from '@/lib/constants'

const IDENTITY_KEY = 'ybm_identity'

interface Props {
  onComplete: (identity: UserIdentity) => void
}

export default function IdentityGate({ onComplete }: Props) {
  const router = useRouter()
  const [name, setName]             = useState('')
  const [baptismal, setBaptismal]   = useState('')
  const [groupStage, setGroupStage] = useState<GroupStage>('창세기')
  const [pin, setPin]               = useState('')
  const [error, setError]           = useState('')

  useEffect(() => {
    try {
      const saved: UserIdentity = JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? '{}')
      if (saved.name)       setName(saved.name)
      if (saved.baptismal)  setBaptismal(saved.baptismal)
      if (saved.groupStage) setGroupStage(saved.groupStage)
      if (saved.pin)        setPin(saved.pin)
    } catch {}
  }, [])

  function handleEnter() {
    if (!name.trim())      return setError('이름을 입력해주세요.')
    if (!baptismal.trim()) return setError('세례명을 입력해주세요.')
    if (!/^\d{4}$/.test(pin)) return setError('개인 비밀번호는 숫자 4자리입니다.')

    const identity: UserIdentity = { name: name.trim(), baptismal: baptismal.trim(), groupStage, pin }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
    onComplete(identity)
  }

  return (
    <div className="flex flex-col min-h-svh bg-white">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-gray-800">그룹공부 공간 예약</span>
      </header>

      <section className="px-4 pt-6 pb-10 flex-1">
        <p className="text-base font-extrabold text-black mb-1">그룹봉사자 정보</p>
        <p className="text-sm text-gray-500 mb-5">예약을 위해 봉사자 정보를 입력해주세요.</p>

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
