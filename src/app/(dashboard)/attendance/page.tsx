'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { ClipboardCheck, Check, X, Clock, Minus, Save, CircleSlash } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { dbErrorMessage } from '@/lib/utils'
import { PageHeader, StatCard, EmptyState, TableShell, SkeletonRows, Toolbar } from '@/components/ui'

const STATUSES = [
  { value: 'present',  label: 'P', title: 'Present',   Icon: Check, bg: '#2f7d5b', chip: { bg: '#dcece3', fg: '#1f5c42' } },
  { value: 'absent',   label: 'A', title: 'Absent',    Icon: X,     bg: '#b8443c', chip: { bg: '#f6dedc', fg: '#94322b' } },
  { value: 'late',     label: 'L', title: 'Late',      Icon: Clock, bg: '#b8873b', chip: { bg: '#f5e6cd', fg: '#8a6224' } },
  { value: 'half_day', label: 'H', title: 'Half day',  Icon: Minus, bg: '#8494a8', chip: { bg: '#e4e8ee', fg: '#4b5a70' } },
] as const

const TODAY = () => format(new Date(), 'yyyy-MM-dd')

export default function AttendancePage() {
  const supabase = useMemo(() => createClient(), [])

  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [date, setDate] = useState(TODAY)
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('id, name, grade').order('grade')
      .then(({ data }) => setClasses(data ?? []))
  }, [supabase])

  const load = useCallback(async () => {
    if (!classId) { setStudents([]); setMarks({}); setSaved({}); return }
    setLoading(true)

    const { data: studs, error } = await supabase
      .from('students')
      .select('id, full_name, admission_number')
      .eq('class_id', classId).eq('status', 'active').order('full_name')

    if (error) { toast.error(dbErrorMessage(error)); setLoading(false); return }

    const list = studs ?? []
    setStudents(list)

    const map: Record<string, string> = {}
    if (list.length) {
      const { data: att } = await supabase
        .from('attendance').select('student_id, status')
        .eq('date', date).in('student_id', list.map(s => s.id))
      ;(att ?? []).forEach((a: any) => { map[a.student_id] = a.status })
    }
    setMarks(map)
    setSaved(map)
    setLoading(false)
  }, [supabase, classId, date])

  useEffect(() => { load() }, [load])

  // Warn before losing unsaved marks.
  const dirty = useMemo(
    () => students.some(s => (marks[s.id] ?? '') !== (saved[s.id] ?? '')),
    [students, marks, saved],
  )
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const markAll = (status: string) =>
    setMarks(Object.fromEntries(students.map(s => [s.id, status])))

  async function save() {
    const marked = students.filter(s => marks[s.id])
    if (!marked.length) { toast.error('Mark at least one student'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const records = marked.map(s => ({
      student_id: s.id, date, status: marks[s.id], marked_by: user?.id ?? null,
    }))

    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    setSaved({ ...marks })
    toast.success(`Saved ${marked.length} record${marked.length === 1 ? '' : 's'} for ${format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')}`)
  }

  const count = (v: string) => students.filter(s => marks[s.id] === v).length
  const unmarked = students.filter(s => !marks[s.id]).length

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardCheck}
        title="Attendance"
        subtitle="Daily register"
        actions={students.length > 0 && (
          <button onClick={save} disabled={saving || !dirty} className="btn btn-brass">
            {saving
              ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
              : <><Save className="h-4 w-4" /> {dirty ? 'Save register' : 'Saved'}</>}
          </button>
        )}
      />

      <Toolbar>
        <div className="sm:w-48">
          <label htmlFor="att-date" className="label">Date</label>
          <input
            id="att-date" type="date" value={date} max={TODAY()}
            onChange={e => setDate(e.target.value)} className="input"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="att-class" className="label">Class</label>
          <select id="att-class" value={classId} onChange={e => setClassId(e.target.value)} className="input">
            <option value="">Select a class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {students.length > 0 && (
          <div className="flex gap-2 sm:ml-auto sm:self-end">
            <button onClick={() => markAll('present')} className="btn btn-ghost btn-sm">
              <Check className="h-3.5 w-3.5" style={{ color: '#2f7d5b' }} /> All present
            </button>
            <button onClick={() => markAll('absent')} className="btn btn-ghost btn-sm">
              <X className="h-3.5 w-3.5" style={{ color: '#b8443c' }} /> All absent
            </button>
          </div>
        )}
      </Toolbar>

      {students.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Present"  value={count('present')}  icon={Check} tone="green" />
          <StatCard label="Absent"   value={count('absent')}   icon={X} tone="red" />
          <StatCard label="Late"     value={count('late')}     icon={Clock} tone="brass" />
          <StatCard label="Unmarked" value={unmarked}          icon={CircleSlash} tone="slate" />
        </div>
      )}

      {!classId ? (
        <div className="panel p-4">
          <EmptyState
            icon={ClipboardCheck}
            title="Select a class to begin"
            hint="Pick a class and date above to load the register."
          />
        </div>
      ) : (
        <TableShell columns={['#', 'Student', 'Adm. No.', 'Mark', 'Status']}>
          {loading ? (
            <SkeletonRows cols={5} rows={6} />
          ) : students.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No active students in this class" colSpan={5} />
          ) : students.map((s, i) => {
            const current = marks[s.id]
            const chip = STATUSES.find(o => o.value === current)
            return (
              <tr key={s.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
                <td className="table-cell text-center text-xs tabular-nums" style={{ color: 'var(--ink-faint)' }}>{i + 1}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: 'linear-gradient(180deg, var(--navy-lift), var(--navy-deep))' }}
                    >
                      {s.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>{s.full_name}</span>
                  </div>
                </td>
                <td className="table-cell font-mono text-xs">{s.admission_number}</td>
                <td className="table-cell">
                  <div role="radiogroup" aria-label={`Attendance for ${s.full_name}`} className="flex gap-1.5">
                    {STATUSES.map(opt => {
                      const on = current === opt.value
                      return (
                        <button
                          key={opt.value}
                          role="radio"
                          aria-checked={on}
                          title={opt.title}
                          onClick={() => setMarks(p => ({ ...p, [s.id]: opt.value }))}
                          className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-xs font-bold transition-all duration-150"
                          style={on ? {
                            background: opt.bg,
                            color: '#fff',
                            boxShadow: `0 2px 0 rgba(0,0,0,.25), 0 3px 8px ${opt.bg}55, inset 0 1px 0 rgba(255,255,255,.3)`,
                            transform: 'translateY(-1px)',
                          } : {
                            background: 'var(--surface-sunk)',
                            color: 'var(--ink-faint)',
                            border: '1px solid var(--edge-strong)',
                            boxShadow: 'var(--sunk)',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </td>
                <td className="table-cell">
                  {chip
                    ? <span className="badge" style={{ background: chip.chip.bg, color: chip.chip.fg }}>{chip.title}</span>
                    : <span className="text-xs italic" style={{ color: 'var(--ink-faint)' }}>not marked</span>}
                </td>
              </tr>
            )
          })}
        </TableShell>
      )}
    </div>
  )
}
