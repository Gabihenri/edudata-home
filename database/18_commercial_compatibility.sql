BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 18 — COMMERCIAL COMPATIBILITY
-- =========================================================
--
-- Objetivos:
-- 1. Compatibilizar o núcleo comercial consolidado com o
--    serviço de controle de acesso já existente.
-- 2. Preservar colunas anteriores utilizadas pelo backend.
-- 3. Evitar reconstrução ou perda de dados.
-- 4. Preparar a inserção dos planos e recursos oficiais.
--
-- Esta migração:
-- - não remove colunas;
-- - não remove dados;
-- - não cria planos;
-- - não cria assinaturas;
-- - não libera acesso automaticamente.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DAS TABELAS
-- =========================================================

DO $$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'plans',
    'features',
    'plan_entitlements',
    'subscriptions',
    'organization_licenses',
    'usage_counters',
    'access_overrides'
  ]
  LOOP
    IF to_regclass(
      format('public.%I', required_table)
    ) IS NULL THEN
      RAISE EXCEPTION
        'Tabela obrigatória não encontrada: public.%',
        required_table;
    END IF;
  END LOOP;
END;
$$;


-- =========================================================
-- 2. COMPATIBILIDADE — PLANS
-- =========================================================
--
-- Estrutura consolidada:
-- audience_type
-- billing_model
-- annual_price_cents
--
-- Estrutura utilizada pelo backend:
-- audience
-- billing_mode
-- yearly_price_cents
-- =========================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS billing_mode text,
  ADD COLUMN IF NOT EXISTS yearly_price_cents integer;


UPDATE public.plans
SET
  audience = COALESCE(
    audience,
    CASE audience_type
      WHEN 'individual' THEN 'individual'
      WHEN 'institutional' THEN 'organization'
      WHEN 'network' THEN 'network'
      WHEN 'platform' THEN 'organization'
      ELSE 'individual'
    END
  ),

  audience_type = COALESCE(
    audience_type,
    CASE audience
      WHEN 'individual' THEN 'individual'
      WHEN 'organization' THEN 'institutional'
      WHEN 'network' THEN 'network'
      ELSE 'individual'
    END
  ),

  billing_mode = COALESCE(
    billing_mode,
    CASE billing_model
      WHEN 'free' THEN 'free'
      WHEN 'subscription' THEN 'recurring'
      WHEN 'license' THEN 'recurring'
      WHEN 'contract' THEN 'quote'
      WHEN 'custom' THEN 'quote'
      ELSE 'recurring'
    END
  ),

  billing_model = COALESCE(
    billing_model,
    CASE billing_mode
      WHEN 'free' THEN 'free'
      WHEN 'recurring' THEN 'subscription'
      WHEN 'quote' THEN 'custom'
      ELSE 'subscription'
    END
  ),

  yearly_price_cents = COALESCE(
    yearly_price_cents,
    annual_price_cents
  ),

  annual_price_cents = COALESCE(
    annual_price_cents,
    yearly_price_cents
  );


UPDATE public.plans
SET
  audience = 'individual'
WHERE audience IS NULL;


UPDATE public.plans
SET
  billing_mode = CASE
    WHEN is_free = true THEN 'free'
    ELSE 'recurring'
  END
WHERE billing_mode IS NULL;


ALTER TABLE public.plans
  ALTER COLUMN audience SET DEFAULT 'individual',
  ALTER COLUMN audience SET NOT NULL,
  ALTER COLUMN billing_mode SET DEFAULT 'recurring',
  ALTER COLUMN billing_mode SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_plans_compat_audience
  ON public.plans(audience);


CREATE INDEX IF NOT EXISTS idx_plans_compat_billing_mode
  ON public.plans(billing_mode);


COMMENT ON COLUMN public.plans.audience IS
  'Campo de compatibilidade utilizado pelo serviço de acesso existente.';


COMMENT ON COLUMN public.plans.billing_mode IS
  'Modo comercial compatível com free, recurring e quote.';


COMMENT ON COLUMN public.plans.yearly_price_cents IS
  'Valor anual compatível com annual_price_cents.';


-- =========================================================
-- 3. COMPATIBILIDADE — FEATURES
-- =========================================================
--
-- Estrutura consolidada:
-- value_type
-- unit_name
--
-- Estrutura utilizada pelo backend:
-- feature_type
-- unit
-- =========================================================

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS feature_type text,
  ADD COLUMN IF NOT EXISTS unit text;


