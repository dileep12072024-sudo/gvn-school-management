'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Teacher } from '@/types'
import toast from 'react-hot-toast'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const supabase = createClientComponentClient()

  const emptyForm = { employee_id:'', full_name:'', email:'', phone:'', qualification:'', joining_date:'', subject_specialization:[] as string[], status:'active' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    setLoading(true)
    const { data } = await supabase.from('teachers').select('*').order('full_name')
    setTeachers(data ?? [])
    setLoading(false)
  }

  async function handleSave() {
    if (editing) {
      const { error } = await supabase.from('teachers').update(form).eq('id', editing.id)
      if (error) { toast.error('Update failed'); return }
      toast.success('Teacher updated')
    } else {
      const { error } = await supabase.from('teachers').insert(form)
      if (error) { toast.error('Add failed'); return }
      toast.success('Teacher added')
    }
    setShowModal(false); fetchTeachers()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this teacher?')) return
    await supabase.from('teachers').delete().eq('id', id)
    toast.success('Deleted'); fetchTeachers()
  }

  const filtered = teachers.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Teachers</h2>
          <p className="text-sm text-gray-500">{teachers.filter(t => t.status === 'active').length} active staff members</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true) }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers..." className="input pl-9 max-w-sm" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Employee ID','Name','Qualification','Subjects','Phone','Joined','Status','Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({length:4}).map((_,i)=>(
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No teachers found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-[#1e3a5f]">{t.employee_id}</td>
                  <td className="table-cell font-semibold">{t.full_name}</td>
                  <td className="table-cell">{t.qualification}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(t.subject_specialization ?? []).map(s => (
                        <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">{t.phone}</td>
                  <td className="table-cell">{formatDate(t.joining_date)}</td>
                  <td className="table-cell">
                    <span className={`badge ${t.status==='active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(t); setForm(t as any); setShowModal(true) }}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(t.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">{editing ? 'Edit Teacher' : 'Add Teacher'}</h3></div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[{l:'Employee ID',k:'employee_id'},{l:'Full Name',k:'full_name'},{l:'Email',k:'email',t:'email'},{l:'Phone',k:'phone'},{l:'Qualification',k:'qualification'},{l:'Joining Date',k:'joining_date',t:'date'}].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.l}</label>
                  <input type={f.t??'text'} value={(form as any)[f.k]??''}
                    onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} className="input" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Subjects (comma separated)</label>
                <input value={form.subject_specialization.join(', ')}
                  onChange={e=>setForm(p=>({...p,subject_specialization:e.target.value.split(',').map(s=>s.trim())}))} className="input" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={()=>setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
