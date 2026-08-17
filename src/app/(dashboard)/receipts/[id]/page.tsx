'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, GraduationCap } from 'lucide-react'
import { Receipt as ReceiptIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import { rupeesInWords } from '@/lib/money'
import { EmptyState } from '@/components/ui'

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [fee, setFee] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('fees')
      .select('id, amount, fee_type, due_date, status, paid_date, receipt_number, students(full_name, admission_number, classes(name), sections(name))')
      .eq('id', id)
      .single()
      .then(({ data }) => { setFee(data); setLoading(false) })
  }, [supabase, id])

  if (loading) return <div className="panel p-8"><div className="skeleton h-64" /></div>

  if (!fee || fee.status !== 'paid') {
    return (
      <div className="panel p-6">
        <EmptyState
          icon={ReceiptIcon}
          title={fee ? 'This fee has not been paid yet' : 'Receipt not found'}
          hint="A receipt is issued once the payment is recorded."
        />
        <div className="flex justify-center">
          <button onClick={() => router.push('/fees')} className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back to fees
          </button>
        </div>
      </div>
    )
  }

  const amount = Number(fee.amount)
  const student = fee.students

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <button onClick={() => router.push('/fees')} className="btn btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Back to fees
        </button>
        <button onClick={() => window.print()} className="btn btn-brass">
          <Printer className="h-4 w-4" /> Print receipt
        </button>
      </div>

      {/* ── The sheet ─────────────────────────────────── */}
      <div
        className="print-sheet panel mx-auto max-w-3xl p-10"
        style={{ background: 'var(--surface)' }}
      >
        {/* Letterhead */}
        <div className="flex items-start justify-between gap-6 pb-5" style={{ borderBottom: '2px solid var(--navy)' }}>
          <div className="flex items-center gap-3.5">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius)] text-white"
              style={{ background: 'linear-gradient(180deg, var(--brass-lift), var(--brass-deep))' }}
            >
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--navy)', fontFamily: 'var(--font-serif), serif' }}>
                Geethanjali Vidya Nilayam
              </h1>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                Peddawaltair, Visakhapatnam, Andhra Pradesh
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[.14em]" style={{ color: 'var(--brass)' }}>
              Fee Receipt
            </p>
            <p className="mt-1 font-mono text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {fee.receipt_number ?? '—'}
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
              {fee.paid_date ? formatDate(fee.paid_date) : ''}
            </p>
          </div>
        </div>

        {/* Student block */}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 py-6">
          {[
            ['Received from', student?.full_name ?? '—'],
            ['Admission number', student?.admission_number ?? '—'],
            ['Class', `${student?.classes?.name ?? '—'}${student?.sections?.name ? ' · ' + student.sections.name : ''}`],
            ['Payment date', fee.paid_date ? formatDate(fee.paid_date) : '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-faint)' }}>{k}</dt>
              <dd className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--ink)' }}>{v}</dd>
            </div>
          ))}
        </dl>

        {/* Line items */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-header">Particulars</th>
              <th className="table-header text-right">Due date</th>
              <th className="table-header text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-semibold" style={{ color: 'var(--ink)' }}>{fee.fee_type} fee</td>
              <td className="table-cell text-right">{formatDate(fee.due_date)}</td>
              <td className="table-cell text-right font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {formatCurrency(amount)}
              </td>
            </tr>
            <tr style={{ borderTop: '2px solid var(--navy)' }}>
              <td className="table-cell font-bold" colSpan={2} style={{ color: 'var(--ink)' }}>Total paid</td>
              <td className="table-cell text-right text-lg font-bold tabular-nums" style={{ color: 'var(--navy)' }}>
                {formatCurrency(amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="plaque mt-5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--ink-faint)' }}>
            Amount in words
          </p>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Rupees {rupeesInWords(amount)} only
          </p>
        </div>

        {/* Sign-off */}
        <div className="mt-12 flex items-end justify-between">
          <p className="max-w-xs text-[11px] leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
            This is a computer-generated receipt. Fees once paid are not refundable.
          </p>
          <div className="text-center">
            <div className="mb-1 h-12 w-48" />
            <div style={{ borderTop: '1px solid var(--ink-faint)' }} />
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
              Authorised signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
