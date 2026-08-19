'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, GraduationCap, ClipboardCheck, CreditCard, Megaphone,
  AlertTriangle, CalendarDays, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { format, subDays, isWeekend } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatDate, callingName } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { PageHeader, StatCard, EmptyState } from '@/components/ui'

const CHART = { navy: 'var(--primary)', brass: 'var(--accent)', red: 'var(--danger)', green: 'var(--success)', slate: 'var(--slate)' }

/** The last 5 working days, oldest first. */
function recentSchoolDays(n = 5): string[] {
  const days: string[] = []
  for (let i = 0; days.length < n && i < 14; i++) {
    const d = subDays(new Date(), i)
    if (!isWeekend(d)) days.unshift(format(d, 'yyyy-MM-dd'))
  }
  return days
}

interface Stats {
  students: number
  teachers: number
  attendancePct: number | null
  collected: number
  outstanding: number
  overdueCount: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [stats, setStats] = useState<Stats | null>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [week, setWeek] = useState<{ day: string; present: number; absent: number }[]>([])
  const [feeSplit, setFeeSplit] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const today = format(new Date(), 'yyyy-MM-dd')
    const days = recentSchoolDays()

    async function load() {
      const [
        studentsRes, teachersRes, todayAttRes, feesRes, noticesRes, eventsRes, weekAttRes,
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('attendance').select('status').eq('date', today),
        supabase.from('fees').select('amount, status'),
        supabase.from('notices').select('id, title, content, priority, created_at')
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('calendar_events').select('id, title, event_date, event_type')
          .gte('event_date', today).order('event_date').limit(5),
        supabase.from('attendance').select('date, status').in('date', days),
      ])

      if (cancelled) return

      const firstError = [studentsRes, teachersRes, todayAttRes, feesRes].find(r => r.error)?.error
      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      // Today's attendance rate
      const todayRows = todayAttRes.data ?? []
      const present = todayRows.filter((r: any) => r.status === 'present' || r.status === 'late').length
      const attendancePct = todayRows.length
        ? Math.round((present / todayRows.length) * 100)
        : null

      // Fees
      const fees = (feesRes.data ?? []) as { amount: number; status: string }[]
      const sum = (s: string) => fees.filter(f => f.status === s).reduce((a, f) => a + Number(f.amount || 0), 0)
      const paid = sum('paid'), pending = sum('pending'), overdue = sum('overdue')
      const total = paid + pending + overdue

      setStats({
        students: studentsRes.count ?? 0,
        teachers: teachersRes.count ?? 0,
        attendancePct,
        collected: paid,
        outstanding: pending + overdue,
        overdueCount: fees.filter(f => f.status === 'overdue').length,
      })

      setFeeSplit(total === 0 ? [] : [
        { name: 'Paid',    value: Math.round((paid / total) * 100),    color: CHART.green },
        { name: 'Pending', value: Math.round((pending / total) * 100), color: CHART.brass },
        { name: 'Overdue', value: Math.round((overdue / total) * 100), color: CHART.red },
      ])

      // Weekly attendance
      const byDay = new Map<string, { present: number; absent: number }>()
      days.forEach(d => byDay.set(d, { present: 0, absent: 0 }))
      ;((weekAttRes.data ?? []) as any[]).forEach(r => {
        const bucket = byDay.get(r.date)
        if (!bucket) return
        if (r.status === 'present' || r.status === 'late') bucket.present++
        else bucket.absent++
      })
      setWeek(days.map(d => ({
        day: format(new Date(d + 'T00:00:00'), 'EEE'),
        ...byDay.get(d)!,
      })))

      setNotices(noticesRes.data ?? [])
      setEvents(eventsRes.data ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [supabase])

  const tooltipStyle = {
    borderRadius: '10px',
    border: '1px solid var(--edge)',
    background: 'var(--surface)',
    boxShadow: '0 10px 24px rgba(22,32,46,.12)',
    fontSize: '12px',
  }

  const priorityTone: Record<string, string> = {
    urgent: CHART.red, high: CHART.brass, medium: CHART.navy, low: CHART.slate,
  }

