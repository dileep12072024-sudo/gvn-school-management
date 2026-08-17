'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import type { Profile } from '@/lib/supabase'

export default function DashboardShell({
  profile, children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setOpen(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(15,33,56,.45)' }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={[
          'fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-out',
          'lg:relative lg:inset-auto lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full lg:hidden',
        ].join(' ')}
      >
        <Sidebar role={profile.role} onClose={() => setOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header profile={profile} sidebarOpen={open} onMenuClick={() => setOpen(p => !p)} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1400px] space-y-5">{children}</div>
        </main>
      </div>
    </div>
  )
}
