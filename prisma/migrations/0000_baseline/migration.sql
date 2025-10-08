-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Enums
CREATE TYPE "public"."Role"                AS ENUM ('VIEWER', 'CREATOR', 'AGENCY', 'ADMIN');
CREATE TYPE "public"."PowerUpType"         AS ENUM ('magic_mist', 'vault_glove', 'No.2_booster', 'No.3_booster', 'stun_hammer', 'glove', 'time_maker');
CREATE TYPE "public"."PowerUpEventKind"    AS ENUM ('CREATED', 'ACTIVATED', 'EXPIRED', 'REVOKED');
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');
CREATE TYPE "public"."NotificationKind"    AS ENUM ('BOOSTER_EXPIRING', 'BATTLE_REMINDER');
CREATE TYPE "public"."NotificationStatus"  AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "public"."SubStatus"           AS ENUM ('INACTIVE', 'ACTIVE', 'PAST_DUE', 'CANCELED');
CREATE TYPE "public"."Plan"                AS ENUM ('STARTER', 'PRO', 'AGENCY');

-- Tables (your baseline)
CREATE TABLE "public"."users" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "handle" TEXT,
  "role" "public"."Role" NOT NULL,
  "tiktok_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."creators" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "display_name" TEXT NOT NULL,
  "backstage_verified" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."agencies" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "backstage_org_id" TEXT NOT NULL,
  "backstage_verified" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."agency_memberships" (
  "id" UUID NOT NULL,
  "agency_id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "agency_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."viewers" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "display_name" TEXT NOT NULL,
  CONSTRAINT "viewers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."battles" (
  "id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."powerups" (
  "id" UUID NOT NULL,
  "type" "public"."PowerUpType" NOT NULL,
  "holder_viewer_id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "awarded_at" TIMESTAMPTZ(6) NOT NULL,
  "expiry_at" TIMESTAMPTZ(6) NOT NULL,
  "source" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "powerups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."powerup_events" (
  "id" UUID NOT NULL,
  "powerup_id" UUID NOT NULL,
  "kind" "public"."PowerUpEventKind" NOT NULL,
  "at" TIMESTAMPTZ(6) NOT NULL,
  "meta" JSONB,
  CONSTRAINT "powerup_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "channel" "public"."NotificationChannel" NOT NULL,
  "kind" "public"."NotificationKind" NOT NULL,
  "payload" JSONB NOT NULL,
  "send_at" TIMESTAMPTZ(6) NOT NULL,
  "sent_at" TIMESTAMPTZ(6),
  "status" "public"."NotificationStatus" NOT NULL,
  "error" TEXT,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."jobs" (
  "id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "run_at" TIMESTAMPTZ(6) NOT NULL,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "locked_at" TIMESTAMPTZ(6),
  "done" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."webhooks" (
  "id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "signature" TEXT,
  "received_at" TIMESTAMPTZ(6) NOT NULL,
  "payload" JSONB NOT NULL,
  CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."subscriptions" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "agency_id" UUID,
  "status" "public"."SubStatus" NOT NULL,
  "plan" "public"."Plan" NOT NULL,
  "stripe_customer_id" TEXT NOT NULL,
  "stripe_sub_id" TEXT,
  "current_period_end" TIMESTAMP(3),
  "max_creators" INTEGER,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."calendar_tokens" (
  "id" UUID NOT NULL,
  "owner_user_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calendar_tokens_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
CREATE UNIQUE INDEX "users_tiktok_id_key" ON "public"."users"("tiktok_id");
CREATE UNIQUE INDEX "creators_user_id_key" ON "public"."creators"("user_id");
CREATE UNIQUE INDEX "agencies_user_id_key" ON "public"."agencies"("user_id");
CREATE UNIQUE INDEX "agency_memberships_agency_id_creator_id_key" ON "public"."agency_memberships"("agency_id","creator_id");
CREATE UNIQUE INDEX "viewers_user_id_key" ON "public"."viewers"("user_id");
CREATE INDEX "powerups_creator_id_idx" ON "public"."powerups"("creator_id");
CREATE INDEX "powerups_holder_viewer_id_idx" ON "public"."powerups"("holder_viewer_id");
CREATE INDEX "powerups_active_expiry_at_idx" ON "public"."powerups"("active","expiry_at");
CREATE INDEX "jobs_run_at_done_idx" ON "public"."jobs"("run_at","done");
CREATE INDEX "subscriptions_user_id_idx" ON "public"."subscriptions"("user_id");
CREATE INDEX "subscriptions_agency_id_idx" ON "public"."subscriptions"("agency_id");
CREATE UNIQUE INDEX "calendar_tokens_token_key" ON "public"."calendar_tokens"("token");

-- FKs
ALTER TABLE "public"."creators"          ADD CONSTRAINT "creators_user_id_fkey"            FOREIGN KEY ("user_id")           REFERENCES "public"."users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."agencies"          ADD CONSTRAINT "agencies_user_id_fkey"            FOREIGN KEY ("user_id")           REFERENCES "public"."users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."agency_memberships"ADD CONSTRAINT "agency_memberships_agency_id_fkey" FOREIGN KEY ("agency_id")         REFERENCES "public"."agencies"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."agency_memberships"ADD CONSTRAINT "agency_memberships_creator_id_fkey"FOREIGN KEY ("creator_id")        REFERENCES "public"."creators"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."viewers"           ADD CONSTRAINT "viewers_user_id_fkey"             FOREIGN KEY ("user_id")           REFERENCES "public"."users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."battles"           ADD CONSTRAINT "battles_creator_id_fkey"          FOREIGN KEY ("creator_id")        REFERENCES "public"."creators"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."powerups"          ADD CONSTRAINT "powerups_holder_viewer_id_fkey"   FOREIGN KEY ("holder_viewer_id")  REFERENCES "public"."viewers"("id")     ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."powerups"          ADD CONSTRAINT "powerups_creator_id_fkey"         FOREIGN KEY ("creator_id")        REFERENCES "public"."creators"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."powerup_events"    ADD CONSTRAINT "powerup_events_powerup_id_fkey"   FOREIGN KEY ("powerup_id")        REFERENCES "public"."powerups"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."notifications"     ADD CONSTRAINT "notifications_user_id_fkey"       FOREIGN KEY ("user_id")           REFERENCES "public"."users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."subscriptions"     ADD CONSTRAINT "subscriptions_user_id_fkey"       FOREIGN KEY ("user_id")           REFERENCES "public"."users"("id")       ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."subscriptions"     ADD CONSTRAINT "subscriptions_agency_id_fkey"     FOREIGN KEY ("agency_id")         REFERENCES "public"."agencies"("id")    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."calendar_tokens"   ADD CONSTRAINT "calendar_tokens_owner_user_id_fkey" FOREIGN KEY ("owner_user_id")   REFERENCES "public"."users"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;

-- Patch 1: ensure time_maker is in PowerUpType enum
DO $$ BEGIN
  ALTER TYPE "public"."PowerUpType" ADD VALUE IF NOT EXISTS 'time_maker';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Patch 2: create PowerupEvent table used by the Battles UI
CREATE TABLE IF NOT EXISTS "public"."PowerupEvent" (
  "id"            TEXT        NOT NULL,
  "matchId"       TEXT        NOT NULL,
  "creatorId"     TEXT        NOT NULL,
  "contributorId" TEXT        NOT NULL,
  "type"          TEXT        NOT NULL,  -- glove | vault_glove | time_maker | magic_mist | No.2_booster | No.3_booster | stun_hammer
  "action"        TEXT        NOT NULL,  -- used | held
  "ts"            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"     TIMESTAMPTZ,
  CONSTRAINT "PowerupEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PowerupEvent_match_creator_idx" ON "public"."PowerupEvent" ("matchId","creatorId");
CREATE INDEX IF NOT EXISTS "PowerupEvent_contributor_idx"   ON "public"."PowerupEvent" ("contributorId");
CREATE INDEX IF NOT EXISTS "PowerupEvent_type_action_idx"   ON "public"."PowerupEvent" ("type","action");
CREATE INDEX IF NOT EXISTS "PowerupEvent_expires_idx"       ON "public"."PowerupEvent" ("expiresAt");
