-- ============================================
-- CalendarEvent Table
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"           TEXT NOT NULL,
    "description"     TEXT,
    "date"            TIMESTAMP(3) NOT NULL,
    "endDate"         TIMESTAMP(3),                       -- Nullable, for multi-day events
    "type"            TEXT NOT NULL DEFAULT 'General',     -- Holiday, Meeting, Payroll, Task, Reminder, Social, General
    "creatorId"       TEXT NOT NULL,
    "assigneeId"      TEXT,                                -- Nullable, for assigned tasks
    "targetTeam"      TEXT,                                -- Nullable, for team-wide events
    "isRecurring"     BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule"  TEXT,                                 -- iCal RRULE string (e.g., FREQ=WEEKLY;BYDAY=MO)
    "status"          TEXT NOT NULL DEFAULT 'Pending',     -- Pending, InProgress, Done, Cancelled
    "reminderMinutes" INTEGER DEFAULT 30,                  -- Minutes before event to send reminder
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "CalendarEvent_date_idx" ON "CalendarEvent"("date");
CREATE INDEX IF NOT EXISTS "CalendarEvent_creatorId_idx" ON "CalendarEvent"("creatorId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_assigneeId_idx" ON "CalendarEvent"("assigneeId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_type_idx" ON "CalendarEvent"("type");
CREATE INDEX IF NOT EXISTS "CalendarEvent_status_idx" ON "CalendarEvent"("status");
