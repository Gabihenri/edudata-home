BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 19 — COMMERCIAL SEED
-- =========================================================
--
-- Objetivos:
-- 1. Registrar os planos comerciais iniciais.
-- 2. Registrar os recursos utilizados pela Agenda EDI.
-- 3. Definir a matriz inicial de acesso por plano.
-- 4. Não criar assinaturas para usuários.
-- 5. Não definir preços comerciais ainda não oficializados.
--
-- Planos:
-- - edi_free
-- - edi_professor_pro
-- - edi_escola
-- - edi_rede
--
-- Recursos:
-- - agenda.events
-- - agenda.recurring
-- - agenda.templates
-- - agenda.planning
-- - evidences.text
-- - evidences.upload
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DO NÚCLEO COMERCIAL
-- =========================================================

DO $$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'plans',
    'features',
    'plan_entitlements'
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
-- 2. PLANOS COMERCIAIS INICIAIS
-- =========================================================
--
-- Os preços dos planos pagos permanecem nulos.
-- A definição de preços será realizada em decisão comercial
-- específica, sem alterar os códigos permanentes dos planos.
-- =========================================================

WITH plan_seed (
  code,
  name,
  description,
  audience_type,
  audience,
  billing_model,
  billing_mode,
  currency,
  monthly_price_cents,
  annual_price_cents,
  yearly_price_cents,
  setup_price_cents,
  trial_days,
  minimum_seats,
  maximum_seats,
  is_public,
  is_free,
  is_active,
  sort_order,
  metadata
) AS (
  VALUES
    (
      'edi_free',
      'EDI Gratuito',
      'Plano individual de entrada para conhecer o ecossistema EduData IA e utilizar os recursos essenciais da Agenda Inteligente EDI.',
      'individual',
      'individual',
      'free',
      'free',
      'BRL',
      0,
      0,
      0,
      0,
      0,
      NULL::integer,
      NULL::integer,
      true,
      true,
      true,
      10,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'entry',
        'official_code', true
      )
    ),

    (
      'edi_professor_pro',
      'Professor Digital Pro',
      'Plano individual profissional com automações, modelos de agenda, recorrência e gestão ampliada de evidências pedagógicas.',
      'individual',
      'individual',
      'subscription',
      'recurring',
      'BRL',
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      0,
      NULL::integer,
      NULL::integer,
      true,
      false,
      true,
      20,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'professional',
        'official_code', true,
        'pricing_status', 'pending'
      )
    ),

    (
      'edi_escola',
      'EDI Escola',
      'Plano institucional para escolas, com licenciamento de usuários, governança de acesso e recursos compartilhados do ecossistema EDI.',
      'institutional',
      'organization',
      'contract',
      'quote',
      'BRL',
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      0,
      1,
      NULL::integer,
      true,
      false,
      true,
      30,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'institutional',
        'official_code', true,
        'pricing_status', 'quote'
      )
    ),

    (
      'edi_rede',
      'EDI Rede',
      'Plano institucional para redes de ensino, mantenedoras e organizações com múltiplas escolas ou unidades educacionais.',
      'network',
      'network',
      'contract',
      'quote',
      'BRL',
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      0,
      1,
      NULL::integer,
      true,
      false,
      true,
      40,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'network',
        'official_code', true,
        'pricing_status', 'quote'
      )
    )
)

UPDATE public.plans AS target
SET
  name = seed.name,
  description = seed.description,

  audience_type = seed.audience_type,
  audience = seed.audience,

  billing_model = seed.billing_model,
  billing_mode = seed.billing_mode,

  currency = seed.currency,

  monthly_price_cents =
    seed.monthly_price_cents,

  annual_price_cents =
    seed.annual_price_cents,

  yearly_price_cents =
    seed.yearly_price_cents,

  setup_price_cents =
    seed.setup_price_cents,

  trial_days = seed.trial_days,

  minimum_seats = seed.minimum_seats,
  maximum_seats = seed.maximum_seats,

  is_public = seed.is_public,
  is_free = seed.is_free,
  is_active = seed.is_active,

  sort_order = seed.sort_order,

  metadata =
    COALESCE(
      target.metadata,
      '{}'::jsonb
    ) || seed.metadata,

  updated_at = now()

FROM plan_seed AS seed

WHERE lower(target.code) =
      lower(seed.code);


