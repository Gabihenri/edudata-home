-- =====================================================
-- AVAILABILITY
-- =====================================================

CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    teacher_id UUID NOT NULL,

    weekday INTEGER NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    status VARCHAR(50) DEFAULT 'available',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_availability_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_availability_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_availability_updated_at
BEFORE UPDATE ON availability
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- SUBSTITUTIONS
-- =====================================================

CREATE TABLE substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    absent_teacher_id UUID NOT NULL,

    substitute_teacher_id UUID,

    class_id UUID,

    subject_id UUID,

    schedule_id UUID,

    substitution_date DATE NOT NULL,

    reason TEXT,

    compatibility_score NUMERIC(5,2),

    status VARCHAR(50) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_sub_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sub_absent
        FOREIGN KEY (absent_teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sub_substitute
        FOREIGN KEY (substitute_teacher_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_sub_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_sub_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_sub_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE SET NULL
);

CREATE TRIGGER trg_substitutions_updated_at
BEFORE UPDATE ON substitutions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();