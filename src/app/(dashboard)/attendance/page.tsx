'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ClipboardCheck, Check, X, Clock, Minus, Save } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data ?? []))
  }, [])

  useEffect(() => {
    if (selectedClass) loadStudents()
  }, [selectedClass, selectedDate])

  async function loadStudents() {
    setLoading(true)
    const { data: studs } = await supabase
      .from('students').select('id, full_name, admission_number')
      .eq('class_id', selectedClass).eq('status', 'active').order('full_name')
    setStudents(studs ?? [])
    const ids = (studs ?? []).map((s: any) => s.id)
    if (ids.length) {
      const { data: att } = await supabase.from('attendance')
        .select('student_id, status').eq('date', selectedDate).in('student_id', ids)
      const map: Record<string, string> = {}
      ;(att ?? []).forEach((a: any) => { map[a.student_id] = a.status })
      setAttendance(map)
    }
    setLoading(false)
  }

  function markAll(status: string) {
    const map: Record<string, string> = {}
    students.forEach(s => { map[s.id] = status })
    setAttendance(map)
  }

  async function saveAttendance() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const records = students.map(s => ({
      student_id: s.id, date: selectedDate,
      status: attendance[s.id] ?? 'absent', marked_by: user?.id
    }))
    const { error } = await supabase.from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
    if (error) toast.error('Save failed')
    else toast.success(`Attendance saved for ${format(new Date(selectedDate + 'T00:00:00'), 'dd MMM yyyy')}`)
    setSaving(false)
  }

  const STATUS_OPTIONS = [
    { value: 'present', label: 'P', Icon: Check, activeBg: 'bg-emerald-500', activeRing: 'ring-emerald-400', badgeCls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    { value: 'absent',  label: 'A', Icon: X,     activeBg: 'bg-red-500',     activeRing: 'ring-red-400',     badgeCls: 'bg-red-100 text-red-700 border border-red-200' },
    { value: 'late',    label: 'L', Icon: Clock,  activeBg: 'bg-amber-500',   activeRing: 'ring-amber-400',   badgeCls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    { value: 'half_day',label: 'H', Icon: Minus,  activeBg: 'bg-orange-500',  activeRing: 'ring-orange-400',  badgeCls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  ]

  const presentCount  = Object.values(attendance).filter(v => v === 'present').length
  const absentCount   = Object.values(attendance).filter(v => v === 'absent').length
  const lateCount     = Object.values(attendance).filter(v => v === 'late').length
  const unmarkedCount = students.length - Object.keys(attendance).filter(k => students.some(s => s.id === k)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center shadow-lg">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
            <p className="text-sm text-gray-500">Daily attendance marking</p>
          </div>
        </div>
        {students.length > 0 && (
          <button onClick={saveAttendance} disabled={saving}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-70">
            {saving
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="input w-44 rounded-xl border-gray-200 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              className="input w-48 rounded-xl border-gray-200 text-sm font-medium">
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {students.length > 0 && (
            <div className="flex gap-2 ml-auto">
              <button onClick={() => markAll('present')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                <Check className="w-3.5 h-3.5" /> All Present
              </button>
              <button onClick={() => markAll('absent')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                <X className="w-3.5 h-3.5" /> All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Present',  count: presentCount,  colorText: 'text-emerald-700', colorBg: 'bg-emerald-50', bar: 'from-emerald-500 to-green-400' },
            { label: 'Absent',   count: absentCount,   colorText: 'text-red-700',     colorBg: 'bg-red-50',     bar: 'from-red-500 to-rose-400' },
            { label: 'Late',     count: lateCount,     colorText: 'text-amber-700',   colorBg: 'bg-amber-50',   bar: 'from-amber-500 to-yellow-400' },
            { label: 'Unmarked', count: unmarkedCount, colorText: 'text-gray-600',    colorBg: 'bg-gray-50',    bar: 'from-gray-400 to-slate-400' },
          ].map(s => (
            <div key={s.label} className={`${s.colorBg} rounded-2xl p-4 border border-white/80 shadow-sm`}>
              <div className={`text-2xl font-bold ${s.colorText}`}>{s.count}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
              <div className="mt-2 h-1 rounded-full bg-white/60">
                <div className={`h-full rounded-full bg-gradient-to-r ${s.bar} transition-all duration-500`}
                  style={{ width: students.length ? `${(s.count / students.length) * 100}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {!selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">Select a class to mark attendance</p>
          <p className="text-gray-300 text-sm mt-1">Choose a class and date above to get started</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="w-8 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="w-36 h-8 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <th className="table-header w-12">#</th>
                <th className="table-header">Student</th>
                <th className="table-header">Adm. No.</th>
                <th className="table-header">Mark Attendance</th>
                <th className="table-header w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => {
                const current = attendance[s.id]
                const currentOpt = STATUS_OPTIONS.find(o => o.value === current)
                return (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="table-cell text-gray-400 text-center text-sm">{i + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500 font-mono text-sm">{s.admission_number}</td>
                    <td className="table-cell">
                      <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value}
                            onClick={() => setAttendance(p => ({ ...p, [s.id]: opt.value }))}
                            title={opt.value}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                              current === opt.value
                                ? `${opt.activeBg} text-white shadow-md ring-2 ring-offset-1 ${opt.activeRing} scale-110`
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      {currentOpt ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${currentOpt.badgeCls}`}>
                          {current}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 italic">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
