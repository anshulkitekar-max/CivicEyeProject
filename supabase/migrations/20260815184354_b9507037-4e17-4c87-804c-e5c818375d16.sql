REVOKE ALL ON FUNCTION public.protect_points() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_report_insert() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_report_update() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.award_points(uuid, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;