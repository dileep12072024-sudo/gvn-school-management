'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Plus, FileText, Trash2, ClipboardList, Save, Award, TrendingUp, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import {
  formatDate, toPayload, validate, dbErrorMessage, required, positive,
} from '@/lib/utils'
import { gradeFor, percentage, isPass } from '@/lib/grading'
import {
  PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Toolbar,
} from '@/components/ui'

const EMPTY_EXAM = {
  name: '',
  class_id: '',
  subject: '',
  exam_date: '',
  max_marks: '100',
  passing_marks: '35',
}

const EXAM_RULES = {
  name:          [required('Exam name')],
  class_id:      [required('Class')],
  subject:       [required('Subject')],
  exam_date:     [required('Exam date')],
  max_marks:     [required('Max marks'), positive('Max marks')],
  passing_marks: [required('Passing marks')],
}

export default function ExamsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [exams, setExams] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showExam, setShowExam] = useState(false)
  const [examForm, setExamForm] = useState<Record<string, any>>(EMPTY_EXAM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  // Marks entry
  const [marksExam, setMarksExam] = useState<any | null>(null)
  const [roster, setRoster] = useState<any[]>([])
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [savedMarks, setSavedMarks] = useState<Record<string, string>>({})
  const [loadingRoster, setLoadingRoster] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('id, name, grade').order('grade')
      .then(({ data }) => setClasses(data ?? []))
  }, [supabase])

  const fetchExams = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exams')
      .select('id, name, subject, exam_date, max_marks, passing_marks, class_id, classes(name)')
      .order('exam_date', { ascending: false })
    if (error) toast.error(dbErrorMessage(error))
    setExams(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchExams() }, [fetchExams])

  const setExamField = (k: string, v: any) => {
    setExamForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function saveExam() {
    const errs = validate(examForm, EXAM_RULES)
    if (Number(examForm.passing_marks) > Number(examForm.max_marks)) {
      errs.passing_marks = 'Passing marks cannot exceed max marks'
    }
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const payload = {
      ...toPayload(examForm, EMPTY_EXAM),
      max_marks: Number(examForm.max_marks),
      passing_marks: Number(examForm.passing_marks),
    }
    const { error } = await supabase.from('exams').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Exam scheduled')
    setShowExam(false)
    setExamForm(EMPTY_EXAM)
    fetchExams()
  }

  async function deleteExam() {
    if (!deleting) return
    const { error } = await supabase.from('exams').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Exam deleted')
    setDeleting(null)
    fetchExams()
  }

  /** Load the whole class at once — marks are entered per class, not per pupil. */
  async function openMarks(exam: any) {
    setMarksExam(exam)
    setLoadingRoster(true)

    const [{ data: studs }, { data: res }] = await Promise.all([
      supabase.from('students').select('id, full_name, admission_number')
        .eq('class_id', exam.class_id).eq('status', 'active').order('full_name'),
      supabase.from('exam_results').select('student_id, marks_obtained').eq('exam_id', exam.id),
    ])

    const map: Record<string, string> = {}
    ;(res ?? []).forEach((r: any) => { map[r.student_id] = String(r.marks_obtained) })

    setRoster(studs ?? [])
    setMarks(map)
    setSavedMarks(map)
    setLoadingRoster(false)
  }

  async function saveMarks() {
    if (!marksExam) return
    const max = Number(marksExam.max_marks)

    const entered = roster.filter(s => marks[s.id] !== undefined && marks[s.id] !== '')
    if (!entered.length) { toast.error('Enter at least one mark'); return }

    const invalid = entered.find(s => {
      const v = Number(marks[s.id])
      return !Number.isFinite(v) || v < 0 || v > max
    })
    if (invalid) { toast.error(`${invalid.full_name}: marks must be between 0 and ${max}`); return }

    setSaving(true)
    const rows = entered.map(s => ({
      exam_id: marksExam.id,
      student_id: s.id,
      marks_obtained: Number(marks[s.id]),
      grade: gradeFor(Number(marks[s.id]), max),
    }))

    const { error } = await supabase.from('exam_results')
      .upsert(rows, { onConflict: 'exam_id,student_id' })
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    setSavedMarks({ ...marks })
    toast.success(`Saved ${rows.length} result${rows.length === 1 ? '' : 's'}`)
  }

  const marksDirty = roster.some(s => (marks[s.id] ?? '') !== (savedMarks[s.id] ?? ''))

  const filtered = exams.filter(e => {
    const q = search.trim().toLowerCase()
    return !q || e.name.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
  })

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date()).length
  const subjects = new Set(exams.map(e => e.subject)).size

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileText}
        title="Exams & results"
        subtitle={`${exams.length} exam${exams.length === 1 ? '' : 's'} scheduled`}
        actions={
          <button onClick={() => { setExamForm(EMPTY_EXAM); setErrors({}); setShowExam(true) }} className="btn btn-brass">
            <Plus className="h-4 w-4" /> Schedule exam
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total exams" value={exams.length} icon={FileText} tone="navy" />
        <StatCard label="Upcoming" value={upcoming} icon={TrendingUp} tone="brass" />
        <StatCard label="Subjects" value={subjects} icon={Award} tone="green" />
      </div>

      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search exams by name or subject…" aria-label="Search exams"
          />
        </div>
      </Toolbar>

      <TableShell columns={['Exam', 'Class', 'Subject', 'Date', 'Max', 'Pass', 'Actions']}>
        {loading ? (
          <SkeletonRows cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No exams scheduled" hint="Schedule an exam to start recording marks." colSpan={7} />
        ) : filtered.map(e => (
          <tr key={e.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
            <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>{e.name}</td>
            <td className="table-cell">{e.classes?.name ?? '—'}</td>
            <td className="table-cell">
              <span className="badge" style={{ background: 'var(--paper-deep)', color: 'var(--navy)' }}>{e.subject}</span>
            </td>
            <td className="table-cell">{formatDate(e.exam_date)}</td>
            <td className="table-cell tabular-nums">{e.max_marks}</td>
            <td className="table-cell tabular-nums">{e.passing_marks}</td>
            <td className="table-cell">
              <div className="flex items-center gap-1.5">
                <button onClick={() => openMarks(e)} className="btn btn-ghost btn-sm">
                  <ClipboardList className="h-3.5 w-3.5" /> Enter marks
                </button>
                <button onClick={() => setDeleting(e)} className="btn btn-ghost btn-icon" aria-label={`Delete ${e.name}`}>
                  <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <div className="panel-flat flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Need a consolidated report card across every subject?
        </p>
        <Link href="/report-card" className="btn btn-ghost btn-sm">
          <Award className="h-3.5 w-3.5" /> Generate report cards
        </Link>
      </div>

      {/* ── Schedule exam ─────────────────────────────── */}
      <Modal
        open={showExam}
        onClose={() => setShowExam(false)}
        title="Schedule an exam"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowExam(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveExam} disabled={saving}>
              {saving ? 'Saving…' : 'Schedule'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="label">Exam name</label>
            <input
              id="name" value={examForm.name} onChange={e => setExamField('name', e.target.value)}
              className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Half-Yearly Examination"
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="class_id" className="label">Class</label>
            <select
              id="class_id" value={examForm.class_id} onChange={e => setExamField('class_id', e.target.value)}
              className={`input ${errors.class_id ? 'input-error' : ''}`}
            >
              <option value="">Select…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.class_id && <p className="field-error">{errors.class_id}</p>}
          </div>

          <div>
            <label htmlFor="subject" className="label">Subject</label>
            <input
              id="subject" value={examForm.subject} onChange={e => setExamField('subject', e.target.value)}
              className={`input ${errors.subject ? 'input-error' : ''}`} placeholder="Mathematics"
            />
            {errors.subject && <p className="field-error">{errors.subject}</p>}
          </div>

          <div>
            <label htmlFor="exam_date" className="label">Date</label>
            <input
              id="exam_date" type="date" value={examForm.exam_date}
              onChange={e => setExamField('exam_date', e.target.value)}
              className={`input ${errors.exam_date ? 'input-error' : ''}`}
            />
            {errors.exam_date && <p className="field-error">{errors.exam_date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="max_marks" className="label">Max marks</label>
              <input
                id="max_marks" type="number" min="1" value={examForm.max_marks}
                onChange={e => setExamField('max_marks', e.target.value)}
                className={`input ${errors.max_marks ? 'input-error' : ''}`}
              />
              {errors.max_marks && <p className="field-error">{errors.max_marks}</p>}
            </div>
            <div>
              <label htmlFor="passing_marks" className="label">Pass marks</label>
              <input
                id="passing_marks" type="number" min="0" value={examForm.passing_marks}
                onChange={e => setExamField('passing_marks', e.target.value)}
                className={`input ${errors.passing_marks ? 'input-error' : ''}`}
              />
              {errors.passing_marks && <p className="field-error">{errors.passing_marks}</p>}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Bulk marks entry ──────────────────────────── */}
      <Modal
        open={!!marksExam}
        onClose={() => setMarksExam(null)}
        title={marksExam ? `${marksExam.name} — ${marksExam.subject}` : ''}
        subtitle={marksExam ? `${marksExam.classes?.name} · max ${marksExam.max_marks} · pass ${marksExam.passing_marks}` : ''}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setMarksExam(null)}>Close</button>
            <button className="btn btn-primary" onClick={saveMarks} disabled={saving || !marksDirty}>
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : marksDirty ? 'Save marks' : 'Saved'}
            </button>
          </>
        }
      >
        {loadingRoster ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
        ) : roster.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No active students in this class" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Student', 'Adm. No.', 'Marks', 'Grade', 'Result'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map(s => {
                const raw = marks[s.id] ?? ''
                const n = Number(raw)
                const max = Number(marksExam?.max_marks ?? 100)
                const valid = raw !== '' && Number.isFinite(n) && n >= 0 && n <= max
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--edge)' }}>
                    <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>{s.full_name}</td>
                    <td className="table-cell font-mono text-xs">{s.admission_number}</td>
                    <td className="table-cell">
                      <input
                        type="number" min="0" max={max} value={raw}
                        onChange={e => setMarks(p => ({ ...p, [s.id]: e.target.value }))}
                        aria-label={`Marks for ${s.full_name}`}
                        className={`input w-24 py-1.5 text-center tabular-nums ${raw !== '' && !valid ? 'input-error' : ''}`}
                      />
                    </td>
                    <td className="table-cell">
                      {valid
                        ? <span className="badge" style={{ background: 'var(--paper-deep)', color: 'var(--navy)' }}>
                            {gradeFor(n, max)} · {Math.round(percentage(n, max))}%
                          </span>
                        : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                    </td>
                    <td className="table-cell">
                      {valid && (
                        <span
                          className="badge"
                          style={isPass(n, Number(marksExam?.passing_marks ?? 0))
                            ? { background: '#dcece3', color: '#1f5c42' }
                            : { background: '#f6dedc', color: '#94322b' }}
                        >
                          {isPass(n, Number(marksExam?.passing_marks ?? 0)) ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Modal>

      {/* ── Delete exam ───────────────────────────────── */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete exam"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteExam}>Delete</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Deleting <strong>{deleting?.name}</strong> also removes every result recorded against it.
          This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
