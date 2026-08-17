'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, GraduationCap, Users, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import {
  formatDate, toPayload, validate, dbErrorMessage,
  required, phone as phoneRule, email as emailRule, notFuture,
} from '@/lib/utils'
import {
  PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Toolbar,
} from '@/components/ui'

const EMPTY_FORM = {
  employee_id: '',
  full_name: '',
  email: '',
  phone: '',
  qualification: '',
  joining_date: '',
  subject_specialization: [] as string[],
  status: 'active',
}

const RULES = {
  employee_id:   [required('Employee ID')],
  full_name:     [required('Full name')],
  email:         [required('Email'), emailRule],
  phone:         [required('Phone'), phoneRule],
  qualification: [required('Qualification')],
  joining_date:  [required('Joining date'), notFuture('Joining date')],
}

export default function TeachersPage() {
  const supabase = useMemo(() => createClient(), [])

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('teachers').select('*').order('full_name')
    if (error) toast.error(dbErrorMessage(error))
    setRows(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setErrors({}); setShowModal(true)
  }

  const openEdit = (t: any) => {
    setEditing(t)
    // Whitelist to the form's own keys — `id`, `created_at` and `profile_id`
    // are not editable and posting them back breaks the UPDATE.
    setForm({ ...toPayload({ ...EMPTY_FORM, ...t }, EMPTY_FORM), subject_specialization: t.subject_specialization ?? [] })
    setErrors({}); setShowModal(true)
  }

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function handleSave() {
    const errs = validate(form, RULES)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const payload = {
      ...toPayload(form, EMPTY_FORM),
      // Arrays survive toPayload untouched; just drop blanks from the CSV input.
      subject_specialization: (form.subject_specialization as string[]).map(s => s.trim()).filter(Boolean),
    }
    const { error } = editing
      ? await supabase.from('teachers').update(payload).eq('id', editing.id)
      : await supabase.from('teachers').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(editing ? 'Teacher updated' : 'Teacher added')
    setShowModal(false)
    fetchTeachers()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('teachers').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(`${deleting.full_name} removed`)
    setDeleting(null)
    fetchTeachers()
  }

  const filtered = rows.filter(t => {
    const q = search.trim().toLowerCase()
    const matches = !q ||
      t.full_name.toLowerCase().includes(q) ||
      t.employee_id.toLowerCase().includes(q) ||
      (t.subject_specialization ?? []).some((s: string) => s.toLowerCase().includes(q))
    return matches && (statusFilter === 'all' || t.status === statusFilter)
  })

  const active = rows.filter(t => t.status === 'active').length
  const subjects = new Set(rows.flatMap(t => t.subject_specialization ?? [])).size

  return (
    <div className="space-y-5">
      <PageHeader
        icon={GraduationCap}
        title="Teachers"
        subtitle={`${rows.length} staff record${rows.length === 1 ? '' : 's'}`}
        actions={<button onClick={openAdd} className="btn btn-brass"><Plus className="h-4 w-4" /> Add teacher</button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total staff" value={rows.length} icon={Users} tone="navy" />
        <StatCard label="Active" value={active} icon={GraduationCap} tone="green" />
        <StatCard label="Subjects covered" value={subjects} icon={BookOpen} tone="brass" />
      </div>

      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search by name, employee ID or subject…"
            aria-label="Search teachers"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40" aria-label="Filter by status">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Toolbar>

      <TableShell columns={['Emp. ID', 'Name', 'Qualification', 'Subjects', 'Phone', 'Joined', 'Status', 'Actions']}>
        {loading ? (
          <SkeletonRows cols={8} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No teachers found" hint={search ? 'Try a different search.' : 'Add the first staff member.'} colSpan={8} />
        ) : filtered.map(t => (
          <tr key={t.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
            <td className="table-cell font-mono text-xs font-bold" style={{ color: 'var(--navy)' }}>{t.employee_id}</td>
            <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>
              {t.full_name}
              <span className="block text-[11px] font-normal" style={{ color: 'var(--ink-faint)' }}>{t.email}</span>
            </td>
            <td className="table-cell">{t.qualification}</td>
            <td className="table-cell">
              <div className="flex flex-wrap gap-1">
                {(t.subject_specialization ?? []).length === 0
                  ? <span style={{ color: 'var(--ink-faint)' }}>—</span>
                  : t.subject_specialization.map((s: string) => (
                      <span key={s} className="badge" style={{ background: 'var(--paper-deep)', color: 'var(--navy)' }}>{s}</span>
                    ))}
              </div>
            </td>
            <td className="table-cell">{t.phone}</td>
            <td className="table-cell">{formatDate(t.joining_date)}</td>
            <td className="table-cell">
              <span
                className="badge"
                style={t.status === 'active'
                  ? { background: '#dcece3', color: '#1f5c42' }
                  : { background: '#e8e3d8', color: '#667790' }}
              >
                {t.status}
              </span>
            </td>
            <td className="table-cell">
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(t)} className="btn btn-ghost btn-icon" aria-label={`Edit ${t.full_name}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleting(t)} className="btn btn-ghost btn-icon" aria-label={`Delete ${t.full_name}`}>
                  <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit teacher' : 'New teacher'}
        subtitle={editing ? editing.full_name : 'Enter the staff details'}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add teacher'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            { key: 'employee_id',   label: 'Employee ID',   type: 'text' },
            { key: 'full_name',     label: 'Full name',     type: 'text' },
            { key: 'email',         label: 'Email',         type: 'email' },
            { key: 'phone',         label: 'Phone',         type: 'tel' },
            { key: 'qualification', label: 'Qualification', type: 'text' },
            { key: 'joining_date',  label: 'Joining date',  type: 'date' },
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
            <label htmlFor="status" className="label">Status</label>
            <select id="status" value={form.status} onChange={e => set('status', e.target.value)} className="input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="subjects" className="label">Subjects (comma separated)</label>
            <input
              id="subjects"
              value={(form.subject_specialization as string[]).join(', ')}
              onChange={e => set('subject_specialization', e.target.value.split(','))}
              className="input"
              placeholder="Mathematics, Physics"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete teacher"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete permanently</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Remove <strong>{deleting?.full_name}</strong> ({deleting?.employee_id})? Their timetable slots
          and section assignments will be left unassigned.
        </p>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-faint)' }}>
          To keep the record, set their status to <em>inactive</em> instead.
        </p>
      </Modal>
    </div>
  )
}
