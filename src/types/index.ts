export type UserRole = 'organiser' | 'principal' | 'vice_principal' | 'teacher' | 'parent' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  created_at: string
}

export interface Student {
  id: string
  admission_number: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  class_id: string
  section_id: string
  parent_id?: string
  address: string
  phone?: string
  photo_url?: string
  admission_date: string
  status: 'active' | 'inactive' | 'transferred'
  class_name?: string
  section_name?: string
  created_at: string
}

export interface Teacher {
  id: string
  employee_id: string
  profile_id: string
  full_name: string
  email: string
  phone: string
  subject_specialization: string[]
  qualification: string
  joining_date: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface Class {
  id: string
  name: string
  grade: number
  created_at: string
}

export interface Section {
  id: string
  class_id: string
  name: string
  teacher_id?: string
  capacity: number
  created_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'half_day'
  marked_by: string
  student_name?: string
  created_at: string
}

export interface Fee {
  id: string
  student_id: string
  amount: number
  fee_type: string
  due_date: string
  status: 'paid' | 'pending' | 'overdue'
  paid_date?: string
  receipt_number?: string
  student_name?: string
  class_name?: string
  created_at: string
}

export interface Exam {
  id: string
  name: string
  class_id: string
  subject: string
  exam_date: string
  max_marks: number
  passing_marks: number
  class_name?: string
  created_at: string
}

export interface ExamResult {
  id: string
  exam_id: string
  student_id: string
  marks_obtained: number
  grade: string
  remarks?: string
  student_name?: string
  created_at: string
}

export interface TimetableSlot {
  id: string
  class_id: string
  section_id: string
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  period: number
  subject: string
  teacher_id: string
  teacher_name?: string
  start_time: string
  end_time: string
  created_at: string
}

export interface Notice {
  id: string
  title: string
  content: string
  target_roles: UserRole[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  pinned: boolean
  created_by: string
  created_by_name?: string
  expires_at?: string
  created_at: string
}

export interface TransportRoute {
  id: string
  route_name: string
  route_number: string
  stops: string[]
  created_at: string
}

export interface TransportVehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
  capacity: number
  driver_id?: string
  route_id?: string
  driver_name?: string
  route_name?: string
  created_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  event_date: string
  end_date?: string
  event_type: 'academic' | 'holiday' | 'sports' | 'cultural' | 'exam' | 'other'
  created_by: string
  approved: boolean
  created_at: string
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  subject: string
  body: string
  read: boolean
  from_name?: string
  to_name?: string
  created_at: string
}

export interface LeaveRequest {
  id: string
  teacher_id: string
  teacher_name?: string
  leave_type: 'sick' | 'casual' | 'earned' | 'other'
  from_date: string
  to_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  created_at: string
}

export interface Document {
  id: string
  title: string
  document_type: 'circular' | 'syllabus' | 'portfolio' | 'other'
  file_url: string
  target_roles: UserRole[]
  uploaded_by: string
  uploader_name?: string
  created_at: string
}

export interface DashboardStats {
  total_students: number
  total_teachers: number
  attendance_today: number
  total_fees_collected: number
  pending_fees: number
  upcoming_exams: number
}
