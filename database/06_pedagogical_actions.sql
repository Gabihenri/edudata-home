-- =====================================================
-- PEDAGOGICAL ACTIONS
-- =====================================================

CREATE TABLE pedagogical_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

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

    status VARCHAR(50) DEFAULT 'draft',

    action_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_action_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
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

CREATE TRIGGER trg_pedagogical_actions_updated_at
BEFORE UPDATE ON pedagogical_actions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();