'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  CreditCard, FileText, Calendar, Clock, Megaphone, Bus, MessageSquare,
  CalendarDays, FolderOpen, Settings, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const allNavItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',       roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/students',   icon: Users,           label: 'Students',        roles: ['organiser','principal','vice_principal','teacher'] },
  { href: '/teachers',   icon: GraduationCap,   label: 'Teachers',        roles: ['organiser','principal','vice_principal'] },
  { href: '/classes',    icon: BookOpen,        label: 'Classes',         roles: ['organiser','principal','vice_principal','teacher'] },
  { href: '/attendance', icon: ClipboardCheck,  label: 'Attendance',      roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/fees',       icon: CreditCard,      label: 'Fees',            roles: ['organiser','principal','vice_principal','parent'] },
  { href: '/exams',      icon: FileText,        label: 'Exams & Results', roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/timetable',  icon: Clock,           label: 'Timetable',       roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/notices',    icon: Megaphone,       label: 'Notices',         roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/transport',  icon: Bus,             label: 'Transport',       roles: ['organiser','principal','vice_principal','parent'] },
  { href: '/calendar',   icon: CalendarDays,    label: 'Calendar',        roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/messages',   icon: MessageSquare,   label: 'Messages',        roles: ['organiser','principal','vice_principal','teacher','parent'] },
  { href: '/leave',      icon: Calendar,        label: 'Leave',           roles: ['organiser','principal','vice_principal','teacher'] },
  { href: '/documents',  icon: FolderOpen,      label: 'Documents',       roles: ['organiser','principal','vice_principal','teacher','parent','student'] },
  { href: '/settings',   icon: Settings,        label: 'Settings',        roles: ['organiser','principal','vice_principal'] },
]

interface SidebarProps {
  role: UserRole
  onClose?: () => void
}

export default function Sidebar({ role, onClose }: SidebarProps) {
  const pathname  = usePathname()
  const navItems  = allNavItems.filter(item => item.roles.includes(role))

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.()
    }
  }

  return (
    <aside
      className="w-60 flex flex-col h-full shrink-0"
      style={{ background: 'linear-gradient(180deg, #0d2038 0%, #1a3356 45%, #142540 100%)' }}
    >
      {/* ── Logo ────────────────────────────────────── */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">GVN School</p>
            <p className="text-blue-300/70 text-xs">Visakhapatnam</p>
          </div>
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

      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2.5 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'text-white'
                  : 'text-blue-200/65 hover:bg-white/10 hover:text-white',
              )}
              style={active ? {
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
              } : undefined}
            >
              <item.icon className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                active ? 'text-white' : 'text-blue-300/55',
              )} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ──────────────────────────────────── */}
      <div className="p-3 border-t border-white/10">
        <div
          className="px-3 py-2.5 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <p className="text-blue-300/65 text-xs font-medium">Geethanjali Vidya Nilayam</p>
          <p className="text-blue-400/45 text-xs mt-0.5">Est. 1995 · Vizag</p>
        </div>
      </div>
    </aside>
  )
}