WITH plan_seed (
  code,
  name,
  description,
  audience_type,
  audience,
  billing_model,
  billing_mode,
  currency,
  monthly_price_cents,
  annual_price_cents,
  yearly_price_cents,
  setup_price_cents,
  trial_days,
  minimum_seats,
  maximum_seats,
  is_public,
  is_free,
  is_active,
  sort_order,
  metadata
) AS (
  VALUES
    (
      'edi_free',
      'EDI Gratuito',
      'Plano individual de entrada para conhecer o ecossistema EduData IA e utilizar os recursos essenciais da Agenda Inteligente EDI.',
      'individual',
      'individual',
      'free',
      'free',
      'BRL',
      0,
      0,
      0,
      0,
      0,
      NULL::integer,
      NULL::integer,
      true,
      true,
      true,
      10,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'entry',
        'official_code', true
      )
    ),

    (
      'edi_professor_pro',
      'Professor Digital Pro',
      'Plano individual profissional com automações, modelos de agenda, recorrência e gestão ampliada de evidências pedagógicas.',
      'individual',
      'individual',
      'subscription',
      'recurring',
      'BRL',
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      0,
      NULL::integer,
      NULL::integer,
      true,
      false,
      true,
      20,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'professional',
        'official_code', true,
        'pricing_status', 'pending'
      )
    ),

    (
      'edi_escola',
      'EDI Escola',
      'Plano institucional para escolas, com licenciamento de usuários, governança de acesso e recursos compartilhados do ecossistema EDI.',
      'institutional',
      'organization',
      'contract',
      'quote',
      'BRL',
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      0,
      1,
      NULL::integer,
      true,
      false,
      true,
      30,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'institutional',
        'official_code', true,
        'pricing_status', 'quote'
      )
    ),

    (
      'edi_rede',
      'EDI Rede',
      'Plano institucional para redes de ensino, mantenedoras e organizações com múltiplas escolas ou unidades educacionais.',
      'network',
      'network',
      'contract',
      'quote',
      'BRL',
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      0,
      1,
      NULL::integer,
      true,
      false,
      true,
      40,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'commercial_stage', 'network',
        'official_code', true,
        'pricing_status', 'quote'
      )
    )
)

INSERT INTO public.plans (
  code,
  name,
  description,

  audience_type,
  audience,

  billing_model,
  billing_mode,

  currency,

  monthly_price_cents,
  annual_price_cents,
  yearly_price_cents,
  setup_price_cents,

  trial_days,

  minimum_seats,
  maximum_seats,

  is_public,
  is_free,
  is_active,

  sort_order,

  metadata,

  created_at,
  updated_at
)

SELECT
  seed.code,
  seed.name,
  seed.description,

  seed.audience_type,
  seed.audience,

  seed.billing_model,
  seed.billing_mode,

  seed.currency,

  seed.monthly_price_cents,
  seed.annual_price_cents,
  seed.yearly_price_cents,
  seed.setup_price_cents,

  seed.trial_days,

  seed.minimum_seats,
  seed.maximum_seats,

  seed.is_public,
  seed.is_free,
  seed.is_active,

  seed.sort_order,

  seed.metadata,

  now(),
  now()

FROM plan_seed AS seed

WHERE NOT EXISTS (
  SELECT 1
  FROM public.plans AS existing
  WHERE lower(existing.code) =
        lower(seed.code)
);


-- =========================================================
-- 3. RECURSOS DA AGENDA INTELIGENTE EDI
-- =========================================================
--
-- Os recursos são inicialmente booleanos.
-- Cotas quantitativas poderão ser ativadas posteriormente
-- sem alteração dos códigos permanentes.
-- =========================================================

WITH feature_seed (
  code,
  name,
  description,
  product_code,
  category,
  value_type,
  feature_type,
  unit_name,
  unit,
  is_security_feature,
  is_privacy_feature,
  is_accessibility_feature,
  is_active,
  metadata
) AS (
  VALUES
    (
      'agenda.events',
      'Eventos da Agenda',
      'Criação, consulta, atualização e organização de eventos pedagógicos pessoais.',
      'agenda_edi',
      'agenda',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'agenda.recurring',
      'Eventos recorrentes',
      'Criação de séries de eventos e horários recorrentes na Agenda Inteligente EDI.',
      'agenda_edi',
      'automation',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'agenda.templates',
      'Modelos de horários',
      'Criação e aplicação de horários-padrão e modelos reutilizáveis de agenda.',
      'agenda_edi',
      'automation',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'agenda.planning',
      'Planejamento pedagógico',
      'Criação e organização de planejamentos pedagógicos vinculados ao trabalho docente.',
      'agenda_edi',
      'planning',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'protection_pending'
      )
    ),

    (
      'evidences.text',
      'Evidências textuais',
      'Registro de evidências pedagógicas em texto ou por referência externa.',
      'agenda_edi',
      'evidences',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      true,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'evidences.upload',
      'Upload de evidências',
      'Envio protegido de imagens e documentos vinculados às evidências pedagógicas.',
      'agenda_edi',
      'evidences',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      true,
      true,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active',
        'requires_minor_protection', true
      )
    )
)

