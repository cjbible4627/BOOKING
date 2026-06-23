'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAdmin } from '@/lib/admin-storage'
import AdminBookings from './AdminBookings'
import RoomManager from './RoomManager'
import BlockManager from './BlockManager'
import ExportView from './ExportView'

type Tab = 'bookings' | 'rooms' | 'blocks' | 'export'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('bookings')

  function handleLogout() {
    logoutAdmin()
    router.push('/admin')
  }

  return (
    <div className="flex flex-col h-svh bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-base font-bold text-gray-900">관리자</h1>
          <p className="text-xs text-gray-400">청년성서모임 공간 예약</p>
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

      <div className="flex bg-white border-b border-gray-100 px-4 gap-1">
        {([
          ['bookings', '예약 현황'],
          ['rooms',    '방 관리'],
          ['blocks',   '차단 관리'],
          ['export',   '내보내기'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'bookings' && <AdminBookings />}
        {tab === 'rooms'    && <RoomManager />}
        {tab === 'blocks'   && <BlockManager />}
        {tab === 'export'   && <ExportView />}
      </div>
    </div>
  )
}
