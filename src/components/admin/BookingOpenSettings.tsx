'use client'
import { useState, useEffect } from 'react'
import { getBookingOpenAt, setBookingOpenAt } from '@/lib/settings-storage'

function toLocalInput(iso: string): string {
  // ISO → datetime-local input value (YYYY-MM-DDTHH:mm)
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(local: string): string {
  // datetime-local → ISO (로컬 시간 기준)
  return new Date(local).toISOString()
}

export default function BookingOpenSettings() {
  const [current, setCurrent] = useState<string | null>(null)   // 저장된 ISO
  const [input, setInput]     = useState('')                     // datetime-local 값
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBookingOpenAt().then(val => {
      setCurrent(val)
      if (val) setInput(toLocalInput(val))
      setLoading(false)
    })
  }, [])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSave() {
    if (!input) return
    setSaving(true)
    const iso = fromLocalInput(input)
    await setBookingOpenAt(iso)
    setCurrent(iso)
    flash('저장되었습니다.')
    setSaving(false)
  }

  async function handleClear() {
    setSaving(true)
    await setBookingOpenAt(null)
    setCurrent(null)
    setInput('')
    flash('접수 제한이 해제되었습니다.')
    setSaving(false)
  }

  const isActive = current !== null && new Date() < new Date(current)
  const isPast   = current !== null && new Date() >= new Date(current)

  if (loading) return <div className="px-4 py-8 text-center text-sm text-gray-400">불러오는 중...</div>

  return (
    <div className="px-4 py-5 max-w-lg">
      <p className="text-xs text-gray-500 mb-5">
        설정한 날짜·시각 이전에는 예약 화면에서 카운트다운이 표시되고 예약이 불가합니다.
        시각이 지나면 자동으로 예약이 열립니다. 설정하지 않으면 항상 예약 가능합니다.
      </p>

      {/* 현재 상태 */}
      <div className={`rounded-2xl border-2 px-4 py-3 mb-5 ${
        isActive ? 'border-amber-200 bg-amber-50' :
        isPast   ? 'border-green-200 bg-green-50' :
                   'border-gray-200 bg-gray-50'
      }`}>
        <p className="text-xs font-semibold text-gray-500 mb-1">현재 상태</p>
        {!current ? (
          <p className="text-sm font-bold text-gray-700">제한 없음 — 항상 예약 가능</p>
        ) : isActive ? (
          <>
            <p className="text-sm font-bold text-amber-700">접수 대기 중 🔒</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {new Date(current).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 부터 접수 시작
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-green-700">접수 중 🔓</p>
            <p className="text-xs text-green-600 mt-0.5">
              {new Date(current).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 에 개방됨
            </p>
          </>
        )}
      </div>

      {/* 시각 설정 */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">접수 시작 날짜·시각</span>
          <input
            type="datetime-local"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={!input || saving}
          className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold disabled:opacity-40"
        >
          {saving ? '저장 중...' : '⏰ 접수 시작 시각 설정'}
        </button>

        {current && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="w-full py-3 bg-white border-2 border-red-200 text-red-500 rounded-2xl text-sm font-bold disabled:opacity-40"
          >
            🔓 접수 제한 해제 (항상 예약 가능)
          </button>
        )}

        {msg && (
          <p className="text-center text-sm font-semibold text-green-600">{msg}</p>
        )}
      </div>
    </div>
  )
}
