-- =====================================================
-- USERS
-- =====================================================

CREATE INDEX idx_users_school
ON users(school_id);

CREATE INDEX idx_users_email
ON users(email);

-- =====================================================
-- TEACHER PROFILES
-- =====================================================

CREATE INDEX idx_teacher_profiles_user
ON teacher_profiles(user_id);

-- =====================================================
-- SUBJECTS
-- =====================================================

CREATE INDEX idx_subjects_school
ON subjects(school_id);

-- =====================================================
-- CLASSES
-- =====================================================

CREATE INDEX idx_classes_school
ON classes(school_id);

-- =====================================================
-- SCHEDULES
-- =====================================================

CREATE INDEX idx_schedules_teacher
ON schedules(teacher_id);

CREATE INDEX idx_schedules_class
ON schedules(class_id);

-- =====================================================
-- AGENDA
-- =====================================================

CREATE INDEX idx_agenda_user
ON agenda_events(user_id);

CREATE INDEX idx_agenda_period
ON agenda_events(start_datetime, end_datetime);

-- =====================================================
-- PEDAGOGICAL ACTIONS
-- =====================================================

CREATE INDEX idx_actions_teacher
ON pedagogical_actions(teacher_id);

CREATE INDEX idx_actions_class
ON pedagogical_actions(class_id);

CREATE INDEX idx_actions_subject
ON pedagogical_actions(subject_id);

-- =====================================================
-- EVIDENCES
-- =====================================================

CREATE INDEX idx_evidences_teacher
ON evidences(teacher_id);

CREATE INDEX idx_evidences_action
ON evidences(pedagogical_action_id);

CREATE INDEX idx_evidences_status
ON evidences(status);

-- =====================================================
-- SUBSTITUTIONS
-- =====================================================

CREATE INDEX idx_substitutions_date
ON substitutions(substitution_date);

CREATE INDEX idx_substitutions_teacher
ON substitutions(absent_teacher_id);

-- =====================================================
-- INDICATORS
-- =====================================================

CREATE INDEX idx_indicators_school
ON indicators(school_id);

-- =====================================================
-- E-SCORES
-- =====================================================

CREATE INDEX idx_escores_user
ON e_scores(user_id);

CREATE INDEX idx_escores_period
ON e_scores(period);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE INDEX idx_notifications_user
ON notifications(user_id);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE INDEX idx_audit_entity
ON audit_logs(entity);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);