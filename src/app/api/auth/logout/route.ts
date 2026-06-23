export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/mock-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
