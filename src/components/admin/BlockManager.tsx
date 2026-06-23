'use client'
import { useState, useEffect } from 'react'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { getBlocked, addBlock, removeBlock } from '@/lib/admin-storage'
import { TIME_SLOTS, OP_END } from '@/lib/constants'

export default function BlockManager() {
  const [blocks, setBlocked]   = useState<BlockedPeriod[]>([])
  const [date, setDate]        = useState('')
  const [allDay, setAllDay]    = useState(true)
  const [startTime, setStart]  = useState('09:00')
  const [endTime, setEnd]      = useState('18:00')
  const [note, setNote]        = useState('')

  async function refresh() {
    setBlocked(await getBlocked())
  }

  useEffect(() => { refresh() }, [])

  async function handleAdd() {
    if (!date) return
    await addBlock({
      date,
      start_time: allDay ? undefined : startTime,
      end_time:   allDay ? undefined : endTime,
      note: note.trim() || undefined,
    })
    await refresh()
    setDate('')
    setNote('')
  }

  async function handleRemove(id: string) {
    await removeBlock(id)
    await refresh()
  }

  const endOptions = [...TIME_SLOTS.slice(1), `${String(OP_END).padStart(2,'0')}:00`]

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 mb-3">
        차단된 날짜·시간에는 예약을 할 수 없습니다.
      </p>

      <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex gap-2">
          {[true, false].map(isAllDay => (
            <button
              key={String(isAllDay)}
              onClick={() => setAllDay(isAllDay)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                allDay === isAllDay
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {isAllDay ? '종일' : '시간 지정'}
            </button>
          ))}
        </div>

        {!allDay && (
          <div className="flex items-center gap-2">
            <select
              value={startTime}
              onChange={e => setStart(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white"
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-gray-400 text-xs">~</span>
            <select
              value={endTime}
              onChange={e => setEnd(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white"
            >
              {endOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          placeholder="메모 (선택)"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <button
          onClick={handleAdd}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          차단 추가
        </button>
      </div>

      {blocks.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">차단된 날짜가 없습니다.</p>
      ) : (
        [...blocks]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(b => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm text-gray-800">
                  {b.date}
                  <span className="text-gray-400 ml-1.5">
                    {b.start_time ? `${b.start_time}~${b.end_time}` : '종일'}
                  </span>
                </p>
                {b.note && <p className="text-xs text-gray-400 mt-0.5">{b.note}</p>}
              </div>
              <button
                onClick={() => handleRemove(b.id)}
                className="text-xs text-red-500 px-2.5 py-1 border border-red-200 rounded-xl ml-3"
              >
                삭제
              </button>
            </div>
          ))
      )}
    </div>
  )
}
