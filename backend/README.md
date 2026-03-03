# YesBill Backend

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063?style=flat-square&logo=pydantic&logoColor=white)](https://docs.pydantic.dev)
[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](../LICENSE)

FastAPI backend for YesBill — a household expense tracker with multi-provider AI, automatic bill generation, and Supabase for auth and data storage.

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | 0.109 | Web framework |
| [Uvicorn](https://www.uvicorn.org) | 0.27 | ASGI server |
| [Supabase Python](https://supabase.com/docs/reference/python) | 2.3 | Auth + PostgreSQL client |
| [Pydantic](https://docs.pydantic.dev) | v2 | Data validation & settings |
| [HTTPX](https://www.python-httpx.org) | 0.26 | Async HTTP client |
| [SlowAPI](https://slowapi.readthedocs.io) | 0.1.9 | Rate limiting |
| [python-jose](https://python-jose.readthedocs.io) | 3.3 | JWT handling |

---

## Quick Start

### Prerequisites

- Python 3.11+
- A [Supabase](https://supabase.com) project (for auth and database)
- API keys for at least one AI provider (OpenAI, Anthropic, or Google Gemini)

### 1 — Clone and install

```bash
git clone https://github.com/your-org/yesbill.git
cd yesbill/backend
pip install -r requirements.txt
```

### 2 — Configure environment

Create a `.env` file in the `backend/` directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# App
SECRET_KEY=your-secret-key-min-32-chars
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
```

### 3 — Run the development server

```bash
uvicorn app.main:app --reload --port 8000
```

API available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

---

## Project Structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app entry point, CORS, routers
│   ├── core/
│   │   ├── config.py         # Pydantic settings (env vars)
│   │   ├── supabase.py       # Supabase client initialisation
│   │   └── security.py       # JWT verification helpers
│   ├── routers/
│   │   ├── auth.py           # Auth endpoints (profile, session)
│   │   ├── bills.py          # Bill CRUD, generation, payment tracking
│   │   ├── chat.py           # Ask AI & AI Agent chat endpoints
│   │   └── ai_settings.py    # AI provider configuration
│   ├── schemas/              # Pydantic request/response models
│   └── services/             # Business logic (bill calc, AI calls)
├── tests/
│   ├── test_gemini_thinking.py
│   ├── test_google_suite.py
│   └── test_reasoning_summary.py
├── scripts/
│   └── test_model_probes.py  # AI model capability probes
├── Dockerfile
├── fly.toml                  # Fly.io deployment config
├── vercel.json               # Vercel serverless config
├── requirements.txt
└── pyproject.toml            # Ruff, Black, mypy config
```

---

## API Overview

| Router | Prefix | Description |
|---|---|---|
| Auth | `/api/auth` | User profile, session management |
| Bills | `/api/bills` | Bill gen, CRUD, payment, export |
| Chat | `/api/chat` | Ask AI, AI Agent, conversation history |
| AI Settings | `/api/ai-settings` | Provider config, model selection |

Full interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` when the server is running.

---

## AI Provider Support

The backend supports three AI providers. Users configure their preferred provider and API key from the frontend settings.

| Provider | Models Supported | Reasoning |
|---|---|---|
| OpenAI | GPT-4o, o1, o1-mini, o3-mini | ✅ (o-series) |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku | ✅ (extended thinking) |
| Google | Gemini 1.5 Pro, Gemini 2.0 Flash | ✅ (thinking mode) |

AI keys are stored per-user in Supabase (encrypted at rest). The backend never stores keys in plaintext server-side.

---

## Bill Generation

Bills are generated automatically on a monthly schedule via a cron job. The generation logic:

1. Reads all services for all users
2. Aggregates calendar tracking data for the billing period
3. Calculates amounts based on service type and rates
4. Optionally calls the configured AI provider to generate a plain-English bill summary
5. Writes the bill record to Supabase
6. Triggers email notification via Supabase

Manual re-generation is available through the API for testing.

---

## Code Quality

```bash
# Lint
ruff check app/

# Format
black app/

# Type check
mypy app/
```

Configuration for all three tools is in `pyproject.toml`.

---

## Deployment

The backend is deployed on **Render** (production) with a Dockerfile.

```bash
# Build and run with Docker
docker build -t yesbill-backend .
docker run -p 8000:8000 --env-file .env yesbill-backend
```

Alternative deployment configs are provided for:
- **Fly.io** — `fly.toml`
- **Vercel** (serverless) — `vercel.json`

---

## Related

- [Frontend README](../frontend/README.md)
- [Docs Site README](../docs-site/README.md)
- [Root README](../README.md)

## Legacy Schema Documentation

### bill_config
```javascript
{
  "name": "bill_config",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true
      }
    },
    {
      "name": "daily_amount",
      "type": "number",
      "required": true
    },
    {
      "name": "currency",
      "type": "text",
      "required": true,
      "options": {
        "max": 3
      }
    },
    {
      "name": "start_date",
      "type": "date",
      "required": true
    },
    {
      "name": "active",
      "type": "bool",
      "required": true
    }
  ],
  "listRule": "user.id = @request.auth.id",
  "viewRule": "user.id = @request.auth.id",
  "createRule": "user.id = @request.auth.id",
  "updateRule": "user.id = @request.auth.id",
  "deleteRule": "user.id = @request.auth.id"
}
```

### daily_records
```javascript
{
  "name": "daily_records",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true
      }
    },
    {
      "name": "date",
      "type": "date",
      "required": true
    },
    {
      "name": "status",
      "type": "select",
      "required": true,
      "options": {
        "values": ["YES", "NO"]
      }
    },
    {
      "name": "amount",
      "type": "number",
      "required": true
    }
  ],
  "listRule": "user.id = @request.auth.id",
  "viewRule": "user.id = @request.auth.id",
  "createRule": "user.id = @request.auth.id",
  "updateRule": "user.id = @request.auth.id",
  "deleteRule": "user.id = @request.auth.id"
}
```

## Code Quality

Run linting:
```bash
ruff check .
```

Format code:
```bash
black .
```

Type check:
```bash
mypy app/
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
