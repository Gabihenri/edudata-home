BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 22 — DEFAULT FREE INTEGRITY
-- =========================================================
--
-- Objetivos:
-- 1. Garantir a integridade do plano oficial edi_free.
-- 2. Reparar assinaturas gratuitas padrão inconsistentes.
-- 3. Preservar assinaturas pagas legítimas.
-- 4. Impedir que is_default_free aponte para plano pago.
-- 5. Fortalecer o provisionamento automático do edi_free.
--
-- Esta migração:
-- - não exclui assinaturas;
-- - não remove planos pagos;
-- - não altera perfis;
-- - não altera organizações;
-- - não concede recursos além da matriz comercial existente.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DA ESTRUTURA
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

    FROM information_schema.columns

    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'is_default_free'
  ) THEN
    RAISE EXCEPTION
      'A coluna public.subscriptions.is_default_free não existe.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM public.plans

    WHERE lower(code) = 'edi_free'
  ) THEN
    RAISE EXCEPTION
      'O plano edi_free não foi encontrado.';
  END IF;
END;
$$;


-- =========================================================
-- 2. NORMALIZAÇÃO DOS PLANOS OFICIAIS
-- =========================================================

UPDATE public.plans
SET
  is_free = true,

  is_active = true,

  audience_type = 'individual',
  audience = 'individual',

  billing_model = 'free',
  billing_mode = 'free',

  monthly_price_cents = 0,
  annual_price_cents = 0,
  yearly_price_cents = 0,
  setup_price_cents = 0,

  metadata =
    COALESCE(
      metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'official_code',
      true,

      'integrity_repair',
      '22_default_free_integrity',

      'integrity_repaired_at',
      now()
    ),

  updated_at = now()

WHERE lower(code) = 'edi_free';


UPDATE public.plans
SET
  is_free = false,

  metadata =
    COALESCE(
      metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'official_code',
      true,

      'integrity_checked_by',
      '22_default_free_integrity',

      'integrity_checked_at',
      now()
    ),

  updated_at = now()

WHERE lower(code) IN (
  'edi_professor_pro',
  'edi_escola',
  'edi_rede'
);


-- =========================================================
-- 3. REPARO DE ASSINATURAS PADRÃO INCORRETAS
-- =========================================================
--
-- Uma assinatura com:
-- - is_default_free = true;
-- - source = default;
-- - plano diferente de edi_free;
--
-- é uma assinatura gratuita padrão associada ao plano errado.
-- Ela deve ser redirecionada ao edi_free.
-- =========================================================

WITH free_plan AS (
  SELECT id

  FROM public.plans

  WHERE lower(code) = 'edi_free'
    AND is_free = true
    AND is_active = true

  ORDER BY
    sort_order ASC,
    created_at ASC

  LIMIT 1
)

UPDATE public.subscriptions AS subscription
SET
  plan_id = free_plan.id,

  subscriber_type = 'user',
  owner_type = 'user',

  organization_id = NULL,

  status = CASE
    WHEN subscription.status IN (
      'canceled',
      'expired',
      'unpaid'
    )
    THEN subscription.status

    ELSE 'active'
  END,

  source = 'default',

  starts_at =
    COALESCE(
      subscription.starts_at,
      subscription.created_at,
      now()
    ),

  billing_cycle = 'free',
  quantity = 1,
  currency = 'BRL',

  unit_amount_cents = 0,
  total_amount_cents = 0,

  cancel_at_period_end = false,

  is_default_free = true,

  metadata =
    COALESCE(
      subscription.metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'default_free',
      true,

      'integrity_repair',
      'incorrect_default_plan',

      'integrity_repaired_at',
      now(),

      'migration',
      '22_default_free_integrity'
    ),

  updated_at = now()

FROM
  free_plan,
  public.plans AS current_plan

