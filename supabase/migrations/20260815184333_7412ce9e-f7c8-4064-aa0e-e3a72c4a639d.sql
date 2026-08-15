-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','citizen');
CREATE TYPE public.report_status AS ENUM ('Pending','In Progress','Resolved','Rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  photo_url text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  status public.report_status NOT NULL DEFAULT 'Pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile name" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own reports" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- prevent manual point edits
CREATE OR REPLACE FUNCTION public.protect_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.points <> OLD.points THEN
    NEW.points := OLD.points;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_protect_points BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_points();

-- signup handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- points + notifications
CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _pts integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET points = points + _pts, updated_at = now() WHERE id = _user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.on_report_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET points = points + 10, updated_at = now() WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, report_id, message)
  VALUES (NEW.user_id, NEW.id, 'Your report has been submitted successfully. +10 points');
  RETURN NEW;
END; $$;
CREATE TRIGGER reports_after_insert AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.on_report_insert();

CREATE OR REPLACE FUNCTION public.on_report_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE short_id text;
BEGIN
  NEW.updated_at := now();
  short_id := upper(substr(NEW.id::text, 1, 8));
  IF NEW.status <> OLD.status THEN
    IF NEW.status = 'In Progress' THEN
      UPDATE public.profiles SET points = points + 20 WHERE id = NEW.user_id;
      INSERT INTO public.notifications (user_id, report_id, message)
      VALUES (NEW.user_id, NEW.id, 'Your report #' || short_id || ' is now In Progress. +20 points');
    ELSIF NEW.status = 'Resolved' THEN
      NEW.resolved_at := now();
      UPDATE public.profiles SET points = points + 10 WHERE id = NEW.user_id;
      INSERT INTO public.notifications (user_id, report_id, message)
      VALUES (NEW.user_id, NEW.id, 'Your civic problem #' || short_id || ' has been marked as Resolved. +10 bonus points');
    ELSIF NEW.status = 'Rejected' THEN
      INSERT INTO public.notifications (user_id, report_id, message)
      VALUES (NEW.user_id, NEW.id, 'Your report #' || short_id || ' was reviewed and rejected.');
    ELSE
      INSERT INTO public.notifications (user_id, report_id, message)
      VALUES (NEW.user_id, NEW.id, 'Your report #' || short_id || ' status changed to ' || NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER reports_before_update BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.on_report_update();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;