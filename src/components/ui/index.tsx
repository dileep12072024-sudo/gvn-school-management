'use client'

import { useEffect, type ElementType } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Tilt3D from './Tilt3D'
import { useExitAnimation } from '@/lib/exit'

export { default as Tilt3D } from './Tilt3D'
export { default as Segmented, type SegOption } from './Segmented'

/* ── Page header ─────────────────────────────────────────── */

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: ElementType
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 animate-rise sm:gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
        <div
          className="plate grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] text-white"
          style={{
            background: 'linear-gradient(180deg, var(--primary-lift), var(--primary) 60%, var(--primary-deep))',
            boxShadow: '0 3px 0 var(--primary-deep), 0 6px 14px rgba(15,33,56,.3), inset 0 1px 0 rgba(255,255,255,.25)',
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl" style={{ color: 'var(--ink)' }}>{title}</h2>
          {subtitle && <p className="truncate text-xs sm:text-sm" style={{ color: 'var(--ink-faint)' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex w-full items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}

/* ── Stat tile ───────────────────────────────────────────── */

const TONES = {
  primary: 'linear-gradient(180deg, var(--primary-lift), var(--primary) 60%, var(--primary-deep))',
  accent:  'linear-gradient(180deg, var(--accent-lift), var(--accent) 60%, var(--accent-deep))',
  green:   'linear-gradient(180deg, #2c9c78, var(--success) 60%, var(--success-deep))',
  red:     'linear-gradient(180deg, #d4645e, var(--danger) 60%, var(--danger-deep))',
  slate:   'linear-gradient(180deg, #94a2b5, var(--slate) 60%, var(--slate-deep))',
} as const

export type Tone = keyof typeof TONES

export function StatCard({
  label, value, icon: Icon, tone = 'primary', hint,
}: {
  label: string
  value: React.ReactNode
  icon: ElementType
  tone?: Tone
  hint?: string
}) {
  // Stagger and float phase come from :nth-child in globals.css, so no call
  // site has to hand-number its tiles.
  return (
    <Tilt3D className="panel deal float overflow-hidden p-3.5 sm:p-5">
      {/* Two tiles fit across a 390px phone, so the icon sits above the number
          there and beside it once there is room. */}
      <div className="layer-1 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
        <div
          className="plate grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] text-white sm:h-12 sm:w-12"
          style={{
            background: TONES[tone],
            boxShadow: '0 3px 0 rgba(0,0,0,.18), 0 6px 14px rgba(20,29,41,.22), inset 0 1px 0 rgba(255,255,255,.3)',
          }}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tabular-nums sm:text-2xl" style={{ color: 'var(--ink)' }}>{value}</p>
          <p className="truncate text-xs font-medium" style={{ color: 'var(--ink-faint)' }}>{label}</p>
          {hint && <p className="truncate text-[11px]" style={{ color: 'var(--ink-faint)' }}>{hint}</p>}
        </div>
      </div>
    </Tilt3D>
  )
}

/* ── Modal ───────────────────────────────────────────────── */

export function Modal({
  open, onClose, title, subtitle, children, footer, wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  const sheet = useExitAnimation(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!sheet.mounted) return null

  return (
    <div
      className={cn('veil fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4', sheet.closing && 'veil-closing')}
      style={{ background: 'rgba(18, 33, 63, .55)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // Phone: a sheet anchored to the bottom, square at the base, thumb in
          // reach of the footer buttons. Desktop: the usual centred card.
          'panel safe-b genie flex w-full flex-col overflow-hidden',
          'max-h-[92dvh] rounded-b-none sm:max-h-[88dvh] sm:rounded-b-[var(--radius-lg)]',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
          sheet.closing && 'genie-closing',
        )}
        style={{
          boxShadow: '0 30px 60px -20px rgba(18,33,63,.55), 0 10px 24px rgba(18,33,63,.28)',
        }}
      >
        {/* Grab handle — the affordance that says "this sheet dismisses". */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full" style={{ background: 'var(--edge-strong)' }} />
        </div>

        <div
          className="flex items-start justify-between gap-4 px-5 py-4 text-white sm:px-6 sm:py-5"
          style={{
            background: 'linear-gradient(180deg, var(--primary-lift), var(--primary) 70%, var(--primary-deep))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 2px 6px rgba(15,33,56,.3)',
          }}
        >
          <div>
            <h3 className="text-lg font-bold leading-tight">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-white/65">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-[var(--radius-sm)] p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div
            className="flex flex-col-reverse gap-2.5 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
            style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface-sunk)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Empty / loading states ──────────────────────────────── */

export function EmptyState({
  icon: Icon, title, hint, colSpan,
}: {
  icon: ElementType
  title: string
  hint?: string
  colSpan?: number
}) {
  const body = (
    <div className="plaque mx-auto my-8 max-w-sm px-6 py-10 text-center">
      <div
        className="icon-pop float mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[var(--radius)]"
        style={{ background: 'var(--paper-deep)', boxShadow: 'var(--sunk)' }}
      >
        <Icon className="h-7 w-7" style={{ color: 'var(--ink-faint)' }} />
      </div>
      <p className="font-semibold" style={{ color: 'var(--ink-soft)' }}>{title}</p>
      {hint && <p className="mt-1 text-sm" style={{ color: 'var(--ink-faint)' }}>{hint}</p>}
    </div>
  )
  return colSpan ? <tr><td colSpan={colSpan}>{body}</td></tr> : body
}

export function SkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td colSpan={cols} className="px-4 py-3.5">
            <div className="skeleton h-4" style={{ width: `${92 - i * 9}%` }} />
          </td>
        </tr>
      ))}
    </>
  )
}

/* ── Table shell ─────────────────────────────────────────── */

export function TableShell({
  columns, children, footer,
}: {
  columns: string[]
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="scrollbar-thin table-scroll overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>{columns.map(c => <th key={c} className="table-header">{c}</th>)}</tr>
          </thead>
          <tbody style={{ background: 'var(--surface)' }}>{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}

/* ── Pagination ──────────────────────────────────────────── */

export function Pagination({
  page, pageSize, total, onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface-sunk)' }}
    >
      <p className="text-xs tabular-nums" style={{ color: 'var(--ink-faint)' }}>
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="text-xs tabular-nums" style={{ color: 'var(--ink-soft)' }}>
          {page + 1} / {pages}
        </span>
        <button className="btn btn-ghost btn-sm" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

/* ── Toolbar ─────────────────────────────────────────────── */

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel-flat flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
      {children}
    </div>
  )
}
