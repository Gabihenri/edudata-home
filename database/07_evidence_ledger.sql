-- =====================================================
-- EVIDENCE CATEGORIES
-- EduData IA Platform Core
-- =====================================================

CREATE TABLE evidence_categories (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    color VARCHAR(30),

    icon VARCHAR(100),

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_category_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_category_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_evidence_category_school
ON evidence_categories(school_id);

CREATE INDEX idx_evidence_category_org
ON evidence_categories(organization_id);

CREATE TRIGGER trg_evidence_categories_updated_at
BEFORE UPDATE ON evidence_categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- EVIDENCES
-- =====================================================

CREATE TABLE evidences (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    pedagogical_action_id UUID,

    teacher_id UUID NOT NULL,

    category_id UUID,

    class_id UUID,

    subject_id UUID,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    evidence_type VARCHAR(100),

    visibility VARCHAR(30) DEFAULT 'private',

    status VARCHAR(50) DEFAULT 'draft',

    ai_summary TEXT,

    submitted_at TIMESTAMP,

    validated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_evidence_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_evidence_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_evidence_action
        FOREIGN KEY (pedagogical_action_id)
        REFERENCES pedagogical_actions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_evidence_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_evidence_category
        FOREIGN KEY (category_id)
        REFERENCES evidence_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_evidence_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_evidence_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_evidences_school
ON evidences(school_id);

CREATE INDEX idx_evidences_org
ON evidences(organization_id);

CREATE INDEX idx_evidences_teacher
ON evidences(teacher_id);

CREATE INDEX idx_evidences_status
ON evidences(status);

CREATE INDEX idx_evidences_action
ON evidences(pedagogical_action_id);

CREATE TRIGGER trg_evidences_updated_at
BEFORE UPDATE ON evidences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- EVIDENCE FILES
-- =====================================================

CREATE TABLE evidence_files (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evidence_id UUID NOT NULL,

    uploaded_by UUID,

    file_name VARCHAR(255) NOT NULL,

    original_file_name VARCHAR(255),

    storage_bucket VARCHAR(100) DEFAULT 'evidence-files',

    storage_path TEXT NOT NULL,

    mime_type VARCHAR(100),

    file_extension VARCHAR(20),

    checksum VARCHAR(255),

    file_size BIGINT,

    uploaded_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_file_evidence
        FOREIGN KEY (evidence_id)
        REFERENCES evidences(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_file_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_evidence_files_evidence
ON evidence_files(evidence_id);

-- =====================================================
-- EVIDENCE VALIDATIONS
-- =====================================================

CREATE TABLE evidence_validations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evidence_id UUID NOT NULL,

    validator_id UUID NOT NULL,

    status VARCHAR(50) NOT NULL,

    score NUMERIC(5,2),

    feedback TEXT,

    ai_feedback TEXT,

    validated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_validation_evidence
        FOREIGN KEY (evidence_id)
        REFERENCES evidences(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_validation_user
        FOREIGN KEY (validator_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_validation_evidence
ON evidence_validations(evidence_id);

CREATE INDEX idx_validation_validator
ON evidence_validations(validator_id);
