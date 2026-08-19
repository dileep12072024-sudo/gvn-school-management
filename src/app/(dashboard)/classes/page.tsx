'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, BookOpen, Pencil, Trash2, Users, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { toPayload, validate, dbErrorMessage, required, positive, type Rule } from '@/lib/utils'
import {
  PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Tilt3D,
  Segmented,
} from '@/components/ui'

const EMPTY_CLASS = { name: '', grade: '1' }
const EMPTY_SECTION = { class_id: '', name: '', teacher_id: '', capacity: '40' }

type Tab = 'classes' | 'sections'

export default function ClassesPage() {
  const supabase = useMemo(() => createClient(), [])

  const [tab, setTab] = useState<Tab>('classes')
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_CLASS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<{ kind: Tab; row: any } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cls, sec, teach, studs] = await Promise.all([
      supabase.from('classes').select('id, name, grade').order('grade'),
      supabase.from('sections').select('id, name, capacity, class_id, teacher_id, classes(name), teachers(full_name)').order('name'),
      supabase.from('teachers').select('id, full_name').eq('status', 'active').order('full_name'),
      supabase.from('students').select('class_id').eq('status', 'active'),
    ])

    const byClass: Record<string, number> = {}
    ;((studs.data ?? []) as any[]).forEach(s => {
      if (s.class_id) byClass[s.class_id] = (byClass[s.class_id] ?? 0) + 1
    })

    setClasses(cls.data ?? [])
    setSections(sec.data ?? [])
    setTeachers(teach.data ?? [])
    setCounts(byClass)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const shape = tab === 'classes' ? EMPTY_CLASS : EMPTY_SECTION

  const openAdd = () => {
    setEditing(null); setForm(shape); setErrors({}); setShowModal(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    // Strip the joined `classes`/`teachers` objects — not columns.
    setForm(toPayload({ ...shape, ...row, grade: String(row.grade ?? ''), capacity: String(row.capacity ?? '') }, shape))
    setErrors({}); setShowModal(true)
  }

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function save() {
    const rules: Record<string, Rule[]> = tab === 'classes'
      ? { name: [required('Class name')], grade: [required('Grade'), positive('Grade')] }
      : { class_id: [required('Class')], name: [required('Section name')], capacity: [required('Capacity'), positive('Capacity')] }

    const errs = validate(form, rules)
    if (tab === 'classes' && form.grade && (Number(form.grade) < 1 || Number(form.grade) > 12)) {
      errs.grade = 'Grade must be between 1 and 12'
    }
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const table = tab === 'classes' ? 'classes' : 'sections'
    const payload: Record<string, any> = tab === 'classes'
      ? { ...toPayload(form, EMPTY_CLASS), grade: Number(form.grade) }
      : { ...toPayload(form, EMPTY_SECTION), capacity: Number(form.capacity) }

    const { error } = editing
      ? await supabase.from(table).update(payload).eq('id', editing.id)
      : await supabase.from(table).insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(editing ? 'Updated' : tab === 'classes' ? 'Class added' : 'Section added')
    setShowModal(false)
    fetchAll()
  }

  async function handleDelete() {
    if (!deleting) return
    const table = deleting.kind === 'classes' ? 'classes' : 'sections'
    const { error } = await supabase.from(table).delete().eq('id', deleting.row.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Deleted')
    setDeleting(null)
    fetchAll()
  }

  const enrolled = deleting?.kind === 'classes' ? (counts[deleting.row.id] ?? 0) : 0

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BookOpen}
        title="Classes & sections"
        subtitle={`${classes.length} classes · ${sections.length} sections`}
        actions={
          <button onClick={openAdd} className="btn btn-accent">
            <Plus className="h-4 w-4" /> Add {tab === 'classes' ? 'class' : 'section'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={classes.length} icon={BookOpen} tone="primary" />
        <StatCard label="Sections" value={sections.length} icon={LayoutGrid} tone="accent" />
        <StatCard label="Students enrolled" value={Object.values(counts).reduce((a, b) => a + b, 0)} icon={Users} tone="green" />
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'classes', label: 'Classes', icon: BookOpen },
          { value: 'sections', label: 'Sections', icon: LayoutGrid },
        ]}
      />

      {tab === 'classes' ? (
        loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="panel p-5"><div className="skeleton h-20" /></div>)}
          </div>
        ) : classes.length === 0 ? (
          <div className="panel p-4">
            <EmptyState icon={BookOpen} title="No classes yet" hint="Add Class 1 to get started." />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {classes.map(c => (
              <Tilt3D key={c.id} className="panel p-5">
                <div className="layer-1">
                  <div className="mb-3 flex items-start justify-between">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-white"
                      style={{ background: 'linear-gradient(180deg, var(--primary-lift), var(--primary-deep))' }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="btn btn-ghost btn-icon" aria-label={`Edit ${c.name}`}>
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => setDeleting({ kind: 'classes', row: c })} className="btn btn-ghost btn-icon" aria-label={`Delete ${c.name}`}>
                        <Trash2 className="h-3 w-3" style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{c.name}</p>
                  <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Grade {c.grade}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--ink-faint)' }}>
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3" /> {sections.filter(s => s.class_id === c.id).length} sections
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {counts[c.id] ?? 0}
                    </span>
                  </div>
                </div>
              </Tilt3D>
            ))}
          </div>
        )
      ) : (
        <TableShell columns={['Class', 'Section', 'Class teacher', 'Capacity', 'Actions']}>
          {loading ? (
            <SkeletonRows cols={5} />
          ) : sections.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="No sections yet" hint="Add a section under a class." colSpan={5} />
          ) : sections.map(s => (
            <tr key={s.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-semibold" style={{ color: 'var(--primary)' }}>{s.classes?.name ?? '—'}</td>
              <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>{s.name}</td>
              <td className="table-cell">
                {s.teachers?.full_name ?? <span style={{ color: 'var(--ink-faint)' }}>Not assigned</span>}
              </td>
              <td className="table-cell tabular-nums">{s.capacity}</td>
              <td className="table-cell">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(s)} className="btn btn-ghost btn-icon" aria-label={`Edit section ${s.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleting({ kind: 'sections', row: s })} className="btn btn-ghost btn-icon" aria-label={`Delete section ${s.name}`}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {/* ── Add / edit ────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`${editing ? 'Edit' : 'New'} ${tab === 'classes' ? 'class' : 'section'}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {tab === 'classes' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="label">Class name</label>
              <input
                id="name" value={form.name ?? ''} onChange={e => set('name', e.target.value)}
                className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Class 1"
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="grade" className="label">Grade (1–12)</label>
              <input
                id="grade" type="number" min={1} max={12} value={form.grade ?? ''}
                onChange={e => set('grade', e.target.value)}
                className={`input ${errors.grade ? 'input-error' : ''}`}
              />
              {errors.grade && <p className="field-error">{errors.grade}</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="class_id" className="label">Class</label>
              <select
                id="class_id" value={form.class_id ?? ''} onChange={e => set('class_id', e.target.value)}
                className={`input ${errors.class_id ? 'input-error' : ''}`}
              >
                <option value="">Select…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.class_id && <p className="field-error">{errors.class_id}</p>}
            </div>
            <div>
              <label htmlFor="sec_name" className="label">Section name</label>
              <input
                id="sec_name" value={form.name ?? ''} onChange={e => set('name', e.target.value)}
                className={`input ${errors.name ? 'input-error' : ''}`} placeholder="A"
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="teacher_id" className="label">Class teacher</label>
              <select id="teacher_id" value={form.teacher_id ?? ''} onChange={e => set('teacher_id', e.target.value)} className="input">
                <option value="">Not assigned</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="capacity" className="label">Capacity</label>
              <input
                id="capacity" type="number" min={1} value={form.capacity ?? ''}
                onChange={e => set('capacity', e.target.value)}
                className={`input ${errors.capacity ? 'input-error' : ''}`}
              />
              {errors.capacity && <p className="field-error">{errors.capacity}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete ────────────────────────────────────── */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.kind === 'classes' ? 'class' : 'section'}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        {deleting?.kind === 'classes' ? (
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Deleting <strong>{deleting.row.name}</strong> also deletes its sections, timetable and exams.
            {enrolled > 0 && (
              <> <strong>{enrolled} student{enrolled === 1 ? ' is' : 's are'}</strong> still enrolled — they will be left
              without a class.</>
            )}
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Delete section <strong>{deleting?.row.name}</strong> of {deleting?.row.classes?.name}? Students in it
            will be left without a section.
          </p>
        )}
      </Modal>
    </div>
  )
}
