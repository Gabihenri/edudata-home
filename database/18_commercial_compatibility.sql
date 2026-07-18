BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 18 — COMMERCIAL COMPATIBILITY (CONSOLIDADA)
-- =========================================================
--
-- Compatibiliza o núcleo comercial com o serviço de acesso
-- já utilizado pela aplicação.
--
-- Não remove colunas.
-- Não apaga dados.
-- Não cria assinaturas.
-- Não concede acesso automaticamente.
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
-- 2. PLANOS
-- =========================================================
--
-- Modelo consolidado:
-- audience_type
-- billing_model
-- annual_price_cents
--
-- Modelo utilizado pelo backend:
-- audience
-- billing_mode
-- yearly_price_cents
-- =========================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS audience_type text,
  ADD COLUMN IF NOT EXISTS billing_model text,
  ADD COLUMN IF NOT EXISTS annual_price_cents integer,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS billing_mode text,
  ADD COLUMN IF NOT EXISTS yearly_price_cents integer;


UPDATE public.plans
SET
  audience_type = CASE
    WHEN audience = 'individual'
      THEN 'individual'

    WHEN audience = 'organization'
      THEN 'institutional'

    WHEN audience = 'network'
      THEN 'network'

    ELSE COALESCE(
      NULLIF(trim(audience_type), ''),
      'individual'
    )
  END,

  audience = COALESCE(
    NULLIF(trim(audience), ''),
    CASE audience_type
      WHEN 'individual'
        THEN 'individual'

      WHEN 'institutional'
        THEN 'organization'

      WHEN 'network'
        THEN 'network'

      WHEN 'platform'
        THEN 'organization'

      ELSE 'individual'
    END
  ),

  billing_model = CASE
    WHEN billing_mode = 'free'
      THEN 'free'

    WHEN billing_mode = 'recurring'
      THEN 'subscription'

    WHEN billing_mode = 'quote'
      THEN 'custom'

    ELSE COALESCE(
      NULLIF(trim(billing_model), ''),
      CASE
        WHEN is_free = true
          THEN 'free'
        ELSE 'subscription'
      END
    )
  END,

  billing_mode = COALESCE(
    NULLIF(trim(billing_mode), ''),
    CASE billing_model
      WHEN 'free'
        THEN 'free'

      WHEN 'subscription'
        THEN 'recurring'

      WHEN 'license'
        THEN 'recurring'

      WHEN 'contract'
        THEN 'quote'

      WHEN 'custom'
        THEN 'quote'

      ELSE
        CASE
          WHEN is_free = true
            THEN 'free'
          ELSE 'recurring'
        END
    END
  ),

  annual_price_cents = COALESCE(
    yearly_price_cents,
    annual_price_cents
  ),

  yearly_price_cents = COALESCE(
    yearly_price_cents,
    annual_price_cents
  );


UPDATE public.plans
SET
  audience_type = COALESCE(
    NULLIF(trim(audience_type), ''),
    'individual'
  ),

  audience = COALESCE(
    NULLIF(trim(audience), ''),
    'individual'
  ),

  billing_model = COALESCE(
    NULLIF(trim(billing_model), ''),
    CASE
      WHEN is_free = true
        THEN 'free'
      ELSE 'subscription'
    END
  ),

  billing_mode = COALESCE(
    NULLIF(trim(billing_mode), ''),
    CASE
      WHEN is_free = true
        THEN 'free'
      ELSE 'recurring'
    END
  );


ALTER TABLE public.plans
  ALTER COLUMN audience_type
    SET DEFAULT 'individual',

  ALTER COLUMN audience_type
    SET NOT NULL,

  ALTER COLUMN audience
    SET DEFAULT 'individual',

  ALTER COLUMN audience
    SET NOT NULL,

  ALTER COLUMN billing_model
    SET DEFAULT 'subscription',

  ALTER COLUMN billing_model
    SET NOT NULL,

  ALTER COLUMN billing_mode
    SET DEFAULT 'recurring',

  ALTER COLUMN billing_mode
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_plans_compat_audience
ON public.plans(audience);


CREATE INDEX IF NOT EXISTS
  idx_plans_compat_billing_mode
