'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { MessageSquare, Send, Inbox as InboxIcon, MailOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { formatDate, toPayload, validate, dbErrorMessage, required, maxLen, getRoleLabel } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { PageHeader, Modal, EmptyState } from '@/components/ui'

const EMPTY_FORM = { to_id: '', subject: '', body: '' }

const RULES = {
  to_id:   [required('Recipient')],
  subject: [required('Subject'), maxLen(140, 'Subject')],
  body:    [required('Message')],
}

export default function MessagesPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [messages, setMessages] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [box, setBox] = useState<'inbox' | 'sent'>('inbox')
  const [selected, setSelected] = useState<any>(null)

  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('id, subject, body, read, created_at, from_id, to_id, sender:profiles!messages_from_id_fkey(full_name), receiver:profiles!messages_to_id_fkey(full_name)')
      .or(`from_id.eq.${profile.id},to_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
    if (error) toast.error(dbErrorMessage(error))
    setMessages(data ?? [])
    setLoading(false)
  }, [supabase, profile])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, role').order('full_name')
      .then(({ data }) => setUsers(data ?? []))
  }, [supabase])

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function sendMessage() {
    const errs = validate(form, RULES)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      ...toPayload(form, EMPTY_FORM),
      from_id: profile?.id,
      read: false,
    })
    setSending(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Message sent')
    setShowCompose(false)
    setForm(EMPTY_FORM)
    fetchMessages()
  }

  async function open(m: any) {
    setSelected(m)
    // Only the recipient may flip the read flag; RLS enforces it too.
    if (!m.read && m.to_id === profile?.id) {
      await supabase.from('messages').update({ read: true }).eq('id', m.id)
      setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, read: true } : x)))
    }
  }

  const shown = messages.filter(m => (box === 'inbox' ? m.to_id === profile?.id : m.from_id === profile?.id))
  const unread = messages.filter(m => m.to_id === profile?.id && !m.read).length

  return (
    <div className="space-y-5">
      <PageHeader
        icon={MessageSquare}
        title="Messages"
        subtitle="Direct communication between staff and parents"
        actions={
          <button onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowCompose(true) }} className="btn btn-brass">
            <Send className="h-4 w-4" /> Compose
          </button>
        }
      />

      <div className="grid h-[calc(100vh-260px)] min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── List ────────────────────────────────────── */}
        <div className="panel flex flex-col overflow-hidden">
          <div
            className="flex shrink-0 gap-1 p-2"
            style={{ borderBottom: '1px solid var(--edge)', background: 'var(--surface-sunk)' }}
          >
            {(['inbox', 'sent'] as const).map(b => (
              <button
                key={b}
                onClick={() => { setBox(b); setSelected(null) }}
                aria-pressed={box === b}
                className={`btn btn-sm flex-1 capitalize ${box === b ? 'btn-primary' : 'btn-ghost'}`}
              >
                {b === 'inbox' ? <InboxIcon className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {b}
                {b === 'inbox' && unread > 0 && (
                  <span className="badge ml-1" style={{ background: 'var(--brass)', color: '#fff' }}>{unread}</span>
                )}
              </button>
            ))}
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4"><div className="skeleton h-4" /></div>
              ))
            ) : shown.length === 0 ? (
              <EmptyState icon={MailOpen} title={`No ${box} messages`} hint="Conversations appear here." />
            ) : shown.map(m => {
              const isNew = box === 'inbox' && !m.read
              const active = selected?.id === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => open(m)}
                  className="block w-full px-4 py-3.5 text-left transition-colors"
                  style={{
                    borderTop: '1px solid var(--edge)',
                    borderLeft: active ? '3px solid var(--brass)' : '3px solid transparent',
                    background: active ? 'var(--paper-deep)' : isNew ? 'rgba(184,135,59,.06)' : 'transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm"
                        style={{ color: 'var(--ink)', fontWeight: isNew ? 700 : 500 }}
                      >
                        {m.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--ink-faint)' }}>
                        {box === 'inbox' ? m.sender?.full_name ?? 'Unknown' : m.receiver?.full_name ?? 'Unknown'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{formatDate(m.created_at, 'dd MMM')}</p>
                      {isNew && <span className="ml-auto mt-1 block h-2 w-2 rounded-full" style={{ background: 'var(--brass)' }} />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Reader ──────────────────────────────────── */}
        <div className="panel flex flex-col overflow-hidden lg:col-span-2">
          {selected ? (
            <>
              <div className="shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--edge)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{selected.subject}</h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--ink-faint)' }}>
                  <span>From <strong style={{ color: 'var(--ink-soft)' }}>{selected.sender?.full_name ?? '—'}</strong></span>
                  <span>To <strong style={{ color: 'var(--ink-soft)' }}>{selected.receiver?.full_name ?? '—'}</strong></span>
                  <span>{formatDate(selected.created_at, 'dd MMM yyyy, HH:mm')}</span>
                </div>
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">
                <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{selected.body}</p>
              </div>
              <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface-sunk)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setForm({
                      to_id: selected.from_id === profile?.id ? selected.to_id : selected.from_id,
                      subject: selected.subject.startsWith('Re: ') ? selected.subject : `Re: ${selected.subject}`,
                      body: '',
                    })
                    setErrors({})
                    setShowCompose(true)
                  }}
                >
                  <Send className="h-3.5 w-3.5" /> Reply
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={MessageSquare} title="Nothing selected" hint="Pick a message from the list to read it." />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showCompose}
        onClose={() => setShowCompose(false)}
        title="New message"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={sendMessage} disabled={sending}>
              <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="to_id" className="label">To</label>
            <select
              id="to_id" value={form.to_id} onChange={e => set('to_id', e.target.value)}
              className={`input ${errors.to_id ? 'input-error' : ''}`}
            >
              <option value="">Select recipient</option>
              {users.filter(u => u.id !== profile?.id).map(u => (
                <option key={u.id} value={u.id}>{u.full_name} — {getRoleLabel(u.role)}</option>
              ))}
            </select>
            {errors.to_id && <p className="field-error">{errors.to_id}</p>}
          </div>

          <div>
            <label htmlFor="subject" className="label">Subject</label>
            <input
              id="subject" value={form.subject} onChange={e => set('subject', e.target.value)}
              className={`input ${errors.subject ? 'input-error' : ''}`}
            />
            {errors.subject && <p className="field-error">{errors.subject}</p>}
          </div>

          <div>
            <label htmlFor="body" className="label">Message</label>
            <textarea
              id="body" rows={6} value={form.body} onChange={e => set('body', e.target.value)}
              className={`input resize-none ${errors.body ? 'input-error' : ''}`}
            />
            {errors.body && <p className="field-error">{errors.body}</p>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
