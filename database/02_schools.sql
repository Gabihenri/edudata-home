-- =====================================================
-- SCHOOLS
-- EDUData IA - Platform Core
-- Release 1.0
-- =====================================================

CREATE TABLE schools (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organização proprietária da escola dentro da plataforma
    organization_id UUID NOT NULL,

    -- =====================================================
    -- IDENTIFICAÇÃO
    -- =====================================================

    inep_code VARCHAR(20) UNIQUE,

    name VARCHAR(255) NOT NULL,

    short_name VARCHAR(150),

    code VARCHAR(50),

    -- =====================================================
    -- LOCALIZAÇÃO
    -- =====================================================

    address TEXT,

    neighborhood VARCHAR(150),

    city VARCHAR(100),

    state CHAR(2),

    zip_code VARCHAR(20),

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    -- =====================================================
    -- CLASSIFICAÇÃO
    -- =====================================================

    administrative_dependency VARCHAR(100),

    school_type VARCHAR(100),

    location_type VARCHAR(50),

    active BOOLEAN DEFAULT TRUE,

    official_registry BOOLEAN DEFAULT TRUE,

    manually_created BOOLEAN DEFAULT FALSE,

    pending_validation BOOLEAN DEFAULT FALSE,

    -- =====================================================
    -- CONTATO
    -- =====================================================

    phone VARCHAR(50),

    email VARCHAR(255),

    website VARCHAR(255),

    -- =====================================================
    -- AUDITORIA
    -- =====================================================

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_school_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_school_name
ON schools(name);

CREATE INDEX idx_school_inep
ON schools(inep_code);

CREATE INDEX idx_school_city
ON schools(city);

CREATE INDEX idx_school_state
ON schools(state);

CREATE INDEX idx_school_org
ON schools(organization_id);

-- =====================================================
-- TRIGGER
-- =====================================================

CREATE TRIGGER trg_schools_updated_at
BEFORE UPDATE ON schools
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
