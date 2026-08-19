import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ChevronRight, GraduationCap, CalendarCheck, IndianRupee, Award,
  Bus, Megaphone, ShieldCheck, FileText,
} from 'lucide-react'
import { Reveal, Magnetic } from '@/components/ui/Motion'
import Tilt3D from '@/components/ui/Tilt3D'

export const metadata: Metadata = {
  title: 'Geethanjali Vidya Nilayam — School Management',
  description:
    'Admissions, attendance, exams, fees, transport and parent communication for Geethanjali Vidya Nilayam, Visakhapatnam.',
}

const MODULES = [
  { icon: GraduationCap,  title: 'Students',   desc: 'Admissions, classes and sections in one register.' },
  { icon: CalendarCheck,  title: 'Attendance', desc: 'Mark a whole section in one pass; parents see it same day.' },
  { icon: Award,          title: 'Exams',      desc: 'Marks entry, CBSE grade bands and printable report cards.' },
  { icon: IndianRupee,    title: 'Fees',       desc: 'Invoices, collections and numbered receipts.' },
  { icon: Bus,            title: 'Transport',  desc: 'Routes, stops, vehicles and student allocation.' },
  { icon: Megaphone,      title: 'Notices',    desc: 'Circulars targeted at the roles that need them.' },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Cinematic ground ────────────────────────────── */}
      <div
        className="aurora"
        style={{ background: 'conic-gradient(from 40deg at 30% 20%, rgba(184,135,59,.30), transparent 40%, rgba(47,92,153,.26) 66%, transparent 90%)' }}
      />
      <div
        className="aurora aurora-2"
        style={{ background: 'conic-gradient(from 220deg at 74% 78%, rgba(221,175,87,.24), transparent 44%, rgba(30,58,95,.28) 72%, transparent 94%)' }}
      />

      <header
        className="sticky top-0 z-20 safe-t"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--edge)', boxShadow: 'var(--lift-1)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="plate grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] text-white"
              style={{
                background: 'linear-gradient(180deg, var(--accent-lift), var(--accent) 60%, var(--accent-deep))',
                boxShadow: '0 3px 0 var(--accent-deep), inset 0 1px 0 rgba(255,255,255,.3)',
              }}
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight sm:text-base" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif), serif' }}>
                Geethanjali Vidya Nilayam
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--ink-faint)' }}>Peddawaltair, Visakhapatnam</p>
            </div>
          </div>
          <Magnetic as="span" className="shrink-0">
            <Link href="/login" className="btn btn-primary">
              <span className="hidden sm:inline">Sign in</span>
              <span className="sm:hidden">Sign in</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Magnetic>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 sm:px-5">
        {/* ── Hero ────────────────────────────────────── */}
        <section className="py-16 text-center sm:py-24">
          <p
            className="deal mx-auto mb-5 inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide"
            style={{ '--i': 0, background: 'var(--surface-sunk)', color: 'var(--accent-deep)', boxShadow: 'var(--sunk)' } as React.CSSProperties}
          >
            Andhra Pradesh State Board · Academic year 2024–25
          </p>
          <h1
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-serif), serif' }}
          >
            <span className="deal block" style={{ '--i': 1 } as React.CSSProperties}>The whole school,</span>
            <span className="deal block" style={{ '--i': 2 } as React.CSSProperties}>on one desk.</span>
          </h1>
          <p
            className="deal mx-auto mt-5 max-w-xl text-base leading-relaxed"
            style={{ '--i': 3, color: 'var(--ink-soft)' } as React.CSSProperties}
          >
            Attendance, marks, fees and transport for staff — and a portal where parents can see their own
            child&rsquo;s day without phoning the office.
          </p>
          <div
            className="deal mt-8 flex flex-col justify-center gap-3 sm:flex-row"
            style={{ '--i': 4 } as React.CSSProperties}
          >
            <Magnetic as="span">
              <Link href="/login" className="btn btn-primary w-full sm:w-auto">Sign in to your account</Link>
            </Magnetic>
            <Magnetic as="span">
              <a
                href="https://github.com/dileep12072024-sudo/gvn-school-management"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost w-full sm:w-auto"
              >
                Source on GitHub
              </a>
            </Magnetic>
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--edge)' }} />

        {/* ── Modules ─────────────────────────────────── */}
        <section className="py-16">
          <Reveal>
            <h2
              className="mb-8 text-center text-2xl font-bold"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-serif), serif' }}
            >
              What it covers
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => (
              <Reveal key={m.title} index={i % 3}>
                <Tilt3D as="article" className="panel h-full p-6">
                  <div
                    className="plate float layer-1 mb-4 grid h-11 w-11 place-items-center rounded-[var(--radius)] text-white"
                    style={{
                      '--bob-i': i,
                      background: 'linear-gradient(180deg, var(--primary-lift), var(--primary) 60%, var(--primary-deep))',
                      boxShadow: '0 3px 0 var(--primary-deep), inset 0 1px 0 rgba(255,255,255,.25)',
                    } as React.CSSProperties}
                  >
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="layer-1 font-bold" style={{ color: 'var(--ink)' }}>{m.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{m.desc}</p>
                </Tilt3D>
              </Reveal>
            ))}
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--edge)' }} />

        {/* ── Access ──────────────────────────────────── */}
        <section className="py-16">
          <Reveal>
            <div className="panel p-6 sm:p-10">
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <div
                  className="plate float grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] text-white"
                  style={{
                    background: 'linear-gradient(180deg, var(--accent-lift), var(--accent) 60%, var(--accent-deep))',
                    boxShadow: '0 3px 0 var(--accent-deep), inset 0 1px 0 rgba(255,255,255,.3)',
                  }}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Accounts come from the office</h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                    There is no public sign-up. Staff, parent and student logins are issued by the school and
                    scoped by role — a parent sees only their own child&rsquo;s attendance, marks and fees.
                    If you need access or a password reset, contact the school office.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {['Organiser', 'Principal', 'Vice principal', 'Teacher', 'Parent'].map((r, i) => (
                      <span
                        key={r}
                        className="deal rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{ '--i': i, background: 'var(--surface-sunk)', color: 'var(--ink-soft)', boxShadow: 'var(--sunk)' } as React.CSSProperties}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--edge)' }} />

        {/* ── Parent portal ───────────────────────────── */}
        <section className="py-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: CalendarCheck, k: 'Attendance', v: 'Day-by-day, with a running percentage.' },
              { icon: FileText,      k: 'Report card', v: 'Printable, with CGPA and grade bands.' },
              { icon: IndianRupee,   k: 'Fees', v: 'What is due, what is paid, receipt on demand.' },
            ].map((x, i) => (
              <Reveal key={x.k} index={i}>
                <div className="plaque h-full p-6">
                  <x.icon className="icon-pop float mb-3 h-5 w-5" style={{ '--bob-i': i, color: 'var(--accent)' } as React.CSSProperties} />
                  <p className="font-bold" style={{ color: 'var(--ink)' }}>{x.k}</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>{x.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative safe-b" style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface)' }}>
        <div className="mx-auto max-w-5xl px-5 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            © 2024 Geethanjali Vidya Nilayam, Peddawaltair, Visakhapatnam
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-faint)' }}>
            Next.js · Supabase · Cloudflare Pages
          </p>
        </div>
      </footer>
    </div>
  )
}
