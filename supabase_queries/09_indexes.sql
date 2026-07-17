-- ============================================
-- 09 — Performance indexes on hot query columns
-- Run in Supabase SQL Editor. Idempotent (CREATE INDEX IF NOT EXISTS).
-- Targets the columns hit most often by the read queries (dashboard, team,
-- leave, attendance, payroll, calendar, org tree).
-- ============================================

create index if not exists "User_department_idx" on "User"("department");
create index if not exists "User_managerId_idx" on "User"("managerId");
create index if not exists "User_role_idx" on "User"("role");
create index if not exists "User_status_idx" on "User"("status");
create index if not exists "User_isOwner_idx" on "User"("isOwner");

create index if not exists "Attendance_userId_date_idx" on "Attendance"("userId", "date");
create index if not exists "Attendance_date_idx" on "Attendance"("date");

create index if not exists "LeaveRequest_userId_idx" on "LeaveRequest"("userId");
create index if not exists "LeaveRequest_status_idx" on "LeaveRequest"("status");
create index if not exists "LeaveRequest_startDate_idx" on "LeaveRequest"("startDate");

create index if not exists "TeamTask_assigneeId_idx" on "TeamTask"("assigneeId");
create index if not exists "TeamTask_assignerId_idx" on "TeamTask"("assignerId");
create index if not exists "TeamTask_status_idx" on "TeamTask"("status");

create index if not exists "Payroll_userId_idx" on "Payroll"("userId");
create index if not exists "CalendarEvent_date_idx" on "CalendarEvent"("date");
create index if not exists "CalendarEvent_targetTeam_idx" on "CalendarEvent"("targetTeam");

create index if not exists "ReviewScore_userId_idx" on "ReviewScore"("userId");
create index if not exists "ReviewScore_reviewId_idx" on "ReviewScore"("reviewId");

create index if not exists "Event_timestamp_idx" on "Event"("timestamp");
create index if not exists "Notification_userId_idx" on "Notification"("userId");
create index if not exists "CompanyNews_pinned_created_idx" on "CompanyNews"("isPinned", "createdAt");

create index if not exists "Certification_userId_idx" on "Certification"("userId");
create index if not exists "Certification_expiryDate_idx" on "Certification"("expiryDate");
create index if not exists "ShiftAssignment_date_idx" on "ShiftAssignment"("date");
