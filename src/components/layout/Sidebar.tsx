'use client'

import { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  CreditCard, FileText, Calendar, Clock, Megaphone, Bus, MessageSquare,
  CalendarDays, FolderOpen, Settings, X, Baby,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV, NAV_GROUPS, type UserRole } from '@/lib/nav'

// Icons live here, not in nav.ts — that file is imported by edge middleware.
const ICONS: Record<string, typeof Users> = {
  '/dashboard': LayoutDashboard,
  '/portal': Baby,
  '/attendance': ClipboardCheck,
  '/exams': FileText,
  '/timetable': Clock,
  '/classes': BookOpen,
  '/students': Users,
  '/teachers': GraduationCap,
  '/leave': Calendar,
  '/fees': CreditCard,
  '/transport': Bus,
  '/documents': FolderOpen,
  '/notices': Megaphone,
  '/calendar': CalendarDays,
  '/messages': MessageSquare,
  '/settings': Settings,
}

export default function Sidebar({ role, onClose }: { role: UserRole; onClose?: () => void }) {
  const pathname = usePathname()
  const visible = NAV.filter(i => !i.hidden && i.roles.includes(role))
  const nav = useRef<HTMLElement>(null)

  // The active highlight is one rail that slides between links rather than a
  // background that blinks off one row and on to another. Absolutely
  // positioned inside the scrolling <nav>, so it scrolls with the list.
  useLayoutEffect(() => {
    const el = nav.current
    if (!el) return
    const place = () => {
      const active = el.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active) { delete el.dataset.ready; return }
      el.style.setProperty('--x', `${active.offsetLeft}px`)
      el.style.setProperty('--y', `${active.offsetTop}px`)
      el.style.setProperty('--w', `${active.offsetWidth}px`)
      el.style.setProperty('--h', `${active.offsetHeight}px`)
    }
    place()
    const raf = requestAnimationFrame(() => { if (el.querySelector('[aria-current="page"]')) el.dataset.ready = 'y' })
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [pathname, role])

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose?.()
  }

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col"
      style={{
        background: 'linear-gradient(180deg, #16304e 0%, #0f2138 55%, #0a1828 100%)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,.06), 4px 0 24px rgba(10,24,40,.28)',
      }}
    >
      {/* Brass hairline along the top edge */}
      <div className="h-px shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(217,169,78,.6), transparent)' }} />

      {/* ── Crest ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)]"
          style={{
            background: 'linear-gradient(180deg, var(--brass-lift), var(--brass) 55%, var(--brass-deep))',
            boxShadow: '0 2px 0 var(--brass-deep), 0 4px 10px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.4)',
          }}
        >
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-white">GVN School</p>
          <p className="truncate text-xs text-white/40">Visakhapatnam</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav ref={nav} className="scrollbar-hide relative flex-1 overflow-y-auto px-3 py-4">
        <span className="nav-rail" aria-hidden />
        {NAV_GROUPS.map(group => {
          const items = visible.filter(i => i.group === group)
          if (!items.length) return null

          return (
            <div key={group} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/25">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = ICONS[item.href] ?? FileText
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        active ? 'text-white' : 'text-white/50 hover:bg-white/[.07] hover:text-white/90',
                      )}
                    >
                      <Icon
                        className={cn('h-4 w-4 shrink-0 transition-colors', !active && 'text-white/35 group-hover:text-white/70')}
                        style={active ? { color: 'var(--brass-lift)' } : undefined}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Footer plate ──────────────────────────────── */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div
          className="rounded-[var(--radius-sm)] px-3 py-2.5 text-center"
          style={{ background: 'rgba(0,0,0,.22)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.4)' }}
        >
          <p className="text-[11px] font-semibold text-white/45">Geethanjali Vidya Nilayam</p>
          <p className="mt-0.5 text-[10px] text-white/25">Est. 1995 · Vizag</p>
        </div>
      </div>
    </aside>
  )
}
