BEGIN;

DROP TABLE IF EXISTS project_applications CASCADE;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS chk_projects_contact_email;

ALTER TABLE projects
  DROP COLUMN IF EXISTS contact_email;

COMMIT;
