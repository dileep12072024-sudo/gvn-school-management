'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { MockProfile } from '@/lib/mock-auth'

interface AuthContextType {
  user: MockProfile | null
  profile: MockProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialProfile,
}: {
  children: React.ReactNode
  initialProfile?: MockProfile | null
}) {
  const [profile, setProfile] = useState<MockProfile | null>(initialProfile ?? null)
  const [loading] = useState(false)

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Invalid credentials' }
    setProfile(data.profile)
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    // No-op for mock auth — profile is stable from cookie
  }, [])

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
