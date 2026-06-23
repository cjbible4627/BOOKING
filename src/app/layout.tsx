import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '청년성서모임 공간 예약',
  description: '그룹공부 공간 예약 시스템',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full bg-gray-50 antialiased">
        <div className="h-full max-w-lg mx-auto flex flex-col shadow-sm">
          {children}
        </div>
      </body>
    </html>
  )
}
