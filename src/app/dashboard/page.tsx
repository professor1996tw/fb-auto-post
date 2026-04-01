'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { FacebookPage } from '@/lib/types'
import { PageCard } from '@/components/PageCard'

/**
 * Dashboard 主頁
 * Phase 1：登入後顯示粉專列表，讓使用者選取目標粉專
 */
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 未登入則跳回登入頁
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // 取得粉專列表
  const fetchPages = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pages')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '取得粉專列表失敗')
      }

      setPages(data.pages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPages()
    }
  }, [status, fetchPages])

  // 切換粉專選取狀態
  const togglePage = (pageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  // 搜尋過濾
  const filteredPages = pages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 取得選取的粉專物件列表（傳給下一個步驟用）
  const selectedPages = pages.filter((p) => selectedIds.has(p.id))

  // 進入發文設定
  const handleNext = () => {
    if (selectedPages.length === 0) return
    // 將選取的粉專 ID 存到 sessionStorage，下一頁讀取
    sessionStorage.setItem('selectedPages', JSON.stringify(selectedPages))
    router.push('/compose')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 頂部導覽列 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📣</span>
            <span className="font-bold text-gray-900">日央水原 發文系統</span>
          </div>

          {session?.user && (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600 hidden sm:block">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 主內容 */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* 步驟指示 */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold
                          px-4 py-1.5 rounded-full">
            <span>1</span>
            <span>選擇粉專</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-sm text-gray-400 px-4">2 輸入發文資訊</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-sm text-gray-400 px-4">3 AI 生成文案</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-sm text-gray-400 px-4">4 發佈</div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">選擇目標粉絲專頁</h2>
        <p className="text-gray-500 text-sm mb-6">
          選取你要發文的粉專，可以多選同時發多個粉專
        </p>

        {/* 搜尋欄 */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜尋粉專名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 粉專列表 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-400 text-sm">正在讀取你的粉絲專頁...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium mb-2">⚠️ {error}</p>
            <button
              onClick={fetchPages}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              重新載入
            </button>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-600 font-medium">
              {searchQuery ? '找不到符合的粉專' : '找不到你管理的粉絲專頁'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              請確認你的 Facebook 帳號有管理粉絲專頁的權限
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                isSelected={selectedIds.has(page.id)}
                onToggle={togglePage}
              />
            ))}
          </div>
        )}

        {/* 底部操作列 */}
        {pages.length > 0 && (
          <div className="sticky bottom-6 mt-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4
                            flex items-center justify-between">
              <div>
                {selectedIds.size > 0 ? (
                  <p className="font-semibold text-gray-900">
                    已選取 <span className="text-blue-600">{selectedIds.size}</span> 個粉專
                  </p>
                ) : (
                  <p className="text-gray-400">尚未選取粉專</p>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={selectedIds.size === 0}
                className="btn-primary flex items-center gap-2"
              >
                <span>下一步：輸入發文資訊</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
