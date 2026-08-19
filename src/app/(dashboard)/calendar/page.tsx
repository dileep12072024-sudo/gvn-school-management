'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, CalendarDays, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, parseISO, addMonths, subMonths, isToday,
} from 'date-fns'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { toPayload, validate, dbErrorMessage, required, after } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/nav'
import { PageHeader, Modal, EmptyState } from '@/components/ui'

const TYPES = {
  academic: { label: 'Academic', color: 'var(--azure)' },
  holiday:  { label: 'Holiday',  color: 'var(--success)' },
  sports:   { label: 'Sports',   color: 'var(--accent)' },
  cultural: { label: 'Cultural', color: 'var(--violet)' },
  exam:     { label: 'Exam',     color: 'var(--danger)' },
  other:    { label: 'Other',    color: 'var(--slate)' },
} as const

const EMPTY_FORM = {
  title: '', description: '', event_date: '', end_date: '', event_type: 'academic',
}

const RULES = {
  title:      [required('Title')],
  event_date: [required('Date')],
  end_date:   [after('event_date', 'End date')],
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canEdit = isAdmin(profile?.role)

  const [month, setMonth] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, description, event_date, end_date, event_type')
      .gte('event_date', format(startOfMonth(month), 'yyyy-MM-dd'))
      .lte('event_date', format(endOfMonth(month), 'yyyy-MM-dd'))
      .order('event_date')
    if (error) toast.error(dbErrorMessage(error))
    setEvents(data ?? [])
    setLoading(false)
  }, [supabase, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const leadingBlanks = startOfMonth(month).getDay()

  const eventsOn = (day: Date) => events.filter(e => isSameDay(parseISO(e.event_date), day))

  const openAdd = (day?: Date) => {
    if (!canEdit) return
    setForm({ ...EMPTY_FORM, event_date: format(day ?? new Date(), 'yyyy-MM-dd') })
    setErrors({})
    setShowModal(true)
  }

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function addEvent() {
    const errs = validate(form, RULES)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    // toPayload nulls the blank end_date — '' is not a valid DATE.
    const payload = { ...toPayload(form, EMPTY_FORM), created_by: user?.id ?? null, approved: true }
    const { error } = await supabase.from('calendar_events').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Event added')
    setShowModal(false)
    fetchEvents()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('calendar_events').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Event removed')
    setDeleting(null)
    fetchEvents()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarDays}
        title="Calendar"
        subtitle="School events and holidays"
        actions={canEdit && (
          <button onClick={() => openAdd()} className="btn btn-accent">
            <Plus className="h-4 w-4" /> Add event
          </button>
        )}
      />

      <div className="panel p-5">
        {/* Month nav */}
        <div className="mb-5 flex items-center justify-between">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="btn btn-ghost btn-icon" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-serif), serif' }}>
              {format(month, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setMonth(new Date())}
              className="text-xs font-semibold"
              style={{ color: 'var(--primary-lift)' }}
            >
              Today
            </button>
          </div>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="btn btn-ghost btn-icon" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          {Object.entries(TYPES).map(([key, t]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} /> {t.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-1 text-center text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--ink-faint)' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`blank-${i}`} />)}
          {days.map(day => {
            const dayEvents = eventsOn(day)
            const today = isToday(day)
            const Cell = canEdit ? 'button' : 'div'
            return (
              <Cell
                key={day.toISOString()}
                {...(canEdit ? { onClick: () => openAdd(day), 'aria-label': `Add event on ${format(day, 'd MMMM')}` } : {})}
                className="min-h-[74px] rounded-[var(--radius-sm)] p-1.5 text-left transition-all"
                style={today ? {
                  background: 'linear-gradient(180deg, var(--primary-lift), var(--primary-deep))',
                  boxShadow: '0 2px 0 var(--primary-deep), inset 0 1px 0 rgba(255,255,255,.18)',
                } : {
                  background: 'var(--surface-sunk)',
                  border: '1px solid var(--edge)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)',
                }}
              >
                <span
                  className="mb-1 block text-center text-xs font-bold tabular-nums"
                  style={{ color: today ? '#fff' : 'var(--ink-soft)' }}
                >
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(e => (
                    <div
                      key={e.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-semibold text-white"
                      style={{ background: TYPES[e.event_type as keyof typeof TYPES]?.color ?? TYPES.other.color }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px]" style={{ color: today ? 'rgba(255,255,255,.7)' : 'var(--ink-faint)' }}>
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </Cell>
            )
          })}
        </div>
      </div>

      {/* This month's list */}
      <div className="panel p-5">
        <h3 className="mb-4 font-bold rule-brass" style={{ color: 'var(--ink)' }}>
          {format(month, 'MMMM')} events
        </h3>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing this month" hint={canEdit ? 'Tap a date to add an event.' : undefined} />
        ) : (
          <div className="space-y-2">
            {events.map(e => {
              const tone = TYPES[e.event_type as keyof typeof TYPES] ?? TYPES.other
              return (
                <div key={e.id} className="plaque flex items-center gap-3 p-3">
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: tone.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{e.title}</p>
                    {e.description && (
                      <p className="truncate text-xs" style={{ color: 'var(--ink-faint)' }}>{e.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs" style={{ color: 'var(--ink-faint)' }}>
                    {format(parseISO(e.event_date), 'dd MMM')}
                    {e.end_date && ` – ${format(parseISO(e.end_date), 'dd MMM')}`}
                  </span>
                  {canEdit && (
                    <button onClick={() => setDeleting(e)} className="btn btn-ghost btn-icon shrink-0" aria-label={`Delete ${e.title}`}>
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add event ─────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add an event"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addEvent} disabled={saving}>
              {saving ? 'Saving…' : 'Add event'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title" value={form.title} onChange={e => set('title', e.target.value)}
              className={`input ${errors.title ? 'input-error' : ''}`} placeholder="Annual Day"
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event_date" className="label">Date</label>
              <input
                id="event_date" type="date" value={form.event_date}
                onChange={e => set('event_date', e.target.value)}
                className={`input ${errors.event_date ? 'input-error' : ''}`}
              />
              {errors.event_date && <p className="field-error">{errors.event_date}</p>}
            </div>
            <div>
              <label htmlFor="end_date" className="label">End date (optional)</label>
              <input
                id="end_date" type="date" value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
                className={`input ${errors.end_date ? 'input-error' : ''}`}
              />
              {errors.end_date && <p className="field-error">{errors.end_date}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="event_type" className="label">Type</label>
            <select id="event_type" value={form.event_type} onChange={e => set('event_type', e.target.value)} className="input">
              {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="label">Description (optional)</label>
            <textarea
              id="description" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)} className="input resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete event"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Delete “<strong>{deleting?.title}</strong>” from the calendar?
        </p>
      </Modal>
    </div>
  )
}
