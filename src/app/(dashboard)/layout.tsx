export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getProfile } from '@/lib/supabase-server'
import { canAccess, landingFor } from '@/lib/nav'
import { AuthProvider } from '@/context/AuthContext'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  // Middleware proves you are signed in; this proves you may see *this* route.
  // RLS is still the real boundary — this just avoids rendering a dead page.
  const pathname = headers().get('x-pathname') ?? headers().get('x-invoke-path') ?? ''
  if (pathname && !canAccess(profile.role, pathname)) {
    redirect(landingFor(profile.role))
  }

  return (
    <AuthProvider initialProfile={profile}>
      <DashboardShell profile={profile}>{children}</DashboardShell>
    </AuthProvider>
  )
}
