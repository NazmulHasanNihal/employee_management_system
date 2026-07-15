-- ============================================
-- TeamTask Table
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS "TeamTask" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "status"      TEXT NOT NULL DEFAULT 'ToDo',        -- ToDo, InProgress, Done, Blocked
    "priority"    TEXT NOT NULL DEFAULT 'Medium',      -- Low, Medium, High
    "assigneeId"  TEXT NOT NULL,
    "assignerId"  TEXT NOT NULL,
    "dueDate"     TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamTask_assignerId_fkey" FOREIGN KEY ("assignerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "TeamTask_assigneeId_idx" ON "TeamTask"("assigneeId");
CREATE INDEX IF NOT EXISTS "TeamTask_assignerId_idx" ON "TeamTask"("assignerId");
CREATE INDEX IF NOT EXISTS "TeamTask_status_idx" ON "TeamTask"("status");
CREATE INDEX IF NOT EXISTS "TeamTask_dueDate_idx" ON "TeamTask"("dueDate");
