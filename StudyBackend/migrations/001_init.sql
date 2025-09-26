-- ===========================================
-- 0) Extension & common functions
-- ===========================================
-- Install the pgcrypto extension if it is not already available. This provides gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update the updated_at column on UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

-- Function to prevent user_id changes on UPDATE. If the user_id is different from the old value, raise an exception.
CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable';
  END IF;
  RETURN NEW;
END; $$;

-- ===========================================
-- 1) profiles table, triggers, and RLS policies
-- ===========================================
-- Create the profiles table. Each profile references auth.users via id. If the user in auth.users is deleted, cascade the delete to profiles.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  birth_date DATE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create or replace the handle_new_user function. This will run after a new user is created in auth.users. It inserts a matching row into profiles with the user metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a profile for the new user. If a profile with the same ID already exists, do nothing.
  INSERT INTO public.profiles (id, name, email, birth_date, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'birth','')::DATE,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- Drop any existing trigger on auth.users for new user creation, then create a fresh trigger to call handle_new_user after insert.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on profiles before update.
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable row-level security on profiles and define policies so that users can only see, update, or insert their own profile.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ===========================================
-- 2) goals table (오늘 목표)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes to speed up lookups by user and done status.
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_done ON public.goals(user_id, done);

-- Trigger to update updated_at on goals before update.
DROP TRIGGER IF EXISTS trg_goals_updated_at ON public.goals;
CREATE TRIGGER trg_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to enforce that user_id cannot change.
DROP TRIGGER IF EXISTS trg_goals_user_immutable ON public.goals;
CREATE TRIGGER trg_goals_user_immutable
BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

-- Enable RLS and define policies so that users can only read, insert, update, or delete their own goals.
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;

CREATE POLICY "goals_select_own"
  ON public.goals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "goals_insert_own"
  ON public.goals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_update_own"
  ON public.goals FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_delete_own"
  ON public.goals FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- 3) schedules table (플랜/일정)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  descr TEXT,
  date DATE NOT NULL,
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  alarm_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on user and date for schedules.
CREATE INDEX IF NOT EXISTS idx_schedules_user ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(user_id, date);

-- Trigger to update updated_at on schedules before update.
DROP TRIGGER IF EXISTS trg_schedules_updated_at ON public.schedules;
CREATE TRIGGER trg_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to enforce immutability of user_id.
DROP TRIGGER IF EXISTS trg_schedules_user_immutable ON public.schedules;
CREATE TRIGGER trg_schedules_user_immutable
BEFORE UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

-- Enable RLS and define policies for schedules.
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select_own" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert_own" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update_own" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete_own" ON public.schedules;

CREATE POLICY "schedules_select_own"
  ON public.schedules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "schedules_insert_own"
  ON public.schedules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "schedules_update_own"
  ON public.schedules FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "schedules_delete_own"
  ON public.schedules FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- 4) user_settings table and triggers (프로필 생성 시 자동 생성)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_lock BOOLEAN NOT NULL DEFAULT FALSE,
  daily_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_report BOOLEAN NOT NULL DEFAULT FALSE,
  exam_alert BOOLEAN NOT NULL DEFAULT TRUE,
  data_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at on user_settings before update.
DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS and define policies for user_settings.
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_select_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete_own" ON public.user_settings;

CREATE POLICY "user_settings_select_own"
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own"
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_delete_own"
  ON public.user_settings FOR DELETE
  USING (user_id = auth.uid());

-- Function to automatically create default user_settings when a new profile is created.
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

-- Trigger to run after a new profile is created, invoking handle_new_user_settings.
DROP TRIGGER IF EXISTS on_new_profile_created ON public.profiles;
CREATE TRIGGER on_new_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- ===========================================
-- 5) Storage: library bucket policies
-- ===========================================
-- Ensure the library bucket exists and is private.
INSERT INTO storage.buckets (id, name, public)
SELECT 'library', 'library', FALSE
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'library');

-- Remove existing policies for the library bucket in storage.objects.
DROP POLICY IF EXISTS "lib_select_prefix" ON storage.objects;
DROP POLICY IF EXISTS "lib_insert_prefix" ON storage.objects;
DROP POLICY IF EXISTS "lib_update_prefix" ON storage.objects;
DROP POLICY IF EXISTS "lib_delete_prefix" ON storage.objects;

-- Allow only authenticated users to select/insert/update/delete objects in the library bucket when the object key begins with their user ID and a slash.
CREATE POLICY "lib_select_prefix"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'library'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "lib_insert_prefix"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'library'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "lib_update_prefix"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'library'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'library'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "lib_delete_prefix"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'library'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/%'
  );

-- ===========================================
-- 6) phone_otps table and row-level security
-- ===========================================
-- Create a table to store phone OTPs (One-Time Passwords) with an expiration timestamp.
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,         -- e.g. 01012345678 (numbers only)
  code TEXT NOT NULL,          -- 6-digit code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Protect phone_otps via row-level security. Deny all direct access. Only server-side functions should interact with this table.
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_all" ON public.phone_otps;
CREATE POLICY "deny_all" ON public.phone_otps FOR ALL USING (false) WITH CHECK (false);
