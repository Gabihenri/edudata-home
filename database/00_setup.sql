-- =====================================================
-- EDUData IA
-- EDU-SQL-001
-- Setup Inicial
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Atualiza automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;