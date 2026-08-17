-- ============================================================
-- 001 — Parent/student portal
--
-- Two things:
--   1. students.profile_id, so a `student` role login can be tied to its own
--      student record (parent_id already covers the parent side).
--   2. Narrow the read policies. `auth.role() = 'authenticated'` let ANY
--      signed-in user — including every parent — read every student's
--      attendance, marks and personal details. Staff keep full read; parents
--      and students see only their own rows.
--
-- Safe to re-run.
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_profile ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_parent  ON public.students(parent_id);

-- True when the signed-in user is that student, or that student's parent.
CREATE OR REPLACE FUNCTION public.owns_student(sid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = sid AND (s.parent_id = auth.uid() OR s.profile_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT public.get_my_role() IN ('organiser','principal','vice_principal','teacher');
$$;

DROP POLICY IF EXISTS "students_select"   ON public.students;
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "results_select"    ON public.exam_results;

CREATE POLICY "students_select" ON public.students FOR SELECT
  USING (public.is_staff() OR public.owns_student(id));

CREATE POLICY "attendance_select" ON public.attendance FOR SELECT
  USING (public.is_staff() OR public.owns_student(student_id));

CREATE POLICY "results_select" ON public.exam_results FOR SELECT
  USING (public.is_staff() OR public.owns_student(student_id));

-- fees_select already scoped parents by parent_id; extend it to student logins.
DROP POLICY IF EXISTS "fees_select" ON public.fees;
CREATE POLICY "fees_select" ON public.fees FOR SELECT
  USING (
    public.get_my_role() IN ('organiser','principal','vice_principal')
    OR public.owns_student(student_id)
  );

-- Transport allocations are the parent's business too.
DROP POLICY IF EXISTS "transport_alloc_select" ON public.transport_allocations;
CREATE POLICY "transport_alloc_select" ON public.transport_allocations FOR SELECT
  USING (public.is_staff() OR public.owns_student(student_id));
