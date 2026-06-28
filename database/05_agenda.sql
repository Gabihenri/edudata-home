-- =====================================================
-- AGENDA EDI
-- EduData IA Platform Core
-- =====================================================

CREATE TABLE agenda_events (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    user_id UUID NOT NULL,

    class_id UUID,

    subject_id UUID,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    event_type VARCHAR(100) NOT NULL,

    category VARCHAR(100),

    start_datetime TIMESTAMP NOT NULL,

    end_datetime TIMESTAMP NOT NULL,

    all_day BOOLEAN DEFAULT FALSE,

    location VARCHAR(255),

    color VARCHAR(30),

    status VARCHAR(50) DEFAULT 'planned',

    priority VARCHAR(20) DEFAULT 'normal',

    recurrence_rule VARCHAR(255),

    reminder_minutes INTEGER,

    created_by UUID,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_agenda_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agenda_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agenda_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agenda_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_agenda_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_agenda_school
ON agenda_events(school_id);

CREATE INDEX idx_agenda_organization
ON agenda_events(organization_id);

CREATE INDEX idx_agenda_user
ON agenda_events(user_id);

CREATE INDEX idx_agenda_class
ON agenda_events(class_id);

CREATE INDEX idx_agenda_subject
ON agenda_events(subject_id);

CREATE INDEX idx_agenda_start
ON agenda_events(start_datetime);

CREATE INDEX idx_agenda_status
ON agenda_events(status);

CREATE INDEX idx_agenda_event_type
ON agenda_events(event_type);

CREATE TRIGGER trg_agenda_events_updated_at
BEFORE UPDATE ON agenda_events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
