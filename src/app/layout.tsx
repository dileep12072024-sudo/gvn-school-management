import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Interactions from '@/components/ui/Interactions'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
// A classic transitional serif for headings and the printed sheets.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'GVN School Management',
    template: '%s | GVN School',
  },
  description:
    'Geethanjali Vidya Nilayam — Peddawaltair, Visakhapatnam, Andhra Pradesh. Students, attendance, fees, exams and transport in one place.',
  keywords: ['school management', 'GVN', 'Geethanjali Vidya Nilayam', 'Visakhapatnam'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16274a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className={inter.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              fontSize: '14px',
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--edge)',
              boxShadow: '0 10px 24px rgba(22,32,46,.12), 0 2px 4px rgba(22,32,46,.07)',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          }}
        />
        <Interactions />
        {children}
      </body>
    </html>
  )
}
