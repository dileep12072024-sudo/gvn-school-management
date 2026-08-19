'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Users, GraduationCap, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import {
  formatDate, toPayload, validate, dbErrorMessage,
  required, phone as phoneRule, notFuture, after,
} from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isStaff } from '@/lib/nav'
import {
  PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Pagination, Toolbar,
} from '@/components/ui'

const PAGE_SIZE = 25

const EMPTY_FORM = {
  admission_number: '',
  full_name: '',
  date_of_birth: '',
  gender: 'male',
  class_id: '',
  section_id: '',
  address: '',
  phone: '',
  admission_date: '',
  status: 'active',
}

const RULES = {
  admission_number: [required('Admission number')],
  full_name:        [required('Full name')],
  date_of_birth:    [required('Date of birth'), notFuture('Date of birth')],
  address:          [required('Address')],
  phone:            [phoneRule],
  admission_date:   [required('Admission date'), after('date_of_birth', 'Admission date')],
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  active:      { bg: 'var(--tint-success)', fg: 'var(--success-deep)' },
  inactive:    { bg: 'var(--paper-deep)', fg: 'var(--slate-deep)' },
  transferred: { bg: 'var(--tint-accent)', fg: 'var(--accent-deep)' },
}

export default function StudentsPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canEdit = isStaff(profile?.role)

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  // Debounce search so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    supabase.from('classes').select('id, name, grade').order('grade')
      .then(({ data }) => setClasses(data ?? []))
    supabase.from('sections').select('id, name, class_id').order('name')
      .then(({ data }) => setSections(data ?? []))
  }, [supabase])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('students')
      .select('id, admission_number, full_name, date_of_birth, gender, address, phone, admission_date, status, class_id, section_id, classes(name), sections(name)',
        { count: 'exact' })
      .order('full_name')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (classFilter !== 'all') q = q.eq('class_id', classFilter)
    if (debounced.trim()) {
      const term = debounced.trim().replace(/[%,]/g, '')
      q = q.or(`full_name.ilike.%${term}%,admission_number.ilike.%${term}%`)
    }

    const { data, count, error } = await q
    if (error) toast.error(dbErrorMessage(error))
    setRows(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, page, statusFilter, classFilter, debounced])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, admission_date: new Date().toISOString().slice(0, 10) })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (s: any) => {
    setEditing(s)
    // Only the form's own keys — never the joined `classes`/`sections` objects,
    // which are not columns and would make the UPDATE fail.
    setForm(toPayload({ ...EMPTY_FORM, ...s }, EMPTY_FORM))
    setErrors({})
    setShowModal(true)
  }

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v, ...(k === 'class_id' ? { section_id: '' } : null) }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function handleSave() {
    const errs = validate(form, RULES)
    if (Object.keys(errs).length) {
      setErrors(errs)
      toast.error('Please fix the highlighted fields')
      return
    }

    setSaving(true)
    const payload = toPayload(form, EMPTY_FORM)
    const { error } = editing
      ? await supabase.from('students').update(payload).eq('id', editing.id)
      : await supabase.from('students').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(editing ? 'Student updated' : 'Student added')
    setShowModal(false)
    fetchStudents()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('students').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(`${deleting.full_name} removed`)
    setDeleting(null)
    fetchStudents()
  }

  const sectionsForClass = sections.filter(s => s.class_id === form.class_id)
  const activeOnPage = rows.filter(r => r.status === 'active').length

  return (
    <div className="space-y-5">
      <PageHeader
        icon={GraduationCap}
        title="Students"
        subtitle={`${total} record${total === 1 ? '' : 's'}`}
        actions={canEdit && (
          <button onClick={openAdd} className="btn btn-accent">
            <Plus className="h-4 w-4" /> Add student
          </button>
        )}
      />

      <div className="stat-grid">
        <StatCard label="Total students" value={total} icon={Users} tone="primary" />
        <StatCard label="Active on this page" value={activeOnPage} icon={UserCheck} tone="green" />
        <StatCard label="Classes" value={classes.length} icon={GraduationCap} tone="accent" />
      </div>

      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search by name or admission number…"
            aria-label="Search students"
          />
        </div>
        <select
          value={classFilter}
          onChange={e => { setClassFilter(e.target.value); setPage(0) }}
          className="input sm:w-44" aria-label="Filter by class"
        >
          <option value="all">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="input sm:w-40" aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
        </select>
      </Toolbar>

      <TableShell
        columns={['Adm. No.', 'Name', 'Class', 'Date of birth', 'Status', 'Phone', canEdit ? 'Actions' : '']}
        footer={<Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}
      >
        {loading ? (
          <SkeletonRows cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            hint={debounced ? 'Try a different search term.' : 'Add the first student to get started.'}
            colSpan={7}
          />
        ) : rows.map(s => {
          const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.inactive
          return (
            <tr key={s.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>
                {s.admission_number}
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-2.5">
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: 'linear-gradient(180deg, var(--primary-lift), var(--primary-deep))',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(0,0,0,.2)',
                    }}
                  >
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>{s.full_name}</span>
                </div>
              </td>
              <td className="table-cell">
                {s.classes?.name ?? '—'}{s.sections?.name ? ` · ${s.sections.name}` : ''}
              </td>
              <td className="table-cell">{s.date_of_birth ? formatDate(s.date_of_birth) : '—'}</td>
              <td className="table-cell">
                <span className="badge" style={{ background: style.bg, color: style.fg }}>{s.status}</span>
              </td>
              <td className="table-cell">{s.phone ?? '—'}</td>
              <td className="table-cell">
                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(s)} className="btn btn-ghost btn-icon" aria-label={`Edit ${s.full_name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleting(s)} className="btn btn-ghost btn-icon" aria-label={`Delete ${s.full_name}`}>
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )
        })}
      </TableShell>

      {/* ── Add / edit ────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit student' : 'New student'}
        subtitle={editing ? editing.full_name : 'Enter the admission details'}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add student'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            { key: 'admission_number', label: 'Admission number', type: 'text' },
            { key: 'full_name',        label: 'Full name',        type: 'text' },
            { key: 'date_of_birth',    label: 'Date of birth',    type: 'date' },
            { key: 'admission_date',   label: 'Admission date',   type: 'date' },
            { key: 'phone',            label: 'Phone',            type: 'tel' },
          ] as const).map(f => (
            <div key={f.key}>
              <label htmlFor={f.key} className="label">{f.label}</label>
              <input
                id={f.key} type={f.type} value={form[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
                aria-invalid={!!errors[f.key]}
                className={`input ${errors[f.key] ? 'input-error' : ''}`}
              />
              {errors[f.key] && <p className="field-error">{errors[f.key]}</p>}
            </div>
          ))}

          <div>
            <label htmlFor="gender" className="label">Gender</label>
            <select id="gender" value={form.gender} onChange={e => set('gender', e.target.value)} className="input">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="class_id" className="label">Class</label>
            <select id="class_id" value={form.class_id ?? ''} onChange={e => set('class_id', e.target.value)} className="input">
              <option value="">Not assigned</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="section_id" className="label">Section</label>
            <select
              id="section_id" value={form.section_id ?? ''}
              onChange={e => set('section_id', e.target.value)}
              className="input" disabled={!form.class_id}
            >
              <option value="">{form.class_id ? 'Not assigned' : 'Pick a class first'}</option>
              {sectionsForClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" value={form.status} onChange={e => set('status', e.target.value)} className="input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="label">Address</label>
            <textarea
              id="address" rows={2} value={form.address ?? ''}
              onChange={e => set('address', e.target.value)}
              aria-invalid={!!errors.address}
              className={`input resize-none ${errors.address ? 'input-error' : ''}`}
            />
            {errors.address && <p className="field-error">{errors.address}</p>}
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ────────────────────────────── */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete student"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete permanently</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          This removes <strong>{deleting?.full_name}</strong> ({deleting?.admission_number}) along with
          their attendance, fees and exam results. This cannot be undone.
        </p>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-faint)' }}>
          To keep the history, set their status to <em>transferred</em> instead.
        </p>
      </Modal>
    </div>
  )
}
