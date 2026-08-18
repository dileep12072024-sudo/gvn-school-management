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
  // Closed is the honest first paint: the server has no idea how wide the
  // screen is, and rendering open meant every phone flashed a full-screen
  // scrim before the effect below could correct it.
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setOpen(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    // h-dvh, not h-screen: 100vh on mobile Safari is taller than the visible
    // area, which buries the last row of every table under the URL bar.
    <div className="flex h-[100dvh] overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(13,30,51,.55)' }}
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
        <main className="scrollbar-thin safe-b flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:p-6">
          <div className="mx-auto max-w-[1400px] space-y-4 md:space-y-5">{children}</div>
        </main>
      </div>
    </div>
  )
}
