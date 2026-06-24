import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/liquid-glass.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'GVN School Management',
    template: '%s | GVN School',
  },
  description: 'Geethanjali Vidya Nilayam — Peddawaltair, Visakhapatnam, Andhra Pradesh. Premium iOS 27 Liquid Glass UI',
  keywords: ['school management', 'GVN', 'Geethanjali Vidya Nilayam', 'Visakhapatnam', 'liquid glass', 'iOS 27'],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GVN School" />
      </head>
      <body className={inter.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#1e3a5f', secondary: '#fff' } },
          }}
        />
        {children}
      </body>
    </html>
  )
}