UPDATE public.features
SET
  feature_type = COALESCE(
    feature_type,
    CASE
      WHEN value_type = 'boolean' THEN 'boolean'
      ELSE 'quota'
    END
  ),

  value_type = COALESCE(
    value_type,
    CASE feature_type
      WHEN 'boolean' THEN 'boolean'
      WHEN 'quota' THEN 'integer'
      ELSE 'boolean'
    END
  ),

  unit = COALESCE(
    unit,
    unit_name
  ),

  unit_name = COALESCE(
    unit_name,
    unit
  );


UPDATE public.features
SET feature_type = 'boolean'
WHERE feature_type IS NULL;


ALTER TABLE public.features
  ALTER COLUMN feature_type SET DEFAULT 'boolean',
  ALTER COLUMN feature_type SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_features_compat_feature_type
  ON public.features(feature_type);


COMMENT ON COLUMN public.features.feature_type IS
  'Tipo utilizado pelo serviço de acesso: boolean ou quota.';


COMMENT ON COLUMN public.features.unit IS
  'Unidade de consumo utilizada para recursos com cota.';


-- =========================================================
-- 4. COMPATIBILIDADE — PLAN ENTITLEMENTS
-- =========================================================
--
-- Estrutura consolidada:
-- is_enabled
-- json_value
--
-- Estrutura utilizada pelo backend:
-- enabled
-- is_unlimited
-- config
-- =========================================================

ALTER TABLE public.plan_entitlements
  ADD COLUMN IF NOT EXISTS enabled boolean,
  ADD COLUMN IF NOT EXISTS is_unlimited boolean,
  ADD COLUMN IF NOT EXISTS config jsonb;


UPDATE public.plan_entitlements
SET
  enabled = COALESCE(
    enabled,
    is_enabled,
    false
  ),

  is_enabled = COALESCE(
    is_enabled,
    enabled,
    false
  ),

  is_unlimited = COALESCE(
    is_unlimited,
    CASE
      WHEN COALESCE(enabled, is_enabled, false) = true
        AND limit_value IS NULL
      THEN true
      ELSE false
    END
  ),

  config = COALESCE(
    config,
    json_value,
    '{}'::jsonb
  ),

  json_value = COALESCE(
    json_value,
    config
  );


ALTER TABLE public.plan_entitlements
  ALTER COLUMN enabled SET DEFAULT false,
  ALTER COLUMN enabled SET NOT NULL,
  ALTER COLUMN is_unlimited SET DEFAULT false,
  ALTER COLUMN is_unlimited SET NOT NULL,
  ALTER COLUMN config SET DEFAULT '{}'::jsonb,
  ALTER COLUMN config SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_plan_entitlements_compat_enabled
  ON public.plan_entitlements(
    plan_id,
    feature_id,
    enabled
  );


COMMENT ON COLUMN public.plan_entitlements.enabled IS
  'Compatibilidade com is_enabled para consulta do backend.';


COMMENT ON COLUMN public.plan_entitlements.is_unlimited IS
  'Indica que o recurso não possui limite quantitativo.';


COMMENT ON COLUMN public.plan_entitlements.config IS
  'Configuração complementar utilizada pelo serviço de acesso.';


-- =========================================================
-- 5. COMPATIBILIDADE — SUBSCRIPTIONS
-- =========================================================
--
-- Estrutura consolidada:
-- subscriber_type
-- current_period_starts_at
-- current_period_ends_at
--
-- Estrutura utilizada pelo backend:
-- owner_type
-- source
-- starts_at
-- current_period_start
-- current_period_end
-- =========================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS owner_type text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;


UPDATE public.subscriptions
SET
  owner_type = COALESCE(
    owner_type,
    CASE subscriber_type
      WHEN 'user' THEN 'user'
      WHEN 'organization' THEN 'organization'
      ELSE
        CASE
          WHEN user_id IS NOT NULL THEN 'user'
          WHEN organization_id IS NOT NULL THEN 'organization'
          ELSE NULL
        END
    END
  ),

  subscriber_type = COALESCE(
    subscriber_type,
    CASE owner_type
      WHEN 'user' THEN 'user'
      WHEN 'organization' THEN 'organization'
      ELSE
        CASE
          WHEN user_id IS NOT NULL THEN 'user'
          WHEN organization_id IS NOT NULL THEN 'organization'
          ELSE NULL
        END
    END
  ),

  source = COALESCE(
    source,
    CASE
      WHEN provider IS NOT NULL THEN 'billing'
      ELSE 'manual'
    END
  ),

  starts_at = COALESCE(
    starts_at,
    trial_starts_at,
    current_period_starts_at,
    created_at,
    now()
  ),

  current_period_start = COALESCE(
    current_period_start,
    current_period_starts_at
  ),

  current_period_starts_at = COALESCE(
    current_period_starts_at,
    current_period_start
  ),

  current_period_end = COALESCE(
    current_period_end,
    current_period_ends_at
  ),

  current_period_ends_at = COALESCE(
    current_period_ends_at,
    current_period_end
  );


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE owner_type IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem assinaturas sem proprietário definido.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE starts_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem assinaturas sem data inicial.';
  END IF;
