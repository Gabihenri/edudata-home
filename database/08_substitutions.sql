-- =====================================================
-- AVAILABILITY
-- EduData IA Platform Core
-- =====================================================

CREATE TABLE availability (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    teacher_id UUID NOT NULL,

    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    status VARCHAR(50) DEFAULT 'available',

    preferred BOOLEAN DEFAULT TRUE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_availability_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_availability_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_availability_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_availability_teacher
ON availability(teacher_id);

CREATE INDEX idx_availability_school
ON availability(school_id);

CREATE INDEX idx_availability_weekday
ON availability(weekday);

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

    organization_id UUID NOT NULL,

    absent_teacher_id UUID NOT NULL,

    substitute_teacher_id UUID,

    class_id UUID,

    subject_id UUID,

    schedule_id UUID,

    substitution_date DATE NOT NULL,

    start_time TIME,

    end_time TIME,

    reason TEXT,

    ai_recommendation TEXT,

    compatibility_score NUMERIC(5,2),

    status VARCHAR(50) DEFAULT 'pending',

    approved_by UUID,

    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_sub_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sub_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
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

CREATE INDEX idx_substitution_school
ON substitutions(school_id);

CREATE INDEX idx_substitution_organization
ON substitutions(organization_id);

CREATE INDEX idx_substitution_date
ON substitutions(substitution_date);

CREATE INDEX idx_substitution_status
ON substitutions(status);

CREATE INDEX idx_substitution_absent_teacher
ON substitutions(absent_teacher_id);

CREATE INDEX idx_substitution_substitute_teacher
ON substitutions(substitute_teacher_id);

CREATE TRIGGER trg_substitutions_updated_at
BEFORE UPDATE ON substitutions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
