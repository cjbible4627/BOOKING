'use client'
import { useState, useEffect, useRef } from 'react'
import type { Resource } from '@/lib/types'
import { getResources, addLink, uploadFile, updateResourceTitle, deleteResource } from '@/lib/resource-storage'

const MAX_BYTES = 20 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResourceManager() {
  const [resources, setResources] = useState<Resource[]>([])
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [editId, setEditId]       = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl]     = useState('')
  const [linkErr, setLinkErr]     = useState('')
  const [linkSaving, setLinkSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setResources(await getResources())
  }

  useEffect(() => { load() }, [])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadErr('')
    const file = files[0]
    if (file.size > MAX_BYTES) {
      setUploadErr(`파일 용량이 20MB를 초과합니다. (${formatBytes(file.size)})`)
      return
    }
    const title = file.name.replace(/\.[^/.]+$/, '')
    setUploading(true)
    try {
      await uploadFile(file, title)
      await load()
    } catch {
      setUploadErr('업로드 실패. 다시 시도해주세요.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleAddLink() {
    setLinkErr('')
    if (!linkTitle.trim()) { setLinkErr('제목을 입력해주세요.'); return }
    if (!linkUrl.trim())   { setLinkErr('URL을 입력해주세요.'); return }
    const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`
    setLinkSaving(true)
    await addLink(linkTitle.trim(), url)
    setLinkTitle('')
    setLinkUrl('')
    await load()
    setLinkSaving(false)
  }

  async function handleSaveTitle(id: string) {
    if (!editTitle.trim()) return
    await updateResourceTitle(id, editTitle.trim())
    setEditId(null)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('자료를 삭제하시겠습니까?')) return
    await deleteResource(id)
    await load()
  }

  const files = resources.filter(r => r.type === 'file')
  const links = resources.filter(r => r.type === 'link')

  return (
    <div className="px-4 py-4 max-w-2xl space-y-6">

      {/* 파일 업로드 */}
      <section>
        <p className="text-sm font-bold text-gray-800 mb-3">파일 업로드</p>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl px-4 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-500">
            {uploading ? '업로드 중...' : '파일을 드래그하거나 클릭하여 선택'}
          </p>
          <p className="text-xs text-gray-400">최대 20MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploadErr && <p className="text-xs text-red-500 mt-2">{uploadErr}</p>}
      </section>

      {/* 링크 추가 */}
      <section>
        <p className="text-sm font-bold text-gray-800 mb-3">링크 추가</p>
        <div className="space-y-2">
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            placeholder="링크 제목"
            value={linkTitle}
            onChange={e => setLinkTitle(e.target.value)}
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            placeholder="URL (예: https://...)"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
          />
          {linkErr && <p className="text-xs text-red-500">{linkErr}</p>}
          <button
            onClick={handleAddLink}
            disabled={linkSaving}
            className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-purple-700"
          >
            {linkSaving ? '추가 중...' : '링크 추가'}
          </button>
        </div>
      </section>

      {/* 등록된 자료 목록 */}
      {resources.length > 0 && (
        <section>
          <p className="text-sm font-bold text-gray-800 mb-3">등록된 자료</p>

          {files.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">파일</p>
              <div className="space-y-2">
                {files.map(r => (
                  <div key={r.id} className="border border-gray-100 rounded-2xl p-3 bg-white">
                    {editId === r.id ? (
                      <div className="flex gap-2">
                        <input
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => handleSaveTitle(r.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">저장</button>
                        <button onClick={() => setEditId(null)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                          {r.file_name && (
                            <p className="text-[11px] text-gray-400 truncate">
                              {r.file_name}{r.file_size != null && ` · ${formatBytes(r.file_size)}`}
                            </p>
                          )}
                        </div>
                        <button onClick={() => { setEditId(r.id); setEditTitle(r.title) }}
                          className="text-xs text-blue-400 px-2 py-1 rounded-lg border border-blue-100 flex-shrink-0">수정</button>
                        <button onClick={() => handleDelete(r.id)}
                          className="text-xs text-red-400 px-2 py-1 rounded-lg border border-red-100 flex-shrink-0">삭제</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">링크</p>
              <div className="space-y-2">
                {links.map(r => (
                  <div key={r.id} className="border border-gray-100 rounded-2xl p-3 bg-white">
                    {editId === r.id ? (
                      <div className="flex gap-2">
                        <input
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => handleSaveTitle(r.id)}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold">저장</button>
                        <button onClick={() => setEditId(null)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                          <p className="text-[11px] text-purple-400 truncate">{r.url}</p>
                        </div>
                        <button onClick={() => { setEditId(r.id); setEditTitle(r.title) }}
                          className="text-xs text-blue-400 px-2 py-1 rounded-lg border border-blue-100 flex-shrink-0">수정</button>
                        <button onClick={() => handleDelete(r.id)}
                          className="text-xs text-red-400 px-2 py-1 rounded-lg border border-red-100 flex-shrink-0">삭제</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
