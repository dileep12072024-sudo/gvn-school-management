'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Megaphone, Pin, Trash2 } from 'lucide-react'
import { formatDate, getPriorityColor } from '@/lib/utils'
import type { Notice } from '@/types'
import toast from 'react-hot-toast'

const ALL_ROLES = ['organiser','principal','vice_principal','teacher','parent','student']

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClientComponentClient()

  const emptyForm = { title: '', content: '', priority: 'medium', target_roles: ALL_ROLES, pinned: false, expires_at: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchNotices() }, [])

  async function fetchNotices() {
    setLoading(true)
    const { data } = await supabase.from('notices').select('*, profiles(full_name)')
      .order('pinned', { ascending: false }).order('created_at', { ascending: false })
    setNotices((data ?? []).map((n: any) => ({ ...n, created_by_name: n.profiles?.full_name })))
    setLoading(false)
  }

  async function handlePost() {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('notices').insert({ ...form, created_by: user?.id })
    if (error) { toast.error('Failed'); return }
    toast.success('Notice posted')
    setShowModal(false); setForm(emptyForm); fetchNotices()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete notice?')) return
    await supabase.from('notices').delete().eq('id', id)
    toast.success('Deleted'); fetchNotices()
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from('notices').update({ pinned: !pinned }).eq('id', id)
    fetchNotices()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notices</h2>
          <p className="text-sm text-gray-500">School announcements and circulars</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-50" />)}</div>
      ) : notices.length === 0 ? (
        <div className="card p-16 text-center">
          <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No notices posted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className={`card p-5 border-l-4 ${
              n.priority === 'urgent' ? 'border-l-red-500' :
              n.priority === 'high' ? 'border-l-orange-500' :
              n.priority === 'medium' ? 'border-l-blue-500' : 'border-l-gray-300'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.pinned && <Pin className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />}
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <span className={`badge ${getPriorityColor(n.priority)}`}>{n.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>By: {n.created_by_name ?? 'Admin'}</span>
                    <span>{formatDate(n.created_at)}</span>
                    <span>Targets: {n.target_roles.join(', ')}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin(n.id, n.pinned)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      n.pinned ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'hover:bg-gray-100 text-gray-400'
                    }`}><Pin className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(n.id)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Post Notice</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  className="input h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input">
                    {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expires</label>
                  <input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pinned" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} className="rounded" />
                <label htmlFor="pinned" className="text-sm text-gray-700">Pin this notice</label>
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handlePost} className="btn-primary">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
