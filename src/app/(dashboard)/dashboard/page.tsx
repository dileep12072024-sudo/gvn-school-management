'use client'

import { useEffect, useState } from 'react'
import { Users, GraduationCap, ClipboardCheck, CreditCard, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#1e3a5f', '#f59e0b', '#10b981', '#ef4444']

const MOCK_NOTICES = [
  { id: '1', title: 'Annual Day Celebration', content: 'Annual day will be held on 15th July 2024 at 5:00 PM in the school auditorium.', priority: 'high', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', title: 'Parent-Teacher Meeting', content: 'PTM for Classes VI\u2013X scheduled for 28th June 2024. All parents are requested to attend.', priority: 'medium', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '3', title: 'Sports Day Preparations', content: 'Inter-house sports day on 5th July. Practice sessions begin Monday at 8 AM sharp.', priority: 'low', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({ students: 234, teachers: 18, attendance: 92, fees: 485000 })
  const [notices, setNotices] = useState<any[]>(MOCK_NOTICES)
  const [loading] = useState(false)

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
        if (!noticesRes.error && noticesRes.data && noticesRes.data.length > 0) setNotices(noticesRes.data)
      } catch {
        // Supabase not configured — showing demo data
      }
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Total Teachers', value: stats.teachers, icon: GraduationCap, color: 'bg-[#fff8e7] text-[#b45309]', border: 'border-[#fde68a]' },
    { label: "Today's Attendance", value: `${stats.attendance}%`, icon: ClipboardCheck, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { label: 'Fees Collected', value: formatCurrency(stats.fees), icon: CreditCard, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
  ]

  const attendanceData = [
    { day: 'Mon', present: 92, absent: 8 },
    { day: 'Tue', present: 88, absent: 12 },
    { day: 'Wed', present: 95, absent: 5 },
    { day: 'Thu', present: 90, absent: 10 },
    { day: 'Fri', present: 87, absent: 13 },
  ]

  const feeData = [
    { name: 'Paid', value: 68 },
    { name: 'Pending', value: 22 },
    { name: 'Overdue', value: 10 },
  ]

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Geethanjali Vidya Nilayam \u2014 Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`card p-5 border ${card.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? <span className="animate-pulse bg-gray-200 rounded h-7 w-16 block" /> : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1e3a5f]" /> Weekly Attendance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="present" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Fee Collection Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={feeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {feeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {feeData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Notices</h3>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No notices yet</p>
        ) : (
          <div className="space-y-2">
            {notices.map(n => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border ${priorityColors[n.priority] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs opacity-70 truncate">{n.content}</p>
                </div>
                <span className="text-xs opacity-60 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
