-- =====================================================================
-- Notices — add `received_date` (تاريخ الإستلام), set separately from the
-- existing `notice_date` (renamed in the UI to تاريخ الإرسال, "sent date").
-- =====================================================================

alter table public.notices
  add column if not exists received_date date; -- تاريخ الإستلام
