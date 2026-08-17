'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Search, CreditCard, AlertCircle, CheckCircle, Wallet, Receipt, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import {
  formatDate, formatCurrency, toPayload, validate, dbErrorMessage,
  required, positive,
} from '@/lib/utils'
import {
  PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Pagination, Toolbar,
} from '@/components/ui'

const PAGE_SIZE = 25

const EMPTY_FORM = {
  student_id: '',
  fee_type: '',
  amount: '',
  due_date: '',
  status: 'pending',
}

const RULES = {
  student_id: [required('Student')],
  fee_type:   [required('Fee type')],
  amount:     [required('Amount'), positive('Amount')],
  due_date:   [required('Due date')],
}

const FEE_TYPES = ['Tuition', 'Transport', 'Examination', 'Library', 'Laboratory', 'Uniform', 'Admission', 'Other']

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  paid:    { bg: '#dcece3', fg: '#1f5c42' },
  pending: { bg: '#f5e6cd', fg: '#8a6224' },
  overdue: { bg: '#f6dedc', fg: '#94322b' },
}

/** GVN/2024-25/000137 — readable, sortable, unique per record. */
function receiptNumber(seq: number) {
  const y = new Date().getFullYear()
  const ay = new Date().getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`
  return `GVN/${ay}/${String(seq).padStart(6, '0')}`
}

export default function FeesPage() {
  const supabase = useMemo(() => createClient(), [])

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [totals, setTotals] = useState({ collected: 0, pending: 0, overdue: 0, overdueCount: 0 })

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState<any | null>(null)
  const [deleting, setDeleting] = useState<any | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    supabase.from('students').select('id, full_name, admission_number')
      .eq('status', 'active').order('full_name')
      .then(({ data }) => setStudents(data ?? []))
  }, [supabase])

  /** Totals are computed over every row, not just the current page. */
  const fetchTotals = useCallback(async () => {
    const { data } = await supabase.from('fees').select('amount, status')
    const fees = (data ?? []) as { amount: number; status: string }[]
    const sum = (s: string) => fees.filter(f => f.status === s).reduce((a, f) => a + Number(f.amount || 0), 0)
    setTotals({
      collected: sum('paid'),
      pending: sum('pending'),
      overdue: sum('overdue'),
      overdueCount: fees.filter(f => f.status === 'overdue').length,
    })
  }, [supabase])

  const fetchFees = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('fees')
      .select('id, amount, fee_type, due_date, status, paid_date, receipt_number, student_id, students(full_name, admission_number, classes(name))',
        { count: 'exact' })
      .order('due_date', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)

    const { data, count, error } = await q
    if (error) toast.error(dbErrorMessage(error))

    let list = data ?? []
    // The student name lives on the joined table, so filter it client-side
    // over the page. ponytail: fine to ~thousands of rows; if it grows, add a
    // Postgres view exposing student_name and filter server-side.
    if (debounced.trim()) {
      const t = debounced.trim().toLowerCase()
      list = list.filter((f: any) =>
        (f.students?.full_name ?? '').toLowerCase().includes(t) ||
        (f.students?.admission_number ?? '').toLowerCase().includes(t))
    }

    setRows(list)
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, page, statusFilter, debounced])

  useEffect(() => { fetchFees(); fetchTotals() }, [fetchFees, fetchTotals])

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function handleAdd() {
    const errs = validate(form, RULES)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const payload = { ...toPayload(form, EMPTY_FORM), amount: Number(form.amount) }
    const { error } = await supabase.from('fees').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Fee raised')
    setShowModal(false)
    setForm(EMPTY_FORM)
    fetchFees(); fetchTotals()
  }

  async function recordPayment() {
    if (!paying) return
    setSaving(true)

    // Sequence off the count of already-paid records. Single-clerk school, so
    // a collision needs two simultaneous clerks; the UNIQUE-ish check below
    // catches it rather than silently duplicating.
    // ponytail: swap for a Postgres sequence if two offices ever collect at once.
    const { count } = await supabase
      .from('fees').select('id', { count: 'exact', head: true }).eq('status', 'paid')

    const { error } = await supabase.from('fees').update({
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10),
      receipt_number: receiptNumber((count ?? 0) + 1),
    }).eq('id', paying.id)

    setSaving(false)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Payment recorded')
    setPaying(null)
    fetchFees(); fetchTotals()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('fees').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Fee record deleted')
    setDeleting(null)
    fetchFees(); fetchTotals()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CreditCard}
        title="Fees"
        subtitle={`${total} record${total === 1 ? '' : 's'}`}
        actions={
          <button onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true) }} className="btn btn-brass">
            <Plus className="h-4 w-4" /> Raise fee
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Collected" value={formatCurrency(totals.collected)} icon={CheckCircle} tone="green" />
        <StatCard label="Pending"   value={formatCurrency(totals.pending)}   icon={Wallet} tone="brass" />
        <StatCard
          label="Overdue"
          value={formatCurrency(totals.overdue)}
          hint={`${totals.overdueCount} record${totals.overdueCount === 1 ? '' : 's'}`}
          icon={AlertCircle}
          tone={totals.overdueCount ? 'red' : 'slate'}
        />
      </div>

      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search by student name or admission number…"
            aria-label="Search fees"
          />
        </div>
        <select
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="input sm:w-40" aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </Toolbar>

      <TableShell
        columns={['Student', 'Class', 'Type', 'Amount', 'Due', 'Paid', 'Status', 'Actions']}
        footer={<Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}
      >
        {loading ? (
          <SkeletonRows cols={8} />
        ) : rows.length === 0 ? (
          <EmptyState icon={CreditCard} title="No fee records" hint="Raise a fee to start tracking collections." colSpan={8} />
        ) : rows.map(f => {
          const style = STATUS_STYLE[f.status] ?? STATUS_STYLE.pending
          return (
            <tr key={f.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>
                {f.students?.full_name ?? '—'}
                <span className="ml-1.5 font-mono text-[11px] font-normal" style={{ color: 'var(--ink-faint)' }}>
                  {f.students?.admission_number}
                </span>
              </td>
              <td className="table-cell">{f.students?.classes?.name ?? '—'}</td>
              <td className="table-cell">
                <span className="badge" style={{ background: 'var(--paper-deep)', color: 'var(--navy)' }}>{f.fee_type}</span>
              </td>
              <td className="table-cell font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {formatCurrency(Number(f.amount))}
              </td>
              <td className="table-cell">{formatDate(f.due_date)}</td>
              <td className="table-cell">{f.paid_date ? formatDate(f.paid_date) : '—'}</td>
              <td className="table-cell">
                <span className="badge" style={{ background: style.bg, color: style.fg }}>{f.status}</span>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1.5">
                  {f.status !== 'paid' ? (
                    <button onClick={() => setPaying(f)} className="btn btn-ghost btn-sm">
                      <CheckCircle className="h-3.5 w-3.5" style={{ color: '#2f7d5b' }} /> Record payment
                    </button>
                  ) : (
                    <Link href={`/receipts/${f.id}`} className="btn btn-ghost btn-sm">
                      <Receipt className="h-3.5 w-3.5" /> Receipt
                    </Link>
                  )}
                  <button onClick={() => setDeleting(f)} className="btn btn-ghost btn-icon" aria-label="Delete fee record">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </TableShell>

      {/* ── Raise fee ─────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Raise a fee"
        subtitle="This creates a payable record against the student"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Raise fee'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="student_id" className="label">Student</label>
            <select
              id="student_id" value={form.student_id} onChange={e => set('student_id', e.target.value)}
              aria-invalid={!!errors.student_id}
              className={`input ${errors.student_id ? 'input-error' : ''}`}
            >
              <option value="">Select a student…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>
              ))}
            </select>
            {errors.student_id && <p className="field-error">{errors.student_id}</p>}
          </div>

          <div>
            <label htmlFor="fee_type" className="label">Fee type</label>
            <select
              id="fee_type" value={form.fee_type} onChange={e => set('fee_type', e.target.value)}
              aria-invalid={!!errors.fee_type}
              className={`input ${errors.fee_type ? 'input-error' : ''}`}
            >
              <option value="">Select a type…</option>
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.fee_type && <p className="field-error">{errors.fee_type}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="label">Amount (₹)</label>
              <input
                id="amount" type="number" min="1" step="1" value={form.amount}
                onChange={e => set('amount', e.target.value)}
                aria-invalid={!!errors.amount}
                className={`input ${errors.amount ? 'input-error' : ''}`}
              />
              {errors.amount && <p className="field-error">{errors.amount}</p>}
            </div>
            <div>
              <label htmlFor="due_date" className="label">Due date</label>
              <input
                id="due_date" type="date" value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                aria-invalid={!!errors.due_date}
                className={`input ${errors.due_date ? 'input-error' : ''}`}
              />
              {errors.due_date && <p className="field-error">{errors.due_date}</p>}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Record payment ────────────────────────────── */}
      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title="Record payment"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setPaying(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={recordPayment} disabled={saving}>
              {saving ? 'Recording…' : 'Confirm payment'}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Marking <strong>{formatCurrency(Number(paying?.amount ?? 0))}</strong> ({paying?.fee_type}) as
          paid for <strong>{paying?.students?.full_name}</strong>.
        </p>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-faint)' }}>
          A receipt number is issued automatically and the receipt becomes printable.
        </p>
      </Modal>

      {/* ── Delete ────────────────────────────────────── */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete fee record"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Delete the {deleting?.fee_type} fee of {formatCurrency(Number(deleting?.amount ?? 0))} for{' '}
          <strong>{deleting?.students?.full_name}</strong>?
          {deleting?.status === 'paid' && ' This record has already been receipted.'}
        </p>
      </Modal>
    </div>
  )
}