ON public.plans(billing_mode);


COMMENT ON COLUMN public.plans.audience IS
  'Campo de compatibilidade utilizado pelo serviço de acesso.';


COMMENT ON COLUMN public.plans.billing_mode IS
  'Modo comercial compatível com free, recurring e quote.';


COMMENT ON COLUMN public.plans.yearly_price_cents IS
  'Valor anual compatível com annual_price_cents.';


-- =========================================================
-- 3. RECURSOS
-- =========================================================
--
-- Modelo consolidado:
-- value_type
-- unit_name
--
-- Modelo utilizado pelo backend:
-- feature_type
-- unit
-- =========================================================

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS value_type text,
  ADD COLUMN IF NOT EXISTS unit_name text,
  ADD COLUMN IF NOT EXISTS feature_type text,
  ADD COLUMN IF NOT EXISTS unit text;


UPDATE public.features
SET
  value_type = CASE
    WHEN feature_type = 'boolean'
      THEN 'boolean'

    WHEN feature_type = 'quota'
      THEN 'integer'

    ELSE COALESCE(
      NULLIF(trim(value_type), ''),
      'boolean'
    )
  END,

  feature_type = COALESCE(
    NULLIF(trim(feature_type), ''),
    CASE
      WHEN value_type = 'boolean'
        THEN 'boolean'
      ELSE 'quota'
    END
  ),

  unit_name = COALESCE(
    unit,
    unit_name
  ),

  unit = COALESCE(
    unit,
    unit_name
  );


UPDATE public.features
SET
  value_type = COALESCE(
    NULLIF(trim(value_type), ''),
    'boolean'
  ),

  feature_type = COALESCE(
    NULLIF(trim(feature_type), ''),
    'boolean'
  );


ALTER TABLE public.features
  ALTER COLUMN value_type
    SET DEFAULT 'boolean',

  ALTER COLUMN value_type
    SET NOT NULL,

  ALTER COLUMN feature_type
    SET DEFAULT 'boolean',

  ALTER COLUMN feature_type
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_features_compat_feature_type
ON public.features(feature_type);


COMMENT ON COLUMN public.features.feature_type IS
  'Tipo utilizado pelo serviço de acesso: boolean ou quota.';


COMMENT ON COLUMN public.features.unit IS
  'Unidade de consumo utilizada nos recursos com cota.';


-- =========================================================
-- 4. DIREITOS DOS PLANOS
-- =========================================================
--
-- Modelo consolidado:
-- is_enabled
-- json_value
--
-- Modelo utilizado pelo backend:
-- enabled
-- is_unlimited
-- config
-- =========================================================

ALTER TABLE public.plan_entitlements
  ADD COLUMN IF NOT EXISTS is_enabled boolean,
  ADD COLUMN IF NOT EXISTS json_value jsonb,
  ADD COLUMN IF NOT EXISTS enabled boolean,
  ADD COLUMN IF NOT EXISTS is_unlimited boolean,
  ADD COLUMN IF NOT EXISTS config jsonb;


UPDATE public.plan_entitlements
SET
  is_enabled = COALESCE(
    enabled,
    is_enabled,
    false
  ),

  enabled = COALESCE(
    enabled,
    is_enabled,
    false
  ),

  is_unlimited = COALESCE(
    is_unlimited,
    CASE
      WHEN COALESCE(
        enabled,
        is_enabled,
        false
      ) = true
      AND limit_value IS NULL
        THEN true
      ELSE false
    END
  ),

  json_value = COALESCE(
    config,
    json_value
  ),

  config = COALESCE(
    config,
    json_value,
    '{}'::jsonb
  );


ALTER TABLE public.plan_entitlements
  ALTER COLUMN is_enabled
    SET DEFAULT false,

  ALTER COLUMN is_enabled
    SET NOT NULL,

  ALTER COLUMN enabled
    SET DEFAULT false,

  ALTER COLUMN enabled
    SET NOT NULL,

  ALTER COLUMN is_unlimited
    SET DEFAULT false,

  ALTER COLUMN is_unlimited
    SET NOT NULL,

  ALTER COLUMN config
    SET DEFAULT '{}'::jsonb,

  ALTER COLUMN config
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_plan_entitlements_compat_enabled
ON public.plan_entitlements(
  plan_id,
  feature_id,
  enabled
);


