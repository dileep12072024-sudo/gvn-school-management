'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Clock, CalendarDays, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { toPayload, validate, dbErrorMessage, required } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/nav'
import { PageHeader, Modal, EmptyState, Toolbar } from '@/components/ui'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

// Muted, print-safe subject tints — deliberately not the neon set.
const TINTS = [
  { bg: '#e5ecf4', edge: '#b9cadd', ink: '#1e3a5f' },
  { bg: '#f2e9dc', edge: '#ddc9a8', ink: '#8a6224' },
  { bg: '#e2eee8', edge: '#b6d5c6', ink: '#1f5c42' },
  { bg: '#f0e4e6', edge: '#dcbdc1', ink: '#94322b' },
  { bg: '#e9e6f0', edge: '#c8c1da', ink: '#463c66' },
  { bg: '#e6eef0', edge: '#bcd3d8', ink: '#265a63' },
]

const EMPTY_SLOT = {
  class_id: '', day: 'monday', period: '1', subject: '',
  teacher_id: '', start_time: '08:00', end_time: '08:45',
}

const RULES = {
  subject:    [required('Subject')],
  start_time: [required('Start time')],
  end_time:   [required('End time')],
}

export default function TimetablePage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canEdit = isAdmin(profile?.role)

  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [allSlots, setAllSlots] = useState<any[]>([])
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_SLOT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  useEffect(() => {
    supabase.from('classes').select('id, name, grade').order('grade')
      .then(({ data }) => setClasses(data ?? []))
    supabase.from('teachers').select('id, full_name').eq('status', 'active').order('full_name')
      .then(({ data }) => setTeachers(data ?? []))
    // Every slot school-wide, so we can spot a teacher double-booked.
    supabase.from('timetable').select('id, day, period, teacher_id, class_id, classes(name)')
      .then(({ data }) => setAllSlots(data ?? []))
  }, [supabase])

  const loadSlots = useCallback(async () => {
    if (!classId) { setSlots([]); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('timetable')
      .select('id, day, period, subject, start_time, end_time, teacher_id, teachers(full_name)')
      .eq('class_id', classId)
    if (error) toast.error(dbErrorMessage(error))
    setSlots(data ?? [])
    setLoading(false)
  }, [supabase, classId])

  useEffect(() => { loadSlots() }, [loadSlots])

  const tintFor = useMemo(() => {
    const subjects = Array.from(new Set(slots.map(s => s.subject).filter(Boolean))).sort()
    const map: Record<string, typeof TINTS[number]> = {}
    subjects.forEach((s, i) => { map[s] = TINTS[i % TINTS.length] })
    return map
  }, [slots])

  const slotAt = (day: string, period: number) =>
    slots.find(s => s.day === day && s.period === period)

  const openAdd = (day?: string, period?: number) => {
    setForm({
      ...EMPTY_SLOT,
      class_id: classId,
      day: day ?? 'monday',
      period: String(period ?? 1),
    })
    setErrors({})
    setShowModal(true)
  }

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  /** The teacher already teaching this day+period somewhere else. */
  const clash = useMemo(() => {
    if (!form.teacher_id) return null
    return allSlots.find(s =>
      s.teacher_id === form.teacher_id &&
      s.day === form.day &&
      String(s.period) === String(form.period) &&
      s.class_id !== classId)
  }, [allSlots, form.teacher_id, form.day, form.period, classId])

  async function save() {
    const errs = validate(form, RULES)
    if (!classId && !form.class_id) errs.class_id = 'Select a class first'
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      errs.end_time = 'End time must be after start time'
    }
    if (slotAt(form.day, Number(form.period))) {
      errs.period = 'That period is already filled for this class'
    }
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const payload = {
      ...toPayload(form, EMPTY_SLOT),
      class_id: classId || form.class_id,
      period: Number(form.period),
    }
    const { error } = await supabase.from('timetable').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Period added')
    setShowModal(false)
    loadSlots()
    supabase.from('timetable').select('id, day, period, teacher_id, class_id, classes(name)')
      .then(({ data }) => setAllSlots(data ?? []))
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('timetable').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Period removed')
    setDeleting(null)
    loadSlots()
  }

  const className = classes.find(c => c.id === classId)?.name ?? ''

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarDays}
        title="Timetable"
        subtitle={className ? `${className} — weekly schedule` : 'Period-wise weekly schedule'}
        actions={canEdit && classId && (
          <button onClick={() => openAdd()} className="btn btn-brass">
            <Plus className="h-4 w-4" /> Add period
          </button>
        )}
      />

      <Toolbar>
        <div className="sm:w-56">
          <label htmlFor="tt-class" className="label">Class</label>
          <select id="tt-class" value={classId} onChange={e => setClassId(e.target.value)} className="input">
            <option value="">Select a class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {slots.length > 0 && (
          <p className="text-sm sm:ml-auto sm:self-end sm:pb-2" style={{ color: 'var(--ink-faint)' }}>
            {slots.length} period{slots.length === 1 ? '' : 's'} scheduled
          </p>
        )}
      </Toolbar>

      {!classId ? (
        <div className="panel p-4">
          <EmptyState icon={Clock} title="Select a class" hint="Choose a class to see its weekly grid." />
        </div>
      ) : loading ? (
        <div className="panel p-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 760 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, var(--navy-lift), var(--navy-deep))' }}>
                  <th className="w-16 px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-[.08em] text-white/50">
                    Period
                  </th>
                  {DAYS.map(d => (
                    <th key={d} className="px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-[.08em] text-white">
                      {d.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: 'var(--surface)' }}>
                {PERIODS.map(p => (
                  <tr key={p} style={{ borderTop: '1px solid var(--edge)' }}>
                    <td className="px-3 py-2">
                      <div
                        className="mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
                        style={{
                          background: 'linear-gradient(180deg, var(--navy-lift), var(--navy-deep))',
                          boxShadow: '0 2px 0 var(--navy-deep), inset 0 1px 0 rgba(255,255,255,.2)',
                        }}
                      >
                        {p}
                      </div>
                    </td>
                    {DAYS.map(d => {
                      const slot = slotAt(d, p)
                      const tint = slot ? tintFor[slot.subject] ?? TINTS[0] : null
                      return (
                        <td key={d} className="px-1.5 py-1.5 align-top">
                          {slot ? (
                            <div
                              className="group relative rounded-[var(--radius-sm)] p-2.5"
                              style={{
                                background: tint!.bg,
                                border: `1px solid ${tint!.edge}`,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7), 0 1px 2px rgba(22,32,46,.06)',
                              }}
                            >
                              <p className="text-xs font-bold" style={{ color: tint!.ink }}>{slot.subject}</p>
                              {slot.teachers?.full_name && (
                                <p className="mt-0.5 truncate text-[11px]" style={{ color: tint!.ink, opacity: .7 }}>
                                  {slot.teachers.full_name}
                                </p>
                              )}
                              <p className="mt-0.5 text-[10px] tabular-nums" style={{ color: 'var(--ink-faint)' }}>
                                {String(slot.start_time).slice(0, 5)}–{String(slot.end_time).slice(0, 5)}
                              </p>
                              {canEdit && (
                                <button
                                  onClick={() => setDeleting(slot)}
                                  aria-label={`Remove ${slot.subject} on ${d} period ${p}`}
                                  className="absolute right-1 top-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                                >
                                  <Trash2 className="h-3 w-3" style={{ color: '#b8443c' }} />
                                </button>
                              )}
                            </div>
                          ) : canEdit ? (
                            <button
                              onClick={() => openAdd(d, p)}
                              aria-label={`Add period ${p} on ${d}`}
                              className="grid h-[68px] w-full place-items-center rounded-[var(--radius-sm)] text-lg transition-colors"
                              style={{ border: '1px dashed var(--edge-strong)', color: 'var(--edge-strong)' }}
                            >
                              +
                            </button>
                          ) : (
                            <div className="h-[68px]" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add period ────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add a period"
        subtitle={className}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Add period'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="day" className="label">Day</label>
            <select id="day" value={form.day} onChange={e => set('day', e.target.value)} className="input capitalize">
              {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="period" className="label">Period</label>
            <select
              id="period" value={form.period} onChange={e => set('period', e.target.value)}
              className={`input ${errors.period ? 'input-error' : ''}`}
            >
              {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
            </select>
            {errors.period && <p className="field-error">{errors.period}</p>}
          </div>

          <div className="col-span-2">
            <label htmlFor="subject" className="label">Subject</label>
            <input
              id="subject" value={form.subject} onChange={e => set('subject', e.target.value)}
              className={`input ${errors.subject ? 'input-error' : ''}`} placeholder="Mathematics"
            />
            {errors.subject && <p className="field-error">{errors.subject}</p>}
          </div>

          <div className="col-span-2">
            <label htmlFor="teacher_id" className="label">Teacher</label>
            <select id="teacher_id" value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)} className="input">
              <option value="">Not assigned</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
            {clash && (
              <div
                className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2"
                style={{ background: '#f6dedc', border: '1px solid #e0b4b0' }}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#94322b' }} />
                <p className="text-xs" style={{ color: '#94322b' }}>
                  This teacher already has period {form.period} on {form.day} with{' '}
                  <strong>{clash.classes?.name}</strong>. Saving will double-book them.
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="start_time" className="label">Start time</label>
            <input
              id="start_time" type="time" value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
              className={`input ${errors.start_time ? 'input-error' : ''}`}
            />
            {errors.start_time && <p className="field-error">{errors.start_time}</p>}
          </div>
          <div>
            <label htmlFor="end_time" className="label">End time</label>
            <input
              id="end_time" type="time" value={form.end_time}
              onChange={e => set('end_time', e.target.value)}
              className={`input ${errors.end_time ? 'input-error' : ''}`}
            />
            {errors.end_time && <p className="field-error">{errors.end_time}</p>}
          </div>
        </div>
      </Modal>

      {/* ── Delete ────────────────────────────────────── */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove period"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Remove</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Remove <strong>{deleting?.subject}</strong> from period {deleting?.period} on {deleting?.day}?
        </p>
      </Modal>
    </div>
  )
}
