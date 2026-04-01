'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FacebookPage } from '@/lib/types'

interface CopyVersion {
  id: number
  angle: string
  content: string
}

interface GenerateResult {
  versions: CopyVersion[]
  usage?: { inputTokens: number; outputTokens: number }
}

export default function ResultPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [result, setResult] = useState<GenerateResult | null>(null)
  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState<Record<number, string>>({})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const resultData = sessionStorage.getItem('generateResult')
    const pagesData = sessionStorage.getItem('selectedPages')

    if (!resultData) {
      router.push('/compose')
      return
    }
    try {
      setResult(JSON.parse(resultData))
      if (pagesData) setSelectedPages(JSON.parse(pagesData))
    } catch {
      router.push('/compose')
    }
  }, [router])

  // 複製文案到剪貼簿
  const handleCopy = async (version: CopyVersion) => {
    const text = editedContent[version.id] ?? version.content
    await navigator.clipboard.writeText(text)
    setCopiedId(version.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 取得最終文案（可能被編輯過）
  const getFinalContent = (version: CopyVersion) =>
    editedContent[version.id] ?? version.content

  // 發佈到 Facebook
  const handlePublish = async () => {
    if (selectedVersionId === null) {
      alert('請先選擇一個文案版本')
      return
    }

    const version = result!.versions.find((v) => v.id === selectedVersionId)!
    const content = getFinalContent(version)

    setIsPublishing(true)
    setPublishResult(null)

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          pages: selectedPages.map((p) => ({ id: p.id, name: p.name, access_token: p.access_token })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '發佈失敗')
      }

      setPublishResult({ success: true, message: data.message || '發佈成功！' })
    } catch (err: any) {
      setPublishResult({ success: false, message: err.message })
    } finally {
      setIsPublishing(false)
    }
  }

  if (status === 'loading' || !result) {
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📣</span>
            <span className="font-bold text-gray-900">日央水原 發文系統</span>
          </div>
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* 步驟指示 */}
        <div className="flex items-center gap-2 mb-6">
          <div className="text-sm text-gray-400 px-4">1 選擇粉專</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-sm text-gray-400 px-4">2 輸入發文資訊</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold
                          px-4 py-1.5 rounded-full">
            <span>3</span><span>AI 生成文案</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className={`text-sm px-4 ${selectedVersionId !== null ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            4 發佈
          </div>
        </div>

        {/* 標題 */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">選擇文案版本</h2>
        <p className="text-gray-500 text-sm mb-6">
          點選你喜歡的版本，可以直接編輯後發佈
        </p>

        {/* 發佈成功 Banner */}
        {publishResult?.success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">發佈成功！</p>
              <p className="text-sm text-green-600">{publishResult.message}</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.clear()
                router.push('/dashboard')
              }}
              className="ml-auto btn-primary text-sm"
            >
              繼續發文
            </button>
          </div>
        )}

        {/* 文案版本卡片 */}
        <div className="space-y-4 mb-6">
          {result.versions.map((version) => {
            const isSelected = selectedVersionId === version.id
            const content = editedContent[version.id] ?? version.content

            return (
              <div
                key={version.id}
                className={`bg-white rounded-2xl border-2 transition-all overflow-hidden
                  ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-100 shadow-sm'}`}
              >
                {/* 卡片標頭 */}
                <div
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer
                    ${isSelected ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                  onClick={() => setSelectedVersionId(isSelected ? null : version.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs
                      ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}>
                      {isSelected ? '✓' : version.id}
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 mr-2">版本 {version.id}</span>
                      <span className="text-sm font-semibold text-gray-700">{version.angle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 複製按鈕 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(version) }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg
                                 hover:bg-gray-200 transition-colors"
                    >
                      {copiedId === version.id ? '✅ 已複製' : '📋 複製'}
                    </button>
                    <span className="text-gray-400">{isSelected ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* 文案內容（可編輯）*/}
                <div className="px-4 py-4">
                  <textarea
                    value={content}
                    onChange={(e) =>
                      setEditedContent({ ...editedContent, [version.id]: e.target.value })
                    }
                    rows={6}
                    className={`w-full text-sm text-gray-700 leading-relaxed resize-none
                                border rounded-xl p-3 focus:outline-none transition-colors
                                ${isSelected
                                  ? 'border-blue-200 bg-blue-50/30 focus:ring-2 focus:ring-blue-300'
                                  : 'border-gray-100 bg-gray-50 focus:border-blue-300'}`}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {content.length} 字
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 使用量提示 */}
        {result.usage && (
          <p className="text-xs text-gray-300 text-center mb-2">
            Token 使用：{result.usage.inputTokens} in / {result.usage.outputTokens} out
          </p>
        )}

        {/* 發佈失敗提示 */}
        {publishResult && !publishResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">
            ⚠️ {publishResult.message}
          </div>
        )}

        {/* 底部操作列 */}
        <div className="sticky bottom-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4
                          flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/compose')}
              className="btn-secondary"
            >
              ← 重新設定
            </button>

            <div className="flex gap-2">
              {/* 重新生成 */}
              <button
                onClick={() => router.push('/compose')}
                className="btn-secondary flex items-center gap-1"
              >
                🔄 重新生成
              </button>

              {/* 發佈 */}
              <button
                onClick={handlePublish}
                disabled={selectedVersionId === null || isPublishing || publishResult?.success}
                className="btn-primary flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>發佈中...</span>
                  </>
                ) : (
                  <span>
                    📤 發佈到 {selectedPages.length > 0 ? `${selectedPages.length} 個粉專` : 'Facebook'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
