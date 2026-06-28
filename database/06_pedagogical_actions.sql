-- =====================================================
-- PEDAGOGICAL ACTIONS
-- EduData IA Platform Core
-- =====================================================

CREATE TABLE pedagogical_actions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    teacher_id UUID NOT NULL,

    agenda_event_id UUID,

    class_id UUID,

    subject_id UUID,

    action_type VARCHAR(100) NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    objectives TEXT,

    methodology TEXT,

    resources TEXT,

    evaluation_strategy TEXT,

    expected_results TEXT,

    curriculum_reference TEXT,

    estimated_duration INTEGER,

    lesson_number INTEGER,

    planned_students INTEGER,

    actual_students INTEGER,

    status VARCHAR(50) DEFAULT 'draft',

    action_date DATE,

    started_at TIMESTAMP,

    finished_at TIMESTAMP,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_action_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_action_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_action_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_action_agenda
        FOREIGN KEY (agenda_event_id)
        REFERENCES agenda_events(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_action_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_action_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_action_school
ON pedagogical_actions(school_id);

CREATE INDEX idx_action_organization
ON pedagogical_actions(organization_id);

CREATE INDEX idx_action_teacher
ON pedagogical_actions(teacher_id);

CREATE INDEX idx_action_date
ON pedagogical_actions(action_date);

CREATE INDEX idx_action_status
ON pedagogical_actions(status);

CREATE INDEX idx_action_class
ON pedagogical_actions(class_id);

CREATE INDEX idx_action_subject
ON pedagogical_actions(subject_id);

CREATE TRIGGER trg_pedagogical_actions_updated_at
BEFORE UPDATE ON pedagogical_actions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
