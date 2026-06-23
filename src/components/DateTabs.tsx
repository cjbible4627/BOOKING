'use client'
import { useState, useMemo, useRef } from 'react'

interface Props {
  selected: string
  onSelect: (date: string) => void
}

const DAY = ['일', '월', '화', '수', '목', '금', '토']

function toISO(d: Date): string {
  return d.toLocaleDateString('sv-SE')
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(base.getDate() + n)
  return d
}

function buildCalGrid(year: number, month: number) {
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevLast    = new Date(year, month, 0).getDate()
  const cells: Array<{ iso: string; day: number; cur: boolean }> = []

  const py = month === 0 ? year - 1 : year
  const pm = month === 0 ? 11     : month - 1
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ iso: toISO(new Date(py, pm, prevLast - i)), day: prevLast - i, cur: false })

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ iso: toISO(new Date(year, month, d)), day: d, cur: true })

  const ny = month === 11 ? year + 1 : year
  const nm = month === 11 ? 0       : month + 1
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++)
    cells.push({ iso: toISO(new Date(ny, nm, d)), day: d, cur: false })

  return cells
}

export default function DateTabs({ selected, onSelect }: Props) {
  const todayRef   = useRef(new Date())
  const today      = todayRef.current
  const todayISO   = toISO(today)

  const [offset, setOffset]     = useState(0)
  const [showCal, setShowCal]   = useState(false)
  const [calYear, setCalYear]   = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, offset + i)),
    [offset],
  )

  function prevWeek() { setOffset(o => Math.max(0, o - 7)) }
  function nextWeek() { setOffset(o => o + 7) }

  function pickFromCal(iso: string) {
    if (iso < todayISO) return
    onSelect(iso)
    const diff = Math.round(
      (new Date(iso + 'T00:00:00').getTime() - today.getTime()) / 86_400_000,
    )
    setOffset(Math.max(0, diff - 3))
    setShowCal(false)
  }

  function prevCalMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextCalMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const calCells = buildCalGrid(calYear, calMonth)

  const selDate  = new Date(selected + 'T00:00:00')
  const monthLabel = `${selDate.getFullYear()}년 ${selDate.getMonth() + 1}월`

  return (
    <div className="bg-white border-b-2 border-gray-200">
      {/* 월 표시 + 달력 버튼 */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
        <span className="text-xs font-extrabold text-black">{monthLabel}</span>
        <button
          onClick={() => setShowCal(v => !v)}
          className={`flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors ${
            showCal
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          날짜 선택
        </button>
      </div>

      {/* 날짜 스트립 + 화살표 */}
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          onClick={prevWeek}
          disabled={offset === 0}
          className="w-7 h-12 flex items-center justify-center text-black font-bold text-xl rounded-xl disabled:opacity-20 flex-shrink-0 active:bg-gray-100"
        >
          ‹
        </button>

        <div className="flex flex-1 gap-1">
          {dates.map((d) => {
            const iso      = toISO(d)
            const isSel    = iso === selected
            const isToday  = iso === todayISO
            const dow      = d.getDay()
            return (
              <button
                key={iso}
                onClick={() => onSelect(iso)}
                className={`flex flex-col items-center py-1.5 rounded-xl flex-1 transition-colors ${
                  isSel ? 'bg-blue-600' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                <span className={`text-[10px] leading-none font-semibold ${
                  isSel ? 'text-blue-100' : isToday ? 'text-blue-500' : dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {isToday ? '오늘' : DAY[dow]}
                </span>
                <span className={`text-[16px] font-extrabold leading-snug ${isSel ? 'text-white' : 'text-black'}`}>
                  {d.getDate()}
                </span>
                <span className={`text-[9px] leading-none ${isSel ? 'text-blue-200' : 'text-gray-400'}`}>
                  {d.getMonth() + 1}월
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={nextWeek}
          className="w-7 h-12 flex items-center justify-center text-black font-bold text-xl rounded-xl flex-shrink-0 active:bg-gray-100"
        >
          ›
        </button>
      </div>

      {/* 달력 팝업 */}
      {showCal && (
        <div className="px-3 pb-3">
          <div className="bg-sky-50 rounded-2xl p-3 border border-sky-200">
            {/* 월 네비 */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevCalMonth}
                className="w-7 h-7 flex items-center justify-center text-black font-bold text-base rounded-lg active:bg-sky-100">
                ‹
              </button>
              <span className="text-sm font-extrabold text-black">{calYear}년 {calMonth + 1}월</span>
              <button onClick={nextCalMonth}
                className="w-7 h-7 flex items-center justify-center text-black font-bold text-base rounded-lg active:bg-sky-100">
                ›
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {DAY.map((d, i) => (
                <div key={d} className={`text-center text-[10px] font-extrabold py-0.5
                  ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-600' : 'text-black'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-0.5">
              {calCells.map((cell, idx) => {
                const isPast   = cell.iso < todayISO
                const isSel    = cell.iso === selected
                const isToday  = cell.iso === todayISO
                const dow      = idx % 7
                const disabled = !cell.cur || isPast
                return (
                  <button
                    key={idx}
                    disabled={disabled}
                    onClick={() => pickFromCal(cell.iso)}
                    className={`h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-colors
                      ${disabled ? 'opacity-25 pointer-events-none' : ''}
                      ${isSel    ? 'bg-blue-600 text-white'
                      : isToday  ? 'bg-blue-100 text-blue-800'
                      : dow === 0 ? 'text-red-500 hover:bg-sky-100'
                      : dow === 6 ? 'text-blue-600 hover:bg-sky-100'
                      : 'text-black hover:bg-sky-100'
                      }
                    `}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
