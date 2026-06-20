'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GraduationCap, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { role: 'Organiser', email: 'organiser@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Principal', email: 'principal@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Vice Principal', email: 'vp@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Teacher', email: 'teacher@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Parent', email: 'parent@gvn.edu.in', password: 'GVN@2024!' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2e5a96] to-[#1e3a5f] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-between bg-[#152a45] p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#f59e0b] rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Geethanjali</p>
              <p className="text-blue-300 text-sm">Vidya Nilayam</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3">School Management System</h2>
            <p className="text-blue-300 text-sm leading-relaxed">
              Peddawaltair, Visakhapatnam, Andhra Pradesh<br />
              Empowering education through smart administration.
            </p>
          </div>
          <div className="space-y-3">
            {['Students & Attendance', 'Fees & Exams', 'Timetable & Transport', 'Notices & Events'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-blue-200">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 md:hidden">
              <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <div>
                <p className="font-bold text-[#1e3a5f]">GVN School</p>
                <p className="text-gray-400 text-xs">Management System</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@gvn.edu.in"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-9 pr-10"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-3 font-medium">DEMO ACCOUNTS</p>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password) }}
                  className="text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent text-xs transition-all">
                  <span className="font-semibold text-[#1e3a5f]">{acc.role}:</span>
                  <span className="text-gray-500 ml-1">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
