-- =====================================================
-- PROFESSOR DIGITAL · PRIVATE PROFESSIONAL MEMORY
-- EduData IA / Framework EDI
-- =====================================================
-- O produto não armazena avaliação psicológica ou rótulos.
-- Cada registro pertence ao profissional autenticado e só pode
-- ser consultado/alterado pelo próprio titular via RLS.

CREATE TABLE IF NOT EXISTS professor_digital_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    knowledge JSONB NOT NULL DEFAULT '[]'::jsonb,
    production JSONB NOT NULL DEFAULT '[]'::jsonb,
    development_choices JSONB NOT NULL DEFAULT '[]'::jsonb,
    consent JSONB NOT NULL DEFAULT '{"eios":true,"academy":false}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professor_digital_profiles_updated_at
ON professor_digital_profiles(updated_at DESC);

ALTER TABLE professor_digital_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professor Digital profile owner select" ON professor_digital_profiles;
CREATE POLICY "Professor Digital profile owner select"
ON professor_digital_profiles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Professor Digital profile owner insert" ON professor_digital_profiles;
CREATE POLICY "Professor Digital profile owner insert"
ON professor_digital_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Professor Digital profile owner update" ON professor_digital_profiles;
CREATE POLICY "Professor Digital profile owner update"
ON professor_digital_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Professor Digital profile owner delete" ON professor_digital_profiles;
CREATE POLICY "Professor Digital profile owner delete"
ON professor_digital_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Mantém updated_at coerente sem depender do cliente.
CREATE OR REPLACE FUNCTION set_professor_digital_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professor_digital_profiles_updated_at ON professor_digital_profiles;
CREATE TRIGGER professor_digital_profiles_updated_at
BEFORE UPDATE ON professor_digital_profiles
FOR EACH ROW
EXECUTE FUNCTION set_professor_digital_updated_at();
