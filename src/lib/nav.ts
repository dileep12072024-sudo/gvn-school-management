// Single source of truth for "who may see which route".
// Consumed by Sidebar (to render links) and middleware (to enforce them).
// Keep this file free of React/lucide imports — it runs in edge middleware.

export type UserRole =
  | 'organiser'
  | 'principal'
  | 'vice_principal'
  | 'teacher'
  | 'parent'
  | 'student'

export const ALL_ROLES: UserRole[] = [
  'organiser', 'principal', 'vice_principal', 'teacher', 'parent', 'student',
]

/** Roles that administer the school rather than consume it. */
export const ADMIN_ROLES: UserRole[] = ['organiser', 'principal', 'vice_principal']
export const STAFF_ROLES: UserRole[] = [...ADMIN_ROLES, 'teacher']
/** Roles that only ever see their own / their child's records. */
export const PORTAL_ROLES: UserRole[] = ['parent', 'student']

export interface NavItem {
  href: string
  label: string
  roles: UserRole[]
  /** Grouping for the sidebar. */
  group: 'Overview' | 'Academics' | 'People' | 'Operations' | 'Admin'
  /** Permission-gated but not a sidebar destination (detail/print routes). */
  hidden?: boolean
}

export const NAV: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',       roles: ALL_ROLES,                       group: 'Overview' },
  { href: '/portal',      label: 'My Child',        roles: PORTAL_ROLES,                    group: 'Overview' },

  { href: '/attendance',  label: 'Attendance',      roles: STAFF_ROLES,                     group: 'Academics' },
  { href: '/exams',       label: 'Exams & Results', roles: STAFF_ROLES,                     group: 'Academics' },
  { href: '/timetable',   label: 'Timetable',       roles: ALL_ROLES,                       group: 'Academics' },
  { href: '/classes',     label: 'Classes',         roles: STAFF_ROLES,                     group: 'Academics' },

  { href: '/students',    label: 'Students',        roles: STAFF_ROLES,                     group: 'People' },
  { href: '/teachers',    label: 'Teachers',        roles: ADMIN_ROLES,                     group: 'People' },
  { href: '/leave',       label: 'Leave',           roles: STAFF_ROLES,                     group: 'People' },

  { href: '/fees',        label: 'Fees',            roles: ADMIN_ROLES,                     group: 'Operations' },
  { href: '/transport',   label: 'Transport',       roles: [...ADMIN_ROLES, 'parent'],      group: 'Operations' },
  { href: '/documents',   label: 'Documents',       roles: ALL_ROLES,                       group: 'Operations' },

  { href: '/notices',     label: 'Notices',         roles: ALL_ROLES,                       group: 'Admin' },
  { href: '/calendar',    label: 'Calendar',        roles: ALL_ROLES,                       group: 'Admin' },
  { href: '/messages',    label: 'Messages',        roles: [...STAFF_ROLES, 'parent'],      group: 'Admin' },
  // Account settings — every signed-in user needs their own profile/password.
  { href: '/settings',    label: 'Settings',        roles: ALL_ROLES,                       group: 'Admin' },

  // Print / detail routes — reachable by link, never listed in the sidebar.
  { href: '/receipts',    label: 'Receipt',         roles: [...ADMIN_ROLES, 'parent'],      group: 'Operations', hidden: true },
  { href: '/report-card', label: 'Report card',     roles: [...STAFF_ROLES, ...PORTAL_ROLES], group: 'Academics', hidden: true },
]

export const NAV_GROUPS = ['Overview', 'Academics', 'People', 'Operations', 'Admin'] as const

/** Longest-prefix match, so /students/abc inherits /students' rules. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV
    .filter(i => pathname === i.href || pathname.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

export function canAccess(role: string | undefined, pathname: string): boolean {
  const item = navItemForPath(pathname)
  if (!item) return true // not a guarded route
  return !!role && item.roles.includes(role as UserRole)
}

/** Where to send someone who just signed in, or who hit a route they may not see. */
export function landingFor(role: string | undefined): string {
  return PORTAL_ROLES.includes(role as UserRole) ? '/portal' : '/dashboard'
}

export function isAdmin(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role as UserRole)
}

export function isStaff(role: string | undefined): boolean {
  return STAFF_ROLES.includes(role as UserRole)
}
