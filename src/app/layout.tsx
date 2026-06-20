import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'GVN School Management',
    template: '%s | GVN School',
  },
  description: 'Geethanjali Vidya Nilayam — Peddawaltair, Visakhapatnam, Andhra Pradesh',
  keywords: ['school management', 'GVN', 'Geethanjali Vidya Nilayam', 'Visakhapatnam'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
