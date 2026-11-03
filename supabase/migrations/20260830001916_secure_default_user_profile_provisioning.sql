-- The function provisions profiles with SECURITY DEFINER and must only be callable by a user for their own authenticated identity.
REVOKE EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_default_user_profile(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  default_display_name text;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Não autorizado a provisionar perfil para outro usuário.';
  END IF;

  SELECT COALESCE(
    NULLIF(trim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(auth_user.raw_user_meta_data ->> 'name'), ''),
    NULLIF(trim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(trim(split_part(auth_user.email, '@', 1)), '')
  )
  INTO default_display_name
  FROM auth.users AS auth_user
  WHERE auth_user.id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado para criação do perfil padrão: %.', target_user_id;
  END IF;

  INSERT INTO public.user_profiles (
    user_id, display_name, phone, role, status, onboarding_completed, metadata, created_at, updated_at
  )
  VALUES (
    target_user_id, default_display_name, NULL, 'professor', 'active', false,
    jsonb_build_object(
      'profile_type', 'individual',
      'provisioning', 'automatic',
      'migration', '21_default_user_profile'
    ),
    now(), now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN target_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) TO authenticated;
