import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ChevronRight, GraduationCap, CalendarCheck, IndianRupee, Award,
  Bus, Megaphone, ShieldCheck, FileText,
} from 'lucide-react'

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
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <header
        className="sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--edge)', boxShadow: 'var(--lift-1)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-[var(--radius)] text-white"
              style={{
                background: 'linear-gradient(180deg, var(--brass-lift), var(--brass) 60%, var(--brass-deep))',
                boxShadow: '0 3px 0 var(--brass-deep), inset 0 1px 0 rgba(255,255,255,.3)',
              }}
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold leading-tight" style={{ color: 'var(--navy)', fontFamily: 'var(--font-serif), serif' }}>
                Geethanjali Vidya Nilayam
              </p>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Peddawaltair, Visakhapatnam</p>
            </div>
          </div>
          <Link href="/login" className="btn btn-primary">
            Sign in <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* ── Hero ────────────────────────────────────── */}
        <section className="py-16 text-center sm:py-24">
          <p
            className="mx-auto mb-5 inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide"
            style={{ background: 'var(--surface-sunk)', color: 'var(--brass-deep)', boxShadow: 'var(--sunk)' }}
          >
            Andhra Pradesh State Board · Academic year 2024–25
          </p>
          <h1
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-serif), serif' }}
          >
            The whole school, on one desk.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            Attendance, marks, fees and transport for staff — and a portal where parents can see their own
            child&rsquo;s day without phoning the office.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="btn btn-primary">Sign in to your account</Link>
            <a
              href="https://github.com/dileep12072024-sudo/gvn-school-management"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Source on GitHub
            </a>
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--edge)' }} />

        {/* ── Modules ─────────────────────────────────── */}
        <section className="py-16">
          <h2
            className="mb-8 text-center text-2xl font-bold"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-serif), serif' }}
          >
            What it covers
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(m => (
              <article key={m.title} className="panel p-6">
                <div
                  className="mb-4 grid h-11 w-11 place-items-center rounded-[var(--radius)] text-white"
                  style={{
                    background: 'linear-gradient(180deg, var(--navy-lift), var(--navy) 60%, var(--navy-deep))',
                    boxShadow: '0 3px 0 var(--navy-deep), inset 0 1px 0 rgba(255,255,255,.25)',
                  }}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold" style={{ color: 'var(--ink)' }}>{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{m.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--edge)' }} />

        {/* ── Access ──────────────────────────────────── */}
        <section className="py-16">
          <div className="panel p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] text-white"
                style={{
                  background: 'linear-gradient(180deg, var(--brass-lift), var(--brass) 60%, var(--brass-deep))',
                  boxShadow: '0 3px 0 var(--brass-deep), inset 0 1px 0 rgba(255,255,255,.3)',
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
                  {['Organiser', 'Principal', 'Vice principal', 'Teacher', 'Parent', 'Student'].map(r => (
                    <span
                      key={r}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: 'var(--surface-sunk)', color: 'var(--ink-soft)', boxShadow: 'var(--sunk)' }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--edge)' }} />

        {/* ── Parent portal ───────────────────────────── */}
        <section className="py-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: CalendarCheck, k: 'Attendance', v: 'Day-by-day, with a running percentage.' },
              { icon: FileText,      k: 'Report card', v: 'Printable, with CGPA and grade bands.' },
              { icon: IndianRupee,   k: 'Fees', v: 'What is due, what is paid, receipt on demand.' },
            ].map(x => (
              <div key={x.k} className="plaque p-6">
                <x.icon className="mb-3 h-5 w-5" style={{ color: 'var(--brass)' }} />
                <p className="font-bold" style={{ color: 'var(--ink)' }}>{x.k}</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>{x.v}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--edge)', background: 'var(--surface)' }}>
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
