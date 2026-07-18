BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 20 — DEFAULT FREE SUBSCRIPTION
-- =========================================================
--
-- Objetivos:
-- 1. Vincular o plano edi_free aos usuários existentes.
-- 2. Vincular automaticamente o edi_free aos novos usuários.
-- 3. Permitir a coexistência do plano gratuito com um plano
--    individual pago.
-- 4. Manter o plano pago como plano prioritário.
-- 5. Não alterar vínculos ou licenças institucionais.
--
-- Esta migração:
-- - não remove assinaturas pagas;
-- - não altera preços;
-- - não altera perfis;
-- - não altera organizações;
-- - não concede recursos além da matriz da migração 19.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DAS TABELAS
-- =========================================================

DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: auth.users.';
  END IF;

  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.plans.';
  END IF;

  IF to_regclass('public.subscriptions') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.subscriptions.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.plans
    WHERE lower(code) = 'edi_free'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION
      'O plano ativo edi_free não foi encontrado.';
  END IF;
END;
$$;


-- =========================================================
-- 2. IDENTIFICAÇÃO DA ASSINATURA GRATUITA PADRÃO
-- =========================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS
    is_default_free boolean DEFAULT false;


UPDATE public.subscriptions
SET is_default_free = false
WHERE is_default_free IS NULL;


ALTER TABLE public.subscriptions
  ALTER COLUMN is_default_free
    SET DEFAULT false,

  ALTER COLUMN is_default_free
    SET NOT NULL;


COMMENT ON COLUMN
  public.subscriptions.is_default_free
IS
  'Identifica a assinatura gratuita padrão criada automaticamente para o usuário individual.';


-- =========================================================
-- 3. MARCAÇÃO DE ASSINATURAS EDI_FREE EXISTENTES
-- =========================================================

UPDATE public.subscriptions AS subscription
SET
  is_default_free = true,

  source = CASE
    WHEN subscription.source IS NULL
      OR trim(subscription.source) = ''
    THEN 'default'
    ELSE subscription.source
  END,

  metadata =
    COALESCE(
      subscription.metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'default_free', true,
      'provisioning', 'migration-20'
    ),

  updated_at = now()

FROM public.plans AS plan_record

WHERE subscription.plan_id =
      plan_record.id

  AND lower(plan_record.code) =
      'edi_free'

  AND subscription.user_id IS NOT NULL

  AND subscription.organization_id IS NULL;


-- =========================================================
-- 4. REGRA DE PROPRIEDADE DO PLANO GRATUITO
-- =========================================================

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS
    subscriptions_default_free_owner_check;


ALTER TABLE public.subscriptions
  ADD CONSTRAINT
    subscriptions_default_free_owner_check
  CHECK (
    is_default_free = false
    OR (
      user_id IS NOT NULL
      AND organization_id IS NULL
      AND subscriber_type = 'user'
      AND owner_type = 'user'
    )
  );


-- =========================================================
-- 5. ÍNDICES DE ASSINATURA ATIVA
-- =========================================================
--
-- O índice anterior permitia somente uma assinatura ativa
-- por usuário, impedindo a coexistência do edi_free com um
-- plano individual pago.
--
-- A partir desta migração:
-- - cada usuário pode possuir um edi_free ativo;
-- - cada usuário pode possuir uma assinatura paga ativa;
-- - o backend escolhe o plano de maior prioridade.
-- =========================================================

DROP INDEX IF EXISTS
  public.idx_subscriptions_active_user_unique;


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_subscriptions_active_default_free_user_unique

ON public.subscriptions(user_id)

WHERE user_id IS NOT NULL

  AND is_default_free = true

  AND status IN (
    'pending',
    'trialing',
    'active',
    'past_due',
    'paused',
    'incomplete'
  );


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_subscriptions_active_commercial_user_unique

ON public.subscriptions(user_id)

WHERE user_id IS NOT NULL

  AND is_default_free = false

  AND status IN (
    'pending',
    'trialing',
    'active',
    'past_due',
    'paused',
    'incomplete'
  );


CREATE INDEX IF NOT EXISTS
  idx_subscriptions_default_free_lookup

ON public.subscriptions(
  user_id,
  is_default_free,
  status
);


