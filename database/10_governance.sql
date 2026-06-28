-- =====================================================
-- GOVERNANCE
-- EduData IA Platform Core
-- =====================================================

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID,

    organization_id UUID,

    user_id UUID,

    action VARCHAR(100) NOT NULL,

    entity VARCHAR(100) NOT NULL,

    entity_id UUID,

    ip_address INET,

    user_agent TEXT,

    request_id VARCHAR(100),

    session_id VARCHAR(255),

    old_value JSONB,

    new_value JSONB,

    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_audit_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_audit_school
ON audit_logs(school_id);

CREATE INDEX idx_audit_organization
ON audit_logs(organization_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

CREATE INDEX idx_audit_entity
ON audit_logs(entity, entity_id);

CREATE INDEX idx_audit_action
ON audit_logs(action);

CREATE INDEX idx_audit_created_at
ON audit_logs(created_at);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE TABLE system_settings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID,

    setting_key VARCHAR(255) NOT NULL,

    setting_value JSONB NOT NULL,

    description TEXT,

    editable BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_settings_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_system_settings_key
ON system_settings(organization_id, setting_key);

CREATE TRIGGER trg_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TABLE feature_flags (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID,

    feature_name VARCHAR(150) NOT NULL,

    enabled BOOLEAN DEFAULT FALSE,

    rollout_percentage INTEGER DEFAULT 100,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_feature_flags_org
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_feature_flags
ON feature_flags(organization_id, feature_name);

CREATE TRIGGER trg_feature_flags_updated_at
BEFORE UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
