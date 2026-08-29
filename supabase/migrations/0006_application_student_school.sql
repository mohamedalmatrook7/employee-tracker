-- =====================================================================
-- Applications: add student details + school (اسم الطالب / الرقم الشخصي / المدرسة)
--
-- Applications now capture the student the request concerns and the school
-- they belong to, mirroring notices. `school_name` is a plain-text snapshot
-- (like notices.school_name): a school typed here becomes reusable in the
-- shared school picker (schools ∪ notices ∪ applications) alongside the fixed
-- events schools, WITHOUT growing the fixed events school list.
-- =====================================================================

alter table public.applications
  add column if not exists student_name text,   -- اسم الطالب
  add column if not exists student_cpr text,    -- الرقم الشخصي للطالب
  add column if not exists school_name text;     -- المدرسة (snapshot)
