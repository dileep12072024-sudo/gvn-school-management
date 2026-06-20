-- ============================================================
-- GVN SCHOOL — SEED DATA
-- Run AFTER schema.sql in Supabase SQL Editor
-- Creates demo accounts + sample data
-- ============================================================

-- NOTE: Create these users in Supabase Auth Dashboard first:
-- organiser@gvn.edu.in / GVN@2024!
-- principal@gvn.edu.in / GVN@2024!
-- vp@gvn.edu.in / GVN@2024!
-- teacher@gvn.edu.in / GVN@2024!
-- parent@gvn.edu.in / GVN@2024!
-- Then run this seed to set their roles and create sample data.

-- Update roles (replace UUIDs with actual auth user IDs)
-- UPDATE public.profiles SET role = 'organiser'  WHERE email = 'organiser@gvn.edu.in';
-- UPDATE public.profiles SET role = 'principal'  WHERE email = 'principal@gvn.edu.in';
-- UPDATE public.profiles SET role = 'vice_principal' WHERE email = 'vp@gvn.edu.in';
-- UPDATE public.profiles SET role = 'teacher'    WHERE email = 'teacher@gvn.edu.in';
-- UPDATE public.profiles SET role = 'parent'     WHERE email = 'parent@gvn.edu.in';

-- ============================================================
-- SAMPLE CLASSES
-- ============================================================
INSERT INTO public.classes (name, grade) VALUES
  ('Class 1', 1), ('Class 2', 2), ('Class 3', 3),
  ('Class 4', 4), ('Class 5', 5), ('Class 6', 6),
  ('Class 7', 7), ('Class 8', 8), ('Class 9', 9),
  ('Class 10', 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE NOTICES
-- ============================================================
INSERT INTO public.notices (title, content, priority, pinned, target_roles) VALUES
  ('Welcome to GVN School Management System',
   'This system helps manage all school activities. Please explore all modules.',
   'high', true,
   ARRAY['organiser','principal','vice_principal','teacher','parent','student']),
  ('Annual Day Preparations',
   'Annual day celebrations are scheduled for 15th January. All students must participate in cultural programs.',
   'urgent', true,
   ARRAY['teacher','parent','student']),
  ('Fee Due Reminder',
   'Term 2 fees are due by 31st December. Kindly pay at the school office or online.',
   'high', false,
   ARRAY['parent']),
  ('Staff Meeting',
   'A staff meeting is scheduled for Saturday at 10:00 AM in the conference hall.',
   'medium', false,
   ARRAY['organiser','principal','vice_principal','teacher'])
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE CALENDAR EVENTS
-- ============================================================
INSERT INTO public.calendar_events (title, description, event_date, event_type, approved) VALUES
  ('Independence Day', 'National holiday - school closed', '2024-08-15', 'holiday', true),
  ('Gandhi Jayanti', 'National holiday', '2024-10-02', 'holiday', true),
  ('Annual Sports Day', 'Inter-class sports competition at school ground', '2024-11-20', 'sports', true),
  ('Half-Yearly Exams Begin', 'Half-yearly examinations start', '2024-12-01', 'exam', true),
  ('Christmas Holidays', 'School closed for Christmas', '2024-12-25', 'holiday', true),
  ('Republic Day', 'National holiday', '2025-01-26', 'holiday', true),
  ('Annual Day', 'Cultural programs and prize distribution', '2025-01-15', 'cultural', true),
  ('Annual Exams Begin', 'Final annual examinations', '2025-03-01', 'exam', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE TRANSPORT ROUTES
-- ============================================================
INSERT INTO public.transport_routes (route_name, route_number, stops) VALUES
  ('Peddawaltair Main Route', 'R-01',
   ARRAY['Peddawaltair Bus Stop', 'MVP Colony Gate', 'Rushikonda Junction', 'Steel Plant Area', 'School']),
  ('Gajuwaka Route', 'R-02',
   ARRAY['Gajuwaka Centre', 'Autonagar', 'Pedagantyada', 'Bheemunipatnam Road', 'School']),
  ('Seethammadhara Route', 'R-03',
   ARRAY['Seethammadhara', 'NAD Junction', 'Old Town', 'Dwaraka Nagar', 'School'])
ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted successfully!' AS status;
