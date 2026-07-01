'use client'
import { useState, useEffect } from 'react'
import type { Booking, Room, SelectedSlot } from '@/lib/types'
import { loadBookings, cancelBooking, bookingsInRange } from '@/lib/storage'
import { getRooms, getBlocked } from '@/lib/admin-storage'
import type { BlockedPeriod } from '@/lib/admin-storage'
import { GROUP_COLORS } from '@/lib/constants'
import AdminBookingModal from './AdminBookingModal'
import BookingGrid from '@/components/BookingGrid'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

const DOT_COLOR: Record<string, string> = {
  '창세기':   '#378ADD',
  '탈출기':   '#639922',
  '마르코':   '#E24B4A',
  '요한':     '#888780',
  '사도행전': '#EF9F27',
  '이사야':   '#D4537E',
  '청소년센터': '#0D9488',
  '한처음':   '#7C3AED',
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildGrid(year: number, month: number) {
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevLast    = new Date(year, month, 0).getDate()
  const cells: Array<{ iso: string; day: number; cur: boolean }> = []

  const py = month === 0 ? year - 1 : year
  const pm = month === 0 ? 11 : month - 1
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ iso: toIso(py, pm, prevLast - i), day: prevLast - i, cur: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ iso: toIso(year, month, d), day: d, cur: true })
  const ny = month === 11 ? year + 1 : year
  const nm = month === 11 ? 0 : month + 1
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++)
    cells.push({ iso: toIso(ny, nm, d), day: d, cur: false })

  return cells
}

type ViewMode = 'list' | 'grid' | 'month'

