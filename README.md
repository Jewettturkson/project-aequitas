# Project Aequitas V2

Microservices preview stack for:
- `backend-a-orchestrator` (Node.js/Express)
- `backend-b-intelligence` (Flask/AI matching)
- `db` (PostgreSQL + pgvector)

## One-command preview (recommended)

From the workspace root:

```bash
cd "/Users/jaytee/Desktop/Project Aequitas"
docker compose up --build
```

This boots:
- PostgreSQL (`localhost:5432`) with schema + seed data from `database/bootstrap/`
- Orchestrator API (`localhost:3000`)
- Intelligence API (`localhost:8001`)
- Next.js Dashboard (`localhost:3001`)

If you previously ran manual containers with the same ports, stop/remove them once:

```bash
docker rm -f aequitas-pg aequitas-intelligence aequitas-orchestrator 2>/dev/null || true
```

### Reset and re-bootstrap from scratch

```bash
docker compose down -v
docker compose up --build
```

Use this when you want DB init scripts to run again.

## Health checks

```bash
curl -i http://localhost:3000/healthz
curl -i http://localhost:8001/healthz
```

Open the UI in a browser:

```text
http://localhost:3001
```

## Preview contribution flow

```bash
curl -i -X POST http://localhost:3000/api/v1/contributions \
  -H "Content-Type: application/json" \
  -d '{"userId":"550e8400-e29b-41d4-a716-446655440000","projectId":"770e8400-e29b-41d4-a716-446655441111","impactType":"hours","impactValue":5.5,"evidenceUrl":"https://s3.amazon.com/enturk-proof/photo1.jpg"}'
```

Expected: `201 Created` with `transactionId`.

## Preview AI matching flow

```bash
curl -i -X POST http://localhost:8001/api/v1/match \
  -H "Content-Type: application/json" \
  -d '{"projectDescription":"Need volunteers skilled in solar microgrid design, GIS mapping, and rapid field deployment.","topK":5}'
```

Expected: `200 OK` with ranked `data`.

## Volunteer and project onboarding APIs

Create a volunteer profile (also triggers embedding index in intelligence service):

```bash
curl -i -X POST http://localhost:3000/api/v1/volunteers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName":"Amina Solar",
    "email":"amina@enturk.org",
    "skillSummary":"Solar microgrids, GIS mapping, rapid field deployment and community energy planning."
  }'
```

Create a project posting:

```bash
curl -i -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Rapid Reforestation Deployment",
    "description":"Urgent reforestation effort requiring logistics, field deployment, and GIS support.",
    "latitude":47.6062,
    "longitude":-122.3321,
    "status":"OPEN"
  }'
```

## Deployment env vars for onboarding flow

Orchestrator service:

```text
INTELLIGENCE_URL=https://ai.nodeenturk.org
INTELLIGENCE_SERVICE_TOKEN=<shared-secret>
PROJECT_ADMIN_KEY=<optional-admin-key-for-project-posting>
VOLUNTEER_RATE_LIMIT_WINDOW_MS=600000
VOLUNTEER_RATE_LIMIT_MAX=20
PROJECT_RATE_LIMIT_WINDOW_MS=600000
PROJECT_RATE_LIMIT_MAX=10
```

Intelligence service:

```text
SERVICE_TOKEN=<shared-secret>
```

If you do not set `SERVICE_TOKEN`, the volunteer-index endpoint remains open. For production, set both values to the same secret.
If you set `PROJECT_ADMIN_KEY`, project posting requires either `X-Admin-Key: <key>` or `Authorization: Bearer <key>`.

## OpenAI mode vs mock mode

`docker-compose.yml` defaults to `MOCK_EMBEDDINGS=true` for easy local preview.

To use real OpenAI embeddings:

```bash
export OPENAI_API_KEY="your-key"
export MOCK_EMBEDDINGS=false
docker compose up --build
```

## Migration order (manual mode)

If running migrations manually:
1. `database/migrations/20260225_create_core_entities_up.sql`
2. `database/migrations/20260225_create_impact_ledger_up.sql`
