-- ═══════════════════════════════════════════════════════════
-- GuessMyPlace (GMP) — Database Schema v1.0
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── PLACES ──────────────────────────────────────────────────
CREATE TABLE places (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    name_aliases        TEXT[]   DEFAULT '{}',
    type                TEXT NOT NULL,
    subtype             TEXT,
    emoji               TEXT,
    description         TEXT,
    fun_fact            TEXT,
    interesting_facts   TEXT[]   DEFAULT '{}',
    attributes          JSONB    NOT NULL DEFAULT '{}',
    embedding           vector(384),
    data_quality_score  FLOAT    DEFAULT 0.5 CHECK (data_quality_score BETWEEN 0 AND 1),
    is_active           BOOLEAN  DEFAULT true,
    is_verified         BOOLEAN  DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          TEXT     DEFAULT 'system'
);

CREATE INDEX idx_places_type       ON places(type);
CREATE INDEX idx_places_active     ON places(is_active);
CREATE INDEX idx_places_name_trgm  ON places USING gin(name gin_trgm_ops);
CREATE INDEX idx_places_attributes ON places USING gin(attributes);
CREATE INDEX idx_places_embedding  ON places USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── QUESTIONS ────────────────────────────────────────────────
CREATE TABLE questions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text    TEXT  NOT NULL UNIQUE,
    attribute        TEXT  NOT NULL,
    value            JSONB NOT NULL,
    applicable_types TEXT[] DEFAULT '{}',
    stage            INT   DEFAULT 5,
    base_weight      FLOAT DEFAULT 1.0,
    learned_weight   FLOAT DEFAULT 1.0,
    times_asked      INT   DEFAULT 0,
    avg_info_gain    FLOAT DEFAULT 0.0,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_attr   ON questions(attribute);
CREATE INDEX idx_questions_stage  ON questions(stage);
CREATE INDEX idx_questions_active ON questions(is_active);

-- ── GAME SESSIONS ────────────────────────────────────────────
CREATE TABLE game_sessions (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token        TEXT UNIQUE NOT NULL,
    target_place_id      UUID REFERENCES places(id) ON DELETE SET NULL,
    status               TEXT DEFAULT 'active'
                         CHECK (status IN ('active','correct','incorrect','abandoned')),
    guessed_place_id     UUID REFERENCES places(id) ON DELETE SET NULL,
    final_confidence     FLOAT,
    questions_asked      INT  DEFAULT 0,
    user_correction_text TEXT,
    corrected_place_id   UUID REFERENCES places(id) ON DELETE SET NULL,
    duration_seconds     INT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    ended_at             TIMESTAMPTZ
);

CREATE INDEX idx_sessions_status  ON game_sessions(status);
CREATE INDEX idx_sessions_created ON game_sessions(created_at);
CREATE INDEX idx_sessions_target  ON game_sessions(target_place_id);

-- ── GAME ANSWERS ─────────────────────────────────────────────
CREATE TABLE game_answers (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id           UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id          UUID REFERENCES questions(id) ON DELETE SET NULL,
    question_text        TEXT  NOT NULL,
    attribute            TEXT  NOT NULL,
    value                JSONB NOT NULL,
    answer               TEXT  NOT NULL
                         CHECK (answer IN ('yes','probably','dontknow','probablynot','no')),
    confidence_before    FLOAT,
    confidence_after     FLOAT,
    active_count_before  INT,
    active_count_after   INT,
    asked_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answers_session  ON game_answers(session_id);
CREATE INDEX idx_answers_question ON game_answers(question_id);

-- ── ANALYTICS DAILY ──────────────────────────────────────────
CREATE TABLE analytics_daily (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                   DATE NOT NULL UNIQUE,
    total_games            INT  DEFAULT 0,
    correct_games          INT  DEFAULT 0,
    incorrect_games        INT  DEFAULT 0,
    abandoned_games        INT  DEFAULT 0,
    accuracy               FLOAT,
    avg_questions          FLOAT,
    by_type                JSONB DEFAULT '{}',
    confusion_pairs        JSONB DEFAULT '[]',
    bot_test_accuracy      FLOAT,
    bot_test_total         INT  DEFAULT 0,
    bot_test_correct       INT  DEFAULT 0,
    bot_test_avg_questions FLOAT,
    bot_test_ran_at        TIMESTAMPTZ,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── FEATURE IMPORTANCE ──────────────────────────────────────
CREATE TABLE feature_importance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attribute       TEXT  NOT NULL,
    place_type      TEXT  DEFAULT 'all',
    importance_score FLOAT DEFAULT 0.5,
    times_decisive  INT   DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attribute, place_type)
);

-- ── ADMIN USERS ──────────────────────────────────────────────
CREATE TABLE admin_users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email        TEXT NOT NULL,
    is_super_admin BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    last_login   TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRIGGERS ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at
    BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER analytics_updated_at
    BEFORE UPDATE ON analytics_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SIMILARITY SEARCH FUNCTION ───────────────────────────────
CREATE OR REPLACE FUNCTION find_similar_places(
    query_embedding vector(384),
    match_count     INT  DEFAULT 10,
    type_filter     TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, type TEXT, similarity FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.type,
           1 - (p.embedding <=> query_embedding) AS similarity
    FROM places p
    WHERE p.is_active = true
      AND p.embedding IS NOT NULL
      AND (type_filter IS NULL OR p.type = type_filter)
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE places            ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_importance ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_public_read"    ON places     FOR SELECT USING (is_active = true);
CREATE POLICY "questions_public_read" ON questions  FOR SELECT USING (is_active = true);
CREATE POLICY "sessions_all"          ON game_sessions  FOR ALL USING (true);
CREATE POLICY "answers_all"           ON game_answers   FOR ALL USING (true);
CREATE POLICY "analytics_all"         ON analytics_daily FOR ALL USING (true);
CREATE POLICY "fi_all"                ON feature_importance FOR ALL USING (true);
CREATE POLICY "admin_all"             ON admin_users FOR ALL USING (true);