'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import type { MockProfile } from '@/lib/mock-auth'

export default function DashboardShell({
  profile,
  children,
}: {
  profile: MockProfile
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setOpen(false)
    }
  }, [])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #eef2f7 0%, #e8f0f9 50%, #eef2f7 100%)' }}
    >
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar wrapper */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-30',
          'lg:relative lg:inset-auto lg:z-auto',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:hidden',
        ].join(' ')}
      >
        <Sidebar
          role={(profile.role as any) ?? 'student'}
          onClose={() => setOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          profile={profile}
          sidebarOpen={open}
          onMenuClick={() => setOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
