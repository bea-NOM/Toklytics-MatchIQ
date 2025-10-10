-- Migration: rename indexes/sequences/constraints related to tiktok_tokens to new TikTokToken naming
-- This script is best-effort and performs conditional renames where possible.
-- Review before applying.

BEGIN;

-- Example: rename sequence if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'tiktok_tokens_id_seq') THEN
    EXECUTE 'ALTER SEQUENCE tiktok_tokens_id_seq RENAME TO "TikTokToken_id_seq"';
  END IF;
END$$;

-- Example: rename primary key constraint if exists
DO $$
DECLARE
  pk_name text;
BEGIN
  SELECT conname INTO pk_name FROM pg_constraint WHERE contype = 'p' AND conrelid = 'tiktok_tokens'::regclass;
  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "TikTokToken" RENAME CONSTRAINT %I TO %I', pk_name, replace(pk_name, 'tiktok_tokens', 'TikTokToken'));
  END IF;
EXCEPTION WHEN others THEN
  -- ignore
  NULL;
END$$;

-- Example: rename indexes
DO $$
DECLARE
  idx RECORD;
BEGIN
  FOR idx IN SELECT indexname FROM pg_indexes WHERE tablename = 'tiktok_tokens' LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %I', idx.indexname, replace(idx.indexname, 'tiktok_tokens', 'TikTokToken'));
  END LOOP;
END$$;

COMMIT;
