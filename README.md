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

## Stripe donation flow (Next.js API route)

The dashboard now includes a Stripe-backed donation form. It creates payment intents through:

```text
POST /api/donations/payment-intent
```

Example request:

```bash
curl -i -X POST http://localhost:3001/api/donations/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount":25,"currency":"usd"}'
```

Required frontend env vars (`frontend-dashboard/.env.local`):

```text
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Optional donation tuning:

```text
NEXT_PUBLIC_STRIPE_DONATION_CURRENCY=usd
STRIPE_DONATION_CURRENCY=usd
NEXT_PUBLIC_DEFAULT_DONATION_AMOUNT=25
STRIPE_MIN_DONATION_AMOUNT=1
STRIPE_MAX_DONATION_AMOUNT=10000
```

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
    "contactEmail":"projects@enturk.org",
    "latitude":47.6062,
    "longitude":-122.3321,
    "status":"OPEN"
  }'
```

Latitude/longitude are optional. If you provide one, provide both.

Create a public project posting (no admin key):

```bash
curl -i -X POST http://localhost:3000/api/v1/projects/public \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Community Water Rapid Response",
    "description":"Urgent field response requiring logistics, sanitation planning, and volunteer operations support.",
    "contactEmail":"projects@enturk.org",
    "latitude":5.6037,
    "longitude":-0.1870
  }'
```

Submit a volunteer application to an open project:

```bash
curl -i -X POST http://localhost:3000/api/v1/projects/<project-id>/applications \
  -H "Content-Type: application/json" \
  -d '{
    "volunteerName":"Ama Volunteer",
    "volunteerEmail":"ama@example.com",
    "message":"I have logistics and field deployment experience and can deploy this week."
  }'
```

Review project applications (Firebase manager token required):

```bash
curl -i http://localhost:3000/api/v1/projects/<project-id>/applications \
  -H "Authorization: Bearer <firebase-id-token>"
```

Approve or reject an application (Firebase manager token required):

```bash
curl -i -X PATCH http://localhost:3000/api/v1/projects/<project-id>/applications/<application-id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{"status":"APPROVED"}'
```

Close project intake when work is completed (Firebase manager token required):

```bash
curl -i -X PATCH http://localhost:3000/api/v1/projects/<project-id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{"status":"COMPLETED"}'
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
PROJECT_APPLICATION_RATE_LIMIT_WINDOW_MS=600000
PROJECT_APPLICATION_RATE_LIMIT_MAX=30
FIREBASE_SERVICE_ACCOUNT_JSON=<optional-json-blob>
FIREBASE_SERVICE_ACCOUNT_BASE64=<optional-base64-json>
FIREBASE_USE_APPLICATION_DEFAULT=<optional-true-to-use-ADC>
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<service-account-private-key-with-\n-escapes>
FIREBASE_MANAGER_ROLE_CLAIMS=admin,projectManager,manager
FIREBASE_MANAGER_ROLE_VALUES=admin,project_manager,manager
FIREBASE_MANAGER_EMAILS=<optional-comma-separated-emails>
```

Intelligence service:

```text
SERVICE_TOKEN=<shared-secret>
```

If you do not set `SERVICE_TOKEN`, the volunteer-index endpoint remains open. For production, set both values to the same secret.
If you set `PROJECT_ADMIN_KEY`, project posting requires either `X-Admin-Key: <key>` or `Authorization: Bearer <key>`.
Project application review and project close/reopen endpoints require a Firebase ID token with manager role claims.

Grant manager role claim to a Firebase user:

```bash
cd backend-a-orchestrator
npm run grant:manager -- --email manager@example.com --claim projectManager --value true
```

You can also target a UID:

```bash
cd backend-a-orchestrator
npm run grant:manager -- --uid <firebase-uid> --claim projectManager --value true
```

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
3. `database/migrations/20260227_add_project_intake_extensions_up.sql`
