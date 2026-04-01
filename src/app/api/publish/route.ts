import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

/**
 * POST /api/publish
 * 使用 Page Access Token 發文到指定粉絲專頁
 *
 * 注意：pages_manage_posts scope 需 Meta App Review 通過後才能對外用戶生效
 * 開發者帳號在開發模式下可直接測試
 */
export async function POST(req: NextRequest) {
  // 驗證登入狀態
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const { content, pages } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: '發文內容不能為空' }, { status: 400 })
  }

  if (!pages || pages.length === 0) {
    return NextResponse.json({ error: '請選擇至少一個粉專' }, { status: 400 })
  }

  const results: Array<{
    pageId: string
    pageName: string
    success: boolean
    postId?: string
    error?: string
  }> = []

  // 逐一對每個粉專發文
  for (const page of pages) {
    if (!page.access_token) {
      results.push({
        pageId: page.id,
        pageName: page.name,
        success: false,
        error: '缺少 Page Access Token',
      })
      continue
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            access_token: page.access_token,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok || data.error) {
        results.push({
          pageId: page.id,
          pageName: page.name,
          success: false,
          error: data.error?.message || '發佈失敗',
        })
      } else {
        results.push({
          pageId: page.id,
          pageName: page.name,
          success: true,
          postId: data.id,
        })
      }
    } catch (err: any) {
      results.push({
        pageId: page.id,
        pageName: page.name,
        success: false,
        error: err.message,
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  // 組合回應訊息
  let message = ''
  if (successCount === results.length) {
    message = `成功發佈到 ${successCount} 個粉絲專頁 🎉`
  } else if (successCount > 0) {
    message = `${successCount} 個成功，${failCount} 個失敗`
  } else {
    const firstError = results.find((r) => !r.success)?.error
    return NextResponse.json(
      { error: firstError || '全部發佈失敗', results },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message,
    successCount,
    failCount,
    results,
  })
}
