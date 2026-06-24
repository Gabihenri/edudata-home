-- =====================================================
-- INDICATORS
-- =====================================================

CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    name VARCHAR(255) NOT NULL,

    value NUMERIC(10,2) NOT NULL,

    period VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_indicator_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

-- =====================================================
-- E-SCORES
-- =====================================================

CREATE TABLE e_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    user_id UUID,

    score NUMERIC(5,2) NOT NULL,

    planning_score NUMERIC(5,2) DEFAULT 0,

    evidence_score NUMERIC(5,2) DEFAULT 0,

    development_score NUMERIC(5,2) DEFAULT 0,

    governance_score NUMERIC(5,2) DEFAULT 0,

    period VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_escore_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_escore_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    user_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT,

    status VARCHAR(50) DEFAULT 'unread',

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_notification_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- AI INSIGHTS
-- =====================================================

CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    user_id UUID,

    insight_type VARCHAR(100),

    title VARCHAR(255),

    description TEXT,

    status VARCHAR(50) DEFAULT 'new',

    generated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_ai_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);