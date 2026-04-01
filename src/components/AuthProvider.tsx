'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * NextAuth Session Provider
 * 包裹整個 App，讓所有子元件可以使用 useSession()
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