COMMENT ON COLUMN public.plan_entitlements.enabled IS
  'Campo utilizado pelo serviço de acesso, sincronizado com is_enabled.';


COMMENT ON COLUMN public.plan_entitlements.is_unlimited IS
  'Indica que o recurso habilitado não possui limite quantitativo.';


COMMENT ON COLUMN public.plan_entitlements.config IS
  'Configuração complementar utilizada pelo serviço de acesso.';


-- =========================================================
-- 5. ASSINATURAS
-- =========================================================
--
-- Modelo consolidado:
-- subscriber_type
-- current_period_starts_at
-- current_period_ends_at
--
-- Modelo utilizado pelo backend:
-- owner_type
-- source
-- starts_at
-- current_period_start
-- current_period_end
-- =========================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS subscriber_type text,
  ADD COLUMN IF NOT EXISTS owner_type text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS billing_cycle text,
  ADD COLUMN IF NOT EXISTS quantity integer,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS unit_amount_cents integer,
  ADD COLUMN IF NOT EXISTS total_amount_cents integer,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_customer_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS provider_price_id text,
  ADD COLUMN IF NOT EXISTS trial_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


UPDATE public.subscriptions
SET
  subscriber_type = COALESCE(
    NULLIF(trim(owner_type), ''),
    NULLIF(trim(subscriber_type), ''),
    CASE
      WHEN user_id IS NOT NULL
        THEN 'user'

      WHEN organization_id IS NOT NULL
        THEN 'organization'

      ELSE NULL
    END
  ),

  owner_type = COALESCE(
    NULLIF(trim(owner_type), ''),
    NULLIF(trim(subscriber_type), ''),
    CASE
      WHEN user_id IS NOT NULL
        THEN 'user'

      WHEN organization_id IS NOT NULL
        THEN 'organization'

      ELSE NULL
    END
  ),

  source = CASE
    WHEN provider IS NOT NULL
      AND (
        source IS NULL
        OR source = 'manual'
      )
      THEN 'billing'

    ELSE COALESCE(
      NULLIF(trim(source), ''),
      'manual'
    )
  END,

  starts_at = COALESCE(
    current_period_start,
    current_period_starts_at,
    trial_starts_at,
    created_at,
    starts_at,
    now()
  ),

  billing_cycle = COALESCE(
    NULLIF(trim(billing_cycle), ''),
    'monthly'
  ),

  quantity = COALESCE(
    quantity,
    1
  ),

  currency = COALESCE(
    NULLIF(trim(currency), ''),
    'BRL'
  ),

  current_period_start = COALESCE(
    current_period_start,
    current_period_starts_at
  ),

  current_period_starts_at = COALESCE(
    current_period_start,
    current_period_starts_at
  ),

  current_period_end = COALESCE(
    current_period_end,
    current_period_ends_at
  ),

  current_period_ends_at = COALESCE(
    current_period_end,
    current_period_ends_at
  ),

  cancel_at_period_end = COALESCE(
    cancel_at_period_end,
    false
  ),

  metadata = COALESCE(
    metadata,
    '{}'::jsonb
  ),

  created_at = COALESCE(
    created_at,
    now()
  ),

  updated_at = COALESCE(
    updated_at,
    created_at,
    now()
  );


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE subscriber_type IS NULL
       OR owner_type IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem assinaturas sem usuário ou organização responsável.';
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
  ALTER COLUMN subscriber_type
    SET NOT NULL,

  ALTER COLUMN owner_type
    SET NOT NULL,

  ALTER COLUMN source
    SET DEFAULT 'manual',

  ALTER COLUMN source
    SET NOT NULL,

  ALTER COLUMN starts_at
    SET DEFAULT now(),

  ALTER COLUMN starts_at
    SET NOT NULL,

  ALTER COLUMN billing_cycle
    SET DEFAULT 'monthly',

  ALTER COLUMN billing_cycle
    SET NOT NULL,

  ALTER COLUMN quantity
    SET DEFAULT 1,

  ALTER COLUMN quantity
    SET NOT NULL,

  ALTER COLUMN currency
    SET DEFAULT 'BRL',

  ALTER COLUMN currency
    SET NOT NULL,

  ALTER COLUMN cancel_at_period_end
    SET DEFAULT false,

  ALTER COLUMN cancel_at_period_end
    SET NOT NULL,

  ALTER COLUMN metadata
    SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata
    SET NOT NULL,

  ALTER COLUMN created_at
    SET DEFAULT now(),

  ALTER COLUMN created_at
    SET NOT NULL,

  ALTER COLUMN updated_at
    SET DEFAULT now(),

  ALTER COLUMN updated_at
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_subscriptions_compat_user_access
ON public.subscriptions(
  owner_type,
  user_id,
  status,
  starts_at,
  current_period_end
);


