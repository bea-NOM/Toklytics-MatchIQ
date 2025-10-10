-- Migration: create TikTokToken table
-- Generated to reflect the table created directly in staging.

BEGIN;

CREATE TABLE IF NOT EXISTS "TikTokToken" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  tiktok_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NULL,
  expires_at timestamptz NULL,
  scope text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK to users if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tiktoktoken_user') THEN
      BEGIN
        ALTER TABLE "TikTokToken" ADD CONSTRAINT fk_tiktoktoken_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK constraint fk_tiktoktoken_user: %', SQLERRM;
      END;
    END IF;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_tiktoktoken_tiktok_id ON "TikTokToken" (tiktok_id);

COMMIT;
