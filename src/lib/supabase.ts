import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { UserRole } from './nav'

/** Browser-side client. Shares the singleton so the auth session stays in sync. */
export const createClient = () => createClientComponentClient()

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
}

// Server-only helpers live in ./supabase-server — they import next/headers,
// which Next.js refuses to bundle into a client component.
