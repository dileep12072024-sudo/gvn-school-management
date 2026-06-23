'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Search, Edit, Trash2, Users, GraduationCap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Student } from '@/types'
import toast from 'react-hot-toast'

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-amber-700',
  'from-pink-500 to-rose-700',
  'from-cyan-500 to-cyan-700',
]

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const supabase = createClientComponentClient()

  const emptyForm = {
    admission_number: '', full_name: '', date_of_birth: '',
    gender: 'male', class_id: '', section_id: '', address: '', phone: '', admission_date: ''
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchStudents()
    supabase.from('classes').select('*').then(({ data }) => setClasses(data ?? []))
  }, [])

  async function fetchStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*, classes(name), sections(name)')
      .order('full_name')
    setStudents((data ?? []).map((s: any) => ({ ...s, class_name: s.classes?.name, section_name: s.sections?.name })))
    setLoading(false)
  }

  async function handleSave() {
    if (editing) {
      const { error } = await supabase.from('students').update(form).eq('id', editing.id)
      if (error) { toast.error('Update failed'); return }
      toast.success('Student updated')
    } else {
      const { error } = await supabase.from('students').insert(form)
      if (error) { toast.error('Add failed'); return }
      toast.success('Student added')
    }
    setShowModal(false); setEditing(null); fetchStudents()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this student?')) return
    await supabase.from('students').delete().eq('id', id)
    toast.success('Deleted'); fetchStudents()
  }

  const filtered = students.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusConfig: Record<string, string> = {
    active:      'bg-emerald-100 text-emerald-700 border border-emerald-200',
    inactive:    'bg-gray-100 text-gray-600 border border-gray-200',
    transferred: 'bg-orange-100 text-orange-700 border border-orange-200',
  }

  const activeCount   = students.filter(s => s.status === 'active').length
  const inactiveCount = students.filter(s => s.status !== 'active').length

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Students</h2>
            <p className="text-sm text-gray-500">{students.length} students enrolled</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true) }}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: students.length, gradient: 'from-[#1e3a5f] to-[#2d5a8e]', Icon: Users },
          { label: 'Active',         value: activeCount,     gradient: 'from-emerald-500 to-teal-500', Icon: GraduationCap },
          { label: 'Inactive / Transferred', value: inactiveCount, gradient: 'from-gray-400 to-slate-500', Icon: Users },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
              <s.Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or admission number..."
            className="input pl-9 rounded-xl border-gray-200 w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input w-auto rounded-xl border-gray-200">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                {['Adm. No.', 'Name', 'Class/Section', 'DOB', 'Status', 'Phone', 'Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium text-sm">No students found</p>
                  </td>
                </tr>
              ) : filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="table-cell font-mono text-sm text-[#1e3a5f] font-semibold">{s.admission_number}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {s.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-600">{s.class_name} {s.section_name}</td>
                  <td className="table-cell text-gray-500">{formatDate(s.date_of_birth)}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      statusConfig[s.status ?? 'inactive'] ?? 'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">{s.phone ?? '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(s); setForm(s); setShowModal(true) }}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] p-6">
              <h3 className="font-bold text-white text-lg">{editing ? 'Edit Student' : 'Add New Student'}</h3>
              <p className="text-blue-200 text-sm mt-0.5">{editing ? 'Update student information' : 'Fill in student details below'}</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {([
                { label: 'Admission No.', key: 'admission_number', type: 'text' },
                { label: 'Full Name',     key: 'full_name',         type: 'text' },
                { label: 'Date of Birth', key: 'date_of_birth',     type: 'date' },
                { label: 'Phone',         key: 'phone',             type: 'text' },
                { label: 'Admission Date',key: 'admission_date',    type: 'date' },
                { label: 'Address',       key: 'address',           type: 'text', full: true },
              ] as { label: string; key: string; type: string; full?: boolean }[]).map(f => (
                <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input rounded-xl border-gray-200 w-full" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Gender</label>
                <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Class</label>
                <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full">
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3 border-t border-gray-50 pt-4">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                className="btn-gradient px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md">
                {editing ? 'Save Changes' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
