'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MessageSquare, Send, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [selectedMsg, setSelectedMsg] = useState<any>(null)
  const supabase = createClientComponentClient()

  const emptyForm = { to_id: '', subject: '', body: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchMessages() }, [])

  async function fetchMessages() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('messages')
      .select('*, sender:profiles!messages_from_id_fkey(full_name), receiver:profiles!messages_to_id_fkey(full_name)')
      .or(`from_id.eq.${user?.id},to_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })
    setMessages((data ?? []).map((m: any) => ({ ...m, from_name: m.sender?.full_name, to_name: m.receiver?.full_name })))
    supabase.from('profiles').select('id, full_name, role').then(({ data: u }) => setUsers(u ?? []))
    setLoading(false)
  }

  async function sendMessage() {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('messages').insert({ ...form, from_id: user?.id, read: false })
    if (error) { toast.error('Send failed'); return }
    toast.success('Message sent'); setShowCompose(false); setForm(emptyForm); fetchMessages()
  }

  async function markRead(id: string) {
    await supabase.from('messages').update({ read: true }).eq('id', id)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <p className="text-sm text-gray-500">Teacher-parent communication</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" /> Compose
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Inbox List */}
        <div className="card overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Inbox</h3>
          </div>
          <div className="divide-y">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></div>
              ))
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No messages</p>
              </div>
            ) : messages.map(m => (
              <div key={m.id}
                onClick={() => { setSelectedMsg(m); markRead(m.id) }}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedMsg?.id === m.id ? 'bg-blue-50 border-l-4 border-l-[#1e3a5f]' : ''
                } ${!m.read ? 'bg-blue-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!m.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{m.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">From: {m.from_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(m.created_at, 'dd MMM')}</p>
                    {!m.read && <div className="w-2 h-2 bg-[#1e3a5f] rounded-full ml-auto mt-1" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message View */}
        <div className="card lg:col-span-2 flex flex-col">
          {selectedMsg ? (
            <>
              <div className="p-5 border-b">
                <h3 className="font-bold text-gray-900 text-lg">{selectedMsg.subject}</h3>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  <span>From: <strong>{selectedMsg.from_name}</strong></span>
                  <span>To: <strong>{selectedMsg.to_name}</strong></span>
                  <span>{formatDate(selectedMsg.created_at)}</span>
                </div>
              </div>
              <div className="p-5 flex-1">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMsg.body}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">New Message</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <select value={form.to_id} onChange={e => setForm(p => ({ ...p, to_id: e.target.value }))} className="input">
                  <option value="">Select recipient</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  className="input h-32 resize-none" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowCompose(false)} className="btn-secondary">Cancel</button>
              <button onClick={sendMessage} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
