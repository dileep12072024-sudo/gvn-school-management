export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function RootPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
