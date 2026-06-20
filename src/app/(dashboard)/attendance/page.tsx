'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ClipboardCheck, ChevronLeft, ChevronRight, Check, X, Clock, Minus } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { getAttendanceColor } from '@/lib/utils'
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
    else toast.success(`Attendance saved for ${selectedDate}`)
    setSaving(false)
  }

  const STATUS_OPTIONS = [
    { value: 'present', icon: Check, color: 'text-green-600 hover:bg-green-50' },
    { value: 'absent', icon: X, color: 'text-red-600 hover:bg-red-50' },
    { value: 'late', icon: Clock, color: 'text-yellow-600 hover:bg-yellow-50' },
    { value: 'half_day', icon: Minus, color: 'text-orange-600 hover:bg-orange-50' },
  ]

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
        <p className="text-sm text-gray-500">Daily attendance marking</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="input w-44" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input w-44">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {students.length > 0 && (
          <>
            <div className="flex gap-2 mt-4">
              <button onClick={() => markAll('present')} className="btn-secondary text-xs px-3 py-1.5 text-green-700 border-green-200">Mark All Present</button>
              <button onClick={() => markAll('absent')} className="btn-secondary text-xs px-3 py-1.5 text-red-600 border-red-200">Mark All Absent</button>
            </div>
            <div className="ml-auto flex gap-4 text-sm mt-4">
              <span className="text-green-600 font-semibold">Present: {presentCount}</span>
              <span className="text-red-600 font-semibold">Absent: {absentCount}</span>
              <span className="text-gray-500">Total: {students.length}</span>
            </div>
          </>
        )}
      </div>

      {!selectedClass ? (
        <div className="card p-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Select a class to mark attendance</p>
        </div>
      ) : loading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Student</th>
                <th className="table-header">Adm. No.</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell font-medium">{s.full_name}</td>
                  <td className="table-cell text-gray-500">{s.admission_number}</td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt.value}
                          onClick={() => setAttendance(p => ({ ...p, [s.id]: opt.value }))}
                          className={`p-1.5 rounded-lg transition-colors ${
                            attendance[s.id] === opt.value
                              ? 'bg-[#1e3a5f] text-white'
                              : `bg-gray-50 ${opt.color}`
                          }`}>
                          <opt.icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                      {attendance[s.id] && (
                        <span className={`badge ml-1 self-center ${getAttendanceColor(attendance[s.id])}`}>
                          {attendance[s.id]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <button onClick={saveAttendance} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
