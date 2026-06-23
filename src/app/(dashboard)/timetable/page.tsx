'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Clock, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

const SUBJECT_PALETTES = [
  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   sub: 'text-blue-500' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', sub: 'text-purple-400' },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',sub: 'text-emerald-500' },
  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  sub: 'text-amber-500' },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-800',   sub: 'text-rose-400' },
  { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-800',   sub: 'text-cyan-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', sub: 'text-orange-500' },
  { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-800',   sub: 'text-teal-500' },
]

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

  // Build stable color index per subject name
  const subjectColorIdx: Record<string, number> = {}
  let ci = 0
  const uniqueSubjects = Array.from(new Set(slots.map(s => s.subject).filter(Boolean)))
  uniqueSubjects.forEach(subj => { subjectColorIdx[subj] = ci++ % SUBJECT_PALETTES.length })

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
    const { error } = await supabase.from('timetable')
      .insert({ ...slotForm, class_id: selectedClass || slotForm.class_id })
    if (error) { toast.error('Save failed'); return }
    toast.success('Period added'); setShowModal(false); loadSlots()
  }

  function getSlot(day: string, period: number) {
    return slots.find(s => s.day === day && s.period === period)
  }

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name ?? ''

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center shadow-lg">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Timetable</h2>
            <p className="text-sm text-gray-500">Period-wise weekly schedule</p>
          </div>
        </div>
        <button
          onClick={() => { setSlotForm({ ...emptySlot, class_id: selectedClass }); setShowModal(true) }}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md">
          <Plus className="w-4 h-4" /> Add Period
        </button>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          className="input w-52 rounded-xl border-gray-200 font-medium">
          <option value="">Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedClassName && (
          <span className="text-sm font-semibold text-[#1e3a5f] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
            {selectedClassName} — Weekly Schedule
          </span>
        )}
      </div>

      {/* Grid */}
      {!selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">Select a class to view timetable</p>
          <p className="text-gray-300 text-sm mt-1">Choose a class to see the weekly period schedule</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-2 mb-2">
              {Array.from({ length: 7 }).map((_, j) => <div key={j} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              <thead>
                <tr className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e]">
                  <th className="px-3 py-3.5 text-left text-xs font-bold text-blue-200 w-16">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="px-3 py-3.5 text-left text-xs font-bold text-white capitalize">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PERIODS.map(p => (
                  <tr key={p} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center text-white text-xs font-bold mx-auto shadow-sm">
                        {p}
                      </div>
                    </td>
                    {DAYS.map(d => {
                      const slot = getSlot(d, p)
                      const palette = slot ? SUBJECT_PALETTES[subjectColorIdx[slot.subject] ?? 0] : null
                      return (
                        <td key={d} className="px-2 py-2">
                          {slot ? (
                            <div className={`${palette!.bg} border ${palette!.border} rounded-xl p-2.5 transition-all hover:shadow-sm`}>
                              <p className={`font-bold text-xs ${palette!.text}`}>{slot.subject}</p>
                              {slot.teacher_name && (
                                <p className={`${palette!.sub} text-xs mt-0.5 truncate`}>{slot.teacher_name}</p>
                              )}
                              <p className="text-gray-400 text-xs mt-0.5">{slot.start_time}–{slot.end_time}</p>
                            </div>
                          ) : (
                            <div className="h-16 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center group-hover:border-gray-200 transition-colors">
                              <span className="text-gray-200 text-xl leading-none">+</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] p-6">
              <h3 className="font-bold text-white text-lg">Add Period</h3>
              <p className="text-blue-200 text-sm mt-0.5">Schedule a new class period</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Day</label>
                <select value={slotForm.day} onChange={e => setSlotForm(p => ({ ...p, day: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full capitalize">
                  {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Period #</label>
                <select value={slotForm.period} onChange={e => setSlotForm(p => ({ ...p, period: Number(e.target.value) }))}
                  className="input rounded-xl border-gray-200 w-full">
                  {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Subject</label>
                <input value={slotForm.subject}
                  onChange={e => setSlotForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Mathematics"
                  className="input rounded-xl border-gray-200 w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Teacher</label>
                <select value={slotForm.teacher_id}
                  onChange={e => setSlotForm(p => ({ ...p, teacher_id: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full">
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Start Time</label>
                <input type="time" value={slotForm.start_time}
                  onChange={e => setSlotForm(p => ({ ...p, start_time: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">End Time</label>
                <input type="time" value={slotForm.end_time}
                  onChange={e => setSlotForm(p => ({ ...p, end_time: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full" />
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3 border-t border-gray-50 pt-4">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveSlot}
                className="btn-gradient px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md">
                Add Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
