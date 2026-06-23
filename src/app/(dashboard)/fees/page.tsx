'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Search, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Fee } from '@/types'
import toast from 'react-hot-toast'

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([])
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
    supabase.from('students').select('id, full_name, admission_number')
      .eq('status', 'active').then(({ data }) => setStudents(data ?? []))
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
    await supabase.from('fees').update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0]
    }).eq('id', id)
    toast.success('Marked as paid'); fetchFees()
  }

  const filtered = fees.filter(f => {
    const matchSearch = (f.student_name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (statusFilter === 'all' || f.status === statusFilter)
  })

  const totalCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
  const totalPending   = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0)
  const overdueCount   = fees.filter(f => f.status === 'overdue').length

  const statusBadge: Record<string, string> = {
    paid:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    overdue: 'bg-red-100 text-red-700 border border-red-200',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center shadow-lg">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Fee Management</h2>
            <p className="text-sm text-gray-500">Track and manage student fees</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md">
          <Plus className="w-4 h-4" /> Add Fee Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: formatCurrency(totalCollected), gradient: 'from-emerald-500 to-teal-500',  Icon: CheckCircle,  iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', valText: 'text-emerald-700' },
          { label: 'Pending Amount',  value: formatCurrency(totalPending),   gradient: 'from-amber-500 to-yellow-400', Icon: TrendingUp,    iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   valText: 'text-amber-700' },
          { label: 'Overdue Records', value: String(overdueCount),           gradient: 'from-red-500 to-rose-500',     Icon: AlertCircle,   iconBg: 'bg-red-50',     iconText: 'text-red-600',     valText: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${s.gradient}`} />
            <div className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                <s.Icon className={`w-6 h-6 ${s.iconText}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-xl font-bold ${s.valText} mt-0.5`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name..."
            className="input pl-9 rounded-xl border-gray-200 w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input w-36 rounded-xl border-gray-200">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                {['Student', 'Class', 'Fee Type', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">No fee records found</p>
                  </td>
                </tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="table-cell font-medium text-gray-900">{f.student_name}</td>
                  <td className="table-cell text-gray-500">{f.class_name}</td>
                  <td className="table-cell">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                      {f.fee_type}
                    </span>
                  </td>
                  <td className="table-cell font-bold text-gray-900">{formatCurrency(f.amount)}</td>
                  <td className="table-cell text-gray-500">{formatDate(f.due_date)}</td>
                  <td className="table-cell text-gray-500">{f.paid_date ? formatDate(f.paid_date) : '—'}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      statusBadge[f.status] ?? 'bg-gray-100 text-gray-600'
                    }`}>{f.status}</span>
                  </td>
                  <td className="table-cell">
                    {f.status !== 'paid' && (
                      <button onClick={() => markPaid(f.id)}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors font-semibold">
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] p-6">
              <h3 className="font-bold text-white text-lg">Add Fee Record</h3>
              <p className="text-blue-200 text-sm mt-0.5">Enter fee details for the student</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Student</label>
                <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
                  className="input rounded-xl border-gray-200 w-full">
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
                </select>
              </div>
              {([
                { l: 'Fee Type', k: 'fee_type', t: 'text' },
                { l: 'Amount (₹)', k: 'amount', t: 'number' },
                { l: 'Due Date', k: 'due_date', t: 'date' },
              ] as { l: string; k: string; t: string }[]).map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
                  <input type={f.t} value={(form as any)[f.k]}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                    className="input rounded-xl border-gray-200 w-full" />
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3 border-t border-gray-50 pt-4">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="btn-gradient px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md">
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
