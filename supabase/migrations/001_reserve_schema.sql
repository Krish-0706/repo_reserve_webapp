-- =============================================================================
-- ReServe — Migration 001
-- All 6 tables with RLS policies
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- users
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('donor','ngo','volunteer','admin')),
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "admin_all_users"
  ON public.users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- =============================================================================
-- listings
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_type    TEXT NOT NULL,
  quantity_kg  NUMERIC(6,2) NOT NULL CHECK (quantity_kg > 0),
  photo_url    TEXT,
  lat          FLOAT NOT NULL,
  lng          FLOAT NOT NULL,
  address      TEXT NOT NULL,
  pickup_start TIMESTAMPTZ NOT NULL,
  pickup_end   TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','claimed','completed','expired')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pickup_window_valid CHECK (pickup_end > pickup_start)
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donors_manage_own"
  ON public.listings FOR ALL
  USING (auth.uid() = donor_id);

CREATE POLICY "ngo_volunteer_read_active"
  ON public.listings FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('ngo','volunteer','admin')
    )
  );

CREATE INDEX IF NOT EXISTS listings_lat_lng_idx ON public.listings (lat, lng);
CREATE INDEX IF NOT EXISTS listings_status_idx  ON public.listings (status);

-- =============================================================================
-- ngos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ngos (
  id            UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  org_name      TEXT NOT NULL,
  kyc_status    TEXT NOT NULL DEFAULT 'pending'
                  CHECK (kyc_status IN ('pending','approved','rejected')),
  contact_phone TEXT NOT NULL
);

ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ngo_manage_own"
  ON public.ngos FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "admin_manage_ngos"
  ON public.ngos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- =============================================================================
-- volunteers
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.volunteers (
  id              UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  hours_logged    NUMERIC(8,2) DEFAULT 0,
  rating          NUMERIC(3,2) DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  tasks_completed INT DEFAULT 0
);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volunteer_manage_own"
  ON public.volunteers FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "ngo_read_volunteers"
  ON public.volunteers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'ngo'
    )
  );

-- =============================================================================
-- pickups
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pickups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  ngo_id          UUID NOT NULL REFERENCES public.ngos(id),
  volunteer_id    UUID REFERENCES public.volunteers(id),
  claimed_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  proof_photo_url TEXT,
  status          TEXT NOT NULL DEFAULT 'claimed'
                    CHECK (status IN ('claimed','in_progress','completed','cancelled'))
);

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ngo_manage_own_pickups"
  ON public.pickups FOR ALL
  USING (auth.uid() = ngo_id);

CREATE POLICY "volunteer_read_assigned"
  ON public.pickups FOR SELECT
  USING (auth.uid() = volunteer_id);

CREATE POLICY "volunteer_update_assigned"
  ON public.pickups FOR UPDATE
  USING (auth.uid() = volunteer_id);

CREATE POLICY "admin_read_all_pickups"
  ON public.pickups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- =============================================================================
-- notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  reference_id UUID,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id);

-- =============================================================================
-- Enable Realtime (run after migration)
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
