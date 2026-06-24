-- =====================================================
-- AGENDA EDI
-- =====================================================

CREATE TABLE agenda_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    user_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    event_type VARCHAR(100) NOT NULL,

    start_datetime TIMESTAMP NOT NULL,

    end_datetime TIMESTAMP NOT NULL,

    location VARCHAR(255),

    status VARCHAR(50) DEFAULT 'planned',

    priority VARCHAR(20) DEFAULT 'normal',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_agenda_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agenda_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_agenda_events_updated_at
BEFORE UPDATE ON agenda_events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();