WHERE current_plan.id =
      subscription.plan_id

  AND subscription.is_default_free = true

  AND COALESCE(
    NULLIF(
      trim(subscription.source),
      ''
    ),
    'default'
  ) = 'default'

  AND lower(current_plan.code) <>
      'edi_free';


-- =========================================================
-- 4. PRESERVAÇÃO DE ASSINATURAS PAGAS LEGÍTIMAS
-- =========================================================
--
-- Uma assinatura paga que não veio do provisionamento
-- automático deve preservar o plano pago.
--
-- Nesse caso, somente a marca indevida is_default_free
-- é removida.
-- =========================================================

UPDATE public.subscriptions AS subscription
SET
  is_default_free = false,

  metadata =
    COALESCE(
      subscription.metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'integrity_repair',
      'removed_invalid_default_flag',

      'integrity_repaired_at',
      now(),

      'migration',
      '22_default_free_integrity'
    ),

  updated_at = now()

FROM public.plans AS plan_record

WHERE subscription.plan_id =
      plan_record.id

  AND subscription.is_default_free = true

  AND lower(plan_record.code) <>
      'edi_free'

  AND COALESCE(
    NULLIF(
      trim(subscription.source),
      ''
    ),
    'manual'
  ) <> 'default';


-- =========================================================
-- 5. REMOÇÃO DE DUPLICIDADES ATIVAS DO EDI_FREE
-- =========================================================
--
-- Caso existam duas assinaturas ativas apontando para o
-- edi_free para o mesmo usuário, apenas uma será preservada.
--
-- A prioridade para preservação é:
-- 1. assinatura já marcada como padrão;
-- 2. assinatura criada mais recentemente.
-- =========================================================

WITH ranked_free_subscriptions AS (
  SELECT
    subscription.id,

    row_number() OVER (
      PARTITION BY subscription.user_id

      ORDER BY
        subscription.is_default_free DESC,
        subscription.created_at DESC,
        subscription.id DESC
    ) AS position

  FROM public.subscriptions AS subscription

  INNER JOIN public.plans AS plan_record
    ON plan_record.id =
       subscription.plan_id

  WHERE subscription.user_id IS NOT NULL

    AND subscription.organization_id
        IS NULL

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
)

UPDATE public.subscriptions AS subscription
SET
  status = 'canceled',

  is_default_free = false,

  cancel_at_period_end = false,

  canceled_at =
    COALESCE(
      subscription.canceled_at,
      now()
    ),

  ended_at =
    COALESCE(
      subscription.ended_at,
      now()
    ),

  metadata =
    COALESCE(
      subscription.metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'integrity_repair',
      'duplicate_active_edi_free',

      'integrity_repaired_at',
      now(),

      'migration',
      '22_default_free_integrity'
    ),

  updated_at = now()

FROM ranked_free_subscriptions AS ranked

WHERE ranked.id =
      subscription.id

  AND ranked.position > 1;


-- =========================================================
-- 6. NORMALIZAÇÃO DAS ASSINATURAS EDI_FREE
-- =========================================================

