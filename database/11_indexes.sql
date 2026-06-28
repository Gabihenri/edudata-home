-- =====================================================
-- INDEXES
-- EduData IA Platform Core
-- =====================================================

-- =====================================================
-- ORGANIZATIONS
-- =====================================================

CREATE INDEX idx_organizations_slug
ON organizations(slug);

CREATE INDEX idx_organizations_type
ON organizations(organization_type);

-- =====================================================
-- SCHOOLS
-- =====================================================

CREATE INDEX idx_schools_organization
ON schools(organization_id);

CREATE INDEX idx_schools_name
ON schools(name);

CREATE INDEX idx_schools_inep
ON schools(inep_code);

CREATE INDEX idx_schools_city
ON schools(city);

CREATE INDEX idx_schools_state
ON schools(state);

-- =====================================================
-- USERS
-- =====================================================

CREATE INDEX idx_users_school
ON users(school_id);

CREATE INDEX idx_users_organization
ON users(organization_id);

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_users_role
ON users(role);

-- =====================================================
-- TEACHER PROFILES
-- =====================================================

CREATE INDEX idx_teacher_profiles_user
ON teacher_profiles(user_id);

-- =====================================================
-- KNOWLEDGE AREAS
-- =====================================================

CREATE INDEX idx_knowledge_areas_school
ON knowledge_areas(school_id);

CREATE INDEX idx_knowledge_areas_name
ON knowledge_areas(name);

-- =====================================================
-- SUBJECTS
-- =====================================================

CREATE INDEX idx_subjects_school
ON subjects(school_id);

CREATE INDEX idx_subjects_area
ON subjects(knowledge_area_id);

CREATE INDEX idx_subjects_name
ON subjects(name);

-- =====================================================
-- CLASSES
-- =====================================================

CREATE INDEX idx_classes_school
ON classes(school_id);

CREATE INDEX idx_classes_school_year
ON classes(school_year_id);

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

CREATE INDEX idx_agenda_school
ON agenda_events(school_id);

CREATE INDEX idx_agenda_start
ON agenda_events(start_datetime);

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

CREATE INDEX idx_actions_date
ON pedagogical_actions(action_date);

CREATE INDEX idx_actions_status
ON pedagogical_actions(status);

-- =====================================================
-- EVIDENCES
-- =====================================================

CREATE INDEX idx_evidences_teacher
ON evidences(teacher_id);

CREATE INDEX idx_evidences_action
ON evidences(pedagogical_action_id);

CREATE INDEX idx_evidences_status
ON evidences(status);

CREATE INDEX idx_evidences_category
ON evidences(category_id);

-- =====================================================
-- SUBSTITUTIONS
-- =====================================================

CREATE INDEX idx_substitutions_date
ON substitutions(substitution_date);

CREATE INDEX idx_substitutions_teacher
ON substitutions(absent_teacher_id);

CREATE INDEX idx_substitutions_status
ON substitutions(status);

-- =====================================================
-- INDICATORS
-- =====================================================

CREATE INDEX idx_indicators_school
ON indicators(school_id);

CREATE INDEX idx_indicators_entity
ON indicators(entity_type, entity_id);

-- =====================================================
-- EDI SCORES
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

CREATE INDEX idx_notifications_status
ON notifications(status);

-- =====================================================
-- AI INSIGHTS
-- =====================================================

CREATE INDEX idx_ai_insights_user
ON ai_insights(user_id);

CREATE INDEX idx_ai_insights_status
ON ai_insights(status);

-- =====================================================
-- AUDIT
-- =====================================================

CREATE INDEX idx_audit_entity
ON audit_logs(entity, entity_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

CREATE INDEX idx_audit_created
ON audit_logs(created_at);
