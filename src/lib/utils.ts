import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build a Postgres-safe payload from a form.
 *
 * Fixes two bugs that hit every CRUD page:
 *  1. Editing spreads the *joined* row (`classes: {...}`, `class_name`) into
 *     the form, so `.update(form)` posted columns that don't exist → 400.
 *  2. Empty selects/dates posted `''` into uuid/date columns → Postgres
 *     `22P02 invalid input syntax`.
 *
 * `shape` is the page's own `emptyForm` — the whitelist already exists, so
 * there's nothing new to keep in sync.
 */
export function toPayload<T extends Record<string, any>>(
  form: Record<string, any>,
  shape: T,
): Record<string, any> {
  const out: Record<string, any> = {}
  for (const key of Object.keys(shape)) {
    const v = form[key]
    if (v === undefined) continue
    if (typeof v === 'string') {
      const t = v.trim()
      out[key] = t === '' ? null : t
    } else {
      out[key] = v
    }
  }
  return out
}

/* ── Validation ────────────────────────────────────────────
   Deliberately tiny: a rule is a predicate returning an error
   string or null. No schema library for six forms' worth of
   "is this blank".
   ──────────────────────────────────────────────────────── */

export type Rule = (v: any, form: Record<string, any>) => string | null

export const required = (label: string): Rule =>
  v => (v === null || v === undefined || String(v).trim() === '' ? `${label} is required` : null)

export const maxLen = (n: number, label: string): Rule =>
  v => (v && String(v).length > n ? `${label} must be ${n} characters or fewer` : null)

export const phone: Rule = v =>
  !v || /^[+]?[\d\s-]{7,15}$/.test(String(v)) ? null : 'Enter a valid phone number'

export const email: Rule = v =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? null : 'Enter a valid email address'

export const notFuture = (label: string): Rule =>
  v => (v && new Date(v) > new Date() ? `${label} cannot be in the future` : null)

export const positive = (label: string): Rule =>
  v => (v !== null && v !== '' && Number(v) <= 0 ? `${label} must be greater than zero` : null)

export const after = (otherKey: string, label: string): Rule =>
  (v, form) => (v && form[otherKey] && new Date(v) < new Date(form[otherKey])
    ? `${label} must be on or after ${otherKey.replace(/_/g, ' ')}`
    : null)

/** Returns `{}` when the form is clean. */
export function validate(
  form: Record<string, any>,
  rules: Record<string, Rule[]>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [key, list] of Object.entries(rules)) {
    for (const rule of list) {
      const err = rule(form[key], form)
      if (err) { errors[key] = err; break }
    }
  }
  return errors
}

/** Turn a PostgREST error into something a school clerk can act on. */
export function dbErrorMessage(error: { code?: string; message?: string } | null): string {
  if (!error) return 'Something went wrong'
  switch (error.code) {
    case '23505': return 'That value already exists — check for a duplicate'
    case '23503': return 'Linked record is missing — pick a valid option'
    case '23514': return 'That value is not allowed for this field'
    case '22P02': return 'One of the fields has an invalid value'
    case '42501': return 'You do not have permission to do that'
    default:      return error.message || 'Something went wrong'
  }
}

export function formatDate(date: string | Date, formatStr = 'dd MMM yyyy') {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, formatStr) : 'Invalid date'
  } catch {
    return 'Invalid date'
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    organiser: 'bg-purple-100 text-purple-800',
    principal: 'bg-navy-100 text-navy-800',
    vice_principal: 'bg-blue-100 text-blue-800',
    teacher: 'bg-green-100 text-green-800',
    parent: 'bg-orange-100 text-orange-800',
  }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    organiser: 'Organiser',
    principal: 'Principal',
    vice_principal: 'Vice Principal',
    teacher: 'Teacher',
    parent: 'Parent',
  }
  return labels[role] || role
}

export function getAttendanceColor(status: string) {
  const colors: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-yellow-100 text-yellow-700',
    half_day: 'bg-orange-100 text-orange-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getFeeStatusColor(status: string) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return colors[priority] || 'bg-gray-100 text-gray-700'
}

export function getEventTypeColor(type: string) {
  const colors: Record<string, string> = {
    academic: 'bg-blue-500',
    holiday: 'bg-green-500',
    sports: 'bg-orange-500',
    cultural: 'bg-purple-500',
    exam: 'bg-red-500',
    other: 'bg-gray-500',
  }
  return colors[type] || 'bg-gray-500'
}

/**
 * The name a person is actually called by.
 *
 * Andhra names routinely lead with a family or village initial — "K. Sarala
 * Devi", "B. Venkata Rao" — so neither the first word nor the last is right:
 * the first is an initial, the last is a surname. Take the first word that
 * carries more than one letter once the dots are stripped.
 */
export function callingName(full: string | null | undefined) {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean)
  return parts.find(p => p.replace(/\./g, '').length > 1) ?? parts[0] ?? ''
}
