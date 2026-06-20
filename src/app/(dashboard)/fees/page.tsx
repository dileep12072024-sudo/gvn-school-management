'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Search, CreditCard, Receipt, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency, getFeeStatusColor } from '@/lib/utils'
import type { Fee } from '@/types'
import toast from 'react-hot-toast'

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const supabase = createClientComponentClient()

  const emptyForm = { student_id: '', amount: '', fee_type: '', due_date: '', status: 'pending' }
  const [form, setForm] = useState(emptyForm)
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    fetchFees()
    supabase.from('students').select('id, full_name, admission_number').eq('status', 'active').then(({ data }) => setStudents(data ?? []))
  }, [])

  async function fetchFees() {
    setLoading(true)
    const { data } = await supabase.from('fees')
      .select('*, students(full_name, admission_number, classes(name))')
      .order('due_date', { ascending: false })
    setFees((data ?? []).map((f: any) => ({
      ...f,
      student_name: f.students?.full_name,
      class_name: f.students?.classes?.name
    })))
    setLoading(false)
  }

  async function handleAdd() {
    const { error } = await supabase.from('fees').insert({ ...form, amount: Number(form.amount) })
    if (error) { toast.error('Failed to add fee'); return }
    toast.success('Fee record added')
    setShowModal(false); setForm(emptyForm); fetchFees()
  }

  async function markPaid(id: string) {
    await supabase.from('fees').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    toast.success('Marked as paid'); fetchFees()
  }

  const filtered = fees.filter(f => {
    const matchSearch = (f.student_name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (statusFilter === 'all' || f.status === statusFilter)
  })

  const totalCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
  const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0)
  const overdueCount = fees.filter(f => f.status === 'overdue').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fee Management</h2>
          <p className="text-sm text-gray-500">Track and manage student fees</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Fee Record
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: formatCurrency(totalCollected), color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Pending Amount', value: formatCurrency(totalPending), color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Overdue Records', value: overdueCount.toString(), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map(s => (
          <div key={s.label} className={`card p-5 border ${s.border}`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..." className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-36">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['Student', 'Class', 'Fee Type', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Action'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? null : filtered.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{f.student_name}</td>
                  <td className="table-cell">{f.class_name}</td>
                  <td className="table-cell">{f.fee_type}</td>
                  <td className="table-cell font-semibold text-gray-900">{formatCurrency(f.amount)}</td>
                  <td className="table-cell">{formatDate(f.due_date)}</td>
                  <td className="table-cell">{f.paid_date ? formatDate(f.paid_date) : '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${getFeeStatusColor(f.status)}`}>{f.status}</span>
                  </td>
                  <td className="table-cell">
                    {f.status !== 'paid' && (
                      <button onClick={() => markPaid(f.id)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors font-medium">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Add Fee Record</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} className="input">
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
                </select>
              </div>
              {[{ l: 'Fee Type', k: 'fee_type', t: 'text' }, { l: 'Amount (₹)', k: 'amount', t: 'number' }, { l: 'Due Date', k: 'due_date', t: 'date' }].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.l}</label>
                  <input type={f.t} value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} className="input" />
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} className="btn-primary">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
