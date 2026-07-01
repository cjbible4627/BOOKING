import type { Room, GroupStage } from './types'

export const GROUP_COLORS: Record<GroupStage, {
  cell: string      // cell bg + text
  badge: string     // badge pill
  name: string      // name text
  sub: string       // secondary text
}> = {
  '창세기':   { cell: 'bg-blue-50',   badge: 'bg-blue-600 text-white',   name: 'text-blue-900',   sub: 'text-blue-600' },
  '탈출기':   { cell: 'bg-green-50',  badge: 'bg-green-600 text-white',  name: 'text-green-900',  sub: 'text-green-600' },
  '마르코':   { cell: 'bg-red-50',    badge: 'bg-red-600 text-white',    name: 'text-red-900',    sub: 'text-red-600' },
  '요한':     { cell: 'bg-white border border-gray-200', badge: 'bg-gray-400 text-white', name: 'text-gray-800', sub: 'text-gray-500' },
  '사도행전': { cell: 'bg-yellow-50', badge: 'bg-yellow-500 text-white', name: 'text-yellow-900', sub: 'text-yellow-600' },
  '이사야':   { cell: 'bg-pink-50',   badge: 'bg-pink-500 text-white',   name: 'text-pink-900',   sub: 'text-pink-600' },
  '청소년센터': { cell: 'bg-teal-50',  badge: 'bg-teal-600 text-white',   name: 'text-teal-900',   sub: 'text-teal-600' },
  '한처음':   { cell: 'bg-purple-50', badge: 'bg-purple-600 text-white', name: 'text-purple-900', sub: 'text-purple-600' },
}

export const ROOMS: Room[] = [
  { id: 'room-1', name: '한처음방', is_active: true },
  { id: 'room-2', name: '대학생방', is_active: true },
  { id: 'room-3', name: '다목적실', is_active: true },
]

export const GROUP_STAGES: GroupStage[] = [
  '창세기', '탈출기', '마르코', '요한', '사도행전', '이사야', '청소년센터', '한처음',
]

export const OP_START = 8   // 08:00
export const OP_END   = 24  // 24:00 (last slot starts at 23:00)

// ["08:00", "09:00", ..., "23:00"]
export const TIME_SLOTS: string[] = Array.from(
  { length: OP_END - OP_START },
  (_, i) => `${String(OP_START + i).padStart(2, '0')}:00`,
)
