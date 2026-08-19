'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, GraduationCap, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { formatDate, dbErrorMessage } from '@/lib/utils'
import { gradeFor, gradePoint, cgpa, percentage, isPass } from '@/lib/grading'
import { useAuth } from '@/context/AuthContext'
import { isStaff, landingFor } from '@/lib/nav'
import { EmptyState } from '@/components/ui'

/** Subject rows collapsed from every result the student has. */
function buildRows(results: any[]) {
  return results
    .map(r => {
      const max = Number(r.exams?.max_marks ?? 100)
      const marks = Number(r.marks_obtained)
      return {
        id: r.id,
        exam: r.exams?.name ?? '—',
        subject: r.exams?.subject ?? '—',
        date: r.exams?.exam_date ?? null,
        marks,
        max,
        passing: Number(r.exams?.passing_marks ?? 35),
        pct: percentage(marks, max),
        grade: r.grade || gradeFor(marks, max),
        point: gradePoint(marks, max),
      }
    })
    .sort((a, b) => a.subject.localeCompare(b.subject))
}

function ReportCard() {
  const params = useSearchParams()
  const router = useRouter()
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const staff = isStaff(profile?.role)

  const studentParam = params.get('student') ?? ''

  const [options, setOptions] = useState<any[]>([])
  const [studentId, setStudentId] = useState(studentParam)
  const [student, setStudent] = useState<any | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Staff pick any student; a parent/student only ever sees their own — RLS
  // filters this list either way, the query is the same.
  useEffect(() => {
    supabase.from('students')
      .select('id, full_name, admission_number')
      .eq('status', 'active')
      .order('full_name')
      .then(({ data }) => {
        const list = data ?? []
        setOptions(list)
        if (!studentParam && list.length) setStudentId(list[0].id)
        if (!list.length) setLoading(false)
      })
  }, [supabase, studentParam])

  const load = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    const [s, r, a] = await Promise.all([
      supabase.from('students')
        .select('id, full_name, admission_number, date_of_birth, admission_date, classes(name, grade), sections(name)')
        .eq('id', studentId).single(),
      supabase.from('exam_results')
        .select('id, marks_obtained, grade, remarks, exams(name, subject, exam_date, max_marks, passing_marks)')
        .eq('student_id', studentId),
      supabase.from('attendance').select('status').eq('student_id', studentId),
    ])
    if (s.error) toast.error(dbErrorMessage(s.error))
    setStudent(s.data ?? null)
    setResults(r.data ?? [])
    setAttendance(a.data ?? [])
    setLoading(false)
  }, [supabase, studentId])

  useEffect(() => { load() }, [load])

  const rows = buildRows(results)
  const totalMarks = rows.reduce((s, r) => s + r.marks, 0)
  const totalMax = rows.reduce((s, r) => s + r.max, 0)
  const overallPct = totalMax ? Math.round((totalMarks / totalMax) * 100) : 0
  const overallCgpa = cgpa(rows.map(r => ({ marks: r.marks, max: r.max })))
  const failed = rows.filter(r => !isPass(r.marks, r.passing)).length

  const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length
  const attendancePct = attendance.length ? Math.round((presentDays / attendance.length) * 100) : 0

  if (loading) return <div className="panel p-8"><div className="skeleton h-64" /></div>

  if (!student) {
    return (
      <div className="panel p-6">
        <EmptyState icon={FileText} title="No student to report on" hint="Pick a student, or ask the office to link your account." />
        <div className="flex justify-center">
          <button onClick={() => router.push(landingFor(profile?.role))} className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => router.back()} className="btn btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {staff && options.length > 1 && (
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="input w-64"
              aria-label="Choose student"
            >
              {options.map(o => (
                <option key={o.id} value={o.id}>{o.full_name} — {o.admission_number}</option>
              ))}
            </select>
          )}
          <button onClick={() => window.print()} className="btn btn-accent">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* ── The sheet ─────────────────────────────────── */}
      <div className="print-sheet panel mx-auto max-w-3xl p-10" style={{ background: 'var(--surface)' }}>
        <div className="flex items-start justify-between gap-6 pb-5" style={{ borderBottom: '2px solid var(--primary)' }}>
          <div className="flex items-center gap-3.5">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius)] text-white"
              style={{ background: 'linear-gradient(180deg, var(--accent-lift), var(--accent-deep))' }}
            >
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1
                className="text-xl font-bold leading-tight"
                style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif), serif' }}
              >
                Geethanjali Vidya Nilayam
              </h1>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                Peddawaltair, Visakhapatnam, Andhra Pradesh
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[.14em]" style={{ color: 'var(--accent)' }}>
              Report Card
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: 'var(--ink)' }}>2024–25</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 py-6 sm:grid-cols-4">
          {[
            ['Student', student.full_name],
            ['Admission no.', student.admission_number],
            ['Class', `${student.classes?.name ?? '—'}${student.sections?.name ? ' · ' + student.sections.name : ''}`],
            ['Date of birth', student.date_of_birth ? formatDate(student.date_of_birth) : '—'],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-faint)' }}>{k}</dt>
              <dd className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--ink)' }}>{v}</dd>
            </div>
          ))}
        </dl>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-header">Subject</th>
              <th className="table-header">Exam</th>
              <th className="table-header text-right">Marks</th>
              <th className="table-header text-right">%</th>
              <th className="table-header text-right">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr style={{ borderTop: '1px solid var(--edge)' }}>
                <td className="table-cell" colSpan={5} style={{ color: 'var(--ink-faint)' }}>
                  No results recorded for this student yet.
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--edge)' }}>
                <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>{r.subject}</td>
                <td className="table-cell">{r.exam}</td>
                <td className="table-cell text-right tabular-nums">{r.marks} / {r.max}</td>
                <td className="table-cell text-right tabular-nums">{Math.round(r.pct)}%</td>
                <td
                  className="table-cell text-right font-bold"
                  style={{ color: isPass(r.marks, r.passing) ? 'var(--ink)' : 'var(--danger)' }}
                >
                  {r.grade}
                </td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr style={{ borderTop: '2px solid var(--primary)' }}>
                <td className="table-cell font-bold" colSpan={2} style={{ color: 'var(--ink)' }}>Total</td>
                <td className="table-cell text-right font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {totalMarks} / {totalMax}
                </td>
                <td className="table-cell text-right font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
                  {overallPct}%
                </td>
                <td className="table-cell text-right font-bold" style={{ color: 'var(--primary)' }}>
                  {totalMax ? gradeFor(totalMarks, totalMax) : '—'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['CGPA', overallCgpa.toFixed(1)],
            ['Attendance', `${attendancePct}%`],
            ['Subjects', String(rows.length)],
            ['Result', rows.length === 0 ? '—' : failed === 0 ? 'Pass' : `${failed} to reattempt`],
          ].map(([k, v]) => (
            <div key={k} className="plaque px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-faint)' }}>{k}</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: 'var(--primary)' }}>{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-end justify-between">
          <div className="text-center">
            <div className="mb-1 h-12 w-40" />
            <div style={{ borderTop: '1px solid var(--ink-faint)' }} />
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>Class teacher</p>
          </div>
          <div className="text-center">
            <div className="mb-1 h-12 w-40" />
            <div style={{ borderTop: '1px solid var(--ink-faint)' }} />
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>Principal</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportCardPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="panel p-8"><div className="skeleton h-64" /></div>}>
      <ReportCard />
    </Suspense>
  )
}