UPDATE public.features AS target
SET
  name = seed.name,
  description = seed.description,

  product_code = seed.product_code,
  category = seed.category,

  value_type = seed.value_type,
  feature_type = seed.feature_type,

  unit_name = seed.unit_name,
  unit = seed.unit,

  is_security_feature =
    seed.is_security_feature,

  is_privacy_feature =
    seed.is_privacy_feature,

  is_accessibility_feature =
    seed.is_accessibility_feature,

  is_active = seed.is_active,

  metadata =
    COALESCE(
      target.metadata,
      '{}'::jsonb
    ) || seed.metadata,

  updated_at = now()

FROM feature_seed AS seed

WHERE lower(target.code) =
      lower(seed.code);


WITH feature_seed (
  code,
  name,
  description,
  product_code,
  category,
  value_type,
  feature_type,
  unit_name,
  unit,
  is_security_feature,
  is_privacy_feature,
  is_accessibility_feature,
  is_active,
  metadata
) AS (
  VALUES
    (
      'agenda.events',
      'Eventos da Agenda',
      'Criação, consulta, atualização e organização de eventos pedagógicos pessoais.',
      'agenda_edi',
      'agenda',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'agenda.recurring',
      'Eventos recorrentes',
      'Criação de séries de eventos e horários recorrentes na Agenda Inteligente EDI.',
      'agenda_edi',
      'automation',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'agenda.templates',
      'Modelos de horários',
      'Criação e aplicação de horários-padrão e modelos reutilizáveis de agenda.',
      'agenda_edi',
      'automation',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'agenda.planning',
      'Planejamento pedagógico',
      'Criação e organização de planejamentos pedagógicos vinculados ao trabalho docente.',
      'agenda_edi',
      'planning',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      false,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'protection_pending'
      )
    ),

    (
      'evidences.text',
      'Evidências textuais',
      'Registro de evidências pedagógicas em texto ou por referência externa.',
      'agenda_edi',
      'evidences',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      false,
      true,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active'
      )
    ),

    (
      'evidences.upload',
      'Upload de evidências',
      'Envio protegido de imagens e documentos vinculados às evidências pedagógicas.',
      'agenda_edi',
      'evidences',
      'boolean',
      'boolean',
      NULL::text,
      NULL::text,
      true,
      true,
      false,
      true,
      jsonb_build_object(
        'seed', 'commercial-v1',
        'route_status', 'active',
        'requires_minor_protection', true
      )
    )
)

INSERT INTO public.features (
  code,
  name,
  description,

  product_code,
  category,

  value_type,
  feature_type,

  unit_name,
  unit,

  is_security_feature,
  is_privacy_feature,
  is_accessibility_feature,

  is_active,

  metadata,

  created_at,
  updated_at
)

SELECT
  seed.code,
  seed.name,
  seed.description,

  seed.product_code,
  seed.category,

  seed.value_type,
  seed.feature_type,

  seed.unit_name,
  seed.unit,

  seed.is_security_feature,
  seed.is_privacy_feature,
  seed.is_accessibility_feature,

  seed.is_active,

  seed.metadata,

  now(),
  now()

FROM feature_seed AS seed

WHERE NOT EXISTS (
  SELECT 1
  FROM public.features AS existing
  WHERE lower(existing.code) =
        lower(seed.code)
);


-- =========================================================
-- 4. MATRIZ INICIAL DE DIREITOS
-- =========================================================
--
-- EDI Gratuito:
-- - eventos;
-- - planejamento;
-- - evidências textuais.
--
-- Professor Digital Pro:
-- - todos os recursos atuais da Agenda EDI.
--
-- EDI Escola e EDI Rede:
-- - todos os recursos atuais da Agenda EDI.
--
-- Recursos desabilitados permanecem registrados para que o
-- backend retorne bloqueio comercial estruturado.
-- =========================================================

WITH entitlement_matrix AS (
  SELECT
    plan_data.plan_code,
    feature_data.feature_code,

    CASE
      WHEN plan_data.plan_code = 'edi_free'
      THEN feature_data.feature_code IN (
        'agenda.events',
        'agenda.planning',
        'evidences.text'
      )

      ELSE true
    END AS enabled

  FROM (
    VALUES
      ('edi_free'),
      ('edi_professor_pro'),
      ('edi_escola'),
      ('edi_rede')
  ) AS plan_data(plan_code)

  CROSS JOIN (
    VALUES
      ('agenda.events'),
      ('agenda.recurring'),
      ('agenda.templates'),
      ('agenda.planning'),
      ('evidences.text'),
      ('evidences.upload')
  ) AS feature_data(feature_code)
)

