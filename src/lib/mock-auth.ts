export type MockProfile = {
  id: string
  email: string
  role: string
  full_name: string
}

export const DEMO_USERS: Record<string, { password: string; profile: MockProfile }> = {
  'organiser@gvn.edu.in': {
    password: 'GVN@2024!',
    profile: { id: 'u1', email: 'organiser@gvn.edu.in', role: 'organiser', full_name: 'School Organiser' },
  },
  'principal@gvn.edu.in': {
    password: 'GVN@2024!',
    profile: { id: 'u2', email: 'principal@gvn.edu.in', role: 'principal', full_name: 'Dr. K. Ramaiah' },
  },
  'vp@gvn.edu.in': {
    password: 'GVN@2024!',
    profile: { id: 'u3', email: 'vp@gvn.edu.in', role: 'vice_principal', full_name: 'Mrs. S. Lakshmi' },
  },
  'teacher@gvn.edu.in': {
    password: 'GVN@2024!',
    profile: { id: 'u4', email: 'teacher@gvn.edu.in', role: 'teacher', full_name: 'Mr. P. Venkat' },
  },
  'parent@gvn.edu.in': {
    password: 'GVN@2024!',
    profile: { id: 'u5', email: 'parent@gvn.edu.in', role: 'parent', full_name: 'Mr. R. Sharma' },
  },
}

export const SESSION_COOKIE = 'gvn_session'
