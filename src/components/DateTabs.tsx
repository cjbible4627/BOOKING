'use client'
import { useMemo } from 'react'

interface Props {
  selected: string
  onSelect: (date: string) => void
}

const DAY = ['일', '월', '화', '수', '목', '금', '토']

export default function DateTabs({ selected, onSelect }: Props) {
  const dates = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return d
    })
  }, [])

  return (
    <div className="flex overflow-x-auto gap-1.5 px-3 py-2 bg-white border-b border-gray-100 scrollbar-none">
      {dates.map((d, i) => {
        const iso = d.toLocaleDateString('sv-SE') // YYYY-MM-DD
        const isSelected = iso === selected
        const isToday = i === 0
        return (
          <button
            key={iso}
            onClick={() => onSelect(iso)}
            className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl min-w-[44px] transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            <span className="text-[10px] leading-none">
              {isToday ? '오늘' : DAY[d.getDay()]}
            </span>
            <span className="text-[17px] font-bold leading-snug">{d.getDate()}</span>
            <span className="text-[10px] leading-none">{d.getMonth() + 1}월</span>
          </button>
        )
      })}
    </div>
  )
}
