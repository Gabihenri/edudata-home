-- =====================================================
-- USERS
-- EduData IA Platform Core
-- =====================================================

CREATE TABLE users (

    id UUID PRIMARY KEY,

    school_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    full_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    phone VARCHAR(30),

    avatar_url VARCHAR(500),

    role VARCHAR(50) DEFAULT 'teacher',

    auth_provider VARCHAR(50) DEFAULT 'supabase',

    auth_provider_id VARCHAR(255),

    active BOOLEAN DEFAULT TRUE,

    email_verified BOOLEAN DEFAULT FALSE,

    last_login TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_user_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_school
ON users(school_id);

CREATE INDEX idx_users_organization
ON users(organization_id);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- TEACHER PROFILES
-- =====================================================

CREATE TABLE teacher_profiles (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    registration_number VARCHAR(100),

    employment_type VARCHAR(100),

    weekly_workload INTEGER,

    years_experience INTEGER,

    digital_maturity INTEGER DEFAULT 0,

    area_of_knowledge VARCHAR(150),

    highest_degree VARCHAR(150),

    biography TEXT,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_teacher_user
ON teacher_profiles(user_id);

CREATE TRIGGER trg_teacher_profiles_updated_at
BEFORE UPDATE ON teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
