'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, Settings, Menu, X } from 'lucide-react'
import { getInitials, getRoleBadgeColor, getRoleLabel, cn } from '@/lib/utils'
import type { MockProfile } from '@/lib/mock-auth'
import toast from 'react-hot-toast'

interface HeaderProps {
  profile: MockProfile | null
  sidebarOpen?: boolean
  onMenuClick?: () => void
}

export default function Header({ profile, sidebarOpen, onMenuClick }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="h-16 border-b border-gray-200/60 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-10"
      style={{
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      {/* Left: toggle + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen
            ? <X    className="w-5 h-5" />
            : <Menu className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 leading-tight">Geethanjali Vidya Nilayam</h1>
          <p className="text-xs text-gray-400">Peddawaltair, Visakhapatnam</p>
        </div>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-2">

        {/* Notification bell with live ping */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2e5a96 100%)' }}
            >
              <span className="text-xs font-bold text-white">{getInitials(profile?.full_name ?? 'U')}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-gray-400">{getRoleLabel(profile?.role ?? '')}</p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{profile?.email}</p>
                  <span className={cn('badge mt-1.5 inline-block', getRoleBadgeColor(profile?.role ?? ''))}>
                    {getRoleLabel(profile?.role ?? '')}
                  </span>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => { setOpen(false); router.push('/settings') }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" /> Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
