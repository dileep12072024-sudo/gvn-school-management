'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Calendar, Check, X, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { LeaveRequest } from '@/types'
import toast from 'react-hot-toast'

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClientComponentClient()

  const emptyForm = { leave_type: 'sick', from_date: '', to_date: '', reason: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.from('profiles').select('*, role').eq('id', user?.id).single().then(({ data }) => setProfile(data))
    })
    fetchLeaves()
  }, [])

  async function fetchLeaves() {
    setLoading(true)
    const { data } = await supabase.from('leave_requests')
      .select('*, teachers(full_name)')
      .order('created_at', { ascending: false })
    setLeaves((data ?? []).map((l: any) => ({ ...l, teacher_name: l.teachers?.full_name })))
    setLoading(false)
  }

  async function submitLeave() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user?.id).single()
    const { error } = await supabase.from('leave_requests').insert({
      ...form, teacher_id: teacher?.id, status: 'pending'
    })
    if (error) { toast.error('Failed to submit'); return }
    toast.success('Leave request submitted'); setShowModal(false); setForm(emptyForm); fetchLeaves()
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('leave_requests').update({ status, approved_by: user?.id }).eq('id', id)
    toast.success(`Leave ${status}`); fetchLeaves()
  }

  const canApprove = ['organiser', 'principal', 'vice_principal'].includes(profile?.role ?? '')

  const statusBadge = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-sm text-gray-500">Staff leave requests and approvals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: leaves.filter(l => l.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Approved', count: leaves.filter(l => l.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Rejected', count: leaves.filter(l => l.status === 'rejected').length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map(s => (
          <div key={s.label} className={`card p-4 border ${s.border}`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>{['Teacher', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', ...(canApprove ? ['Action'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {loading ? null : leaves.map(l => {
              const days = Math.ceil((new Date(l.to_date).getTime() - new Date(l.from_date).getTime()) / 86400000) + 1
              return (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{l.teacher_name}</td>
                  <td className="table-cell capitalize">{l.leave_type}</td>
                  <td className="table-cell">{formatDate(l.from_date)}</td>
                  <td className="table-cell">{formatDate(l.to_date)}</td>
                  <td className="table-cell font-semibold">{days}</td>
                  <td className="table-cell max-w-xs truncate">{l.reason}</td>
                  <td className="table-cell">
                    <span className={`badge ${(statusBadge as any)[l.status]}`}>{l.status}</span>
                  </td>
                  {canApprove && (
                    <td className="table-cell">
                      {l.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(l.id, 'approved')}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateStatus(l.id, 'rejected')}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Apply for Leave</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type</label>
                <select value={form.leave_type} onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))} className="input">
                  {['sick', 'casual', 'earned', 'other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input type="date" value={form.from_date} onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input type="date" value={form.to_date} onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  className="input h-20 resize-none" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={submitLeave} className="btn-primary">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