END;
$$;


ALTER TABLE public.subscriptions
  ALTER COLUMN source SET DEFAULT 'manual',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN owner_type SET NOT NULL,
  ALTER COLUMN starts_at SET DEFAULT now(),
  ALTER COLUMN starts_at SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_subscriptions_compat_user_access
  ON public.subscriptions(
    owner_type,
    user_id,
    status,
    starts_at,
    current_period_end
  );


CREATE INDEX IF NOT EXISTS idx_subscriptions_compat_organization_access
  ON public.subscriptions(
    owner_type,
    organization_id,
    status,
    starts_at,
    current_period_end
  );


COMMENT ON COLUMN public.subscriptions.owner_type IS
  'Proprietário da assinatura utilizado pelo serviço de acesso.';


COMMENT ON COLUMN public.subscriptions.source IS
  'Origem da assinatura: default, manual, trial, billing ou institutional.';


COMMENT ON COLUMN public.subscriptions.starts_at IS
  'Data de início utilizada para validar a assinatura.';


-- =========================================================
-- 6. COMPATIBILIDADE — ORGANIZATION LICENSES
-- =========================================================
--
-- Estrutura consolidada:
-- status
-- starts_at
-- ends_at
--
-- Estrutura utilizada pelo backend:
-- seat_limit
-- school_limit
-- valid_from
-- valid_until
-- active
-- =========================================================

ALTER TABLE public.organization_licenses
  ADD COLUMN IF NOT EXISTS seat_limit integer,
  ADD COLUMN IF NOT EXISTS school_limit integer,
  ADD COLUMN IF NOT EXISTS valid_from date,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS active boolean;


UPDATE public.organization_licenses
SET
  active = COALESCE(
    active,
    CASE
      WHEN status = 'active' THEN true
      ELSE false
    END
  ),

  valid_from = COALESCE(
    valid_from,
    starts_at::date,
    created_at::date,
    current_date
  ),

  valid_until = COALESCE(
    valid_until,
    ends_at::date
  ),

  starts_at = COALESCE(
    starts_at,
    valid_from::timestamptz,
    created_at,
    now()
  ),

  ends_at = COALESCE(
    ends_at,
    valid_until::timestamptz
  );


UPDATE public.organization_licenses
SET active = true
WHERE active IS NULL;


UPDATE public.organization_licenses
SET valid_from = current_date
WHERE valid_from IS NULL;


ALTER TABLE public.organization_licenses
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN active SET NOT NULL,
  ALTER COLUMN valid_from SET DEFAULT current_date,
  ALTER COLUMN valid_from SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_organization_licenses_compat_active
  ON public.organization_licenses(
    subscription_id,
    active,
    valid_from,
    valid_until
  );


COMMENT ON COLUMN public.organization_licenses.seat_limit IS
  'Quantidade máxima de usuários vinculados à licença institucional.';


COMMENT ON COLUMN public.organization_licenses.school_limit IS
  'Quantidade máxima de escolas vinculadas à licença institucional.';


COMMENT ON COLUMN public.organization_licenses.active IS
  'Compatibilidade com o estado operacional da licença.';


-- =========================================================
-- 7. COMPATIBILIDADE — ACCESS OVERRIDES
-- =========================================================
--
-- Estrutura consolidada:
-- override_type
-- is_enabled
-- ends_at
-- approved_by
--
-- Estrutura utilizada pelo backend:
-- subject_type
-- enabled
-- is_unlimited
-- expires_at
-- granted_by
-- =========================================================

ALTER TABLE public.access_overrides
  ADD COLUMN IF NOT EXISTS subject_type text,
  ADD COLUMN IF NOT EXISTS enabled boolean,
  ADD COLUMN IF NOT EXISTS is_unlimited boolean,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS granted_by uuid;


UPDATE public.access_overrides
SET
  subject_type = COALESCE(
    subject_type,
    CASE
      WHEN user_id IS NOT NULL THEN 'user'
      WHEN organization_id IS NOT NULL THEN 'organization'
      ELSE NULL
    END
  ),

  enabled = COALESCE(
    enabled,
    is_enabled,
    CASE
      WHEN override_type = 'deny' THEN false
      ELSE true
    END
  ),

  is_enabled = COALESCE(
    is_enabled,
    enabled,
    CASE
      WHEN override_type = 'deny' THEN false
      ELSE true
    END
  ),

  is_unlimited = COALESCE(
    is_unlimited,
    CASE
      WHEN override_type = 'grant'
        AND limit_value IS NULL
      THEN true
      ELSE false
    END
  ),

  expires_at = COALESCE(
    expires_at,
    ends_at
  ),

  ends_at = COALESCE(
    ends_at,
    expires_at
  ),

  granted_by = COALESCE(
    granted_by,
    approved_by
  ),

  approved_by = COALESCE(
    approved_by,
    granted_by
  );


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.access_overrides
    WHERE subject_type IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem liberações de acesso sem proprietário definido.';
  END IF;
