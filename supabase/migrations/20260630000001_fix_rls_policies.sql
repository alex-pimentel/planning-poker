-- 20260630000001_fix_rls_policies.sql
-- Fix security warnings: search_path, permissive RLS, anonymous grants

-- ──────────────────────────────────────────────
-- 1. Fix mutable search_path on handle_updated_at
-- ──────────────────────────────────────────────
ALTER FUNCTION public.handle_updated_at() SET search_path = '';

-- ──────────────────────────────────────────────
-- 2. Fix rooms INSERT policy — must set own mediator_id
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
CREATE POLICY "Anyone can create rooms"
    ON public.rooms FOR INSERT
    WITH CHECK (auth.uid() = mediator_id);

-- ──────────────────────────────────────────────
-- 3. Fix votes INSERT policy — must vote as self
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can upsert their own vote" ON public.votes;
CREATE POLICY "Users can upsert their own vote"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- 4. Remove anon role access (users always have authenticated role)
-- ──────────────────────────────────────────────
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
