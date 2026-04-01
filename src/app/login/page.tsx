'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * 登入頁面
 * 使用 Facebook OAuth 登入
 */
export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // 已登入則自動跳轉到 Dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('facebook', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('登入失敗:', error)
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full mx-4">

        {/* Logo & 標題 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📣</div>
          <h1 className="text-2xl font-bold text-gray-900">
            FB 粉專自動發文系統
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            日央水原商行 × AI 行銷助手
          </p>
        </div>

        {/* 功能說明 */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-8 space-y-2">
          {[
            '🤖 AI 自動生成 3 種風格文案',
            '🎨 AI 產圖，多種風格任選',
            '📅 支援立即發文或排程發文',
            '📊 管理多個粉絲專頁',
          ].map((item) => (
            <p key={item} className="text-sm text-blue-700 font-medium">
              {item}
            </p>
          ))}
        </div>

        {/* Facebook 登入按鈕 */}
        <button
          onClick={handleFacebookLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5]
                     text-white font-bold py-4 px-6 rounded-2xl text-lg
                     transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                     shadow-lg shadow-blue-200"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>登入中...</span>
            </>
          ) : (
            <>
              {/* Facebook Logo SVG */}
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>使用 Facebook 帳號登入</span>
            </>
          )}
        </button>

        {/* 說明文字 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          登入即表示授權本系統讀取並管理<br />
          您的 Facebook 粉絲專頁發文權限
        </p>
      </div>
    </div>
  )
}
