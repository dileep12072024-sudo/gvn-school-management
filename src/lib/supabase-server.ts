import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Profile } from './supabase'

/** Server component client — reads the session from the request cookies. */
export const createServerClient = () => createServerComponentClient({ cookies })

/** Route handler client — may also *write* refreshed session cookies. */
export const createRouteClient = () => createRouteHandlerClient({ cookies })

/**
 * The authenticated user's profile, or null when signed out.
 *
 * `getUser()` revalidates the JWT against Supabase rather than trusting the
 * cookie, so this is safe to gate rendering on. `getSession()` is not — it
 * decodes whatever the cookie claims.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, avatar_url')
    .eq('id', user.id)
    .single()

  return (data as Profile) ?? null
}