-- =========================================================
-- 6. FUNÇÃO DE PROVISIONAMENTO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.ensure_default_free_subscription(
    target_user_id uuid
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  free_plan_id uuid;
  existing_subscription_id uuid;
  created_subscription_id uuid;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = target_user_id
  ) THEN
    RAISE EXCEPTION
      'Usuário não encontrado para provisionamento do edi_free: %.',
      target_user_id;
  END IF;


  SELECT id
  INTO free_plan_id

  FROM public.plans

  WHERE lower(code) = 'edi_free'
    AND is_active = true

  ORDER BY
    sort_order DESC,
    created_at ASC

  LIMIT 1;


  IF free_plan_id IS NULL THEN
    RAISE EXCEPTION
      'O plano ativo edi_free não foi encontrado.';
  END IF;


  SELECT subscription.id
  INTO existing_subscription_id

  FROM public.subscriptions AS subscription

  WHERE subscription.user_id =
        target_user_id

    AND subscription.organization_id IS NULL

    AND subscription.plan_id =
        free_plan_id

    AND subscription.is_default_free = true

    AND subscription.status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    )

  ORDER BY subscription.created_at DESC

  LIMIT 1;


  IF existing_subscription_id IS NOT NULL THEN
    RETURN existing_subscription_id;
  END IF;


  INSERT INTO public.subscriptions (
    plan_id,

    subscriber_type,
    owner_type,

    user_id,
    organization_id,

    status,
    source,

    starts_at,

    billing_cycle,
    quantity,
    currency,

    unit_amount_cents,
    total_amount_cents,

    current_period_start,
    current_period_end,

    current_period_starts_at,
    current_period_ends_at,

    cancel_at_period_end,

    is_default_free,

    metadata,

    created_at,
    updated_at
  )
  VALUES (
    free_plan_id,

    'user',
    'user',

    target_user_id,
    NULL,

    'active',
    'default',

    now(),

    'free',
    1,
    'BRL',

    0,
    0,

    now(),
    NULL,

    now(),
    NULL,

    false,

    true,

    jsonb_build_object(
      'default_free', true,
      'provisioning', 'automatic',
      'migration', '20_default_free_subscription'
    ),

    now(),
    now()
  )

  ON CONFLICT DO NOTHING

  RETURNING id
  INTO created_subscription_id;


  IF created_subscription_id IS NOT NULL THEN
    RETURN created_subscription_id;
  END IF;


  SELECT subscription.id
  INTO existing_subscription_id

  FROM public.subscriptions AS subscription

  WHERE subscription.user_id =
        target_user_id

    AND subscription.organization_id IS NULL

    AND subscription.plan_id =
        free_plan_id

    AND subscription.is_default_free = true

    AND subscription.status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    )

  ORDER BY subscription.created_at DESC

  LIMIT 1;


  RETURN existing_subscription_id;
END;
$$;


COMMENT ON FUNCTION
  public.ensure_default_free_subscription(uuid)
IS
  'Garante uma assinatura ativa do plano edi_free para o usuário informado, sem remover ou substituir assinaturas pagas.';


-- =========================================================
-- 7. PROTEÇÃO DA FUNÇÃO
-- =========================================================

REVOKE ALL
ON FUNCTION
  public.ensure_default_free_subscription(uuid)
FROM PUBLIC;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'postgres'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.ensure_default_free_subscription(uuid) TO postgres';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'service_role'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.ensure_default_free_subscription(uuid) TO service_role';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'supabase_auth_admin'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.ensure_default_free_subscription(uuid) TO supabase_auth_admin';
  END IF;
END;
$$;


-- =========================================================
-- 8. PROVISIONAMENTO DOS USUÁRIOS EXISTENTES
-- =========================================================

INSERT INTO public.subscriptions (
  plan_id,

  subscriber_type,
  owner_type,

  user_id,
  organization_id,

  status,
  source,

  starts_at,

  billing_cycle,
  quantity,
  currency,

  unit_amount_cents,
  total_amount_cents,

  current_period_start,
  current_period_end,

  current_period_starts_at,
  current_period_ends_at,

  cancel_at_period_end,

  is_default_free,

  metadata,

  created_at,
  updated_at
)

