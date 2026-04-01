import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { FacebookPagesResponse } from '@/lib/types'

/**
 * GET /api/pages
 *
 * 呼叫 Meta Graph API 取得使用者管理的粉專列表
 * 需要使用者已登入（Session 含有 accessToken）
 *
 * Graph API 文件：
 * https://developers.facebook.com/docs/graph-api/reference/user/accounts/
 */
export async function GET(request: NextRequest) {
  // 1. 驗證登入狀態
  const session = await getServerSession(authOptions)

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: '未登入，請先使用 Facebook 帳號登入' },
      { status: 401 }
    )
  }

  try {
    // 2. 呼叫 Graph API /me/accounts
    // fields 指定要回傳的欄位（減少不必要的資料）
    const fields = [
      'id',
      'name',
      'access_token',
      'fan_count',
      'picture.type(large)',
      'category',
      'tasks',
    ].join(',')

    const graphUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=${fields}&access_token=${session.accessToken}`

    const response = await fetch(graphUrl)
    const data: FacebookPagesResponse = await response.json()

    // 3. 處理 Graph API 錯誤
    if (!response.ok || (data as any).error) {
      const error = (data as any).error
      console.error('Graph API Error:', error)

      // 常見錯誤：Token 過期
      if (error?.code === 190) {
        return NextResponse.json(
          { error: '登入憑證已過期，請重新登入' },
          { status: 401 }
        )
      }

      // 常見錯誤：權限不足（尚未通過 Meta App Review）
      if (error?.code === 10 || error?.code === 200) {
        return NextResponse.json(
          {
            error: '缺少 pages_show_list 權限，請確認 Meta App 已申請此權限',
            detail: error?.message,
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: error?.message || '取得粉專列表失敗' },
        { status: 500 }
      )
    }

    // 4. 成功：回傳粉專列表
    return NextResponse.json({
      pages: data.data,
      total: data.data.length,
    })
  } catch (error) {
    console.error('取得粉專列表時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    )
  }
}
