-- Add BASIC to Plan enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan') THEN
    RAISE NOTICE 'Plan enum not found; skipping';
  ELSE
    -- Check if value exists
    IF NOT EXISTS (SELECT 1 FROM unnest(enum_range(NULL::public.Plan)) AS x(v) WHERE v = 'BASIC') THEN
      ALTER TYPE public.Plan ADD VALUE 'BASIC';
    END IF;
  END IF;
END$$;
