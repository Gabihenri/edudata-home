BEGIN;

-- =====================================================
-- EDUDATA IA — SECURITY HARDENING
--
-- Internal SECURITY DEFINER helpers must not be callable
-- directly through the public PostgREST RPC surface.
-- Product RPCs that are intentionally used by the application
-- remain executable by authenticated users.
-- =====================================================

REVOKE EXECUTE ON FUNCTION public.can_view_identity_user(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.edi_current_user_access(text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.edi_current_user_access_snapshot()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.edi_has_current_user_feature(text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.ensure_default_free_subscription(uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid)
  FROM PUBLIC, anon, authenticated;

-- pg_trgm is used by the school registry trigram indexes.
-- Keep the extension outside the exposed public schema.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

COMMIT;
