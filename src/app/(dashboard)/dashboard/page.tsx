'use client'

import { useEffect, useState } from 'react'
import { Users, GraduationCap, ClipboardCheck, CreditCard, TrendingUp, ArrowUpRight, Megaphone } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const PIE_COLORS = ['#1e3a5f', '#f59e0b', '#ef4444']

const MOCK_NOTICES = [
  { id: '1', title: 'Annual Day Celebration',  content: 'Annual day will be held on 15th July 2024 at 5:00 PM in the school auditorium. All students must be present.', priority: 'high',   created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', title: 'Parent-Teacher Meeting',  content: 'PTM for Classes VI–X scheduled for 28th June 2024. All parents are requested to attend.', priority: 'medium', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '3', title: 'Sports Day Preparations', content: 'Inter-house sports day on 5th July. Practice sessions begin Monday at 8 AM sharp.',             priority: 'low',    created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
]

export default function DashboardPage() {
  const [stats,   setStats]   = useState({ students: 234, teachers: 18, attendance: 92, fees: 485000 })
  const [notices, setNotices] = useState<any[]>(MOCK_NOTICES)
  const [loading]             = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
        const supabase = createClientComponentClient()
        const [studentsRes, teachersRes, noticesRes] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
        ])
        if (!studentsRes.error && studentsRes.count !== null) setStats(s => ({ ...s, students: studentsRes.count! }))
        if (!teachersRes.error && teachersRes.count !== null) setStats(s => ({ ...s, teachers: teachersRes.count! }))
        if (!noticesRes.error && noticesRes.data?.length) setNotices(noticesRes.data)
      } catch {
        // Supabase not configured — showing demo data
      }
    }
    load()
  }, [])

  const statCards = [
    {
      label: 'Total Students',
      value: stats.students,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-700',
      trend: '+12 this term',
    },
    {
      label: 'Total Teachers',
      value: stats.teachers,
      icon: GraduationCap,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      gradient: 'from-amber-400 to-orange-500',
      trend: '+2 this year',
    },
    {
      label: "Today's Attendance",
      value: `${stats.attendance}%`,
      icon: ClipboardCheck,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      gradient: 'from-emerald-400 to-teal-500',
      trend: '+3% vs last week',
    },
    {
      label: 'Fees Collected',
      value: formatCurrency(stats.fees),
      icon: CreditCard,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      gradient: 'from-purple-500 to-violet-600',
      trend: '68% of annual target',
    },
  ]

  const attendanceData = [
    { day: 'Mon', present: 92, absent: 8 },
    { day: 'Tue', present: 88, absent: 12 },
    { day: 'Wed', present: 95, absent: 5 },
    { day: 'Thu', present: 90, absent: 10 },
    { day: 'Fri', present: 87, absent: 13 },
  ]

  const feeData = [
    { name: 'Paid',    value: 68 },
    { name: 'Pending', value: 22 },
    { name: 'Overdue', value: 10 },
  ]

  const priorityCfg: Record<string, { pill: string; bar: string; dot: string }> = {
    urgent: { pill: 'bg-red-100 text-red-700',    bar: 'border-l-red-500',    dot: 'bg-red-500' },
    high:   { pill: 'bg-orange-100 text-orange-700', bar: 'border-l-orange-400', dot: 'bg-orange-500' },
    medium: { pill: 'bg-blue-100 text-blue-700',  bar: 'border-l-blue-400',   dot: 'bg-blue-500' },
    low:    { pill: 'bg-gray-100 text-gray-600',  bar: 'border-l-gray-300',   dot: 'bg-gray-400' },
  }

  const tooltipStyle = {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 10px 40px rgba(0,0,0,0.10)',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Geethanjali Vidya Nilayam — Overview</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Academic Year</p>
          <p className="text-sm font-semibold text-gray-700">2024–25</p>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card card-3d overflow-hidden">
            {/* Gradient top accent */}
            <div className={`h-1 w-full bg-gradient-to-r ${card.gradient}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading
                  ? <span className="animate-pulse inline-block bg-gray-200 rounded h-7 w-16" />
                  : card.value
                }
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Attendance bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-navy-700 to-blue-500 inline-block" />
              Weekly Attendance
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(30,58,95,0.05)', radius: 8 } as any}
              />
              <Bar dataKey="present" fill="#1e3a5f" radius={[6, 6, 0, 0]} name="Present" />
              <Bar dataKey="absent"  fill="#f59e0b" radius={[6, 6, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-[#1e3a5f]" />
              <span className="text-xs text-gray-500">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-[#f59e0b]" />
              <span className="text-xs text-gray-500">Absent</span>
            </div>
          </div>
        </div>

        {/* Fee donut chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Fee Collection</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">68% Done</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={feeData}
                cx="50%" cy="50%"
                innerRadius={42}
                outerRadius={65}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {feeData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {feeData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%`, backgroundColor: PIE_COLORS[i] }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 w-7 text-right">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Recent Notices ───────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#1e3a5f]" />
            Recent Notices
          </h3>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">View all</button>
        </div>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No notices yet</p>
        ) : (
          <div className="space-y-2">
            {notices.map(n => {
              const p   = n.priority || 'low'
              const cfg = priorityCfg[p] || priorityCfg.low
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 border-l-4 bg-gray-50/50 hover:bg-gray-50 transition-colors ${cfg.bar}`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${cfg.pill}`}>{p}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
