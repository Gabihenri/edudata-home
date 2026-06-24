-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID,

    user_id UUID,

    action VARCHAR(100) NOT NULL,

    entity VARCHAR(100) NOT NULL,

    entity_id UUID,

    old_value JSONB,

    new_value JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_audit_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);