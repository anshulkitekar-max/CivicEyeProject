-- 1. Remove the always-true bypass on profiles SELECT
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Leaderboard exposes only non-sensitive columns (no email)
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = false) AS
SELECT id, full_name, points
FROM public.profiles;

REVOKE ALL ON public.leaderboard FROM anon;
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;

-- 3. Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_report_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_report_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_points() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_points(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;