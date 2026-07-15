-- ============================================
-- Set System Owner
-- Run this in Supabase SQL Editor
-- This ensures nazmulhas36@gmail.com is the 
-- system owner with Admin/CEO privileges
-- ============================================

-- Add isOwner column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- Set the owner
UPDATE "User" 
SET 
    "role" = 'Admin',
    "designation" = 'CEO',
    "department" = 'Executive',
    "isOwner" = true,
    "status" = 'active'
WHERE "email" = 'nazmulhas36@gmail.com';
