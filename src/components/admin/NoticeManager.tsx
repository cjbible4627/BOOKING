'use client'
import { useState, useEffect } from 'react'
import type { Notice } from '@/lib/types'
import { getNotices, addNotice, updateNotice, removeNotice } from '@/lib/admin-storage'

interface Props { scope?: 'main' | 'booking' }

export default function NoticeManager({ scope = 'main' }: Props) {
  const [notices, setNotices]       = useState<Notice[]>([])
  const [newContent, setNewContent] = useState('')
  const [editId, setEditId]         = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setNotices(await getNotices(scope))
  }

  useEffect(() => { load() }, [scope]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!newContent.trim()) return
    setSubmitting(true)
    await addNotice(newContent.trim(), scope)
    setNewContent('')
    await load()
    setSubmitting(false)
  }

  async function handleUpdate() {
    if (!editId || !editContent.trim()) return
    setSubmitting(true)
    await updateNotice(editId, editContent.trim())
    setEditId(null)
    await load()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return
    await removeNotice(id)
    await load()
  }

  function startEdit(n: Notice) {
    setEditId(n.id)
    setEditContent(n.content)
  }

  const title = scope === 'booking' ? '예약 공지 관리' : '메인 공지사항 관리'
  const desc  = scope === 'booking' ? '공간예약 페이지에 표시됩니다.' : '메인 화면에 표시됩니다.'

  return (
    <div className="px-4 py-4 max-w-2xl">
      <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-4">{desc}</p>

      {notices.length === 0 ? (
        <div className="text-center text-gray-300 text-sm py-8 bg-gray-50 rounded-2xl mb-4">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {notices.map(n => (
            <div key={n.id} className="border border-gray-100 rounded-2xl p-3 bg-white">
              {editId === n.id ? (
                <>
                  <textarea
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
                    rows={3}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleUpdate}
                      disabled={submitting || !editContent.trim()}
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                    >
                      {submitting ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex-1 py-1.5 border border-gray-200 text-gray-500 rounded-xl text-xs"
                    >
                      취소
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm text-gray-700 whitespace-pre-wrap">{n.content}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(n)}
                        className="text-xs text-blue-400 hover:text-blue-600 px-2 py-1 rounded-lg border border-blue-100"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg border border-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1.5">
                    {new Date(n.created_at).toLocaleString('ko-KR')}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">새 공지 등록</p>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
          rows={4}
          placeholder="공지사항 내용을 입력하세요."
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={submitting || !newContent.trim()}
          className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-blue-700"
        >
          {submitting ? '등록 중...' : '공지 등록'}
        </button>
      </div>
    </div>
  )
}