export default function AdminBookings() {
  const today = new Date().toLocaleDateString('sv-SE')
  const now   = new Date()

  // 일별 상태
  const [date, setDate]               = useState(today)
  const [bookings, setBookings]       = useState<Booking[]>([])
  const [rooms, setRooms]             = useState<Room[]>([])
  const [blocked, setBlocked]         = useState<BlockedPeriod[]>([])
  const [confirmId, setConfirmId]     = useState<string | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState<Booking | null>(null)
  const [defaultSlot, setDefaultSlot] = useState<SelectedSlot | undefined>(undefined)
  const [viewMode, setViewMode]       = useState<ViewMode>('list')

  // 월별 상태
  const [year, setYear]               = useState(now.getFullYear())
  const [month, setMonth]             = useState(now.getMonth())
  const [monthBookings, setMonthBookings] = useState<Booking[]>([])
  const [monthLoading, setMonthLoading]   = useState(false)

  useEffect(() => {
    getRooms().then(setRooms)
    getBlocked().then(setBlocked)
  }, [])

  // 일별 예약 로드
  function reload() {
    loadBookings().then(all => {
      setBookings(
        all
          .filter(b => b.date === date)
          .sort((a, b) => `${a.room_id}${a.start_time}`.localeCompare(`${b.room_id}${b.start_time}`))
      )
    })
  }
  useEffect(reload, [date])

  // 월별 예약 로드
  useEffect(() => {
    if (viewMode !== 'month') return
    setMonthLoading(true)
    const cells = buildGrid(year, month)
    bookingsInRange(cells[0].iso, cells[41].iso).then(data => {
      setMonthBookings(data)
      setMonthLoading(false)
    })
  }, [year, month, viewMode])

  // 월별 뷰에서 날짜 클릭 시 일별 예약도 갱신
  function selectDay(iso: string) {
    setDate(iso)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function openCreate(slot?: SelectedSlot) {
    setEditTarget(null)
    setDefaultSlot(slot)
    setModalOpen(true)
  }
  function openEdit(b: Booking) {
    setEditTarget(b)
    setDefaultSlot(undefined)
    setModalOpen(true)
  }
  function handleSaved() {
    setModalOpen(false)
    setEditTarget(null)
    setDefaultSlot(undefined)
    reload()
    // 월별 뷰도 갱신
    if (viewMode === 'month') {
      const cells = buildGrid(year, month)
      bookingsInRange(cells[0].iso, cells[41].iso).then(setMonthBookings)
    }
  }

  async function handleCancel(id: string) {
    await cancelBooking(id)
    setBookings(prev => prev.filter(b => b.id !== id))
    setConfirmId(null)
    if (viewMode === 'month') {
      const cells = buildGrid(year, month)
      bookingsInRange(cells[0].iso, cells[41].iso).then(setMonthBookings)
    }
  }

  function roomName(id: string) {
    return rooms.find(r => r.id === id)?.name ?? id
  }

  const isToday = date === today

  // 월별 그룹핑
  const grouped = new Map<string, Booking[]>()
  for (const b of monthBookings) {
    const arr = grouped.get(b.date) ?? []
    arr.push(b)
    grouped.set(b.date, arr)
  }
  const cells = buildGrid(year, month)

  // 하단 상세 예약 목록 (월별 뷰에서도 공유)
  const DetailList = () => (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <span className="text-2xl">📭</span>
          <p className="text-sm font-semibold text-gray-400">이 날 예약이 없습니다.</p>
        </div>
      ) : (
        bookings.map(b => {
          const c = GROUP_COLORS[b.group_stage]
          return (
            <div key={b.id} className="rounded-2xl border-2 border-gray-200 mb-3 overflow-hidden">
              <div className="flex">
                <div className={`w-1.5 flex-shrink-0 ${c.cell}`} />
                <div className="flex-1 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-black text-[13px]">{roomName(b.room_id)}</span>
                    <span className="text-xs font-bold text-black bg-gray-100 px-2.5 py-1 rounded-full">
                      {b.start_time} ~ {b.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {b.group_stage}
                    </span>
                    <span className="text-[12px] font-bold text-black">
                      {b.leader_name}
                      <span className="font-semibold text-gray-500 ml-1">({b.baptismal_name})</span>
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">· {b.member_count}명</span>
                  </div>
                </div>
              </div>
              {confirmId !== b.id ? (
                <div className="flex border-t-2 border-gray-200">
                  <button onClick={() => openEdit(b)} className="flex-1 py-2.5 text-xs text-blue-600 font-bold bg-white active:bg-blue-50">수정</button>
                  <button onClick={() => setConfirmId(b.id)} className="flex-1 py-2.5 text-xs text-red-500 font-bold border-l-2 border-gray-200 bg-white active:bg-red-50">강제 취소</button>
                </div>
              ) : (
                <div className="flex border-t-2 border-gray-200 bg-red-50">
                  <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 text-xs text-gray-600 font-semibold">아니오</button>
                  <button onClick={() => handleCancel(b.id)} className="flex-1 py-2.5 text-xs text-white font-bold bg-red-500 border-l-2 border-red-300">취소 확인</button>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* ── 월별 뷰 ── */}
      {viewMode === 'month' && (
        <>
          {/* 월 네비게이션 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-black font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200">‹</button>
            <div className="flex-1 text-center">
              <span className="font-extrabold text-black text-[15px]">{year}년 {month + 1}월</span>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-black font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200">›</button>
            {/* 뷰 토글 */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 ml-2">
              {(['list', 'grid', 'month'] as ViewMode[]).map((m, i) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${viewMode === m ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'}`}>
                  {m === 'list' ? '목록' : m === 'grid' ? '그리드' : '월별'}
                </button>
              ))}
            </div>
          </div>

          {/* 달력 */}
          <div className="flex-shrink-0 bg-white px-3 pb-2">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 pt-2 pb-1">
              {DOW.map((d, i) => (
                <div key={d} className={`text-center text-[10px] font-extrabold py-0.5 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-600' : 'text-gray-500'}`}>{d}</div>
              ))}
            </div>

            {monthLoading ? (
              <p className="text-center text-gray-400 text-xs py-6">불러오는 중...</p>
            ) : (
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((cell, i) => {
                  const dayBks = grouped.get(cell.iso) ?? []
                  const isT    = cell.iso === today
                  const isSel  = cell.iso === date
                  const dow    = i % 7
                  return (
                    <div
                      key={i}
                      onClick={() => cell.cur && selectDay(cell.iso)}
                      className={`flex flex-col items-center py-1 rounded-xl min-h-[44px] transition-colors ${
                        cell.cur ? 'cursor-pointer' : 'opacity-20 pointer-events-none'
                      } ${isSel ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold ${
                        isT ? 'bg-blue-600 text-white font-bold' :
                        dow === 0 ? 'text-red-500' :
                        dow === 6 ? 'text-blue-500' : 'text-black'
                      }`}>
                        {cell.day}
                      </div>
                      {dayBks.length > 0 && (
                        <div className="flex flex-col gap-px w-[65%] mt-0.5">
                          {dayBks.slice(0, 3).map((b, j) => (
                            <div key={j} className="h-[3px] rounded-full w-full" style={{ backgroundColor: DOT_COLOR[b.group_stage] }} />
                          ))}
                          {dayBks.length > 3 && (
                            <span className="text-[7px] text-gray-400 font-bold text-center">+{dayBks.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 선택 날짜 상세 */}
          <div className="border-t-2 border-gray-100 flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-extrabold text-black">{fmtDate(date)}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bookings.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {bookings.length}건
              </span>
              <button onClick={() => openCreate()} className="ml-auto text-xs font-bold text-white bg-blue-600 rounded-lg px-3 py-1.5 active:scale-95 transition-transform">
                + 예약 추가
              </button>
            </div>
            <DetailList />
          </div>
        </>
      )}

      {/* ── 목록 / 그리드 뷰 ── */}
      {viewMode !== 'month' && (
        <>
          {/* 날짜 네비게이션 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
            <button onClick={() => setDate(d => addDays(d, -1))} className="w-8 h-8 flex items-center justify-center text-black font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200">‹</button>
            <div className="flex-1 text-center">
              <span className="font-extrabold text-black text-[15px]">{fmtDate(date)}</span>
            </div>
            <button onClick={() => setDate(d => addDays(d, 1))} className="w-8 h-8 flex items-center justify-center text-black font-bold text-lg rounded-xl bg-gray-100 active:bg-gray-200">›</button>
            {!isToday && (
              <button onClick={() => setDate(today)} className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg px-2.5 py-1.5 ml-1">오늘</button>
            )}
          </div>

          {/* 예약 수 배지 + 뷰 토글 + 추가 버튼 */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-extrabold text-black">예약 현황</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bookings.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {bookings.length}건
            </span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 ml-2">
              {(['list', 'grid', 'month'] as ViewMode[]).map((m, i) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${viewMode === m ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'}`}>
                  {m === 'list' ? '목록' : m === 'grid' ? '그리드' : '월별'}
                </button>
              ))}
            </div>
            <button onClick={() => openCreate()} className="ml-auto text-xs font-bold text-white bg-blue-600 rounded-lg px-3 py-1.5 active:scale-95 transition-transform">
              + 예약 추가
            </button>
          </div>

          {/* 목록 */}
          {viewMode === 'list' && (
            <div className="px-4 pt-1 pb-6 overflow-y-auto flex-1">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm font-semibold text-gray-400">이 날 예약이 없습니다.</p>
                </div>
              ) : (
                bookings.map(b => {
                  const c = GROUP_COLORS[b.group_stage]
                  return (
                    <div key={b.id} className="rounded-2xl border-2 border-gray-200 mb-3 overflow-hidden">
                      <div className="flex">
                        <div className={`w-1.5 flex-shrink-0 ${c.cell}`} />
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-black text-[13px]">{roomName(b.room_id)}</span>
                            <span className="text-xs font-bold text-black bg-gray-100 px-2.5 py-1 rounded-full">{b.start_time} ~ {b.end_time}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{b.group_stage}</span>
                            <span className="text-[12px] font-bold text-black">
                              {b.leader_name}
                              <span className="font-semibold text-gray-500 ml-1">({b.baptismal_name})</span>
                            </span>
                            <span className="text-[11px] font-semibold text-gray-500">· {b.member_count}명</span>
                          </div>
                        </div>
                      </div>
                      {confirmId !== b.id ? (
                        <div className="flex border-t-2 border-gray-200">
                          <button onClick={() => openEdit(b)} className="flex-1 py-2.5 text-xs text-blue-600 font-bold bg-white active:bg-blue-50">수정</button>
                          <button onClick={() => setConfirmId(b.id)} className="flex-1 py-2.5 text-xs text-red-500 font-bold border-l-2 border-gray-200 bg-white active:bg-red-50">강제 취소</button>
                        </div>
                      ) : (
                        <div className="flex border-t-2 border-gray-200 bg-red-50">
                          <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 text-xs text-gray-600 font-semibold">아니오</button>
                          <button onClick={() => handleCancel(b.id)} className="flex-1 py-2.5 text-xs text-white font-bold bg-red-500 border-l-2 border-red-300">취소 확인</button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* 그리드 */}
          {viewMode === 'grid' && (
            <div className="flex-1 overflow-hidden px-2 pb-4">
              <BookingGrid
                date={date}
                bookings={bookings}
                rooms={rooms}
                blockedPeriods={blocked}
                onSlotClick={(slot) => openCreate(slot)}
                onBookingClick={(b) => openEdit(b)}
              />
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <AdminBookingModal
          editTarget={editTarget}
          rooms={rooms}
          defaultDate={date}
          defaultSlot={defaultSlot}
          onClose={() => { setModalOpen(false); setEditTarget(null); setDefaultSlot(undefined) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
