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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Sidebar toggle button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen
            ? <X className="w-5 h-5" />
            : <Menu className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Geethanjali Vidya Nilayam</h1>
          <p className="text-xs text-gray-400">Peddawaltair, Visakhapatnam</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f59e0b] rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">{getInitials(profile?.full_name ?? 'U')}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-gray-400">{getRoleLabel(profile?.role ?? '')}</p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-400">{profile?.email}</p>
                <span className={cn('badge mt-1 inline-block', getRoleBadgeColor(profile?.role ?? ''))}>
                  {getRoleLabel(profile?.role ?? '')}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); router.push('/settings') }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
