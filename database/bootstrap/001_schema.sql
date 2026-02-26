CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impact_ledger (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  impact_type VARCHAR(64) NOT NULL,
  impact_value DECIMAL(12, 2) NOT NULL CHECK (impact_value > 0),
  evidence_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ledger_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  CONSTRAINT chk_evidence_url
    CHECK (evidence_url IS NULL OR evidence_url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON impact_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_project ON impact_ledger (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS volunteer_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  embedding VECTOR(1536) NOT NULL,
  skill_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_volunteer_vectors_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_volunteer_vectors_cosine
  ON volunteer_vectors USING hnsw (embedding vector_cosine_ops);
