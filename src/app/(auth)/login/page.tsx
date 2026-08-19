'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, CalendarCheck, IndianRupee, Bus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { validate, required, email as emailRule } from '@/lib/utils'
import { haptic } from '@/lib/haptics'

const PILLARS = [
  { icon: CalendarCheck, label: 'Attendance & academics', desc: 'Registers, results, report cards' },
  { icon: IndianRupee,   label: 'Fees & receipts',        desc: 'Collections, dues, printable receipts' },
  { icon: Bus,           label: 'Timetable & transport',  desc: 'Period grids, routes, vehicles' },
]

/**
 * The scene: two slow liquid blobs and a scatter of lit spheres, some behind
 * the glass and some in front of it so the pane reads as a physical sheet
 * suspended in the middle of the frame rather than a panel painted on top.
 *
 * Every value here is static. The motion is entirely in CSS transforms, so
 * React renders this once and never touches it again.
 */
const BLOBS = [
  { w: 46, h: 44, top: -8,  left: -12, dur: 52, i: 0, bg: 'radial-gradient(circle at 34% 32%, #2ad2b8, #0e6f8f 55%, #16255a 100%)', op: .72 },
  { w: 40, h: 42, top: 44,  left: 62,  dur: 66, i: 1, bg: 'radial-gradient(circle at 62% 58%, #4d7dd6, #2b3f8f 48%, #101b3d 100%)', op: .78 },
]

const ORBS = [
  // Behind the glass. Bigger than the front ones: a soft falloff needs room to
  // read as a diffuse ball rather than as a smudge.
  { d: 168, top: 10, left: 14, dur: 17, i: 0, a: '#2fd0b6', b: '#12466b', front: false },
  { d: 112, top: 64, left: 6,  dur: 21, i: 1, a: '#4f86e8', b: '#1a2a63', front: false },
  { d: 210, top: 52, left: 74, dur: 25, i: 2, a: '#3aa8d8', b: '#16255a', front: false },
  { d: 96,  top: 18, left: 84, dur: 19, i: 3, a: '#2fd0b6', b: '#0e5a52', front: false },
  // In front — these pass over the pane. Placed to clip its *edges* only: a
  // sphere sitting on the form is a sphere sitting on something you have to
  // read.
  { d: 74,  top: 3,   left: 40,   dur: 23, i: 4, a: '#5ce0c8', b: '#12466b', front: true },
  { d: 52,  top: 93,  left: 12.5, dur: 20, i: 5, a: '#5f97f0', b: '#1a2a63', front: true },
  { d: 34,  top: 44,  left: 3,    dur: 15, i: 6, a: '#2fd0b6', b: '#0e5a52', front: true },
]

/**
 * The scene is drawn in two passes because `contain` makes each layer its own
 * stacking context — a z-index inside one can never lift a sphere above the
 * pane. The front pass is a separate sibling that sits over the glass, which
 * is what makes the pane look suspended between the spheres rather than
 * pasted on top of them.
 */
