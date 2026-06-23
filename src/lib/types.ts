export type GroupStage = '창세기' | '탈출기' | '마르코' | '요한' | '사도행전' | '이사야'

export interface Room {
  id: string
  name: string
  is_active: boolean
}

export interface Booking {
  id: string
  room_id: string
  date: string        // YYYY-MM-DD
  start_time: string  // "HH:00"
  end_time: string    // "HH:00"
  leader_name: string
  baptismal_name: string
  group_stage: GroupStage
  member_count: number
  pin: string
  created_at: string
}

export interface NewBooking {
  room_id: string
  date: string
  start_time: string
  end_time: string
  leader_name: string
  baptismal_name: string
  group_stage: GroupStage
  member_count: number
  pin: string
}

export interface UserIdentity {
  name: string
  baptismal: string
  groupStage: GroupStage
  pin: string
}

export interface Notice {
  id: string
  content: string
  is_active: boolean
  created_at: string
}

export interface SelectedSlot {
  room_id: string
  date: string
  start_time: string
}
