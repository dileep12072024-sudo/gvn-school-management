export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase-server'
import { landingFor } from '@/lib/nav'

export default async function RootPage() {
  const profile = await getProfile()
  redirect(profile ? landingFor(profile.role) : '/landing')
}
