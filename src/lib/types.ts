/**
 * 日央水原商行 - FB 自動發文系統
 * 共用型別定義
 */

/** Facebook 粉絲專頁 */
export interface FacebookPage {
  id: string
  name: string
  access_token: string           // Page Access Token（用來代粉專發文）
  fan_count?: number             // 粉絲數
  picture?: {
    data: {
      url: string                // 粉專頭像 URL
    }
  }
  category?: string              // 粉專類別
  tasks?: string[]               // 使用者在此粉專的權限
}

/** /me/accounts API 回傳格式 */
export interface FacebookPagesResponse {
  data: FacebookPage[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}

/** 選定的粉專（包含 UI 狀態） */
export interface SelectedPage extends FacebookPage {
  isSelected: boolean
}

/** NextAuth Session 擴充（加入 accessToken） */
declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    accessTokenExpires?: number
  }
}
