-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY,

    school_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_user_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- TEACHER PROFILES
-- =====================================================

CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    registration_number VARCHAR(100),

    employment_type VARCHAR(100),

    weekly_workload INTEGER,

    years_experience INTEGER,

    digital_maturity INTEGER,

    bio TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_teacher_profiles_updated_at
BEFORE UPDATE ON teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();