function Scene({ front = false }: { front?: boolean }) {
  return (
    <div className="scene" style={front ? { zIndex: 4 } : undefined} aria-hidden>
      {!front && BLOBS.map((b, n) => (
        <div
          key={n}
          className={`blob${n ? ' blob-b' : ''}`}
          style={{
            width: `${b.w}vw`, height: `${b.h}vw`,
            top: `${b.top}%`, left: `${b.left}%`,
            background: b.bg, opacity: b.op,
            '--dur': `${b.dur}s`, '--i': b.i,
          } as React.CSSProperties}
        />
      ))}
      {ORBS.filter(o => o.front === front).map((o, n) => (
        <div
          key={n}
          // Behind the pane a sphere reads as frost-softened, in front of it as
          // a solid lit ball. Two different paints, no filter involved.
          className={front ? 'orb' : 'orb-soft'}
          style={{
            width: o.d, height: o.d,
            top: `${o.top}%`, left: `${o.left}%`,
            '--dur': `${o.dur}s`, '--i': o.i,
            '--orb-a': o.a, '--orb-b': o.b,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

/** Counts 0 → value once, on mount. Pure decoration for the crest figure. */
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
      style={{ background: 'linear-gradient(150deg, #071129 0%, #10275a 42%, #0a1a3f 72%, #061024 100%)' }}
    >
      <Scene />

      {/* Vignette, so the eye lands on the pane and not on a stray sphere. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 48%, transparent 30%, rgba(3, 8, 20, .72) 100%)' }}
      />

      <div
        className={`glass deal grid w-full max-w-5xl grid-cols-1 rounded-[26px] lg:grid-cols-[1.02fr_1fr] ${shake ? 'shake' : ''}`}
      >
        {/* ── Left: the school ──────────────────────────── */}
        <div className="relative hidden flex-col justify-between p-10 text-white lg:flex">
          {/* The seam between the two halves, lit like the pane's edge. */}
          <div
            className="pointer-events-none absolute inset-y-8 right-0 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.28), transparent)' }}
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
              <p className="text-sm tracking-wide text-white/55">Peddawaltair · Visakhapatnam</p>
            </div>
          </div>

          <div className="py-10">
            <p
              className="deal mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em]"
              style={{
                '--i': 2,
                background: 'rgba(63,184,166,.16)',
                color: 'var(--accent-lift)',
                border: '1px solid rgba(63,184,166,.34)',
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
                  // Stays in the bright half of the ramp — running down into
                  // --accent left the word nearly unreadable on this ground.
                  background: 'linear-gradient(180deg, #eafffb, #7ff0dc 45%, #35c9b1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } as React.CSSProperties}
              >
                System
              </span>
            </h1>
            <div className="mt-4 h-px w-24" style={{ background: 'linear-gradient(90deg, var(--accent-lift), transparent)' }} />
            <p className="mt-5 text-sm text-white/55">
              Serving Visakhapatnam for{' '}
              <span className="font-bold tabular-nums text-white/90">{years}</span> years
            </p>
          </div>

          <div className="space-y-2">
            {PILLARS.map((p, i) => (
              <div
                key={p.label}
                className="deal flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3"
                style={{
                  '--i': 6 + i,
                  background: 'rgba(255,255,255,.07)',
                  border: '1px solid rgba(255,255,255,.12)',
                } as React.CSSProperties}
              >
                <p.icon className="icon-pop h-4 w-4 shrink-0" style={{ color: 'var(--accent-lift)' }} />
                <div>
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-white/50">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: the form ───────────────────────────── */}
        <div className="flex flex-col justify-center p-8 text-white md:p-10">
          <div className="deal mb-7 flex items-center gap-3 lg:hidden" style={{ '--i': 1 } as React.CSSProperties}>
            <div
              className="plate float grid h-11 w-11 place-items-center rounded-[var(--radius-sm)]"
              style={{
                background: 'linear-gradient(180deg, var(--accent-lift), var(--accent-deep))',
                boxShadow: '0 3px 0 var(--accent-deep), 0 6px 14px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.4)',
              }}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold">Geethanjali Vidya Nilayam</p>
              <p className="text-xs text-white/55">Peddawaltair · Visakhapatnam</p>
            </div>
          </div>

          <div className="deal mb-7" style={{ '--i': 2 } as React.CSSProperties}>
            <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
            <div className="mt-3 h-px w-16" style={{ background: 'linear-gradient(90deg, var(--accent-lift), transparent)' }} />
            <p className="mt-3 text-sm text-white/55">Use the account issued by the school office.</p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div className="deal" style={{ '--i': 3 } as React.CSSProperties}>
              <label htmlFor="email" className="label-glass">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  id="email" type="email" autoComplete="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  className="input-glass"
                  placeholder="you@gvn.edu.in"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs" style={{ color: '#f5a6a1' }}>{errors.email}</p>}
            </div>

            <div className="deal" style={{ '--i': 4 } as React.CSSProperties}>
              <label htmlFor="password" className="label-glass">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  aria-invalid={!!errors.password}
                  className="input-glass input-glass-pw"
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-white/55 transition-colors hover:bg-white/10"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs" style={{ color: '#f5a6a1' }}>{errors.password}</p>}
            </div>

            <div className="deal pt-2" style={{ '--i': 5 } as React.CSSProperties}>
              <button type="submit" disabled={loading} className="btn btn-accent w-full">
                {loading
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…</>
                  : <>Sign in <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </form>

          <div
            className="deal mt-7 flex items-start gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-3"
            style={{
              '--i': 6,
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.12)',
            } as React.CSSProperties}
          >
            <ShieldCheck className="icon-pop mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent-lift)' }} />
            <p className="text-xs leading-relaxed text-white/55">
              Accounts are created by the school administrator. Contact the office
              if you cannot sign in — self-registration is disabled.
            </p>
          </div>
        </div>
      </div>

      {/* Spheres that pass in front of the pane. Sibling, not child, so they
          actually sit above it — and pointer-transparent, so the form below
          still takes every click. */}
      <Scene front />
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
