'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Megaphone, Pin, Trash2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { formatDate, toPayload, validate, dbErrorMessage, required, maxLen } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isStaff, ALL_ROLES, type UserRole } from '@/lib/nav'
import { getRoleLabel } from '@/lib/utils'
import { PageHeader, Modal, EmptyState, Toolbar } from '@/components/ui'

const EMPTY_FORM = {
  title: '',
  content: '',
  priority: 'medium',
  target_roles: ALL_ROLES as UserRole[],
  pinned: false,
  expires_at: '',
}

const RULES = {
  title:   [required('Title'), maxLen(140, 'Title')],
  content: [required('Content')],
}

const PRIORITY: Record<string, { bg: string; fg: string; rule: string }> = {
  urgent: { bg: '#f6dedc', fg: '#94322b', rule: '#b8443c' },
  high:   { bg: '#f5e6cd', fg: '#8a6224', rule: '#b8873b' },
  medium: { bg: '#e5ecf4', fg: '#1e3a5f', rule: '#2e5a96' },
  low:    { bg: '#e8e3d8', fg: '#667790', rule: '#8494a8' },
}

export default function NoticesPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canPost = isStaff(profile?.role)

  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notices')
      .select('id, title, content, priority, pinned, target_roles, expires_at, created_at, created_by, profiles(full_name)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.error(dbErrorMessage(error))
    setNotices(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  const toggleRole = (role: UserRole) =>
    setForm(p => {
      const roles = p.target_roles as UserRole[]
      return { ...p, target_roles: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role] }
    })

  async function handlePost() {
    const errs = validate(form, RULES)
    if ((form.target_roles as UserRole[]).length === 0) errs.target_roles = 'Pick at least one audience'
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    // toPayload turns the empty date into null — '' would fail the DATE cast.
    const payload = {
      ...toPayload(form, EMPTY_FORM),
      target_roles: form.target_roles,
      pinned: form.pinned,
      created_by: user?.id ?? null,
    }
    const { error } = await supabase.from('notices').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Notice posted')
    setShowModal(false)
    setForm(EMPTY_FORM)
    fetchNotices()
  }

  async function togglePin(n: any) {
    const { error } = await supabase.from('notices').update({ pinned: !n.pinned }).eq('id', n.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    fetchNotices()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('notices').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Notice deleted')
    setDeleting(null)
    fetchNotices()
  }

  const filtered = notices.filter(n => priorityFilter === 'all' || n.priority === priorityFilter)

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Megaphone}
        title="Notices"
        subtitle="School announcements and circulars"
        actions={canPost && (
          <button onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true) }} className="btn btn-brass">
            <Plus className="h-4 w-4" /> Post notice
          </button>
        )}
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: 'var(--ink-faint)' }} />
          <select
            value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="input w-44" aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            {Object.keys(PRIORITY).map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
          </select>
        </div>
        <p className="text-sm sm:ml-auto" style={{ color: 'var(--ink-faint)' }}>
          {filtered.length} notice{filtered.length === 1 ? '' : 's'}
        </p>
      </Toolbar>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="panel p-5"><div className="skeleton h-16" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-4">
          <EmptyState icon={Megaphone} title="No notices" hint="Announcements from the office appear here." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const tone = PRIORITY[n.priority] ?? PRIORITY.low
            const expired = n.expires_at && new Date(n.expires_at) < new Date()
            return (
              <article
                key={n.id}
                className="panel p-5"
                style={{ borderLeft: `4px solid ${tone.rule}`, opacity: expired ? .6 : 1 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {n.pinned && <Pin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--brass)' }} />}
                      <h3 className="font-bold" style={{ color: 'var(--ink)' }}>{n.title}</h3>
                      <span className="badge" style={{ background: tone.bg, color: tone.fg }}>{n.priority}</span>
                      {expired && (
                        <span className="badge" style={{ background: 'var(--paper-deep)', color: 'var(--ink-faint)' }}>expired</span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                      {n.content}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--ink-faint)' }}>
                      <span>{n.profiles?.full_name ?? 'Office'}</span>
                      <span>·</span>
                      <span>{formatDate(n.created_at)}</span>
                      <span>·</span>
                      <span>For {(n.target_roles ?? []).map((r: string) => getRoleLabel(r)).join(', ')}</span>
                    </div>
                  </div>

                  {canPost && (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => togglePin(n)}
                        aria-label={n.pinned ? 'Unpin notice' : 'Pin notice'}
                        aria-pressed={n.pinned}
                        className="btn btn-ghost btn-icon"
                        style={n.pinned ? { color: 'var(--brass)' } : undefined}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(n)} className="btn btn-ghost btn-icon" aria-label="Delete notice">
                        <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Post ──────────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Post a notice"
        subtitle="Visible to the audiences you select"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePost} disabled={saving}>
              {saving ? 'Posting…' : 'Post notice'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title" value={form.title} onChange={e => set('title', e.target.value)}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Parent–Teacher meeting"
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="content" className="label">Content</label>
            <textarea
              id="content" rows={5} value={form.content} onChange={e => set('content', e.target.value)}
              className={`input resize-none ${errors.content ? 'input-error' : ''}`}
            />
            {errors.content && <p className="field-error">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="label">Priority</label>
              <select id="priority" value={form.priority} onChange={e => set('priority', e.target.value)} className="input capitalize">
                {Object.keys(PRIORITY).map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="expires_at" className="label">Expires (optional)</label>
              <input
                id="expires_at" type="date" value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)} className="input"
              />
            </div>
          </div>

          <fieldset>
            <legend className="label">Audience</legend>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(role => {
                const on = (form.target_roles as UserRole[]).includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    aria-pressed={on}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                    style={on ? {
                      background: 'linear-gradient(180deg, var(--navy-lift), var(--navy-deep))',
                      color: '#fff',
                      boxShadow: '0 2px 0 var(--navy-deep), inset 0 1px 0 rgba(255,255,255,.2)',
                    } : {
                      background: 'var(--surface-sunk)',
                      color: 'var(--ink-faint)',
                      border: '1px solid var(--edge-strong)',
                      boxShadow: 'var(--sunk)',
                    }}
                  >
                    {getRoleLabel(role)}
                  </button>
                )
              })}
            </div>
            {errors.target_roles && <p className="field-error">{errors.target_roles}</p>}
          </fieldset>

          <label className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-soft)' }}>
            <input
              type="checkbox" checked={form.pinned}
              onChange={e => set('pinned', e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Pin to the top of the list
          </label>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete notice"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Delete “<strong>{deleting?.title}</strong>”? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