END;
$$;


ALTER TABLE public.access_overrides
  ALTER COLUMN subject_type SET NOT NULL,
  ALTER COLUMN enabled SET DEFAULT false,
  ALTER COLUMN enabled SET NOT NULL,
  ALTER COLUMN is_unlimited SET DEFAULT false,
  ALTER COLUMN is_unlimited SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_access_overrides_compat_user
  ON public.access_overrides(
    subject_type,
    user_id,
    feature_id,
    expires_at
  );


CREATE INDEX IF NOT EXISTS idx_access_overrides_compat_organization
  ON public.access_overrides(
    subject_type,
    organization_id,
    feature_id,
    expires_at
  );


COMMENT ON COLUMN public.access_overrides.subject_type IS
  'Define se a exceção pertence a usuário ou organização.';


COMMENT ON COLUMN public.access_overrides.enabled IS
  'Resultado efetivo da liberação ou do bloqueio manual.';


COMMENT ON COLUMN public.access_overrides.is_unlimited IS
  'Indica acesso sem limite quantitativo.';


-- =========================================================
-- 8. COMPATIBILIDADE — USAGE COUNTERS
-- =========================================================
--
-- Estrutura consolidada:
-- period_starts_at
-- period_ends_at
-- usage_value
--
-- Estrutura utilizada pelo backend:
-- subject_type
-- period_start
-- period_end
-- quantity
-- =========================================================

ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS subject_type text,
  ADD COLUMN IF NOT EXISTS period_start timestamptz,
  ADD COLUMN IF NOT EXISTS period_end timestamptz,
  ADD COLUMN IF NOT EXISTS quantity numeric;


UPDATE public.usage_counters
SET
  subject_type = COALESCE(
    subject_type,
    CASE
      WHEN user_id IS NOT NULL THEN 'user'
      WHEN organization_id IS NOT NULL THEN 'organization'
      ELSE NULL
    END
  ),

  period_start = COALESCE(
    period_start,
    period_starts_at
  ),

  period_starts_at = COALESCE(
    period_starts_at,
    period_start
  ),

  period_end = COALESCE(
    period_end,
    period_ends_at
  ),

  period_ends_at = COALESCE(
    period_ends_at,
    period_end
  ),

  quantity = COALESCE(
    quantity,
    usage_value,
    0
  ),

  usage_value = COALESCE(
    usage_value,
    quantity,
    0
  );


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.usage_counters
    WHERE subject_type IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem contadores de uso sem proprietário definido.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.usage_counters
    WHERE period_start IS NULL
       OR period_end IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem contadores de uso sem período definido.';
  END IF;
END;
$$;


ALTER TABLE public.usage_counters
  ALTER COLUMN subject_type SET NOT NULL,
  ALTER COLUMN quantity SET DEFAULT 0,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN period_start SET NOT NULL,
  ALTER COLUMN period_end SET NOT NULL;


CREATE INDEX IF NOT EXISTS idx_usage_counters_compat_user_period
  ON public.usage_counters(
    subject_type,
    user_id,
    feature_id,
    period_start,
    period_end
  );


CREATE INDEX IF NOT EXISTS idx_usage_counters_compat_organization_period
  ON public.usage_counters(
    subject_type,
    organization_id,
    feature_id,
    period_start,
    period_end
  );


COMMENT ON COLUMN public.usage_counters.subject_type IS
  'Define se o consumo pertence a usuário ou organização.';


COMMENT ON COLUMN public.usage_counters.quantity IS
  'Quantidade consumida no período, compatível com usage_value.';


-- =========================================================
-- 9. VALIDAÇÃO FINAL DA COMPATIBILIDADE
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.plans
    WHERE audience IS NULL
       OR billing_mode IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela plans.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.features
    WHERE feature_type IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela features.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.plan_entitlements
    WHERE enabled IS NULL
       OR is_unlimited IS NULL
       OR config IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela plan_entitlements.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE owner_type IS NULL
       OR source IS NULL
       OR starts_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela subscriptions.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_licenses
    WHERE active IS NULL
       OR valid_from IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela organization_licenses.';
  END IF;
END;
$$;


COMMIT;