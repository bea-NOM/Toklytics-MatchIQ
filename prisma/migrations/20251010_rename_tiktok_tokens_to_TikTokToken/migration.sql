-- Migration: rename tiktok_tokens table to match Prisma model TikTokToken
-- WARNING: Review and run this migration in your development environment before applying to production.

BEGIN;

-- If your DB uses PostgreSQL and the current table is "tiktok_tokens", rename it
ALTER TABLE IF EXISTS "tiktok_tokens" RENAME TO "TikTokToken";

-- If you have any sequences, constraints, or indexes referencing the old name, you may need to rename them too.
-- Example (Postgres):
-- ALTER SEQUENCE IF EXISTS tiktok_tokens_id_seq RENAME TO "TikTokToken_id_seq";

COMMIT;
