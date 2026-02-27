BEGIN;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_projects_contact_email'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT chk_projects_contact_email
      CHECK (
        contact_email IS NULL
        OR contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  volunteer_name TEXT NOT NULL,
  volunteer_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT fk_project_applications_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_applications_project
  ON project_applications(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_applications_status
  ON project_applications(status, created_at DESC);

COMMIT;
