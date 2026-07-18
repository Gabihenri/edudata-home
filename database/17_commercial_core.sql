from pathlib import Path

source_path = Path("/mnt/data/Texto colado (1).txt")

output_path = Path("/mnt/data/17_commercial_core.sql")

text = source_path.read_text(encoding="utf-8")

start_marker = "```sql"

start = text.find(start_marker)

if start == -1:

    raise RuntimeError("Bloco SQL inicial não encontrado no arquivo enviado.")

start += len(start_marker)

end = text.find("```", start)

if end == -1:

    raise RuntimeError("Final do bloco SQL não encontrado no arquivo enviado.")

sql = text[start:end].strip() + "\n"

sql = sql.replace(

    "-- MIGRATION 17 — COMMERCIAL CORE",

    "-- MIGRATION 17 — COMMERCIAL CORE (CONSOLIDADA)"

)

plans_compatibility = r'''

-- =========================================================

-- 2.1. COMPATIBILIDADE COM TABELA PLANS PREEXISTENTE

-- =========================================================

--

-- CREATE TABLE IF NOT EXISTS não altera tabelas já existentes.

-- Este bloco acrescenta as colunas validadas no Supabase sem

-- apagar dados ou reconstruir a estrutura anterior.

-- =========================================================

ALTER TABLE public.plans

  ADD COLUMN IF NOT EXISTS code text,

  ADD COLUMN IF NOT EXISTS name text,

  ADD COLUMN IF NOT EXISTS description text,

  ADD COLUMN IF NOT EXISTS audience_type text DEFAULT 'individual',

  ADD COLUMN IF NOT EXISTS billing_model text DEFAULT 'subscription',

  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL',

  ADD COLUMN IF NOT EXISTS monthly_price_cents integer,

  ADD COLUMN IF NOT EXISTS annual_price_cents integer,

  ADD COLUMN IF NOT EXISTS setup_price_cents integer,

  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0,

  ADD COLUMN IF NOT EXISTS minimum_seats integer,

  ADD COLUMN IF NOT EXISTS maximum_seats integer,

  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,

  ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false,

  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,

  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,

  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,

  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),

  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.plans

SET

  audience_type = COALESCE(audience_type, 'individual'),

  billing_model = COALESCE(billing_model, 'subscription'),

  currency = COALESCE(currency, 'BRL'),

  trial_days = COALESCE(trial_days, 0),

  is_public = COALESCE(is_public, true),

  is_free = COALESCE(is_free, false),

  is_active = COALESCE(is_active, true),

  sort_order = COALESCE(sort_order, 0),

  metadata = COALESCE(metadata, '{}'::jsonb),

  created_at = COALESCE(created_at, now()),

  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE public.plans

  ALTER COLUMN audience_type SET DEFAULT 'individual',

  ALTER COLUMN audience_type SET NOT NULL,

  ALTER COLUMN billing_model SET DEFAULT 'subscription',

  ALTER COLUMN billing_model SET NOT NULL,

  ALTER COLUMN currency SET DEFAULT 'BRL',

  ALTER COLUMN currency SET NOT NULL,

  ALTER COLUMN trial_days SET DEFAULT 0,

  ALTER COLUMN trial_days SET NOT NULL,

  ALTER COLUMN is_public SET DEFAULT true,

  ALTER COLUMN is_public SET NOT NULL,

  ALTER COLUMN is_free SET DEFAULT false,

  ALTER COLUMN is_free SET NOT NULL,

  ALTER COLUMN is_active SET DEFAULT true,

  ALTER COLUMN is_active SET NOT NULL,

  ALTER COLUMN sort_order SET DEFAULT 0,

  ALTER COLUMN sort_order SET NOT NULL,

  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata SET NOT NULL,

  ALTER COLUMN created_at SET DEFAULT now(),

  ALTER COLUMN created_at SET NOT NULL,

  ALTER COLUMN updated_at SET DEFAULT now(),

  ALTER COLUMN updated_at SET NOT NULL;

'''

