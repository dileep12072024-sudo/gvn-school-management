'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  GraduationCap, CalendarCheck, IndianRupee, Award, FileText, Receipt, Bus, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { formatDate, formatCurrency, dbErrorMessage, getInitials } from '@/lib/utils'
import { gradeFor, percentage } from '@/lib/grading'
import { useAuth } from '@/context/AuthContext'
import { PageHeader, StatCard, EmptyState, TableShell, SkeletonRows } from '@/components/ui'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function PortalPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [children, setChildren] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const [attendance, setAttendance] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [periods, setPeriods] = useState<any[]>([])
  const [transport, setTransport] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // RLS already restricts this to the caller's own children — the filter is
  // belt-and-braces so an admin visiting /portal doesn't pull the whole school.
  useEffect(() => {
    if (!profile) return
    supabase
      .from('students')
      .select('id, full_name, admission_number, photo_url, class_id, section_id, classes(name), sections(name)')
      .or(`parent_id.eq.${profile.id},profile_id.eq.${profile.id}`)
      .order('full_name')
      .then(({ data, error }) => {
        if (error) toast.error(dbErrorMessage(error))
        setChildren(data ?? [])
        setActiveId(data?.[0]?.id ?? '')
        setLoading(false)
      })
  }, [supabase, profile])

  const active = children.find(c => c.id === activeId)

  const loadDetail = useCallback(async () => {
    if (!active) return
    setDetailLoading(true)
    const [a, r, f, t, tr] = await Promise.all([
      supabase.from('attendance').select('date, status').eq('student_id', active.id).order('date', { ascending: false }),
      supabase.from('exam_results')
        .select('id, marks_obtained, grade, exams(name, subject, exam_date, max_marks)')
        .eq('student_id', active.id),
      supabase.from('fees').select('id, fee_type, amount, due_date, status, paid_date, receipt_number')
        .eq('student_id', active.id).order('due_date', { ascending: false }),
      active.class_id
        ? supabase.from('timetable')
            .select('day, period, subject, start_time, end_time, teachers(full_name)')
            .eq('class_id', active.class_id).order('period')
        : Promise.resolve({ data: [], error: null } as any),
      supabase.from('transport_allocations')
        .select('stop_name, transport_routes(route_name, route_number), transport_vehicles(vehicle_number)')
        .eq('student_id', active.id).maybeSingle(),
    ])
    const err = a.error ?? r.error ?? f.error ?? t.error
    if (err) toast.error(dbErrorMessage(err))
    setAttendance(a.data ?? [])
    setResults(r.data ?? [])
    setFees(f.data ?? [])
    setPeriods(t.data ?? [])
    setTransport(tr.data ?? null)
    setDetailLoading(false)
  }, [supabase, active])

  useEffect(() => { loadDetail() }, [loadDetail])

  const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length
  const attendancePct = attendance.length ? Math.round((present / attendance.length) * 100) : 0
  const dueTotal = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + Number(f.amount ?? 0), 0)

  const avgPct = results.length
    ? Math.round(
        results.reduce((s, r) => s + percentage(Number(r.marks_obtained), Number(r.exams?.max_marks ?? 100)), 0) /
          results.length,
      )
    : 0

  const today = DAYS[new Date().getDay()]
  const todayPeriods = periods.filter(p => p.day === today)

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader icon={GraduationCap} title="My child" subtitle="Attendance, results and fees" />
        <div className="panel p-5"><div className="skeleton h-32" /></div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader icon={GraduationCap} title="My child" subtitle="Attendance, results and fees" />
        <div className="panel p-4">
          <EmptyState
            icon={GraduationCap}
            title="No student linked to your account"
            hint="Ask the school office to link your login to your child's record."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader icon={GraduationCap} title="My child" subtitle="Attendance, results, fees and transport" />

      {/* ── Child picker ────────────────────────────────── */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              aria-pressed={c.id === activeId}
              className={`btn btn-sm ${c.id === activeId ? 'btn-primary' : 'btn-ghost'}`}
            >
              {c.full_name}
            </button>
          ))}
        </div>
      )}

      {/* ── Identity plate ──────────────────────────────── */}
      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius)] text-lg font-bold text-white"
          style={{
            background: 'linear-gradient(180deg, var(--accent-lift), var(--accent) 60%, var(--accent-deep))',
            boxShadow: '0 3px 0 var(--accent-deep), inset 0 1px 0 rgba(255,255,255,.3)',
          }}
        >
          {getInitials(active?.full_name ?? '')}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{active?.full_name}</p>
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
            {active?.admission_number} · {active?.classes?.name ?? 'Unassigned'}
            {active?.sections?.name ? ` — ${active.sections.name}` : ''}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/report-card?student=${active?.id}`} className="btn btn-accent btn-sm">
            <FileText className="h-3.5 w-3.5" /> Report card
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Attendance" value={`${attendancePct}%`} icon={CalendarCheck}
          tone={attendancePct >= 75 ? 'green' : 'red'}
          hint={`${present} of ${attendance.length} days`}
        />
        <StatCard label="Average score" value={`${avgPct}%`} icon={Award} tone="primary" hint={`${results.length} results`} />
        <StatCard
          label="Fees outstanding" value={formatCurrency(dueTotal)} icon={IndianRupee}
          tone={dueTotal > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Transport" value={transport?.transport_routes?.route_number ?? '—'} icon={Bus} tone="slate"
          hint={transport?.stop_name ?? 'Not allocated'}
        />
      </div>

      {/* ── Today's timetable ───────────────────────────── */}
      <section className="panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h3 className="font-bold capitalize" style={{ color: 'var(--ink)' }}>Today — {today}</h3>
        </div>
        {detailLoading ? (
          <div className="skeleton h-16" />
        ) : todayPeriods.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>No periods scheduled.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {todayPeriods.map(p => (
              <div key={`${p.day}-${p.period}`} className="plaque p-3">
                <p className="text-[11px] font-semibold" style={{ color: 'var(--accent-deep)' }}>Period {p.period}</p>
                <p className="truncate text-sm font-bold" style={{ color: 'var(--ink)' }}>{p.subject}</p>
                <p className="truncate text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                  {String(p.start_time).slice(0, 5)}–{String(p.end_time).slice(0, 5)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Results ─────────────────────────────────────── */}
      <TableShell columns={['Exam', 'Subject', 'Date', 'Marks', 'Grade']}>
        {detailLoading ? (
          <SkeletonRows cols={5} />
        ) : results.length === 0 ? (
          <EmptyState icon={Award} title="No results yet" hint="Marks appear here once exams are graded." colSpan={5} />
        ) : results
          .slice()
          .sort((a, b) => String(b.exams?.exam_date).localeCompare(String(a.exams?.exam_date)))
          .map(r => {
            const max = Number(r.exams?.max_marks ?? 100)
            const marks = Number(r.marks_obtained)
            return (
              <tr key={r.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
                <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>{r.exams?.name ?? '—'}</td>
                <td className="table-cell">{r.exams?.subject ?? '—'}</td>
                <td className="table-cell">{r.exams?.exam_date ? formatDate(r.exams.exam_date) : '—'}</td>
                <td className="table-cell tabular-nums">{marks} / {max}</td>
                <td className="table-cell">
                  <span className="badge" style={{ background: 'var(--tint-primary)', color: 'var(--primary)' }}>
                    {r.grade ?? gradeFor(marks, max)}
                  </span>
                </td>
              </tr>
            )
          })}
      </TableShell>

      {/* ── Fees ────────────────────────────────────────── */}
      <TableShell columns={['Fee', 'Amount', 'Due', 'Status', 'Receipt']}>
        {detailLoading ? (
          <SkeletonRows cols={5} />
        ) : fees.length === 0 ? (
          <EmptyState icon={IndianRupee} title="No fee records" hint="Invoices raised by the office appear here." colSpan={5} />
        ) : fees.map(f => (
          <tr key={f.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
            <td className="table-cell font-semibold capitalize" style={{ color: 'var(--ink)' }}>{f.fee_type}</td>
            <td className="table-cell tabular-nums">{formatCurrency(Number(f.amount))}</td>
            <td className="table-cell">{formatDate(f.due_date)}</td>
            <td className="table-cell">
              <span
                className="badge capitalize"
                style={f.status === 'paid'
                  ? { background: 'var(--tint-success)', color: 'var(--success-deep)' }
                  : f.status === 'overdue'
                    ? { background: 'var(--tint-danger)', color: 'var(--danger-deep)' }
                    : { background: 'var(--tint-accent)', color: 'var(--accent-deep)' }}
              >
                {f.status}
              </span>
            </td>
            <td className="table-cell">
              {f.status === 'paid' ? (
                <Link href={`/receipts/${f.id}`} className="btn btn-ghost btn-sm">
                  <Receipt className="h-3.5 w-3.5" /> Receipt
                </Link>
              ) : '—'}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  )
}
