'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, BookOpen, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams')
  const [showModal, setShowModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const supabase = createClientComponentClient()

  const emptyExam = { name: '', class_id: '', subject: '', exam_date: '', max_marks: 100, passing_marks: 35 }
  const [examForm, setExamForm] = useState(emptyExam)
  const [resultForm, setResultForm] = useState({ student_id: '', marks_obtained: '', grade: '', remarks: '' })

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data ?? []))
    fetchExams()
  }, [])

  async function fetchExams() {
    setLoading(true)
    const { data } = await supabase.from('exams').select('*, classes(name)').order('exam_date', { ascending: false })
    setExams((data ?? []).map((e: any) => ({ ...e, class_name: e.classes?.name })))
    setLoading(false)
  }

  async function handleSaveExam() {
    const { error } = await supabase.from('exams').insert(examForm)
    if (error) { toast.error('Failed'); return }
    toast.success('Exam scheduled')
    setShowModal(false); setExamForm(emptyExam); fetchExams()
  }

  async function openResults(exam: any) {
    setSelectedExam(exam)
    const { data: studs } = await supabase.from('students').select('id, full_name').eq('class_id', exam.class_id).eq('status', 'active')
    setStudents(studs ?? [])
    const { data: res } = await supabase.from('exam_results').select('*, students(full_name)').eq('exam_id', exam.id)
    setResults((res ?? []).map((r: any) => ({ ...r, student_name: r.students?.full_name })))
    setShowResultModal(true)
  }

  async function saveResult() {
    const { error } = await supabase.from('exam_results').upsert(
      { ...resultForm, exam_id: selectedExam.id, marks_obtained: Number(resultForm.marks_obtained) },
      { onConflict: 'exam_id,student_id' }
    )
    if (error) { toast.error('Failed'); return }
    toast.success('Result saved')
    openResults(selectedExam)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Exams & Results</h2>
          <p className="text-sm text-gray-500">Manage exams and enter marks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Exam
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['exams', 'results'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'
            }`}>{tab}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>{['Exam Name', 'Class', 'Subject', 'Date', 'Max Marks', 'Pass Marks', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {exams.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="table-cell font-semibold">{e.name}</td>
                <td className="table-cell">{e.class_name}</td>
                <td className="table-cell">{e.subject}</td>
                <td className="table-cell">{formatDate(e.exam_date)}</td>
                <td className="table-cell">{e.max_marks}</td>
                <td className="table-cell">{e.passing_marks}</td>
                <td className="table-cell">
                  <button onClick={() => openResults(e)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">Enter Results</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Schedule Exam</h3></div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Exam Name</label>
                <input value={examForm.name} onChange={e => setExamForm(p => ({ ...p, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select value={examForm.class_id} onChange={e => setExamForm(p => ({ ...p, class_id: e.target.value }))} className="input">
                  <option value="">Select</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <input value={examForm.subject} onChange={e => setExamForm(p => ({ ...p, subject: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="date" value={examForm.exam_date} onChange={e => setExamForm(p => ({ ...p, exam_date: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Marks</label>
                <input type="number" value={examForm.max_marks} onChange={e => setExamForm(p => ({ ...p, max_marks: Number(e.target.value) }))} className="input" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveExam} className="btn-primary">Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultModal && selectedExam && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">{selectedExam.name} — Results</h3>
              <p className="text-sm text-gray-500">Max: {selectedExam.max_marks} | Pass: {selectedExam.passing_marks}</p>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="flex gap-3 mb-4">
                <select value={resultForm.student_id} onChange={e => setResultForm(p => ({ ...p, student_id: e.target.value }))} className="input flex-1">
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <input type="number" placeholder="Marks" value={resultForm.marks_obtained}
                  onChange={e => setResultForm(p => ({ ...p, marks_obtained: e.target.value }))} className="input w-24" />
                <input placeholder="Grade" value={resultForm.grade}
                  onChange={e => setResultForm(p => ({ ...p, grade: e.target.value }))} className="input w-20" />
                <button onClick={saveResult} className="btn-primary text-sm">Save</button>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['Student','Marks','Grade','Remarks'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {results.map(r => (
                    <tr key={r.id}>
                      <td className="table-cell">{r.student_name}</td>
                      <td className="table-cell font-bold">{r.marks_obtained}/{selectedExam.max_marks}</td>
                      <td className="table-cell"><span className="badge bg-blue-100 text-blue-700">{r.grade}</span></td>
                      <td className="table-cell text-gray-500">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setShowResultModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
