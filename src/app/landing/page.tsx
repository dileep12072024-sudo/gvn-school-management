import type { Metadata } from 'next'
import { ChevronRight, Smartphone, Monitor, Zap, Lock, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GVN School Management | iOS 27 Liquid Glass UI',
  description: 'Premium school management system with iOS 27 liquid glass polished UI. Mobile-first responsive design.',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
}

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-liquid-gradient overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="fixed inset-0 bg-black/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header/Navigation */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/10 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">GVN</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg hidden sm:block">GVN School</h1>
                <p className="text-xs text-gray-300 hidden sm:block">Liquid Glass UI</p>
              </div>
            </div>
            <Link href="/login" className="btn-liquid-primary text-sm sm:text-base">
              Login <ChevronRight className="inline w-4 h-4 ml-1" />
            </Link>
          </div>
        </header>

        {/* Hero Section - Mobile First */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          {/* Floating Elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />

          <div className="relative">
            {/* Main Heading */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-block mb-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
                <p className="text-xs sm:text-sm text-white/80">
                  ✨ iOS 27 Liquid Glass Polished UI
                </p>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Premium School
                <br className="hidden sm:block" />
                <span className="text-gradient-gold">Management System</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-2xl mx-auto mb-8">
                Geethanjali Vidya Nilayam's comprehensive full-stack solution with glassmorphic design, 
                liquid animations, and seamless mobile-to-desktop experience.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8">
                <Link href="/login" className="btn-liquid-primary w-full sm:w-auto">
                  View Dashboard
                </Link>
                <a 
                  href="https://github.com/dileep12072024-sudo/gvn-school-management" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-liquid-glass w-full sm:w-auto"
                >
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Feature Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-12 sm:mt-16">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="liquid-glass rounded-2xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300 group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-xs text-gray-300 hidden sm:block">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* UI Effects Showcase - Mobile First */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              Premium <span className="text-gradient-gold">UI Components</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-300">Mobile-first responsive design with liquid glass effects</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 - Stat Card */}
            <div className="stat-card-liquid">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-300">Total Students</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">1,240</h3>
                </div>
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gold-400" />
              </div>
              <p className="text-xs text-green-400">↑ 12% from last month</p>
            </div>

            {/* Card 2 - Revenue */}
            <div className="stat-card-liquid">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-300">Monthly Revenue</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">₹2.4L</h3>
                </div>
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-gold-400" />
              </div>
              <p className="text-xs text-green-400">↑ 8% from last month</p>
            </div>

            {/* Card 3 - Attendance */}
            <div className="stat-card-liquid">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-300">Attendance Rate</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">94.2%</h3>
                </div>
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-gold-400" />
              </div>
              <p className="text-xs text-green-400">↑ 3% from last week</p>
            </div>
          </div>
        </section>

        {/* Demo Accounts Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="frosted-modal rounded-3xl p-6 sm:p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Demo Accounts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoAccounts.map((account, idx) => (
                <div key={idx} className="bg-white/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-white/20">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-3">{account.role}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Email:</span> <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm">{account.email}</code></p>
                    <p><span className="text-gray-600">Password:</span> <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm">{account.password}</code></p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">ℹ️ Note:</span> All demo accounts are available after database seeding. 
                Use any of the above credentials to explore different dashboard roles.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Stack - Mobile First */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              Built with Modern <span className="text-gradient-gold">Technologies</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {techStack.map((tech, idx) => (
              <div key={idx} className="liquid-glass rounded-2xl p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-2">{tech.icon}</div>
                <p className="text-xs sm:text-sm font-medium text-white">{tech.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-t border-white/10 backdrop-blur-xl bg-black/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-gold-400 transition">Features</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-gold-400 transition">About</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">Blog</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-gold-400 transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">Terms</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">License</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Social</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-gold-400 transition">GitHub</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">Twitter</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition">LinkedIn</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <p className="text-center text-sm text-gray-400">
                © 2024 Geethanjali Vidya Nilayam. Built with ❤️ by NETETI DILIP
              </p>
              <p className="text-center text-xs text-gray-500 mt-2">
                iOS 27 Liquid Glass UI System • Cloudflare Pages Deployment
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

const features = [
  { icon: Smartphone, title: 'Mobile First', desc: 'Optimized for all devices' },
  { icon: Monitor, title: 'Responsive', desc: 'Perfect on desktop too' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Powered by Next.js 14' },
  { icon: Lock, title: 'Secure Auth', desc: 'Role-based access control' },
  { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards' },
  { icon: Users, title: '6 Roles', desc: 'Complete hierarchy' },
]

const demoAccounts = [
  { role: 'Organiser', email: 'organiser@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Principal', email: 'principal@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Vice Principal', email: 'vp@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Teacher', email: 'teacher@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Parent', email: 'parent@gvn.edu.in', password: 'GVN@2024!' },
  { role: 'Student', email: 'student@gvn.edu.in', password: 'GVN@2024!' },
]

const techStack = [
  { icon: '⚛️', name: 'Next.js 14' },
  { icon: '🎨', name: 'Tailwind CSS' },
  { icon: '💎', name: 'Liquid Glass' },
  { icon: '🗄️', name: 'Supabase' },
  { icon: '☁️', name: 'Cloudflare' },
]
