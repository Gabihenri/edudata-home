-- =====================================================
-- ACADEMIC STRUCTURE
-- EduData IA Platform Core
-- =====================================================

-- =====================================================
-- KNOWLEDGE AREAS
-- =====================================================

CREATE TABLE knowledge_areas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(50),

    description TEXT,

    color VARCHAR(20),

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_area_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_area_school
ON knowledge_areas(school_id);

CREATE INDEX idx_knowledge_area_name
ON knowledge_areas(name);

CREATE TRIGGER trg_knowledge_areas_updated_at
BEFORE UPDATE ON knowledge_areas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- SUBJECTS
-- =====================================================

CREATE TABLE subjects (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    knowledge_area_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50),

    workload INTEGER,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_subject_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_subject_area
        FOREIGN KEY (knowledge_area_id)
        REFERENCES knowledge_areas(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_subject_school
ON subjects(school_id);

CREATE INDEX idx_subject_area
ON subjects(knowledge_area_id);

CREATE INDEX idx_subject_name
ON subjects(name);

CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- SCHOOL YEARS
-- =====================================================

CREATE TABLE school_years (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    year INTEGER NOT NULL,

    start_date DATE,

    end_date DATE,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_school_year_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_school_year_school
ON school_years(school_id);

CREATE INDEX idx_school_year
ON school_years(year);

CREATE TRIGGER trg_school_years_updated_at
BEFORE UPDATE ON school_years
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- CLASSES
-- =====================================================

CREATE TABLE classes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    school_year_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    grade VARCHAR(50),

    shift VARCHAR(30),

    modality VARCHAR(50),

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_class_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_classes_school
ON classes(school_id);

CREATE INDEX idx_classes_school_year
ON classes(school_year_id);

CREATE INDEX idx_classes_name
ON classes(name);

CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