UPDATE public.subscriptions AS subscription
SET
  subscriber_type = 'user',
  owner_type = 'user',

  organization_id = NULL,

  source = 'default',

  starts_at =
    COALESCE(
      subscription.starts_at,
      subscription.created_at,
      now()
    ),

  billing_cycle = 'free',
  quantity = 1,
  currency = 'BRL',

  unit_amount_cents = 0,
  total_amount_cents = 0,

  cancel_at_period_end = false,

  is_default_free = true,

  metadata =
    COALESCE(
      subscription.metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'default_free',
      true,

      'integrity_checked_by',
      '22_default_free_integrity',

      'integrity_checked_at',
      now()
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
-- 7. REGRAS DE INTEGRIDADE DOS PLANOS
-- =========================================================

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS
    plans_edi_free_integrity_check;


ALTER TABLE public.plans
  ADD CONSTRAINT
    plans_edi_free_integrity_check
  CHECK (
    lower(code) <> 'edi_free'

    OR (
      is_free = true

      AND is_active = true

      AND audience_type =
          'individual'

      AND audience =
          'individual'

      AND billing_model =
          'free'

      AND billing_mode =
          'free'

      AND COALESCE(
        monthly_price_cents,
        0
      ) = 0

      AND COALESCE(
        annual_price_cents,
        0
      ) = 0

      AND COALESCE(
        yearly_price_cents,
        0
      ) = 0

      AND COALESCE(
        setup_price_cents,
        0
      ) = 0
    )
  );


ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS
    plans_official_paid_not_free_check;


ALTER TABLE public.plans
  ADD CONSTRAINT
    plans_official_paid_not_free_check
  CHECK (
    lower(code) NOT IN (
      'edi_professor_pro',
      'edi_escola',
      'edi_rede'
    )

    OR is_free = false
  );


-- =========================================================
-- 8. PROTEÇÃO AUTOMÁTICA DOS PLANOS OFICIAIS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.enforce_official_plan_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF lower(OLD.code) IN (
      'edi_free',
      'edi_professor_pro',
      'edi_escola',
      'edi_rede'
    )
    AND lower(NEW.code) <>
        lower(OLD.code)
    THEN
      RAISE EXCEPTION
        'O código de um plano oficial não pode ser alterado: %.',
        OLD.code;
    END IF;
  END IF;


  IF lower(NEW.code) = 'edi_free' THEN
    NEW.is_free := true;

    NEW.is_active := true;

    NEW.audience_type :=
      'individual';

    NEW.audience :=
      'individual';

    NEW.billing_model :=
      'free';

    NEW.billing_mode :=
      'free';

    NEW.monthly_price_cents := 0;
    NEW.annual_price_cents := 0;
    NEW.yearly_price_cents := 0;
    NEW.setup_price_cents := 0;


  ELSIF lower(NEW.code) IN (
    'edi_professor_pro',
    'edi_escola',
    'edi_rede'
  ) THEN
    NEW.is_free := false;
  END IF;


  NEW.metadata :=
    COALESCE(
      NEW.metadata,
      '{}'::jsonb
    );


  NEW.updated_at := now();


  RETURN NEW;
END;
$$;


COMMENT ON FUNCTION
  public.enforce_official_plan_integrity()
IS
  'Mantém a classificação e os códigos dos planos comerciais oficiais da EduData IA.';


REVOKE ALL
ON FUNCTION
  public.enforce_official_plan_integrity()
FROM PUBLIC;


DROP TRIGGER IF EXISTS
  trg_enforce_official_plan_integrity
ON public.plans;


CREATE TRIGGER
  trg_enforce_official_plan_integrity

BEFORE INSERT OR UPDATE
ON public.plans

FOR EACH ROW

EXECUTE FUNCTION
  public.enforce_official_plan_integrity();


-- =========================================================
-- 9. PROTEÇÃO DAS ASSINATURAS GRATUITAS PADRÃO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.enforce_default_free_subscription_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_plan_code text;
  selected_plan_is_free boolean;
  selected_plan_is_active boolean;
BEGIN
  SELECT
    lower(code),
    is_free,
    is_active

  INTO
    selected_plan_code,
    selected_plan_is_free,
    selected_plan_is_active

  FROM public.plans

  WHERE id = NEW.plan_id;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Plano da assinatura não encontrado: %.',
      NEW.plan_id;
  END IF;


  IF NEW.is_default_free = true THEN
    IF selected_plan_code <>
       'edi_free'

       OR selected_plan_is_free
          IS DISTINCT FROM true

       OR selected_plan_is_active
          IS DISTINCT FROM true
    THEN
      RAISE EXCEPTION
        'Uma assinatura gratuita padrão somente pode utilizar o plano edi_free ativo.';
    END IF;


    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION
        'A assinatura edi_free precisa pertencer a um usuário.';
    END IF;


    IF NEW.organization_id IS NOT NULL THEN
      RAISE EXCEPTION
        'A assinatura edi_free padrão não pode pertencer a uma organização.';
    END IF;


    NEW.subscriber_type :=
      'user';

    NEW.owner_type :=
      'user';

    NEW.organization_id :=
      NULL;

    NEW.source :=
      'default';

    NEW.starts_at :=
      COALESCE(
        NEW.starts_at,
        NEW.created_at,
        now()
      );

    NEW.billing_cycle :=
      'free';

    NEW.quantity := 1;
    NEW.currency := 'BRL';

    NEW.unit_amount_cents := 0;
    NEW.total_amount_cents := 0;

    NEW.cancel_at_period_end :=
      false;

    NEW.metadata :=
      COALESCE(
        NEW.metadata,
        '{}'::jsonb
      ) || jsonb_build_object(
        'default_free',
        true
      );
  END IF;


  NEW.updated_at := now();


  RETURN NEW;
END;
$$;


COMMENT ON FUNCTION
  public.enforce_default_free_subscription_integrity()
IS
  'Impede que uma assinatura marcada como gratuita padrão utilize um plano diferente de edi_free.';


REVOKE ALL
ON FUNCTION
  public.enforce_default_free_subscription_integrity()
FROM PUBLIC;


DROP TRIGGER IF EXISTS
  trg_enforce_default_free_subscription_integrity
ON public.subscriptions;


CREATE TRIGGER
  trg_enforce_default_free_subscription_integrity

BEFORE INSERT OR UPDATE
ON public.subscriptions

FOR EACH ROW

EXECUTE FUNCTION
  public.enforce_default_free_subscription_integrity();


-- =========================================================
-- 10. PROVISIONAMENTO FORTALECIDO DO EDI_FREE
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

    AND is_free = true

    AND audience_type =
        'individual'

    AND audience =
        'individual'

    AND billing_model =
        'free'

    AND billing_mode =
        'free'

  ORDER BY
    sort_order ASC,
    created_at ASC

  LIMIT 1;


  IF free_plan_id IS NULL THEN
    RAISE EXCEPTION
      'O plano edi_free válido não foi encontrado.';
  END IF;


  SELECT subscription.id
  INTO existing_subscription_id

  FROM public.subscriptions
    AS subscription

  WHERE subscription.user_id =
        target_user_id

    AND subscription.organization_id
        IS NULL

    AND subscription.plan_id =
        free_plan_id

    AND subscription.is_default_free =
        true

    AND subscription.status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    )

  ORDER BY
    subscription.created_at DESC

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
      'default_free',
      true,

      'provisioning',
      'automatic',

      'migration',
      '22_default_free_integrity'
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

  FROM public.subscriptions
    AS subscription

  WHERE subscription.user_id =
        target_user_id

    AND subscription.organization_id
        IS NULL

    AND subscription.plan_id =
        free_plan_id

    AND subscription.is_default_free =
        true

    AND subscription.status IN (
      'pending',
      'trialing',
      'active',
      'past_due',
      'paused',
      'incomplete'
    )

  ORDER BY
    subscription.created_at DESC

  LIMIT 1;


  RETURN existing_subscription_id;
