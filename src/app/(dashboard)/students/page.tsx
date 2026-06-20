'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Search, Filter, Edit, Trash2, Eye, UserCheck } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import type { Student } from '@/types'
import toast from 'react-hot-toast'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const supabase = createClientComponentClient()

  const [form, setForm] = useState({
    admission_number: '', full_name: '', date_of_birth: '',
    gender: 'male', class_id: '', section_id: '', address: '', phone: '', admission_date: ''
  })

  useEffect(() => { fetchStudents() }, [])

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
    setShowModal(false); setEditing(null)
    fetchStudents()
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

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    transferred: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">{students.length} students enrolled</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ admission_number:'',full_name:'',date_of_birth:'',gender:'male',class_id:'',section_id:'',address:'',phone:'',admission_date:'' }); setShowModal(true) }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or admission number..."
            className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Adm. No.','Name','Class/Section','DOB','Status','Phone','Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-medium text-[#1e3a5f]">{s.admission_number}</td>
                  <td className="table-cell font-medium">{s.full_name}</td>
                  <td className="table-cell">{s.class_name} {s.section_name}</td>
                  <td className="table-cell">{formatDate(s.date_of_birth)}</td>
                  <td className="table-cell">
                    <span className={`badge ${statusColors[s.status]}`}>{s.status}</span>
                  </td>
                  <td className="table-cell">{s.phone ?? '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(s); setForm(s as any); setShowModal(true) }}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Student' : 'Add Student'}</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[{label:'Admission No.',key:'admission_number'},{label:'Full Name',key:'full_name'},{label:'Date of Birth',key:'date_of_birth',type:'date'},{label:'Phone',key:'phone'},{label:'Admission Date',key:'admission_date',type:'date'},{label:'Address',key:'address'}].map(f => (
                <div key={f.key} className={f.key === 'address' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type ?? 'text'} value={(form as any)[f.key] ?? ''}
                    onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    className="input" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))} className="input">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
