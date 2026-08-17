'use client'

import { useEffect, type ElementType } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Tilt3D from './Tilt3D'

export { default as Tilt3D } from './Tilt3D'

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
    <div className="flex flex-wrap items-center justify-between gap-4 animate-rise">
      <div className="flex items-center gap-3.5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] text-white"
          style={{
            background: 'linear-gradient(180deg, var(--navy-lift), var(--navy) 60%, var(--navy-deep))',
            boxShadow: '0 3px 0 var(--navy-deep), 0 6px 14px rgba(15,33,56,.3), inset 0 1px 0 rgba(255,255,255,.25)',
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
          {subtitle && <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ── Stat tile ───────────────────────────────────────────── */

const TONES = {
  navy:   'linear-gradient(180deg, var(--navy-lift), var(--navy) 60%, var(--navy-deep))',
  brass:  'linear-gradient(180deg, var(--brass-lift), var(--brass) 60%, var(--brass-deep))',
  green:  'linear-gradient(180deg, #4a9d78, #2f7d5b 60%, #1f5c42)',
  red:    'linear-gradient(180deg, #d15b52, #b8443c 60%, #94322b)',
  slate:  'linear-gradient(180deg, #8494a8, #667790 60%, #4b5a70)',
} as const

export type Tone = keyof typeof TONES

export function StatCard({
  label, value, icon: Icon, tone = 'navy', hint,
}: {
  label: string
  value: React.ReactNode
  icon: ElementType
  tone?: Tone
  hint?: string
}) {
  return (
    <Tilt3D className="panel overflow-hidden p-5">
      <div className="layer-1 flex items-center gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius)] text-white"
          style={{
            background: TONES[tone],
            boxShadow: '0 3px 0 rgba(0,0,0,.18), 0 6px 14px rgba(22,32,46,.22), inset 0 1px 0 rgba(255,255,255,.3)',
          }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{value}</p>
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 33, 56, .45)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'panel animate-rise flex max-h-[88vh] w-full flex-col overflow-hidden',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
        style={{ boxShadow: '0 30px 60px -20px rgba(15,33,56,.5), 0 10px 24px rgba(15,33,56,.25)' }}
      >
        <div
          className="flex items-start justify-between gap-4 px-6 py-5 text-white"
          style={{
            background: 'linear-gradient(180deg, var(--navy-lift), var(--navy) 70%, var(--navy-deep))',
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

        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div
            className="flex justify-end gap-2.5 px-6 py-4"
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
        className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[var(--radius)]"
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
      <div className="scrollbar-thin overflow-x-auto">
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