features_compatibility = r'''

-- =========================================================

-- 3.1. COMPATIBILIDADE COM TABELA FEATURES PREEXISTENTE

-- =========================================================

ALTER TABLE public.features

  ADD COLUMN IF NOT EXISTS code text,

  ADD COLUMN IF NOT EXISTS name text,

  ADD COLUMN IF NOT EXISTS description text,

  ADD COLUMN IF NOT EXISTS product_code text DEFAULT 'core',

  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',

  ADD COLUMN IF NOT EXISTS value_type text DEFAULT 'boolean',

  ADD COLUMN IF NOT EXISTS unit_name text,

  ADD COLUMN IF NOT EXISTS is_security_feature boolean DEFAULT false,

  ADD COLUMN IF NOT EXISTS is_privacy_feature boolean DEFAULT false,

  ADD COLUMN IF NOT EXISTS is_accessibility_feature boolean DEFAULT false,

  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,

  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,

  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),

  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.features

SET

  product_code = COALESCE(NULLIF(trim(product_code), ''), 'core'),

  category = COALESCE(NULLIF(trim(category), ''), 'general'),

  value_type = COALESCE(NULLIF(trim(value_type), ''), 'boolean'),

  is_security_feature = COALESCE(is_security_feature, false),

  is_privacy_feature = COALESCE(is_privacy_feature, false),

  is_accessibility_feature = COALESCE(is_accessibility_feature, false),

  is_active = COALESCE(is_active, true),

  metadata = COALESCE(metadata, '{}'::jsonb),

  created_at = COALESCE(created_at, now()),

  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE public.features

  ALTER COLUMN product_code SET DEFAULT 'core',

  ALTER COLUMN product_code SET NOT NULL,

  ALTER COLUMN category SET DEFAULT 'general',

  ALTER COLUMN category SET NOT NULL,

  ALTER COLUMN value_type SET DEFAULT 'boolean',

  ALTER COLUMN value_type SET NOT NULL,

  ALTER COLUMN is_security_feature SET DEFAULT false,

  ALTER COLUMN is_security_feature SET NOT NULL,

  ALTER COLUMN is_privacy_feature SET DEFAULT false,

  ALTER COLUMN is_privacy_feature SET NOT NULL,

  ALTER COLUMN is_accessibility_feature SET DEFAULT false,

  ALTER COLUMN is_accessibility_feature SET NOT NULL,

  ALTER COLUMN is_active SET DEFAULT true,

  ALTER COLUMN is_active SET NOT NULL,

  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata SET NOT NULL,

  ALTER COLUMN created_at SET DEFAULT now(),

  ALTER COLUMN created_at SET NOT NULL,

  ALTER COLUMN updated_at SET DEFAULT now(),

  ALTER COLUMN updated_at SET NOT NULL;

'''

entitlements_compatibility = r'''

-- =========================================================

-- 4.1. COMPATIBILIDADE COM PLAN_ENTITLEMENTS PREEXISTENTE

-- =========================================================

ALTER TABLE public.plan_entitlements

  ADD COLUMN IF NOT EXISTS plan_id uuid,

  ADD COLUMN IF NOT EXISTS feature_id uuid,

  ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT false,

  ADD COLUMN IF NOT EXISTS limit_value numeric,

  ADD COLUMN IF NOT EXISTS text_value text,

  ADD COLUMN IF NOT EXISTS json_value jsonb,

  ADD COLUMN IF NOT EXISTS reset_period text DEFAULT 'none',

  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,

  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),

  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.plan_entitlements

SET

  is_enabled = COALESCE(is_enabled, false),

  reset_period = COALESCE(NULLIF(trim(reset_period), ''), 'none'),

  metadata = COALESCE(metadata, '{}'::jsonb),

  created_at = COALESCE(created_at, now()),

  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE public.plan_entitlements

  ALTER COLUMN is_enabled SET DEFAULT false,

  ALTER COLUMN is_enabled SET NOT NULL,

  ALTER COLUMN reset_period SET DEFAULT 'none',

  ALTER COLUMN reset_period SET NOT NULL,

  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata SET NOT NULL,

  ALTER COLUMN created_at SET DEFAULT now(),

  ALTER COLUMN created_at SET NOT NULL,

  ALTER COLUMN updated_at SET DEFAULT now(),

  ALTER COLUMN updated_at SET NOT NULL;

'''

plans_anchor = "\n\nCREATE UNIQUE INDEX IF NOT EXISTS idx_plans_code_unique"

features_anchor = "\n\nCREATE UNIQUE INDEX IF NOT EXISTS idx_features_code_unique"

entitlements_anchor = "\n\nCREATE INDEX IF NOT EXISTS idx_plan_entitlements_plan"

for anchor, block, label in [

    (plans_anchor, plans_compatibility, "plans"),

    (features_anchor, features_compatibility, "features"),

    (entitlements_anchor, entitlements_compatibility, "plan_entitlements"),

]:

    if anchor not in sql:

        raise RuntimeError(f"Ponto de inserção não encontrado para {label}.")

    sql = sql.replace(anchor, block + anchor, 1)

output_path.write_text(sql, encoding="utf-8")

print(f"Arquivo criado: {output_path.name}")

print(f"Linhas: {len(sql.splitlines())}")

print(f"Tamanho: {output_path.stat().st_size} bytes")

print("Correções consolidadas: plans, features e plan_entitlements.")