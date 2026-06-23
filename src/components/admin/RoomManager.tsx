'use client'
import { useState, useEffect } from 'react'
import type { Room } from '@/lib/types'
import { getRooms, addRoom, toggleRoom } from '@/lib/admin-storage'

export default function RoomManager() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newName, setNewName] = useState('')

  useEffect(() => { setRooms(getRooms()) }, [])

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    addRoom(name)
    setRooms(getRooms())
    setNewName('')
  }

  function handleToggle(id: string) {
    toggleRoom(id)
    setRooms(getRooms())
  }

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 mb-4">
        비활성화된 방은 예약 그리드에서 숨겨집니다.
      </p>

      <div className="mb-4">
        {rooms.map(r => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
              <span className={`text-sm ${r.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                {r.name}
              </span>
            </div>
            <button
              onClick={() => handleToggle(r.id)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                r.is_active
                  ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                  : 'border-green-200 text-green-600 bg-green-50'
              }`}
            >
              {r.is_active ? '비활성화' : '활성화'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          placeholder="새 방 이름"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          추가
        </button>
      </div>
    </div>
  )
}
