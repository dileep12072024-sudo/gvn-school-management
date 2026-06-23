export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/mock-auth'
import type { MockProfile } from '@/lib/mock-auth'
import { AuthProvider } from '@/context/AuthContext'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)
  if (!sessionCookie?.value) redirect('/login')

  let profile: MockProfile | null = null
  try {
    profile = JSON.parse(sessionCookie!.value) as MockProfile
  } catch {
    redirect('/login')
  }
  if (!profile) redirect('/login')

  return (
    <AuthProvider initialProfile={profile}>
      <DashboardShell profile={profile}>
        {children}
      </DashboardShell>
    </AuthProvider>
  )
}
