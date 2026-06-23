export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/mock-auth'
import type { MockProfile } from '@/lib/mock-auth'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

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
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar role={(profile.role as any) ?? 'student'} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header profile={profile} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