CREATE INDEX IF NOT EXISTS
  idx_subscriptions_compat_organization_access
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
-- 6. LICENÇAS INSTITUCIONAIS
-- =========================================================
--
-- Modelo consolidado:
-- status
-- starts_at
-- ends_at
--
-- Modelo utilizado pelo backend:
-- seat_limit
-- school_limit
-- valid_from
-- valid_until
-- active
-- =========================================================

ALTER TABLE public.organization_licenses
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_by uuid,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid,
  ADD COLUMN IF NOT EXISTS seat_limit integer,
  ADD COLUMN IF NOT EXISTS school_limit integer,
  ADD COLUMN IF NOT EXISTS valid_from date,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS active boolean,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


UPDATE public.organization_licenses
SET
  status = CASE
    WHEN status IN (
      'pending',
      'revoked',
      'expired'
    )
      THEN status

    WHEN active = false
      THEN 'suspended'

    WHEN active = true
      THEN 'active'

    ELSE COALESCE(
      NULLIF(trim(status), ''),
      'active'
    )
  END,

  active = CASE
    WHEN status IN (
      'suspended',
      'revoked',
      'expired'
    )
      THEN false

    WHEN status = 'active'
      THEN true

    ELSE COALESCE(
      active,
      true
    )
  END,

  valid_from = COALESCE(
    created_at::date,
    starts_at::date,
    valid_from,
    current_date
  ),

  valid_until = COALESCE(
    valid_until,
    ends_at::date
  ),

  starts_at = COALESCE(
    created_at,
    starts_at,
    valid_from::timestamptz,
    now()
  ),

  ends_at = COALESCE(
    ends_at,
    valid_until::timestamptz
  ),

  metadata = COALESCE(
    metadata,
    '{}'::jsonb
  ),

  created_at = COALESCE(
    created_at,
    starts_at,
    now()
  ),

  updated_at = COALESCE(
    updated_at,
    created_at,
    now()
  );


UPDATE public.organization_licenses
SET
  status = COALESCE(
    NULLIF(trim(status), ''),
    'active'
  ),

  active = COALESCE(
    active,
    true
  ),

  valid_from = COALESCE(
    valid_from,
    current_date
  ),

  starts_at = COALESCE(
    starts_at,
    now()
  );


ALTER TABLE public.organization_licenses
  ALTER COLUMN status
    SET DEFAULT 'active',

  ALTER COLUMN status
    SET NOT NULL,

  ALTER COLUMN starts_at
    SET DEFAULT now(),

  ALTER COLUMN starts_at
    SET NOT NULL,

  ALTER COLUMN active
    SET DEFAULT true,

  ALTER COLUMN active
    SET NOT NULL,

  ALTER COLUMN valid_from
    SET DEFAULT current_date,

  ALTER COLUMN valid_from
    SET NOT NULL,

  ALTER COLUMN metadata
    SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata
    SET NOT NULL,

  ALTER COLUMN created_at
    SET DEFAULT now(),

  ALTER COLUMN created_at
    SET NOT NULL,

  ALTER COLUMN updated_at
    SET DEFAULT now(),

  ALTER COLUMN updated_at
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_organization_licenses_compat_active
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
  'Estado operacional utilizado pelo serviço de acesso.';


