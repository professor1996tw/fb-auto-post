import NextAuth, { NextAuthOptions } from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'

/**
 * NextAuth 設定
 *
 * 使用商家專用 Facebook 登入（Business Login）
 * Business Login 不支援 email / public_profile scope
 * 只需申請以下粉專管理 Scope：
 * - pages_show_list      → 列出使用者管理的粉專
 * - pages_read_engagement → 讀取粉專基本資訊
 * - pages_manage_posts   → 代粉專發文（需 Meta App Review）
 */
export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          scope: [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
          ].join(','),
        },
      },
      // Business Login 不支援 email scope，覆寫 userinfo 只取 id/name/picture
      userinfo: {
        url: 'https://graph.facebook.com/me',
        params: { fields: 'id,name,picture' },
      },
      // NextAuth 要求 profile 必須有 email，用 id 合成一個 dummy email
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name ?? profile.id,
          email: `${profile.id}@fb-business.local`,
          image: profile.picture?.data?.url ?? null,
        }
      },
    }),
  ],

  callbacks: {
    /**
     * JWT Callback：在 token 裡存入 Facebook access_token
     * 這個 access_token 之後用來呼叫 Graph API 取得粉專列表
     */
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.accessTokenExpires = account.expires_at
      }
      return token
    },

    /**
     * Session Callback：讓前端 useSession() 可以拿到 accessToken
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },

  pages: {
    signIn: '/login',   // 自訂登入頁
    error: '/login',    // 錯誤也導回登入頁
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
