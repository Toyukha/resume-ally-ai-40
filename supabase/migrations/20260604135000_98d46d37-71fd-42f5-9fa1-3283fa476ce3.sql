
-- 1. Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'support_admin', 'analytics_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Suspended flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- 4. has_role / is_admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND suspended = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND suspended = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin' AND suspended = false
  );
$$;

-- 5. RLS policies for user_roles
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT
  TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles FOR ALL
  TO authenticated USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 6. profiles policies for admins
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins update any profile" ON public.profiles;
CREATE POLICY "Super admins update any profile" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 7. Admins view all analyses
DROP POLICY IF EXISTS "Admins view all analyses" ON public.analyses;
CREATE POLICY "Admins view all analyses" ON public.analyses FOR SELECT
  TO authenticated USING (public.is_admin(auth.uid()));

-- 8. admin_activity_logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins view activity logs" ON public.admin_activity_logs FOR SELECT
  TO authenticated USING (public.is_admin(auth.uid()));

-- 9. system_notifications
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_notifications TO authenticated;
GRANT ALL ON public.system_notifications TO service_role;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view notifications" ON public.system_notifications;
CREATE POLICY "Admins view notifications" ON public.system_notifications FOR SELECT
  TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage notifications" ON public.system_notifications;
CREATE POLICY "Super admins manage notifications" ON public.system_notifications FOR ALL
  TO authenticated USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 10. updated_at trigger for user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Auto-promote the initial super admin on signup (and any future re-signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, plan) VALUES (NEW.id, 'free')
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'oyeyemiyunus24@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 12. Backfill: if the super-admin user already exists, grant the role now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users
WHERE lower(email) = 'oyeyemiyunus24@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
