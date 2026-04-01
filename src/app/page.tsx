import { redirect } from 'next/navigation'

/**
 * 根路徑自動導向登入頁
 */
export default function Home() {
  redirect('/login')
}
