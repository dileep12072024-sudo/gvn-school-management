'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, Lock, Mail, Users, ClipboardCheck, BookOpen, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { role: 'Organiser',      email: 'organiser@gvn.edu.in',  password: 'GVN@2024!' },
  { role: 'Principal',      email: 'principal@gvn.edu.in',  password: 'GVN@2024!' },
  { role: 'Vice Principal', email: 'vp@gvn.edu.in',         password: 'GVN@2024!' },
  { role: 'Teacher',        email: 'teacher@gvn.edu.in',    password: 'GVN@2024!' },
  { role: 'Parent',         email: 'parent@gvn.edu.in',     password: 'GVN@2024!' },
]

const FEATURES = [
  { icon: Users,         label: 'Students & Attendance', desc: 'Track daily attendance & academic progress' },
  { icon: ClipboardCheck,label: 'Fees & Exams',          desc: 'Manage payments & exam results' },
  { icon: BookOpen,      label: 'Timetable & Transport', desc: 'Schedule classes & manage routes' },
  { icon: Calendar,      label: 'Notices & Events',      desc: 'Stay updated with school news' },
]

export default function LoginPage() {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invalid credentials')
      } else {
        toast.success('Welcome back!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-animated-gradient">

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern" />

      {/* Floating ambient orbs */}
      <div className="absolute top-12 left-12 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-gold-500/15 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div
        className="absolute bottom-1/3 left-1/5 w-52 h-52 bg-purple-500/10 rounded-full blur-3xl animate-float pointer-events-none"
        style={{ animationDelay: '3s' }}
      />

      {/* Floating geometric accents */}
      <div className="absolute top-24 right-1/4 w-8 h-8 border-2 border-white/10 rounded-lg rotate-45 animate-float-slow pointer-events-none" />
      <div
        className="absolute bottom-28 left-1/3 w-5 h-5 border-2 border-gold-400/20 rounded-full animate-float pointer-events-none"
        style={{ animationDelay: '1.5s' }}
      />
      <div className="absolute top-1/3 right-24 w-3 h-3 bg-white/8 rounded animate-float-delayed pointer-events-none" />

      {/* Card container */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">

        {/* ── Left Panel: glassmorphism dark ───────────────── */}
        <div className="hidden lg:flex flex-col justify-between glass-dark p-10 text-white relative overflow-hidden">
          {/* Inner ambient glows */}
          <div className="absolute -top-8 -right-8 w-64 h-64 bg-gold-500/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-52 h-52 bg-blue-500/12 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-4 relative z-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl animate-pulse-glow shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl leading-tight text-gradient-gold">Geethanjali</p>
              <p className="text-blue-300/80 text-sm tracking-wide">Vidya Nilayam</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-blue-200 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Academic Year 2024–25
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              School<br />
              <span className="text-gradient-gold">Management</span><br />
              System
            </h2>
            <p className="text-blue-300/80 text-sm leading-relaxed">
              Peddawaltair, Visakhapatnam<br />
              Andhra Pradesh · Empowering education<br />
              through smart administration.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2.5 relative z-10">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.2)' }}>
                  <f.icon className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">{f.label}</p>
                  <p className="text-xs text-blue-300/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel: frosted white form ──────────────── */}
        <div className="glass-white p-8 md:p-10 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-[#1e3a5f]">GVN School</p>
              <p className="text-gray-400 text-xs">Management System</p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your school account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@gvn.edu.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient flex items-center justify-center gap-2 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="text-xs text-gray-400 font-medium tracking-widest px-2">DEMO ACCOUNTS</p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password) }}
                  className="text-left px-3 py-2 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 text-xs transition-all duration-200 group"
                >
                  <span className="font-semibold text-[#1e3a5f] group-hover:text-blue-700">{acc.role}:</span>
                  <span className="text-gray-500 ml-1.5">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
