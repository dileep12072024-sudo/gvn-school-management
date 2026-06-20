'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TimetablePage() {
  const [slots, setSlots] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClientComponentClient()

  const emptySlot = { class_id: '', day: 'monday', period: 1, subject: '', teacher_id: '', start_time: '08:00', end_time: '08:45' }
  const [slotForm, setSlotForm] = useState(emptySlot)

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data ?? []))
    supabase.from('teachers').select('id, full_name').eq('status', 'active').then(({ data }) => setTeachers(data ?? []))
  }, [])

  useEffect(() => { if (selectedClass) loadSlots() }, [selectedClass])

  async function loadSlots() {
    setLoading(true)
    const { data } = await supabase.from('timetable').select('*, teachers(full_name)')
      .eq('class_id', selectedClass)
    setSlots((data ?? []).map((s: any) => ({ ...s, teacher_name: s.teachers?.full_name })))
    setLoading(false)
  }

  async function saveSlot() {
    const { error } = await supabase.from('timetable').insert({ ...slotForm, class_id: selectedClass || slotForm.class_id })
    if (error) { toast.error('Save failed'); return }
    toast.success('Period added'); setShowModal(false); loadSlots()
  }

  function getSlot(day: string, period: number) {
    return slots.find(s => s.day === day && s.period === period)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Timetable</h2>
          <p className="text-sm text-gray-500">Period-wise weekly schedule</p>
        </div>
        <button onClick={() => { setSlotForm({ ...emptySlot, class_id: selectedClass }); setShowModal(true) }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Period
        </button>
      </div>

      <div className="card p-4">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input w-48">
          <option value="">Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClass ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header w-16">Period</th>
                {DAYS.map(d => <th key={d} className="table-header capitalize">{d}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERIODS.map(p => (
                <tr key={p}>
                  <td className="table-cell font-bold text-center text-[#1e3a5f]">{p}</td>
                  {DAYS.map(d => {
                    const slot = getSlot(d, p)
                    return (
                      <td key={d} className="table-cell">
                        {slot ? (
                          <div className="bg-[#1e3a5f]/5 rounded-lg p-2">
                            <p className="font-semibold text-[#1e3a5f] text-xs">{slot.subject}</p>
                            <p className="text-gray-400 text-xs">{slot.teacher_name}</p>
                            <p className="text-gray-400 text-xs">{slot.start_time}–{slot.end_time}</p>
                          </div>
                        ) : (
                          <div className="h-14 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Select a class to view timetable</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Add Period</h3></div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                <select value={slotForm.day} onChange={e => setSlotForm(p => ({ ...p, day: e.target.value }))} className="input">
                  {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Period #</label>
                <select value={slotForm.period} onChange={e => setSlotForm(p => ({ ...p, period: Number(e.target.value) }))} className="input">
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <input value={slotForm.subject} onChange={e => setSlotForm(p => ({ ...p, subject: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
                <select value={slotForm.teacher_id} onChange={e => setSlotForm(p => ({ ...p, teacher_id: e.target.value }))} className="input">
                  <option value="">Select</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                <input type="time" value={slotForm.start_time} onChange={e => setSlotForm(p => ({ ...p, start_time: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                <input type="time" value={slotForm.end_time} onChange={e => setSlotForm(p => ({ ...p, end_time: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveSlot} className="btn-primary">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
