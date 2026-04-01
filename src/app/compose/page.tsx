'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FacebookPage } from '@/lib/types'

// 文案風格選項
const STYLE_OPTIONS = [
  { value: 'friendly', label: '😊 親切活潑', desc: '輕鬆口語，適合社群互動' },
  { value: 'professional', label: '💼 專業正式', desc: '建立品牌信賴感' },
  { value: 'promotional', label: '🔥 促銷衝動', desc: '強調優惠與急迫感' },
  { value: 'storytelling', label: '📖 故事感', desc: '以情境帶入，引發共鳴' },
]

// 發文目的選項
const PURPOSE_OPTIONS = [
  { value: '促銷推廣', label: '🎁 促銷推廣' },
  { value: '活動通知', label: '📢 活動通知' },
  { value: '品牌曝光', label: '✨ 品牌曝光' },
  { value: '新品上架', label: '🆕 新品上架' },
  { value: '客戶見證', label: '⭐ 客戶見證' },
  { value: '市場資訊', label: '📊 市場資訊' },
]

export default function ComposePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 表單狀態
  const [form, setForm] = useState({
    purpose: '促銷推廣',
    audience: '天堂M 遊戲玩家',
    style: 'friendly',
    product: '',
    coreMessage: '',
    extraContext: '',
  })

  // 未登入跳回登入頁
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // 讀取上一步選取的粉專
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedPages')
    if (!stored) {
      router.push('/dashboard')
      return
    }
    try {
      setSelectedPages(JSON.parse(stored))
    } catch {
      router.push('/dashboard')
    }
  }, [router])

  const handleGenerate = async () => {
    if (!form.coreMessage.trim()) {
      setError('請輸入核心訊息')
      return
    }
    setError(null)
    setIsGenerating(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pages: selectedPages.map((p) => ({ id: p.id, name: p.name })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'AI 生成失敗')
      }

      // 存入 sessionStorage，傳給結果頁
      sessionStorage.setItem('generateResult', JSON.stringify(data))
      sessionStorage.setItem('composeForm', JSON.stringify(form))
      router.push('/result')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📣</span>
            <span className="font-bold text-gray-900">日央水原 發文系統</span>
          </div>
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || ''}
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* 步驟指示 */}
        <div className="flex items-center gap-2 mb-6">
          <div className="text-sm text-gray-400 px-4">1 選擇粉專</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold
                          px-4 py-1.5 rounded-full">
            <span>2</span><span>輸入發文資訊</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-sm text-gray-400 px-4">3 AI 生成文案</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-sm text-gray-400 px-4">4 發佈</div>
        </div>

        {/* 目標粉專提示 */}
        {selectedPages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex items-center gap-2">
            <span className="text-blue-600">📋</span>
            <span className="text-sm text-blue-700">
              將發文至：
              <strong>{selectedPages.map((p) => p.name).join('、')}</strong>
            </span>
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-auto text-xs text-blue-500 hover:text-blue-700 underline"
            >
              修改
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

          {/* 發文目的 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              發文目的 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PURPOSE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, purpose: opt.value })}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all
                    ${form.purpose === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 目標受眾 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              目標受眾
            </label>
            <input
              type="text"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              placeholder="例：天堂M 玩家、喜歡虛寶交易的玩家..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 商品 / 活動名稱 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              商品 / 活動名稱
            </label>
            <input
              type="text"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              placeholder="例：天堂M 寶石包、黃金週折扣活動..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 核心訊息 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              核心訊息 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.coreMessage}
              onChange={(e) => setForm({ ...form, coreMessage: e.target.value })}
              placeholder="你最想讓粉絲知道的重點是什麼？&#10;例：本週寶石包8折、限量100份、先搶先贏..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              盡量具體，AI 生成的文案會更到位
            </p>
          </div>

          {/* 補充資訊（選填） */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              補充資訊 <span className="text-gray-400 font-normal">（選填）</span>
            </label>
            <textarea
              value={form.extraContext}
              onChange={(e) => setForm({ ...form, extraContext: e.target.value })}
              placeholder="例：搭配圖片說明、活動期限、特殊規則、品牌語氣偏好..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 文案風格 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              文案風格
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, style: opt.value })}
                  className={`p-3 rounded-xl border-2 text-left transition-all
                    ${form.style === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <div className="font-medium text-sm text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* 底部操作列 */}
        <div className="sticky bottom-6 mt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4
                          flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              ← 上一步
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !form.coreMessage.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>AI 生成中...</span>
                </>
              ) : (
                <>
                  <span>🤖 AI 生成 3 種文案</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
