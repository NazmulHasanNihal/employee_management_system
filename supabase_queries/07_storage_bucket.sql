-- ============================================
-- 07 — Storage bucket: ems-uploads
-- Run in Supabase SQL Editor (or via supabase CLI). Idempotent.
-- Holds avatars (public) and documents (private).
-- ============================================

insert into storage.buckets (id, name, public)
values ('ems-uploads', 'ems-uploads', true)
on conflict (id) do update set public = true;
