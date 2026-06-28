-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- EduData IA Platform Core
-- =====================================================

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_school_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT school_id
    FROM users
    WHERE id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT organization_id
    FROM users
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- =====================================================
-- USERS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_same_organization
ON users
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- TEACHER PROFILES
-- =====================================================

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_profiles_same_organization
ON teacher_profiles
FOR ALL
USING (
    user_id IN (
        SELECT id
        FROM users
        WHERE organization_id = current_organization_id()
    )
);

-- =====================================================
-- KNOWLEDGE AREAS
-- =====================================================

ALTER TABLE knowledge_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_areas_same_school
ON knowledge_areas
FOR ALL
USING (
    school_id = current_school_id()
);

-- =====================================================
-- SUBJECTS
-- =====================================================

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY subjects_same_school
ON subjects
FOR ALL
USING (
    school_id = current_school_id()
);

-- =====================================================
-- CLASSES
-- =====================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY classes_same_school
ON classes
FOR ALL
USING (
    school_id = current_school_id()
);

-- =====================================================
-- AGENDA
-- =====================================================

ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY agenda_same_organization
ON agenda_events
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- PEDAGOGICAL ACTIONS
-- =====================================================

ALTER TABLE pedagogical_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY actions_same_organization
ON pedagogical_actions
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- EVIDENCE CATEGORIES
-- =====================================================

ALTER TABLE evidence_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_categories_same_organization
ON evidence_categories
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- EVIDENCES
-- =====================================================

ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidences_same_organization
ON evidences
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- EVIDENCE FILES
-- =====================================================

ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_files_same_organization
ON evidence_files
FOR ALL
USING (
    evidence_id IN (
        SELECT id
        FROM evidences
        WHERE organization_id = current_organization_id()
    )
);

-- =====================================================
-- SUBSTITUTIONS
-- =====================================================

ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY substitutions_same_organization
ON substitutions
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- INDICATORS
-- =====================================================

ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY indicators_same_organization
ON indicators
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- EDI SCORES
-- =====================================================

ALTER TABLE e_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY escores_same_organization
ON e_scores
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_same_organization
ON notifications
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- AI INSIGHTS
-- =====================================================

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_insights_same_organization
ON ai_insights
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_same_organization
ON audit_logs
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_same_organization
ON system_settings
FOR ALL
USING (
    organization_id = current_organization_id()
);

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_same_organization
ON feature_flags
FOR ALL
USING (
    organization_id = current_organization_id()
);