-- =========================================================
-- 7. EXCEÇÕES DE ACESSO
-- =========================================================
--
-- Modelo consolidado:
-- override_type
-- is_enabled
-- starts_at
-- ends_at
-- approved_by
--
-- Modelo utilizado pelo backend:
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
  ADD COLUMN IF NOT EXISTS granted_by uuid,
  ADD COLUMN IF NOT EXISTS override_type text,
  ADD COLUMN IF NOT EXISTS is_enabled boolean,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


UPDATE public.access_overrides
SET
  subject_type = COALESCE(
    NULLIF(trim(subject_type), ''),
    CASE
      WHEN user_id IS NOT NULL
        THEN 'user'

      WHEN organization_id IS NOT NULL
        THEN 'organization'

      ELSE NULL
    END
  ),

  enabled = COALESCE(
    enabled,
    is_enabled,
    CASE
      WHEN override_type = 'deny'
        THEN false
      ELSE true
    END
  ),

  is_enabled = COALESCE(
    enabled,
    is_enabled,
    CASE
      WHEN override_type = 'deny'
        THEN false
      ELSE true
    END
  ),

  override_type = COALESCE(
    NULLIF(trim(override_type), ''),
    CASE
      WHEN COALESCE(
        enabled,
        is_enabled,
        true
      ) = false
        THEN 'deny'

      WHEN limit_value IS NOT NULL
        THEN 'limit'

      ELSE 'grant'
    END
  ),

  is_unlimited = COALESCE(
    is_unlimited,
    CASE
      WHEN COALESCE(
        enabled,
        is_enabled,
        false
      ) = true
      AND limit_value IS NULL
        THEN true
      ELSE false
    END
  ),

  starts_at = COALESCE(
    created_at,
    starts_at,
    now()
  ),

  expires_at = COALESCE(
    expires_at,
    ends_at
  ),

  ends_at = COALESCE(
    expires_at,
    ends_at
  ),

  granted_by = COALESCE(
    granted_by,
    approved_by
  ),

  approved_by = COALESCE(
    granted_by,
    approved_by
  ),

  metadata = COALESCE(
    metadata,
    '{}'::jsonb
  ),

  created_at = COALESCE(
    created_at,
    starts_at,
    now()
  ),

  updated_at = COALESCE(
    updated_at,
    created_at,
    now()
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
  ALTER COLUMN subject_type
    SET NOT NULL,

  ALTER COLUMN enabled
    SET DEFAULT false,

  ALTER COLUMN enabled
    SET NOT NULL,

  ALTER COLUMN is_enabled
    SET DEFAULT false,

  ALTER COLUMN is_enabled
    SET NOT NULL,

  ALTER COLUMN is_unlimited
    SET DEFAULT false,

  ALTER COLUMN is_unlimited
    SET NOT NULL,

  ALTER COLUMN starts_at
    SET DEFAULT now(),

  ALTER COLUMN starts_at
    SET NOT NULL,

  ALTER COLUMN metadata
    SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata
    SET NOT NULL,

  ALTER COLUMN created_at
    SET DEFAULT now(),

  ALTER COLUMN created_at
    SET NOT NULL,

  ALTER COLUMN updated_at
    SET DEFAULT now(),

  ALTER COLUMN updated_at
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_access_overrides_compat_user
ON public.access_overrides(
  subject_type,
  user_id,
  feature_id,
  expires_at
);


CREATE INDEX IF NOT EXISTS
  idx_access_overrides_compat_organization
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
-- 8. CONTADORES DE USO
-- =========================================================
--
-- Modelo consolidado:
-- period_starts_at
-- period_ends_at
-- usage_value
--
-- Modelo utilizado pelo backend:
-- subject_type
-- period_start
-- period_end
-- quantity
-- =========================================================

ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS subject_type text,
  ADD COLUMN IF NOT EXISTS period_type text,
  ADD COLUMN IF NOT EXISTS period_start timestamptz,
  ADD COLUMN IF NOT EXISTS period_end timestamptz,
  ADD COLUMN IF NOT EXISTS period_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS usage_value numeric,
  ADD COLUMN IF NOT EXISTS last_increment_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


UPDATE public.usage_counters
SET
  subject_type = COALESCE(
    NULLIF(trim(subject_type), ''),
    CASE
      WHEN user_id IS NOT NULL
        THEN 'user'

      WHEN organization_id IS NOT NULL
        THEN 'organization'

      ELSE NULL
    END
  ),

  period_type = COALESCE(
    NULLIF(trim(period_type), ''),
    'monthly'
  ),

  period_start = COALESCE(
    period_start,
    period_starts_at
  ),

  period_starts_at = COALESCE(
    period_start,
    period_starts_at
  ),

  period_end = COALESCE(
    period_end,
    period_ends_at
  ),

  period_ends_at = COALESCE(
    period_end,
    period_ends_at
  ),

  quantity = GREATEST(
    COALESCE(quantity, 0),
    COALESCE(usage_value, 0)
  ),

  usage_value = GREATEST(
    COALESCE(quantity, 0),
    COALESCE(usage_value, 0)
  ),

  metadata = COALESCE(
    metadata,
    '{}'::jsonb
  ),

  created_at = COALESCE(
    created_at,
    now()
  ),

  updated_at = COALESCE(
    updated_at,
    created_at,
    now()
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
       OR period_starts_at IS NULL
       OR period_ends_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem contadores de uso sem período definido.';
  END IF;
END;
$$;


ALTER TABLE public.usage_counters
  ALTER COLUMN subject_type
    SET NOT NULL,

  ALTER COLUMN period_type
    SET DEFAULT 'monthly',

  ALTER COLUMN period_type
    SET NOT NULL,

  ALTER COLUMN quantity
    SET DEFAULT 0,

  ALTER COLUMN quantity
    SET NOT NULL,

  ALTER COLUMN usage_value
    SET DEFAULT 0,

  ALTER COLUMN usage_value
    SET NOT NULL,

  ALTER COLUMN period_start
    SET NOT NULL,

  ALTER COLUMN period_end
    SET NOT NULL,

  ALTER COLUMN period_starts_at
    SET NOT NULL,

  ALTER COLUMN period_ends_at
    SET NOT NULL,

  ALTER COLUMN metadata
    SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata
    SET NOT NULL,

  ALTER COLUMN created_at
    SET DEFAULT now(),

  ALTER COLUMN created_at
    SET NOT NULL,

  ALTER COLUMN updated_at
    SET DEFAULT now(),

  ALTER COLUMN updated_at
    SET NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_usage_counters_compat_user_period
ON public.usage_counters(
  subject_type,
  user_id,
  feature_id,
  period_start,
  period_end
);


CREATE INDEX IF NOT EXISTS
  idx_usage_counters_compat_organization_period
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
  'Quantidade consumida no período, sincronizada com usage_value.';


-- =========================================================
-- 9. VALIDAÇÃO FINAL
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.plans
    WHERE audience_type IS NULL
       OR audience IS NULL
       OR billing_model IS NULL
       OR billing_mode IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela plans.';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM public.features
    WHERE value_type IS NULL
       OR feature_type IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela features.';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM public.plan_entitlements
    WHERE is_enabled IS NULL
       OR enabled IS NULL
       OR is_unlimited IS NULL
       OR config IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela plan_entitlements.';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE subscriber_type IS NULL
       OR owner_type IS NULL
       OR source IS NULL
       OR starts_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela subscriptions.';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM public.organization_licenses
    WHERE status IS NULL
       OR starts_at IS NULL
       OR active IS NULL
       OR valid_from IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela organization_licenses.';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM public.access_overrides
    WHERE subject_type IS NULL
       OR enabled IS NULL
       OR is_enabled IS NULL
       OR is_unlimited IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela access_overrides.';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM public.usage_counters
    WHERE subject_type IS NULL
       OR period_start IS NULL
       OR period_end IS NULL
       OR period_starts_at IS NULL
       OR period_ends_at IS NULL
       OR quantity IS NULL
       OR usage_value IS NULL
  ) THEN
    RAISE EXCEPTION
      'Falha na compatibilidade da tabela usage_counters.';
  END IF;
END;
$$;


COMMIT;