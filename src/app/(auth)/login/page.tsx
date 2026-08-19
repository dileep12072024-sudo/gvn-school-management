'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, CalendarCheck, IndianRupee, Bus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { validate, required, email as emailRule } from '@/lib/utils'
import { haptic } from '@/lib/haptics'
import Tilt3D from '@/components/ui/Tilt3D'
import { Magnetic } from '@/components/ui/Motion'

const PILLARS = [
  { icon: CalendarCheck, label: 'Attendance & academics', desc: 'Daily registers, exam results, report cards' },
  { icon: IndianRupee,   label: 'Fees & receipts',        desc: 'Collections, dues, printable receipts' },
  { icon: Bus,           label: 'Timetable & transport',  desc: 'Period grids, routes and vehicle allocation' },
]

/** Counts 0 → value once, on mount. Pure decoration for the crest figures. */
function useCountUp(target: number, ms = 1100) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      // easeOutCubic — fast start, gentle settle, no overshoot on a number.
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const router = useRouter()
  const params = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const next = params.get('next')
  const card = useRef<HTMLDivElement>(null)

  const years = useCountUp(30)

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  const fail = (msg: string) => {
    haptic('error')
    setShake(true)
    setTimeout(() => setShake(false), 500)
    toast.error(msg)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs = validate(form, {
      email:    [required('Email'), emailRule],
      password: [required('Password')],
    })
    if (Object.keys(errs).length) { setErrors(errs); fail('Check the highlighted fields'); return }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)

    if (error) {
      // Don't leak which half was wrong.
      fail(error.message === 'Email not confirmed'
        ? 'Please confirm your email address first'
        : 'Incorrect email or password')
      return
    }

    haptic('success')
    toast.success('Welcome back')
    // '/' resolves the right home server-side via landingFor(), so a parent
    // lands on their child's page rather than on a staff dashboard.
    router.replace(next && next.startsWith('/') ? next : '/')
    router.refresh()
  }

  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4"
      style={{ background: 'linear-gradient(160deg, #0c1730 0%, #22406f 45%, #12213f 100%)' }}
    >
      {/* ── Cinematic backdrop ─────────────────────────── */}
      <div
        className="aurora"
        style={{
          background:
            'radial-gradient(38% 42% at 30% 34%, rgba(21,156,138,.46), transparent 70%),' +
            'radial-gradient(46% 40% at 74% 60%, rgba(51,80,127,.62), transparent 72%)',
        }}
      />
      <div
        className="aurora aurora-2"
        style={{
          background:
            'radial-gradient(40% 38% at 70% 26%, rgba(63,184,166,.30), transparent 72%),' +
            'radial-gradient(52% 46% at 24% 76%, rgba(31,55,99,.62), transparent 76%)',
        }}
      />

      {/* Engraved guilloché ground — classic banknote feel, pure CSS */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[.12]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 1px, transparent 1px 14px),' +
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.35) 0 1px, transparent 1px 14px)',
        }}
      />
      {/* Vignette so the card is the only lit thing in frame. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 34%, rgba(4,10,18,.72) 100%)' }}
      />

      <Tilt3D
        max={4}
        sheen={false}
        className={`deal relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[var(--radius-lg)] lg:grid-cols-[1.05fr_1fr] ${shake ? 'shake' : ''}`}
        style={{
          border: '1px solid rgba(255,255,255,.16)',
          boxShadow: '0 60px 110px -40px rgba(0,0,0,.85), 0 16px 34px rgba(0,0,0,.4)',
        }}
      >
        {/* ── Left: brass plate ─────────────────────────── */}
        <div
          ref={card}
          className="relative hidden flex-col justify-between p-10 text-white lg:flex"
          style={{ background: 'linear-gradient(165deg, #22406f 0%, #16274a 60%, #0a132a 100%)' }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(221,175,87,.75), transparent)' }}
          />

          <div className="deal flex items-center gap-3.5" style={{ '--i': 1 } as React.CSSProperties}>
            <div
              className="plate float grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius)]"
              style={{
                background: 'linear-gradient(180deg, var(--accent-lift), var(--accent) 55%, var(--accent-deep))',
                boxShadow: '0 3px 0 var(--accent-deep), 0 8px 18px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.4)',
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
              className="deal mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em]"
              style={{
                '--i': 2,
                background: 'rgba(221,175,87,.16)',
                color: 'var(--accent-lift)',
                border: '1px solid rgba(221,175,87,.3)',
              } as React.CSSProperties}
            >
              Academic Year 2024–25
            </p>
            <h1 className="text-[2.6rem] font-bold leading-[1.08] tracking-tight">
              <span className="deal block" style={{ '--i': 3 } as React.CSSProperties}>School</span>
              <span className="deal block" style={{ '--i': 4 } as React.CSSProperties}>Management</span>
              <span
                className="glint deal inline-block"
                style={{
                  '--i': 5,
                  background: 'linear-gradient(180deg, #c9f2ea, var(--accent-lift) 45%, var(--accent-deep))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } as React.CSSProperties}
              >
                System
              </span>
            </h1>
            <div className="mt-4 h-px w-24" style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            <p className="mt-5 text-sm text-white/45">
              Serving Visakhapatnam for{' '}
              <span className="font-bold tabular-nums text-white/80">{years}</span> years
            </p>
          </div>

          <div className="space-y-2">
            {PILLARS.map((p, i) => (
              <div
                key={p.label}
                className="deal group flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 transition-colors"
                style={{
                  '--i': 6 + i,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.07)',
                } as React.CSSProperties}
              >
                <p.icon
                  className="icon-pop h-4 w-4 shrink-0"
                  style={{ color: 'var(--accent-lift)' }}
                />
                <div>
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-white/45">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: the form ───────────────────────────── */}
        <div className="flex flex-col justify-center p-8 md:p-10" style={{ background: 'var(--paper)' }}>
          <div className="deal mb-7 flex items-center gap-3 lg:hidden" style={{ '--i': 1 } as React.CSSProperties}>
            <div
              className="plate float grid h-11 w-11 place-items-center rounded-[var(--radius-sm)]"
              style={{
                background: 'linear-gradient(180deg, var(--accent-lift), var(--accent-deep))',
                boxShadow: '0 3px 0 var(--accent-deep), 0 6px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.4)',
              }}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--primary)' }}>GVN School</p>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Management System</p>
            </div>
          </div>

          <div className="deal mb-7" style={{ '--i': 2 } as React.CSSProperties}>
            <h2 className="rule-brass text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              Sign in
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--ink-faint)' }}>
              Use the account issued by the school office.
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div className="deal" style={{ '--i': 3 } as React.CSSProperties}>
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

            <div className="deal" style={{ '--i': 4 } as React.CSSProperties}>
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
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] transition-colors hover:bg-black/[.05]"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <Magnetic className="deal block pt-2" style={{ '--i': 5 } as React.CSSProperties}>
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…</>
                  : <>Sign in <ArrowRight className="h-4 w-4" /></>}
              </button>
            </Magnetic>
          </form>

          <div
            className="deal mt-7 flex items-start gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-3"
            style={{
              '--i': 6,
              background: 'var(--surface-sunk)',
              border: '1px solid var(--edge)',
              boxShadow: 'var(--sunk)',
            } as React.CSSProperties}
          >
            <ShieldCheck className="icon-pop mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
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
