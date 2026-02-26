BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Add indexes for frequent reads.
CREATE INDEX IF NOT EXISTS idx_ledger_user ON impact_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_project ON impact_ledger(project_id, created_at DESC);

COMMIT;
