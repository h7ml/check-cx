ALTER TABLE public.system_notifications
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'public'
    CHECK (scope IN ('public', 'admin', 'both'));
