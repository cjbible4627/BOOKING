import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '청년성서모임 공간 예약',
  description: '그룹공부 공간 예약 시스템',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // maximumScale 제거 → 모바일 핀치줌 허용
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full bg-gray-100 antialiased">
        {/* 모바일: 전체 너비 / PC: 최대 672px 중앙 정렬 + 카드 효과 */}
        <div className="h-full w-full max-w-lg md:max-w-2xl mx-auto flex flex-col bg-white shadow-sm md:shadow-xl md:ring-1 md:ring-gray-200">
          {children}
        </div>
      </body>
    </html>
  )
}
