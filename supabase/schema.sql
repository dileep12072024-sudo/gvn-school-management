-- ============================================================
-- GVN SCHOOL MANAGEMENT SYSTEM — SUPABASE SCHEMA
-- Geethanjali Vidya Nilayam, Peddawaltair, Visakhapatnam
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('organiser','principal','vice_principal','teacher','parent','student')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CLASSES & SECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT NOT NULL,
  grade      INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id   UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  teacher_id UUID,
  capacity   INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TEACHERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id            TEXT UNIQUE NOT NULL,
  profile_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name              TEXT NOT NULL,
  email                  TEXT UNIQUE NOT NULL,
  phone                  TEXT NOT NULL,
  subject_specialization TEXT[] DEFAULT '{}',
  qualification          TEXT NOT NULL,
  joining_date           DATE NOT NULL,
  status                 TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK after teachers created
ALTER TABLE public.sections
  ADD CONSTRAINT fk_sections_teacher
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- ============================================================
-- 4. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admission_number TEXT UNIQUE NOT NULL,
  full_name        TEXT NOT NULL,
  date_of_birth    DATE NOT NULL,
  gender           TEXT NOT NULL CHECK (gender IN ('male','female','other')),
  class_id         UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  section_id       UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  parent_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  address          TEXT NOT NULL,
  phone            TEXT,
  photo_url        TEXT,
  admission_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','transferred')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('present','absent','late','half_day')),
  marked_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- ============================================================
-- 6. FEES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fees (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id     UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  fee_type       TEXT NOT NULL,
  due_date       DATE NOT NULL,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','overdue')),
  paid_date      DATE,
  receipt_number TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. EXAMS & RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  class_id      UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject       TEXT NOT NULL,
  exam_date     DATE NOT NULL,
  max_marks     INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 35,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id         UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  marks_obtained  NUMERIC(5,2) NOT NULL,
  grade           TEXT,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- ============================================================
-- 8. TIMETABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id   UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  day        TEXT NOT NULL CHECK (day IN ('monday','tuesday','wednesday','thursday','friday','saturday')),
  period     INTEGER NOT NULL CHECK (period BETWEEN 1 AND 10),
  subject    TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. NOTICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notices (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  target_roles TEXT[] DEFAULT ARRAY['organiser','principal','vice_principal','teacher','parent','student'],
  priority     TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  pinned       BOOLEAN DEFAULT FALSE,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at   DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TRANSPORT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  route_name   TEXT NOT NULL,
  route_number TEXT UNIQUE NOT NULL,
  stops        TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type   TEXT DEFAULT 'bus' CHECK (vehicle_type IN ('bus','van','auto','car')),
  capacity       INTEGER NOT NULL,
  driver_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  route_id       UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_allocations (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id  UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  vehicle_id  UUID REFERENCES public.transport_vehicles(id) ON DELETE CASCADE NOT NULL,
  route_id    UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE NOT NULL,
  stop_name   TEXT,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- ============================================================
-- 11. CALENDAR EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  end_date    DATE,
  event_type  TEXT DEFAULT 'academic' CHECK (event_type IN ('academic','holiday','sports','cultural','exam','other')),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved    BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id  UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  leave_type  TEXT NOT NULL CHECK (leave_type IN ('sick','casual','earned','other')),
  from_date   DATE NOT NULL,
  to_date     DATE NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT NOT NULL,
  document_type TEXT DEFAULT 'circular' CHECK (document_type IN ('circular','syllabus','portfolio','other')),
  file_url      TEXT NOT NULL,
  target_roles  TEXT[] DEFAULT ARRAY['organiser','principal','vice_principal','teacher','parent','student'],
  uploaded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES: users can read all, update own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- CLASSES: all authenticated can read; admins can write
CREATE POLICY "classes_select" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "classes_write" ON public.classes FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- SECTIONS: all read; admins write
CREATE POLICY "sections_select" ON public.sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sections_write" ON public.sections FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- TEACHERS: all authenticated read; admins write
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_write" ON public.teachers FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- STUDENTS: all auth read; admins & teachers write
CREATE POLICY "students_select" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "students_write" ON public.students FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal','teacher'));

-- ATTENDANCE: teachers & admins write; all read
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "attendance_write" ON public.attendance FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal','teacher'));

-- FEES: admins read/write; parents read own
CREATE POLICY "fees_select" ON public.fees FOR SELECT USING (
  get_my_role() IN ('organiser','principal','vice_principal') OR
  EXISTS (SELECT 1 FROM public.students s WHERE s.id = fees.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "fees_write" ON public.fees FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- EXAMS: all auth read; admins & teachers write
CREATE POLICY "exams_select" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "exams_write" ON public.exams FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal','teacher'));

CREATE POLICY "results_select" ON public.exam_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "results_write" ON public.exam_results FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal','teacher'));

-- TIMETABLE: all read; admins write
CREATE POLICY "timetable_select" ON public.timetable FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "timetable_write" ON public.timetable FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- NOTICES: all read; admins & teachers write
CREATE POLICY "notices_select" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "notices_write" ON public.notices FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal','teacher'));

-- TRANSPORT: all auth read; admins write
CREATE POLICY "transport_routes_select" ON public.transport_routes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transport_routes_write" ON public.transport_routes FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));
CREATE POLICY "transport_vehicles_select" ON public.transport_vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transport_vehicles_write" ON public.transport_vehicles FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));
CREATE POLICY "transport_alloc_select" ON public.transport_allocations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transport_alloc_write" ON public.transport_allocations FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- CALENDAR: all read; admins write
CREATE POLICY "calendar_select" ON public.calendar_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "calendar_write" ON public.calendar_events FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- MESSAGES: users read/write their own
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (from_id = auth.uid() OR to_id = auth.uid());
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (from_id = auth.uid());
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (to_id = auth.uid());

-- LEAVE: teachers read own; admins read all
CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT USING (
  get_my_role() IN ('organiser','principal','vice_principal') OR
  EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = leave_requests.teacher_id AND t.profile_id = auth.uid())
);
CREATE POLICY "leave_insert" ON public.leave_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = leave_requests.teacher_id AND t.profile_id = auth.uid())
);
CREATE POLICY "leave_update" ON public.leave_requests FOR UPDATE USING (get_my_role() IN ('organiser','principal','vice_principal'));

-- DOCUMENTS: all read; admins write
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "documents_write" ON public.documents FOR ALL USING (get_my_role() IN ('organiser','principal','vice_principal','teacher'));

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-docs', 'school-docs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "school_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'school-docs');
CREATE POLICY "school_docs_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'school-docs' AND auth.role() = 'authenticated'
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON public.fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_exams_class ON public.exams(class_id);
CREATE INDEX IF NOT EXISTS idx_notices_created ON public.notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to ON public.messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_from ON public.messages(from_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON public.calendar_events(event_date);
