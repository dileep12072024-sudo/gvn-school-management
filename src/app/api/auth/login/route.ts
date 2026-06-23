export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { DEMO_USERS, SESSION_COOKIE } from '@/lib/mock-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const key = (email ?? '').toLowerCase()
    const user = DEMO_USERS[key]

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const response = NextResponse.json({ profile: user.profile })
    response.cookies.set(SESSION_COOKIE, JSON.stringify(user.profile), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
