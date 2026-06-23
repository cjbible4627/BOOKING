import type { Room, GroupStage } from './types'

export const ROOMS: Room[] = [
  { id: 'room-1', name: '한처음방', is_active: true },
  { id: 'room-2', name: '대학생방', is_active: true },
  { id: 'room-3', name: '다목적실', is_active: true },
]

export const GROUP_STAGES: GroupStage[] = [
  '창세기', '탈출기', '마르코', '요한', '사도행전', '이사야',
]

export const OP_START = 8   // 08:00
export const OP_END   = 24  // 24:00 (last slot starts at 23:00)

// ["08:00", "09:00", ..., "23:00"]
export const TIME_SLOTS: string[] = Array.from(
  { length: OP_END - OP_START },
  (_, i) => `${String(OP_START + i).padStart(2, '0')}:00`,
)
