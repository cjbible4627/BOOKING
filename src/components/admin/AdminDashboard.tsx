'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAdmin } from '@/lib/admin-storage'
import AdminBookings from './AdminBookings'
import RoomManager from './RoomManager'
import BlockManager from './BlockManager'
import ExportView from './ExportView'
import NoticeManager from './NoticeManager'
import ResourceManager from './ResourceManager'
import StatsView from './StatsView'
import FormManager from './FormManager'
import BookingOpenSettings from './BookingOpenSettings'

type MainTab = 'booking' | 'forms' | 'notices' | 'resources'
type BookingSub = 'bookings' | 'stats' | 'rooms' | 'blocks' | 'export' | 'booking-notices' | 'booking-open'

const MAIN_TABS: [MainTab, string][] = [
  ['booking',   '🗓️ 공간 예약'],
  ['forms',     '📝 신청서'],
  ['notices',   '공지사항'],
  ['resources', '자료실'],
]

const BOOKING_SUBS: [BookingSub, string][] = [
  ['bookings',        '예약 현황'],
  ['stats',           '📊 통계'],
  ['rooms',           '방 관리'],
  ['blocks',          '차단 관리'],
  ['export',          '📥 다운로드'],
  ['booking-notices', '📢 예약 공지'],
  ['booking-open',    '⏰ 접수 설정'],
]

export default function AdminDashboard() {
  const router = useRouter()
  const [mainTab, setMainTab] = useState<MainTab>('booking')
  const [bookingSub, setBookingSub] = useState<BookingSub>('bookings')

  const subRef = useRef<HTMLDivElement>(null)
  const [showSubLeft,  setShowSubLeft]  = useState(false)
  const [showSubRight, setShowSubRight] = useState(false)

  useEffect(() => {
    const el = subRef.current
    if (!el) return
    setShowSubLeft(false)
    setShowSubRight(el.scrollWidth > el.clientWidth + 4)
  }, [mainTab])

  function onSubScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setShowSubLeft(el.scrollLeft > 8)
    setShowSubRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  function handleLogout() {
    logoutAdmin()
    router.push('/admin')
  }

  return (
    <div className="flex flex-col h-svh bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-base font-bold text-gray-900">관리자</h1>
          <p className="text-xs text-gray-400">한처음 센터봉사자</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-blue-500 px-3 py-1.5 rounded-lg border border-blue-200"
          >
            예약 화면
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 상단 메인 탭 — 4개, 균등 분할 */}
      <div className="flex border-b border-gray-200 bg-white">
        {MAIN_TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
              mainTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 예약 그룹 서브탭 — 스크롤 가능 */}
      {mainTab === 'booking' && (
        <div className="relative border-b border-gray-100 bg-gray-50">
          <div
            ref={subRef}
            onScroll={onSubScroll}
            className="flex px-3 gap-0.5 overflow-x-auto scrollbar-none"
          >
            {BOOKING_SUBS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setBookingSub(id)}
                className={`py-2 px-3 text-xs font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                  bookingSub === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {showSubLeft && (
            <button
              onClick={() => subRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 pr-3 bg-gradient-to-r from-gray-50 via-gray-50 to-transparent text-gray-400 text-lg leading-none"
            >‹</button>
          )}
          {showSubRight && (
            <button
              onClick={() => subRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
              className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 pl-3 bg-gradient-to-l from-gray-50 via-gray-50 to-transparent text-gray-400 text-lg leading-none"
            >›</button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {mainTab === 'booking' && bookingSub === 'bookings'        && <AdminBookings />}
        {mainTab === 'booking' && bookingSub === 'stats'           && <StatsView />}
        {mainTab === 'booking' && bookingSub === 'rooms'           && <RoomManager />}
        {mainTab === 'booking' && bookingSub === 'blocks'          && <BlockManager />}
        {mainTab === 'booking' && bookingSub === 'export'          && <ExportView />}
        {mainTab === 'booking' && bookingSub === 'booking-notices' && <NoticeManager scope="booking" />}
        {mainTab === 'booking' && bookingSub === 'booking-open'    && <BookingOpenSettings />}
        {mainTab === 'forms'     && <FormManager />}
        {mainTab === 'notices'   && <NoticeManager scope="main" />}
        {mainTab === 'resources' && <ResourceManager />}
      </div>
    </div>
  )
}
