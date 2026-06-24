-- =====================================================
-- EVIDENCE CATEGORIES
-- =====================================================

CREATE TABLE evidence_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_category_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

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

    pedagogical_action_id UUID,

    teacher_id UUID NOT NULL,

    category_id UUID,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    status VARCHAR(50) DEFAULT 'draft',

    submitted_at TIMESTAMP,

    validated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_evidence_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
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
        ON DELETE SET NULL
);

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

    storage_bucket VARCHAR(100) DEFAULT 'evidence-files',

    storage_path TEXT NOT NULL,

    mime_type VARCHAR(100),

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

-- =====================================================
-- EVIDENCE VALIDATIONS
-- =====================================================

CREATE TABLE evidence_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evidence_id UUID NOT NULL,

    validator_id UUID NOT NULL,

    status VARCHAR(50) NOT NULL,

    feedback TEXT,

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