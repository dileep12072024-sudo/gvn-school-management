export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/mock-auth'

export default async function RootPage() {
  const cookieStore = cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (session?.value) {
    redirect('/dashboard')
  } else {
    redirect('/landing')
  }
}
