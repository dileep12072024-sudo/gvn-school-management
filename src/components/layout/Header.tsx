'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Settings, Menu, PanelLeftClose } from 'lucide-react'
import { getInitials, getRoleLabel, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Profile } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Header({
  profile, sidebarOpen, onMenuClick,
}: {
  profile: Profile
  sidebarOpen?: boolean
  onMenuClick?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    toast.success('Signed out')
  }

  return (
    <header
      className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6"
      style={{
        background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-sunk) 100%)',
        borderBottom: '1px solid var(--edge-strong)',
        boxShadow: '0 1px 0 rgba(255,255,255,.8) inset, 0 2px 8px rgba(22,32,46,.06)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={!!sidebarOpen}
          className="btn btn-ghost btn-icon"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight" style={{ color: 'var(--ink)' }}>
            Geethanjali Vidya Nilayam
          </h1>
          <p className="truncate text-xs" style={{ color: 'var(--ink-faint)' }}>
            Peddawaltair, Visakhapatnam
          </p>
        </div>
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-black/[.04]"
        >
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-white"
            style={{
              background: 'linear-gradient(180deg, var(--navy-lift), var(--navy) 60%, var(--navy-deep))',
              boxShadow: '0 2px 0 var(--navy-deep), 0 3px 8px rgba(15,33,56,.28), inset 0 1px 0 rgba(255,255,255,.25)',
            }}
          >
            <span className="text-xs font-bold">{getInitials(profile.full_name || 'U')}</span>
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
              {profile.full_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{getRoleLabel(profile.role)}</p>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
            style={{ color: 'var(--ink-faint)' }}
          />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="panel animate-rise absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden p-0"
              style={{ boxShadow: 'var(--lift-3)' }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--edge)' }}>
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {profile.full_name}
                </p>
                <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--ink-faint)' }}>
                  {profile.email}
                </p>
                <span
                  className="badge mt-2"
                  style={{ background: 'var(--paper-deep)', color: 'var(--navy)' }}
                >
                  {getRoleLabel(profile.role)}
                </span>
              </div>
              <div className="p-1.5">
                <button
                  role="menuitem"
                  onClick={() => { setOpen(false); router.push('/settings') }}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors hover:bg-black/[.04]"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  <Settings className="h-4 w-4" style={{ color: 'var(--ink-faint)' }} /> Settings
                </button>
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors hover:bg-red-50 disabled:opacity-60"
                  style={{ color: '#b8443c' }}
                >
                  <LogOut className="h-4 w-4" /> {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
