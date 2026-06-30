// 폼 빌더 / 신청서 타입 정의

export type FieldType =
  | 'short' | 'long' | 'radio' | 'checkbox' | 'dropdown'
  | 'number' | 'date' | 'tel' | 'email' | 'agree'

export const FIELD_TYPES: FieldType[] = [
  'short', 'long', 'radio', 'checkbox', 'dropdown', 'number', 'date', 'tel', 'email', 'agree',
]

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short:    '단답',
  long:     '장문',
  radio:    '단일선택(라디오)',
  checkbox: '복수선택(체크박스)',
  dropdown: '드롭다운',
  number:   '숫자',
  date:     '날짜',
  tel:      '전화',
  email:    '이메일',
  agree:    '동의체크',
}

// 선택지를 갖는 필드 타입
export const CHOICE_TYPES: FieldType[] = ['radio', 'checkbox', 'dropdown']

export interface FormField {
  id: string
  form_id: string
  label: string
  type: FieldType
  options: string[]
  required: boolean
  placeholder: string | null
  sort_order: number
  created_at: string
}

export type OpenMode = 'always' | 'period'  // 'always' 상시 | 'period' 회차 모집

export interface FormDef {
  id: string
  key: string
  title: string
  description: string | null
  is_open: boolean          // 수동 게시 토글 (마스터 스위치)
  open_mode: OpenMode       // 'always' 상시 | 'period' 회차제
  open_start: string | null // (legacy) 회차제 이전 단일 기간 — 현재 미사용
  open_end: string | null   // (legacy)
  current_round_id: string | null // 회차제일 때 현재 진행 회차
  sort_order: number
  is_active: boolean
  created_at: string
}

// 신청서 회차 (재사용: 학기/기수별 모집 단위)
export interface FormRound {
  id: string
  form_id: string
  name: string              // 예: "2026-1학기"
  open_start: string | null // 'YYYY-MM-DD'
  open_end: string | null   // 'YYYY-MM-DD'
  sort_order: number
  created_at: string
}

// 한국시간 기준 오늘 날짜 (YYYY-MM-DD)
export function todayKST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

type RoundPeriod = Pick<FormRound, 'open_start' | 'open_end'> | null

// 현재 시점에 공개·접수 가능한 폼인지
// 상시: 게시 ON이면 항상 / 회차제: 게시 ON + 현재 회차의 기간 내
export function isFormOpenNow(
  form: Pick<FormDef, 'is_open' | 'open_mode'>,
  currentRound: RoundPeriod = null,
  today: string = todayKST(),
): boolean {
  if (!form.is_open) return false
  if (form.open_mode === 'always') return true
  if (!currentRound) return false
  if (currentRound.open_start && today < currentRound.open_start) return false
  if (currentRound.open_end && today > currentRound.open_end) return false
  return true
}

// 회차제 폼의 현재 회차 상태 라벨
export function periodStatus(
  form: Pick<FormDef, 'open_mode'>,
  currentRound: RoundPeriod = null,
  today: string = todayKST(),
): 'before' | 'during' | 'after' | 'always' | 'none' {
  if (form.open_mode === 'always') return 'always'
  if (!currentRound) return 'none'
  if (currentRound.open_start && today < currentRound.open_start) return 'before'
  if (currentRound.open_end && today > currentRound.open_end) return 'after'
  return 'during'
}

// 폼 + 현재 회차 (목록/홈용)
export interface FormWithRound extends FormDef {
  current_round: FormRound | null
}

// 폼 + 질문 + 현재 회차 묶음 (공개 작성 화면용)
export interface FormWithFields extends FormWithRound {
  fields: FormField[]
}

export type AnswerValue = string | string[] | number | boolean | null

// 제출 시점 스냅샷(라벨·타입 포함) — 질문이 나중에 바뀌어도 자기완결적으로 읽힘
export interface AnswerEntry {
  field_id: string
  label: string
  type: FieldType
  value: AnswerValue
}

export interface SubmissionAnswers {
  fields: AnswerEntry[]
}

export interface FormSubmission {
  id: string
  form_id: string
  round_id: string | null
  answers: SubmissionAnswers
  created_at: string
}
