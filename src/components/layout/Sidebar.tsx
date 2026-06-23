'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  CreditCard, FileText, Calendar, Clock, Megaphone, Bus, MessageSquare,
  CalendarDays, FolderOpen, Settings, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const allNavItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',      roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/students',   icon: Users,           label: 'Students',       roles: ['organiser','principal','vice_principal','teacher'] },
  { href: '/teachers',   icon: GraduationCap,   label: 'Teachers',       roles: ['organiser','principal','vice_principal'] },
  { href: '/classes',    icon: BookOpen,        label: 'Classes',        roles: ['organiser','principal','vice_principal','teacher'] },
  { href: '/attendance', icon: ClipboardCheck,  label: 'Attendance',     roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/fees',       icon: CreditCard,      label: 'Fees',           roles: ['organiser','principal','vice_principal','parent'] },
  { href: '/exams',      icon: FileText,        label: 'Exams & Results',roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/timetable',  icon: Clock,           label: 'Timetable',      roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/notices',    icon: Megaphone,       label: 'Notices',        roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/transport',  icon: Bus,             label: 'Transport',      roles: ['organiser','principal','vice_principal','parent'] },
  { href: '/calendar',   icon: CalendarDays,    label: 'Calendar',       roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/messages',   icon: MessageSquare,   label: 'Messages',       roles: ['organiser','principal','vice_principal','teacher','parent'] },
  { href: '/leave',      icon: Calendar,        label: 'Leave',          roles: ['organiser','principal','vice_principal','teacher'] },
  { href: '/documents',  icon: FolderOpen,      label: 'Documents',      roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/settings',   icon: Settings,        label: 'Settings',       roles: ['organiser','principal','vice_principal'] },
]

interface SidebarProps {
  role: UserRole
  onClose?: () => void
}

export default function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname()
  const navItems = allNavItems.filter(item => item.roles.includes(role))

  const handleNavClick = () => {
    // Auto-close on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.()
    }
  }

  return (
    <aside className="w-60 bg-[#1e3a5f] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f59e0b] rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">GVN School</p>
            <p className="text-blue-300 text-xs">Visakhapatnam</p>
          </div>
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-blue-300 hover:text-white transition-colors shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-[#f59e0b] text-white shadow-sm'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-blue-300')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <p className="text-blue-400 text-xs text-center">Geethanjali Vidya Nilayam</p>
        <p className="text-blue-500 text-xs text-center">Peddawaltair, Vizag</p>
      </div>
    </aside>
  )
}