END;
$$;


COMMENT ON FUNCTION
  public.ensure_default_free_subscription(uuid)
IS
  'Garante uma assinatura válida do plano edi_free sem substituir assinaturas pagas.';


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
-- 11. GARANTIA DO EDI_FREE PARA TODOS OS USUÁRIOS
-- =========================================================

DO $$
DECLARE
  user_record record;
BEGIN
  FOR user_record IN
    SELECT id

    FROM auth.users

    ORDER BY created_at ASC
  LOOP
    PERFORM
      public.ensure_default_free_subscription(
        user_record.id
      );
  END LOOP;
END;
$$;


-- =========================================================
-- 12. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  free_plan_count integer;
  invalid_default_subscriptions integer;
  invalid_paid_plans integer;
  users_without_free integer;
  duplicated_active_free integer;
BEGIN
  SELECT count(*)
  INTO free_plan_count

  FROM public.plans

  WHERE lower(code) = 'edi_free'

    AND is_free = true

    AND is_active = true

    AND audience_type =
        'individual'

    AND audience =
        'individual'

    AND billing_model =
        'free'

    AND billing_mode =
        'free'

    AND COALESCE(
      monthly_price_cents,
      0
    ) = 0

    AND COALESCE(
      annual_price_cents,
      0
    ) = 0

    AND COALESCE(
      yearly_price_cents,
      0
    ) = 0

    AND COALESCE(
      setup_price_cents,
      0
    ) = 0;


  IF free_plan_count <> 1 THEN
    RAISE EXCEPTION
      'Era esperado exatamente um plano edi_free válido, mas foram encontrados %.',
      free_plan_count;
  END IF;


  SELECT count(*)
  INTO invalid_default_subscriptions

  FROM public.subscriptions
    AS subscription

  INNER JOIN public.plans
    AS plan_record
    ON plan_record.id =
       subscription.plan_id

  WHERE subscription.is_default_free = true

    AND (
      lower(plan_record.code) <>
        'edi_free'

      OR plan_record.is_free
        IS DISTINCT FROM true

      OR plan_record.is_active
        IS DISTINCT FROM true

      OR subscription.user_id
        IS NULL

      OR subscription.organization_id
        IS NOT NULL

      OR subscription.subscriber_type <>
        'user'

      OR subscription.owner_type <>
        'user'
    );


  IF invalid_default_subscriptions <> 0 THEN
    RAISE EXCEPTION
      'Existem % assinatura(s) gratuita(s) padrão inválida(s).',
      invalid_default_subscriptions;
  END IF;


  SELECT count(*)
  INTO invalid_paid_plans

  FROM public.plans

  WHERE lower(code) IN (
    'edi_professor_pro',
    'edi_escola',
    'edi_rede'
  )

  AND is_free IS DISTINCT FROM false;


  IF invalid_paid_plans <> 0 THEN
    RAISE EXCEPTION
      'Existem % plano(s) pago(s) marcado(s) como gratuito(s).',
      invalid_paid_plans;
  END IF;


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

      AND subscription.organization_id
          IS NULL

      AND subscription.is_default_free =
          true

      AND lower(plan_record.code) =
          'edi_free'

      AND plan_record.is_free = true

      AND plan_record.is_active = true

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
      'Existem % usuário(s) sem assinatura edi_free ativa.',
      users_without_free;
  END IF;


  SELECT count(*)
  INTO duplicated_active_free

  FROM (
    SELECT
      subscription.user_id

    FROM public.subscriptions
      AS subscription

    INNER JOIN public.plans
      AS plan_record
      ON plan_record.id =
         subscription.plan_id

    WHERE subscription.user_id
          IS NOT NULL

      AND subscription.is_default_free =
          true

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

    GROUP BY
      subscription.user_id

    HAVING count(*) > 1
  ) AS duplicates;


  IF duplicated_active_free <> 0 THEN
    RAISE EXCEPTION
      'Existem usuários com mais de uma assinatura edi_free ativa.';
  END IF;


  IF to_regprocedure(
    'public.ensure_default_free_subscription(uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função de provisionamento do edi_free não foi criada.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM pg_trigger

    WHERE tgname =
      'trg_enforce_official_plan_integrity'

      AND tgisinternal = false
  ) THEN
    RAISE EXCEPTION
      'O trigger de integridade dos planos não foi criado.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM pg_trigger

    WHERE tgname =
      'trg_enforce_default_free_subscription_integrity'

      AND tgisinternal = false
  ) THEN
    RAISE EXCEPTION
      'O trigger de integridade das assinaturas não foi criado.';
  END IF;
END;
$$;


COMMIT;