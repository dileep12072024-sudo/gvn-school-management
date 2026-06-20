import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr = 'dd MMM yyyy') {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, formatStr) : 'Invalid date'
  } catch {
    return 'Invalid date'
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    organiser: 'bg-purple-100 text-purple-800',
    principal: 'bg-navy-100 text-navy-800',
    vice_principal: 'bg-blue-100 text-blue-800',
    teacher: 'bg-green-100 text-green-800',
    parent: 'bg-orange-100 text-orange-800',
    student: 'bg-yellow-100 text-yellow-800',
  }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    organiser: 'Organiser',
    principal: 'Principal',
    vice_principal: 'Vice Principal',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student',
  }
  return labels[role] || role
}

export function getAttendanceColor(status: string) {
  const colors: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-yellow-100 text-yellow-700',
    half_day: 'bg-orange-100 text-orange-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getFeeStatusColor(status: string) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return colors[priority] || 'bg-gray-100 text-gray-700'
}

export function getEventTypeColor(type: string) {
  const colors: Record<string, string> = {
    academic: 'bg-blue-500',
    holiday: 'bg-green-500',
    sports: 'bg-orange-500',
    cultural: 'bg-purple-500',
    exam: 'bg-red-500',
    other: 'bg-gray-500',
  }
  return colors[type] || 'bg-gray-500'
}
