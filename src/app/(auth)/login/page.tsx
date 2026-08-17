'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { validate, required, email as emailRule } from '@/lib/utils'
import Tilt3D from '@/components/ui/Tilt3D'

const PILLARS = [
  { label: 'Attendance & academics', desc: 'Daily registers, exam results, report cards' },
  { label: 'Fees & receipts',        desc: 'Collections, dues, printable receipts' },
  { label: 'Timetable & transport',  desc: 'Period grids, routes and vehicle allocation' },
]

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const params = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const next = params.get('next')

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs = validate(form, {
      email:    [required('Email'), emailRule],
      password: [required('Password')],
    })
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)

    if (error) {
      // Don't leak which half was wrong.
      toast.error(
        error.message === 'Email not confirmed'
          ? 'Please confirm your email address first'
          : 'Incorrect email or password',
      )
      return
    }

    toast.success('Welcome back')
    router.replace(next && next.startsWith('/') ? next : '/dashboard')
    router.refresh()
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{ background: 'linear-gradient(160deg, #0f2138 0%, #1e3a5f 45%, #14283f 100%)' }}
    >
      {/* Engraved guilloché ground — classic banknote feel, pure CSS */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[.16]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 1px, transparent 1px 14px),' +
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.35) 0 1px, transparent 1px 14px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(184,135,59,.22), transparent 62%)' }}
      />

      <Tilt3D
        max={4}
        sheen={false}
        className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[var(--radius-lg)] lg:grid-cols-[1.05fr_1fr]"
        style={{
          border: '1px solid rgba(255,255,255,.14)',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,.7), 0 12px 28px rgba(0,0,0,.35)',
        }}
      >
        {/* ── Left: brass plate ─────────────────────────── */}
        <div
          className="relative hidden flex-col justify-between p-10 text-white lg:flex"
          style={{ background: 'linear-gradient(165deg, #16304e 0%, #0f2138 60%, #0a1828 100%)' }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(217,169,78,.7), transparent)' }}
          />

          <div className="flex items-center gap-3.5">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius)]"
              style={{
                background: 'linear-gradient(180deg, var(--brass-lift), var(--brass) 55%, var(--brass-deep))',
                boxShadow: '0 3px 0 var(--brass-deep), 0 8px 18px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.4)',
              }}
            >
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Geethanjali Vidya Nilayam</p>
              <p className="text-sm tracking-wide text-white/45">Peddawaltair · Visakhapatnam</p>
            </div>
          </div>

          <div className="py-10">
            <p
              className="mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em]"
              style={{ background: 'rgba(217,169,78,.16)', color: 'var(--brass-lift)', border: '1px solid rgba(217,169,78,.3)' }}
            >
              Academic Year 2024–25
            </p>
            <h1 className="text-[2.6rem] font-bold leading-[1.08] tracking-tight">
              School<br />Management<br />
              <span
                style={{
                  background: 'linear-gradient(180deg, #f0d9a0, var(--brass-lift) 45%, var(--brass-deep))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                System
              </span>
            </h1>
            <div className="mt-4 h-px w-24" style={{ background: 'linear-gradient(90deg, var(--brass), transparent)' }} />
          </div>

          <div className="space-y-2">
            {PILLARS.map(p => (
              <div
                key={p.label}
                className="rounded-[var(--radius-sm)] px-4 py-3"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}
              >
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-white/45">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: the form ───────────────────────────── */}
        <div className="flex flex-col justify-center p-8 md:p-10" style={{ background: 'var(--paper)' }}>
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div
              className="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)]"
              style={{ background: 'linear-gradient(180deg, var(--brass-lift), var(--brass-deep))' }}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--navy)' }}>GVN School</p>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Management System</p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight rule-brass" style={{ color: 'var(--ink)' }}>
              Sign in
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--ink-faint)' }}>
              Use the account issued by the school office.
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  id="email" type="email" autoComplete="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@gvn.edu.in"
                />
              </div>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  aria-invalid={!!errors.password}
                  className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary mt-2 w-full">
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…</>
                : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div
            className="mt-7 flex items-start gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-3"
            style={{ background: 'var(--surface-sunk)', border: '1px solid var(--edge)', boxShadow: 'var(--sunk)' }}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--brass)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
              Accounts are created by the school administrator. Contact the office
              if you cannot sign in — self-registration is disabled.
            </p>
          </div>
        </div>
      </Tilt3D>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
