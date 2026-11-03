-- Default subscription provisioning is a SECURITY DEFINER write path.
-- Restrict it to authenticated callers acting only on their own identity; trigger execution remains internal.
CREATE OR REPLACE FUNCTION public.ensure_default_free_subscription(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  free_plan_id uuid;
  existing_subscription_id uuid;
  created_subscription_id uuid;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Não autorizado a provisionar assinatura para outro usuário.';
  END IF;

  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Operação de provisionamento requer contexto autenticado ou de serviço.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado para provisionamento do edi_free: %.', target_user_id;
  END IF;

  SELECT id INTO free_plan_id FROM public.plans
  WHERE lower(code)='edi_free' AND is_active=true AND is_free=true
    AND audience_type='individual' AND audience='individual'
    AND billing_model='free' AND billing_mode='free'
  ORDER BY sort_order ASC, created_at ASC LIMIT 1;

  IF free_plan_id IS NULL THEN
    RAISE EXCEPTION 'O plano edi_free válido não foi encontrado.';
  END IF;

  SELECT id INTO existing_subscription_id FROM public.subscriptions
  WHERE user_id=target_user_id AND organization_id IS NULL AND plan_id=free_plan_id
    AND is_default_free=true
    AND status IN ('pending','trialing','active','past_due','paused','incomplete')
  ORDER BY created_at DESC LIMIT 1;

  IF existing_subscription_id IS NOT NULL THEN RETURN existing_subscription_id; END IF;

  INSERT INTO public.subscriptions (plan_id,subscriber_type,owner_type,user_id,organization_id,status,source,starts_at,billing_cycle,quantity,currency,unit_amount_cents,total_amount_cents,current_period_start,current_period_end,current_period_starts_at,current_period_ends_at,cancel_at_period_end,is_default_free,metadata,created_at,updated_at)
  VALUES (free_plan_id,'user','user',target_user_id,NULL,'active','default',now(),'free',1,'BRL',0,0,now(),NULL,now(),NULL,false,true,jsonb_build_object('default_free',true,'provisioning','automatic','migration','22_default_free_integrity'),now(),now())
  ON CONFLICT DO NOTHING RETURNING id INTO created_subscription_id;

  IF created_subscription_id IS NOT NULL THEN RETURN created_subscription_id; END IF;

  SELECT id INTO existing_subscription_id FROM public.subscriptions
  WHERE user_id=target_user_id AND organization_id IS NULL AND plan_id=free_plan_id
    AND is_default_free=true
    AND status IN ('pending','trialing','active','past_due','paused','incomplete')
  ORDER BY created_at DESC LIMIT 1;
  RETURN existing_subscription_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ensure_default_free_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_free_subscription(uuid) TO authenticated;

-- Internal trigger/helper functions do not need anonymous execution.
REVOKE EXECUTE ON FUNCTION public.academic_calendar_school_belongs_to_organization(uuid,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_support_priority(text,text,text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.initialize_support_ticket_management(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resolve_support_requester_context(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resolve_support_sla_policy(text,text,text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_support_ticket_protocol() FROM anon;
