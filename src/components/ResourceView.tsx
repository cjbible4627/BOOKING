'use client'
import { useState, useEffect } from 'react'
import type { Resource } from '@/lib/types'
import { getResources } from '@/lib/resource-storage'

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon() {
  return (
    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

export default function ResourceView() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getResources().then(r => { setResources(r); setLoading(false) })
  }, [])

  const files = resources.filter(r => r.type === 'file')
  const links = resources.filter(r => r.type === 'link')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
        불러오는 중...
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 py-16">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
            d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">등록된 자료가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      {files.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">양식 파일</p>
          <div className="space-y-2">
            {files.map(r => (
              <a
                key={r.id}
                href={r.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3 active:bg-blue-100 transition-colors"
              >
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                  {r.file_name && (
                    <p className="text-[11px] text-gray-400 truncate">
                      {r.file_name}
                      {r.file_size != null && ` · ${formatBytes(r.file_size)}`}
                    </p>
                  )}
                </div>
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">바로가기 링크</p>
          <div className="space-y-2">
            {links.map(r => (
              <a
                key={r.id}
                href={r.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-purple-50 rounded-2xl px-4 py-3 active:bg-purple-100 transition-colors"
              >
                <LinkIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                  <p className="text-[11px] text-purple-400 truncate">{r.url}</p>
                </div>
                <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
