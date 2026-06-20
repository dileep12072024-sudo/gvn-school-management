'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, BookOpen, Edit, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'classes' | 'sections'>('classes')
  const [showModal, setShowModal] = useState(false)
  const supabase = createClientComponentClient()

  const emptyClass = { name: '', grade: 1 }
  const emptySection = { class_id: '', name: '', teacher_id: '', capacity: 40 }
  const [classForm, setClassForm] = useState(emptyClass)
  const [sectionForm, setSectionForm] = useState(emptySection)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: cls }, { data: sec }, { data: teach }] = await Promise.all([
      supabase.from('classes').select('*').order('grade'),
      supabase.from('sections').select('*, classes(name), teachers(full_name)').order('name'),
      supabase.from('teachers').select('id, full_name').eq('status', 'active'),
    ])
    setClasses(cls ?? [])
    setSections((sec ?? []).map((s: any) => ({ ...s, class_name: s.classes?.name, teacher_name: s.teachers?.full_name })))
    setTeachers(teach ?? [])
  }

  async function saveClass() {
    const { error } = await supabase.from('classes').insert(classForm)
    if (error) { toast.error('Failed'); return }
    toast.success('Class added'); setShowModal(false); setClassForm(emptyClass); fetchAll()
  }

  async function saveSection() {
    const { error } = await supabase.from('sections').insert(sectionForm)
    if (error) { toast.error('Failed'); return }
    toast.success('Section added'); setShowModal(false); setSectionForm(emptySection); fetchAll()
  }

  async function deleteClass(id: string) {
    if (!confirm('Delete this class?')) return
    await supabase.from('classes').delete().eq('id', id)
    toast.success('Deleted'); fetchAll()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Classes & Sections</h2>
          <p className="text-sm text-gray-500">{classes.length} classes, {sections.length} sections</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add {activeTab === 'classes' ? 'Class' : 'Section'}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['classes', 'sections'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'
            }`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'classes' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {classes.map(c => (
            <div key={c.id} className="card p-5 hover:border-[#1e3a5f]/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
                </div>
                <button onClick={() => deleteClass(c.id)} className="p-1 hover:bg-red-50 text-red-400 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-bold text-gray-900 text-lg">{c.name}</p>
              <p className="text-sm text-gray-500">Grade {c.grade}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3 h-3" />
                {sections.filter(s => s.class_id === c.id).length} sections
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-4 card p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No classes added yet</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['Class', 'Section', 'Class Teacher', 'Capacity'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {sections.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell font-semibold text-[#1e3a5f]">{s.class_name}</td>
                  <td className="table-cell font-medium">{s.name}</td>
                  <td className="table-cell">{s.teacher_name ?? <span className="text-gray-400">Not assigned</span>}</td>
                  <td className="table-cell">{s.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">Add {activeTab === 'classes' ? 'Class' : 'Section'}</h3>
            </div>
            {activeTab === 'classes' ? (
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class Name</label>
                  <input value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="e.g. Class 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                  <input type="number" min={1} max={12} value={classForm.grade} onChange={e => setClassForm(p => ({ ...p, grade: Number(e.target.value) }))} className="input" />
                </div>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                  <select value={sectionForm.class_id} onChange={e => setSectionForm(p => ({ ...p, class_id: e.target.value }))} className="input">
                    <option value="">Select</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section Name</label>
                  <input value={sectionForm.name} onChange={e => setSectionForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="A, B, C..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class Teacher</label>
                  <select value={sectionForm.teacher_id} onChange={e => setSectionForm(p => ({ ...p, teacher_id: e.target.value }))} className="input">
                    <option value="">Select</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                  <input type="number" value={sectionForm.capacity} onChange={e => setSectionForm(p => ({ ...p, capacity: Number(e.target.value) }))} className="input" />
                </div>
              </div>
            )}
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={activeTab === 'classes' ? saveClass : saveSection} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
