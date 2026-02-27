INSERT INTO users (id, full_name, email, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Test Volunteer', 'volunteer@enturk.org', TRUE),
  ('11111111-1111-1111-1111-111111111111', 'Amina Solar', 'amina@enturk.org', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Luis Water', 'luis@enturk.org', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Kei Logistics', 'kei@enturk.org', TRUE)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_active = EXCLUDED.is_active;

INSERT INTO projects (id, name, description, status, contact_email) VALUES
  (
    '770e8400-e29b-41d4-a716-446655441111',
    'Test Sustainability Project',
    'Pilot project for local preview and integration testing.',
    'OPEN',
    'projects@enturk.org'
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    contact_email = EXCLUDED.contact_email;

DELETE FROM volunteer_vectors
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

WITH
solar_vec AS (
  SELECT '[' || string_agg(
    CASE
      WHEN i BETWEEN 1 AND 512 THEN '0.08'
      WHEN i BETWEEN 513 AND 768 THEN '0.03'
      ELSE '0.005'
    END, ','
  ) || ']' AS v
  FROM generate_series(1, 1536) AS g(i)
),
water_vec AS (
  SELECT '[' || string_agg(
    CASE
      WHEN i BETWEEN 513 AND 1024 THEN '0.08'
      WHEN i BETWEEN 1025 AND 1280 THEN '0.03'
      ELSE '0.005'
    END, ','
  ) || ']' AS v
  FROM generate_series(1, 1536) AS g(i)
),
logistics_vec AS (
  SELECT '[' || string_agg(
    CASE
      WHEN i BETWEEN 1025 AND 1536 THEN '0.08'
      WHEN i BETWEEN 257 AND 512 THEN '0.03'
      ELSE '0.005'
    END, ','
  ) || ']' AS v
  FROM generate_series(1, 1536) AS g(i)
)
INSERT INTO volunteer_vectors (user_id, embedding, skill_summary)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, solar_vec.v::vector(1536), 'Solar microgrids, GIS mapping, rapid field deployment' FROM solar_vec
UNION ALL
SELECT '22222222-2222-2222-2222-222222222222'::uuid, water_vec.v::vector(1536), 'Water systems, sanitation planning, community resilience' FROM water_vec
UNION ALL
SELECT '33333333-3333-3333-3333-333333333333'::uuid, logistics_vec.v::vector(1536), 'Disaster logistics, volunteer coordination, operations' FROM logistics_vec;
