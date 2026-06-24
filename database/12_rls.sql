-- =====================================================
-- FUNÇÃO AUXILIAR
-- =====================================================

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

-- =====================================================
-- USERS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_same_school
ON users
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- TEACHER PROFILES
-- =====================================================

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_profiles_same_school
ON teacher_profiles
FOR SELECT
USING (
    user_id IN (
        SELECT id
        FROM users
        WHERE school_id = current_school_id()
    )
);

-- =====================================================
-- CLASSES
-- =====================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY classes_same_school
ON classes
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- SUBJECTS
-- =====================================================

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY subjects_same_school
ON subjects
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- AGENDA EVENTS
-- =====================================================

ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY agenda_same_school
ON agenda_events
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- PEDAGOGICAL ACTIONS
-- =====================================================

ALTER TABLE pedagogical_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY actions_same_school
ON pedagogical_actions
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- EVIDENCES
-- =====================================================

ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidences_same_school
ON evidences
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- SUBSTITUTIONS
-- =====================================================

ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY substitutions_same_school
ON substitutions
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- INDICATORS
-- =====================================================

ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY indicators_same_school
ON indicators
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- E-SCORES
-- =====================================================

ALTER TABLE e_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY escores_same_school
ON e_scores
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_same_school
ON notifications
FOR SELECT
USING (
    school_id = current_school_id()
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_same_school
ON audit_logs
FOR SELECT
USING (
    school_id = current_school_id()
);