UPDATE public.plan_entitlements AS target
SET
  is_enabled = matrix.enabled,
  enabled = matrix.enabled,

  limit_value = NULL,

  is_unlimited = matrix.enabled,

  text_value = NULL,
  json_value = NULL,

  reset_period = 'none',

  config = jsonb_build_object(
    'seed', 'commercial-v1'
  ),

  metadata =
    COALESCE(
      target.metadata,
      '{}'::jsonb
    ) || jsonb_build_object(
      'seed', 'commercial-v1',
      'official_matrix', true
    ),

  updated_at = now()

FROM entitlement_matrix AS matrix

INNER JOIN public.plans AS plan_record
  ON lower(plan_record.code) =
     lower(matrix.plan_code)

INNER JOIN public.features AS feature_record
  ON lower(feature_record.code) =
     lower(matrix.feature_code)

WHERE target.plan_id =
      plan_record.id

  AND target.feature_id =
      feature_record.id;


WITH entitlement_matrix AS (
  SELECT
    plan_data.plan_code,
    feature_data.feature_code,

    CASE
      WHEN plan_data.plan_code = 'edi_free'
      THEN feature_data.feature_code IN (
        'agenda.events',
        'agenda.planning',
        'evidences.text'
      )

      ELSE true
    END AS enabled

  FROM (
    VALUES
      ('edi_free'),
      ('edi_professor_pro'),
      ('edi_escola'),
      ('edi_rede')
  ) AS plan_data(plan_code)

  CROSS JOIN (
    VALUES
      ('agenda.events'),
      ('agenda.recurring'),
      ('agenda.templates'),
      ('agenda.planning'),
      ('evidences.text'),
      ('evidences.upload')
  ) AS feature_data(feature_code)
)

INSERT INTO public.plan_entitlements (
  plan_id,
  feature_id,

  is_enabled,
  enabled,

  limit_value,
  is_unlimited,

  text_value,
  json_value,

  reset_period,

  config,
  metadata,

  created_at,
  updated_at
)

SELECT
  plan_record.id,
  feature_record.id,

  matrix.enabled,
  matrix.enabled,

  NULL,
  matrix.enabled,

  NULL,
  NULL,

  'none',

  jsonb_build_object(
    'seed', 'commercial-v1'
  ),

  jsonb_build_object(
    'seed', 'commercial-v1',
    'official_matrix', true
  ),

  now(),
  now()

FROM entitlement_matrix AS matrix

INNER JOIN public.plans AS plan_record
  ON lower(plan_record.code) =
     lower(matrix.plan_code)

INNER JOIN public.features AS feature_record
  ON lower(feature_record.code) =
     lower(matrix.feature_code)

WHERE NOT EXISTS (
  SELECT 1

  FROM public.plan_entitlements
    AS existing

  WHERE existing.plan_id =
        plan_record.id

    AND existing.feature_id =
        feature_record.id
);


-- =========================================================
-- 5. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  plans_found integer;
  features_found integer;
  entitlements_found integer;
BEGIN
  SELECT count(*)
  INTO plans_found
  FROM public.plans
  WHERE lower(code) IN (
    'edi_free',
    'edi_professor_pro',
    'edi_escola',
    'edi_rede'
  );

  IF plans_found <> 4 THEN
    RAISE EXCEPTION
      'Falha no seed: esperados 4 planos, encontrados %.',
      plans_found;
  END IF;


  SELECT count(*)
  INTO features_found
  FROM public.features
  WHERE lower(code) IN (
    'agenda.events',
    'agenda.recurring',
    'agenda.templates',
    'agenda.planning',
    'evidences.text',
    'evidences.upload'
  );

  IF features_found <> 6 THEN
    RAISE EXCEPTION
      'Falha no seed: esperados 6 recursos, encontrados %.',
      features_found;
  END IF;


  SELECT count(*)
  INTO entitlements_found

  FROM public.plan_entitlements
    AS entitlement

  INNER JOIN public.plans
    AS plan_record
    ON plan_record.id =
       entitlement.plan_id

  INNER JOIN public.features
    AS feature_record
    ON feature_record.id =
       entitlement.feature_id

  WHERE lower(plan_record.code) IN (
    'edi_free',
    'edi_professor_pro',
    'edi_escola',
    'edi_rede'
  )

  AND lower(feature_record.code) IN (
    'agenda.events',
    'agenda.recurring',
    'agenda.templates',
    'agenda.planning',
    'evidences.text',
    'evidences.upload'
  );

  IF entitlements_found <> 24 THEN
    RAISE EXCEPTION
      'Falha no seed: esperados 24 direitos, encontrados %.',
      entitlements_found;
  END IF;
END;
$$;


COMMIT;