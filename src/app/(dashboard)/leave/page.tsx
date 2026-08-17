'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Calendar, Check, X, Clock, Info } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { formatDate, toPayload, validate, dbErrorMessage, required, after } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/nav'
import {
  PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Toolbar,
} from '@/components/ui'

const EMPTY_FORM = { leave_type: 'sick', from_date: '', to_date: '', reason: '' }

const RULES = {
  from_date: [required('From date')],
  to_date:   [required('To date'), after('from_date', 'To date')],
  reason:    [required('Reason')],
}

const STATUS: Record<string, { bg: string; fg: string }> = {
  pending:  { bg: '#f5e6cd', fg: '#8a6224' },
  approved: { bg: '#dcece3', fg: '#1f5c42' },
  rejected: { bg: '#f6dedc', fg: '#94322b' },
}

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'other']

export default function LeavePage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canApprove = isAdmin(profile?.role)

  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  /** The teachers row for the signed-in user, if they have one. */
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [teacherResolved, setTeacherResolved] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState<{ row: any; status: 'approved' | 'rejected' } | null>(null)

  useEffect(() => {
    if (!profile) return
    // maybeSingle, not single — an administrator has no teachers row and that
    // is not an error.
    supabase.from('teachers').select('id').eq('profile_id', profile.id).maybeSingle()
      .then(({ data }) => { setTeacherId(data?.id ?? null); setTeacherResolved(true) })
  }, [supabase, profile])

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leave_requests')
      .select('id, leave_type, from_date, to_date, reason, status, teacher_id, teachers(full_name)')
      .order('created_at', { ascending: false })
    if (error) toast.error(dbErrorMessage(error))
    setLeaves(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function submitLeave() {
    if (!teacherId) {
      toast.error('Only staff with a teacher record can apply for leave')
      return
    }
    const errs = validate(form, RULES)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const { error } = await supabase.from('leave_requests').insert({
      ...toPayload(form, EMPTY_FORM),
      teacher_id: teacherId,
      status: 'pending',
    })
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Leave request submitted')
    setShowModal(false)
    setForm(EMPTY_FORM)
    fetchLeaves()
  }

  async function applyDecision() {
    if (!acting) return
    const { error } = await supabase.from('leave_requests')
      .update({ status: acting.status, approved_by: profile?.id ?? null })
      .eq('id', acting.row.id)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(`Leave ${acting.status}`)
    setActing(null)
    fetchLeaves()
  }

  const filtered = leaves.filter(l => statusFilter === 'all' || l.status === statusFilter)
  const countOf = (s: string) => leaves.filter(l => l.status === s).length
  const dayCount = (l: any) => differenceInCalendarDays(new Date(l.to_date), new Date(l.from_date)) + 1

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Calendar}
        title="Leave"
        subtitle="Staff leave requests and approvals"
        actions={
          <button
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true) }}
            className="btn btn-brass"
            disabled={teacherResolved && !teacherId}
            title={teacherResolved && !teacherId ? 'Only staff with a teacher record can apply' : undefined}
          >
            <Plus className="h-4 w-4" /> Apply for leave
          </button>
        }
      />

      {teacherResolved && !teacherId && (
        <div className="panel-flat flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--brass)' }} />
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Your account is not linked to a teacher record, so you can review requests but not submit one.
            Link it from <strong>Teachers</strong> if you also teach.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending"  value={countOf('pending')}  icon={Clock} tone="brass" />
        <StatCard label="Approved" value={countOf('approved')} icon={Check} tone="green" />
        <StatCard label="Rejected" value={countOf('rejected')} icon={X} tone="red" />
      </div>

      <Toolbar>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input sm:w-44" aria-label="Filter by status"
        >
          <option value="all">All requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <p className="text-sm sm:ml-auto" style={{ color: 'var(--ink-faint)' }}>
          {filtered.length} request{filtered.length === 1 ? '' : 's'}
        </p>
      </Toolbar>

      <TableShell columns={['Teacher', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', canApprove ? 'Decision' : '']}>
        {loading ? (
          <SkeletonRows cols={8} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Calendar} title="No leave requests" hint="Submitted requests appear here." colSpan={8} />
        ) : filtered.map(l => {
          const tone = STATUS[l.status] ?? STATUS.pending
          return (
            <tr key={l.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>
                {l.teachers?.full_name ?? '—'}
              </td>
              <td className="table-cell capitalize">{l.leave_type}</td>
              <td className="table-cell">{formatDate(l.from_date)}</td>
              <td className="table-cell">{formatDate(l.to_date)}</td>
              <td className="table-cell font-bold tabular-nums">{dayCount(l)}</td>
              <td className="table-cell max-w-xs truncate" title={l.reason}>{l.reason}</td>
              <td className="table-cell">
                <span className="badge" style={{ background: tone.bg, color: tone.fg }}>{l.status}</span>
              </td>
              <td className="table-cell">
                {canApprove && l.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setActing({ row: l, status: 'approved' })}
                      className="btn btn-ghost btn-icon" aria-label="Approve leave"
                    >
                      <Check className="h-3.5 w-3.5" style={{ color: '#2f7d5b' }} />
                    </button>
                    <button
                      onClick={() => setActing({ row: l, status: 'rejected' })}
                      className="btn btn-ghost btn-icon" aria-label="Reject leave"
                    >
                      <X className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )
        })}
      </TableShell>

      {/* ── Apply ─────────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Apply for leave"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitLeave} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="leave_type" className="label">Leave type</label>
            <select id="leave_type" value={form.leave_type} onChange={e => set('leave_type', e.target.value)} className="input capitalize">
              {LEAVE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="from_date" className="label">From</label>
              <input
                id="from_date" type="date" value={form.from_date}
                onChange={e => set('from_date', e.target.value)}
                className={`input ${errors.from_date ? 'input-error' : ''}`}
              />
              {errors.from_date && <p className="field-error">{errors.from_date}</p>}
            </div>
            <div>
              <label htmlFor="to_date" className="label">To</label>
              <input
                id="to_date" type="date" value={form.to_date}
                onChange={e => set('to_date', e.target.value)}
                className={`input ${errors.to_date ? 'input-error' : ''}`}
              />
              {errors.to_date && <p className="field-error">{errors.to_date}</p>}
            </div>
          </div>

          {form.from_date && form.to_date && !errors.to_date && (
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
              {differenceInCalendarDays(new Date(form.to_date), new Date(form.from_date)) + 1} day(s) of leave.
            </p>
          )}

          <div>
            <label htmlFor="reason" className="label">Reason</label>
            <textarea
              id="reason" rows={4} value={form.reason}
              onChange={e => set('reason', e.target.value)}
              className={`input resize-none ${errors.reason ? 'input-error' : ''}`}
            />
            {errors.reason && <p className="field-error">{errors.reason}</p>}
          </div>
        </div>
      </Modal>

      {/* ── Approve / reject ──────────────────────────── */}
      <Modal
        open={!!acting}
        onClose={() => setActing(null)}
        title={acting?.status === 'approved' ? 'Approve leave' : 'Reject leave'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setActing(null)}>Cancel</button>
            <button
              className={acting?.status === 'approved' ? 'btn btn-primary' : 'btn btn-danger'}
              onClick={applyDecision}
            >
              {acting?.status === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          {acting?.status === 'approved' ? 'Approve' : 'Reject'}{' '}
          <strong>{acting?.row.teachers?.full_name}</strong>’s {acting?.row.leave_type} leave
          from {acting && formatDate(acting.row.from_date)} to {acting && formatDate(acting.row.to_date)}?
        </p>
        {acting && (
          <p className="mt-3 text-sm italic" style={{ color: 'var(--ink-faint)' }}>“{acting.row.reason}”</p>
        )}
      </Modal>
    </div>
  )
}