SELECT
  free_plan.id,

  'user',
  'user',

  auth_user.id,
  NULL,

  'active',
  'default',

  now(),

  'free',
  1,
  'BRL',

  0,
  0,

  now(),
  NULL,

  now(),
  NULL,

  false,

  true,

  jsonb_build_object(
    'default_free', true,
    'provisioning', 'backfill',
    'migration', '20_default_free_subscription'
  ),

  now(),
  now()

FROM auth.users AS auth_user

CROSS JOIN LATERAL (
  SELECT plan_record.id

  FROM public.plans AS plan_record

  WHERE lower(plan_record.code) =
        'edi_free'

    AND plan_record.is_active = true

  ORDER BY
    plan_record.sort_order DESC,
    plan_record.created_at ASC

  LIMIT 1
) AS free_plan

WHERE NOT EXISTS (
  SELECT 1

  FROM public.subscriptions
    AS existing

  WHERE existing.user_id =
        auth_user.id

    AND existing.organization_id IS NULL

    AND existing.plan_id =
        free_plan.id

    AND existing.is_default_free = true

    AND existing.status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    )
)

ON CONFLICT DO NOTHING;


-- =========================================================
-- 9. TRIGGER PARA NOVOS USUÁRIOS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.handle_new_auth_user_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  PERFORM
    public.ensure_default_free_subscription(
      NEW.id
    );

  RETURN NEW;
END;
$$;


COMMENT ON FUNCTION
  public.handle_new_auth_user_default_subscription()
IS
  'Provisiona automaticamente o plano edi_free após a criação de um usuário no Supabase Auth.';


REVOKE ALL
ON FUNCTION
  public.handle_new_auth_user_default_subscription()
FROM PUBLIC;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'postgres'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.handle_new_auth_user_default_subscription() TO postgres';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'supabase_auth_admin'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.handle_new_auth_user_default_subscription() TO supabase_auth_admin';
  END IF;
END;
$$;


DROP TRIGGER IF EXISTS
  on_auth_user_created_ensure_edi_free_subscription
ON auth.users;


CREATE TRIGGER
  on_auth_user_created_ensure_edi_free_subscription

AFTER INSERT
ON auth.users

FOR EACH ROW

EXECUTE FUNCTION
  public.handle_new_auth_user_default_subscription();


-- =========================================================
-- 10. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  users_without_free integer;
  duplicate_free_subscriptions integer;
BEGIN
  SELECT count(*)
  INTO users_without_free

  FROM auth.users AS auth_user

  WHERE NOT EXISTS (
    SELECT 1

    FROM public.subscriptions
      AS subscription

    INNER JOIN public.plans
      AS plan_record
      ON plan_record.id =
         subscription.plan_id

    WHERE subscription.user_id =
          auth_user.id

      AND subscription.organization_id IS NULL

      AND subscription.is_default_free = true

      AND lower(plan_record.code) =
          'edi_free'

      AND subscription.status IN (
        'pending',
        'trialing',
        'active',
        'past_due',
        'paused',
        'incomplete'
      )
  );


  IF users_without_free <> 0 THEN
    RAISE EXCEPTION
      'Falha no provisionamento: % usuário(s) sem edi_free.',
      users_without_free;
  END IF;


  SELECT count(*)
  INTO duplicate_free_subscriptions

  FROM (
    SELECT
      user_id

    FROM public.subscriptions

    WHERE user_id IS NOT NULL
      AND is_default_free = true

      AND status IN (
        'pending',
        'trialing',
        'active',
        'past_due',
        'paused',
        'incomplete'
      )

    GROUP BY user_id

    HAVING count(*) > 1
  ) AS duplicates;


  IF duplicate_free_subscriptions <> 0 THEN
    RAISE EXCEPTION
      'Falha no provisionamento: existem usuários com assinaturas edi_free duplicadas.';
  END IF;


  IF to_regclass(
    'public.idx_subscriptions_active_default_free_user_unique'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Índice da assinatura gratuita padrão não foi criado.';
  END IF;


  IF to_regclass(
    'public.idx_subscriptions_active_commercial_user_unique'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Índice das assinaturas comerciais não foi criado.';
  END IF;
END;
$$;


COMMIT;