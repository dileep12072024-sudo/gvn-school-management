'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Profile } from '@/lib/supabase'

interface AuthContextType {
  profile: Profile | null
  /** Alias kept so existing callers reading `user` keep working. */
  user: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialProfile,
}: {
  children: React.ReactNode
  initialProfile: Profile | null
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Server already resolved the profile; this only catches sign-out or a token
  // refresh happening in another tab.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        router.replace('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  const refreshProfile = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setProfile(null); setLoading(false); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone, avatar_url')
      .eq('id', user.id)
      .single()
    setProfile((data as Profile) ?? null)
    setLoading(false)
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.replace('/login')
    router.refresh()
  }, [supabase, router])

  return (
    <AuthContext.Provider value={{ profile, user: profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
