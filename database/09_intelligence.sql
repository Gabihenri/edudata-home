-- =====================================================
-- INTELLIGENCE
-- EduData IA Platform Core
-- =====================================================

-- =====================================================
-- INDICATORS
-- =====================================================

CREATE TABLE indicators (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    name VARCHAR(255) NOT NULL,

    category VARCHAR(100),

    value NUMERIC(10,2) NOT NULL,

    target_value NUMERIC(10,2),

    unit VARCHAR(50),

    period VARCHAR(100),

    reference_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_indicator_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_indicator_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_indicator_school
ON indicators(school_id);

CREATE INDEX idx_indicator_org
ON indicators(organization_id);

CREATE INDEX idx_indicator_entity
ON indicators(entity_type, entity_id);

CREATE INDEX idx_indicator_period
ON indicators(period);

-- =====================================================
-- EDI SCORES
-- =====================================================

CREATE TABLE e_scores (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    user_id UUID,

    overall_score NUMERIC(5,2) NOT NULL,

    planning_score NUMERIC(5,2) DEFAULT 0,

    evidence_score NUMERIC(5,2) DEFAULT 0,

    development_score NUMERIC(5,2) DEFAULT 0,

    governance_score NUMERIC(5,2) DEFAULT 0,

    ai_score NUMERIC(5,2) DEFAULT 0,

    period VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_escore_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_escore_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_escore_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_escore_school
ON e_scores(school_id);

CREATE INDEX idx_escore_org
ON e_scores(organization_id);

CREATE INDEX idx_escore_user
ON e_scores(user_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    user_id UUID NOT NULL,

    notification_type VARCHAR(100),

    title VARCHAR(255) NOT NULL,

    message TEXT,

    priority VARCHAR(30) DEFAULT 'normal',

    status VARCHAR(50) DEFAULT 'unread',

    read_at TIMESTAMP,

    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_notification_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_notification_user
ON notifications(user_id);

CREATE INDEX idx_notification_status
ON notifications(status);

-- =====================================================
-- AI INSIGHTS
-- =====================================================

CREATE TABLE ai_insights (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    user_id UUID,

    insight_type VARCHAR(100),

    title VARCHAR(255),

    description TEXT,

    recommendation TEXT,

    confidence NUMERIC(5,2),

    model_name VARCHAR(100),

    status VARCHAR(50) DEFAULT 'new',

    generated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_ai_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_ai_school
ON ai_insights(school_id);

CREATE INDEX idx_ai_org
ON ai_insights(organization_id);

CREATE INDEX idx_ai_user
ON ai_insights(user_id);

CREATE INDEX idx_ai_status
ON ai_insights(status);

CREATE INDEX idx_ai_type
ON ai_insights(insight_type);