  const firstName = callingName(profile?.full_name)

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardCheck}
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${firstName}`}
        subtitle={`Geethanjali Vidya Nilayam · ${formatDate(new Date(), 'EEEE, dd MMMM yyyy')}`}
        actions={
          <div className="plaque px-4 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-faint)' }}>Academic Year</p>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>2024–25</p>
          </div>
        }
      />

      {error && (
        <div className="panel-flat flex items-start gap-3 p-4" style={{ borderColor: 'var(--danger)' }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--danger)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Could not load dashboard data</p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-faint)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="stat-grid">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-5"><div className="skeleton h-12" /></div>
          ))
        ) : (
          <>
            <StatCard label="Active students" value={stats.students} icon={Users} tone="primary" />
            <StatCard label="Teaching staff"  value={stats.teachers} icon={GraduationCap} tone="accent" />
            <StatCard
              label="Attendance today"
              value={stats.attendancePct === null ? '—' : `${stats.attendancePct}%`}
              hint={stats.attendancePct === null ? 'Not marked yet' : undefined}
              icon={ClipboardCheck}
              tone={stats.attendancePct === null ? 'slate' : stats.attendancePct >= 85 ? 'green' : 'red'}
            />
            <StatCard
              label="Fees collected"
              value={formatCurrency(stats.collected)}
              hint={stats.outstanding > 0 ? `${formatCurrency(stats.outstanding)} outstanding` : 'All settled'}
              icon={CreditCard}
              tone={stats.overdueCount > 0 ? 'red' : 'green'}
            />
          </>
        )}
      </div>

      {/* ── Charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h3 className="mb-4 font-bold rule-brass" style={{ color: 'var(--ink)' }}>Attendance, last 5 school days</h3>
          {week.every(w => w.present + w.absent === 0) ? (
            <EmptyState icon={ClipboardCheck} title="No attendance recorded yet" hint="Mark a register to see the trend here." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={week} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-deep)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--ink-faint)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--ink-faint)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(30,58,95,.05)' }} />
                  <Bar dataKey="present" fill={CHART.navy}  radius={[5, 5, 0, 0]} name="Present" />
                  <Bar dataKey="absent"  fill={CHART.brass} radius={[5, 5, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center gap-5">
                {[['Present', CHART.navy], ['Absent', CHART.brass]].map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
                    <span className="h-2 w-3 rounded-sm" style={{ background: color }} /> {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="mb-4 font-bold rule-brass" style={{ color: 'var(--ink)' }}>Fee collection</h3>
          {feeSplit.length === 0 ? (
            <EmptyState icon={CreditCard} title="No fee records" hint="Raise a fee to see the split." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={feeSplit} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                       dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {feeSplit.map(s => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {feeSplit.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Notices + events ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold" style={{ color: 'var(--ink)' }}>
              <Megaphone className="h-4 w-4" style={{ color: 'var(--accent)' }} /> Recent notices
            </h3>
            <Link href="/notices" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary-lift)' }}>
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
          ) : notices.length === 0 ? (
            <EmptyState icon={Megaphone} title="No notices posted" hint="Notices published by the office appear here." />
          ) : (
            <div className="space-y-2">
              {notices.map(n => (
                <div
                  key={n.id}
                  className="plaque flex items-start gap-3 p-3.5"
                  style={{ borderLeft: `3px solid ${priorityTone[n.priority] ?? CHART.slate}` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{n.title}</p>
                      <span
                        className="badge shrink-0"
                        style={{ background: 'var(--paper-deep)', color: priorityTone[n.priority] ?? CHART.slate }}
                      >
                        {n.priority}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--ink-faint)' }}>{n.content}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs" style={{ color: 'var(--ink-faint)' }}>
                    {formatDate(n.created_at, 'dd MMM')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold" style={{ color: 'var(--ink)' }}>
              <CalendarDays className="h-4 w-4" style={{ color: 'var(--accent)' }} /> Coming up
            </h3>
            <Link href="/calendar" className="text-xs font-semibold" style={{ color: 'var(--primary-lift)' }}>Calendar</Link>
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
          ) : events.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nothing scheduled" hint="Upcoming events show here." />
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="plaque flex items-center gap-3 p-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-white"
                    style={{ background: 'linear-gradient(180deg, var(--primary-lift), var(--primary-deep))' }}
                  >
                    <span className="text-xs font-bold">{formatDate(e.event_date, 'dd')}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{e.title}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                      {formatDate(e.event_date, 'MMM yyyy')} · {e.event_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
