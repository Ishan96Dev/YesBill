# YesBill — Household Service Billing Tracker

> Track daily services, generate AI-powered bills, and never dispute a monthly charge again.

![Status](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-18.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

---

## What is YesBill?

YesBill is a full-stack web application for tracking recurring household services — milk, newspaper, tiffin, car wash, internet, EMIs, rent, and more. Users mark daily deliveries, and the app automatically generates itemized monthly bills with AI-powered summaries using OpenAI, Anthropic, or Google AI.

---

## Features

### Service Management
- **5 delivery types:** `home_delivery`, `visit_based`, `utility`, `subscription`, `payment`
- Per-service pricing, billing day, frequency, icons, and schedule
- **Dual role:** Consumer (tracks what you pay for) or Provider (tracks what you bill clients)
- Client details (name, phone, email, address) for provider services
- Service start/end dates, active/inactive toggle, auto-generate bill option

### Daily Tracking
- Monthly calendar grid — click a day to mark services delivered or skipped
- Multi-service per-day modal with optimistic UI updates
- Timezone-aware tracking (per user)
- `visit_based` services use Visited/Missed language; `home_delivery` uses Delivered/Skipped

### Bill Generation
- **LLM-powered:** Bill summaries, AI recommendations, savings insights
- **Providers:** OpenAI (GPT-4o, GPT-5.2), Anthropic (Claude), Google (Gemini)
- **Reasoning models:** Configurable effort level (none/low/medium/high/xhigh) for OpenAI GPT-5.2
- **Manual:** Select services + month, generate on demand
- **Auto-generation:** Cron-triggered on each service's billing day (per user timezone)
- Custom notes on bills — user writes, AI refines

### Bill Payment Tracking
- Mark bills paid with method (Cash, Card, UPI, Bank Transfer, Cheque)
- Payment date, payment note, paid-at tracking
- Paid status visible on calendar view

### Analytics
- Monthly spend trends, service breakdown pie chart
- Delivery rate stats, YoY comparison
- Per-service spend breakdown, forecast (best/expected/worst)
- Monthly budget tracking (stored locally)

### AI Chat & Agent
- **Chat mode:** Ask questions about spending, services, or billing history (streamed SSE)
- **Agent mode:** Execute actions via natural language — mark deliveries, update services, mark bills paid
- Agent action confirmation cards before execution
- Per-message reasoning summary for reasoning models
- Thumbs up/down feedback per message
- Conversation history, rename, delete, export (Markdown)
- Alt+L: rephrase selected text in chat input

### User Settings
- Profile: display name, timezone, currency
- AI settings: provider, API key, model, reasoning effort
- Model probe suite: test which models are available for your API key
- Notifications: email and WhatsApp toggles

### Export & Sharing
- PDF bill export (html2pdf)
- Markdown export for chat conversations
- Email notifications on bill generation

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| Vite | 5 | Build tool |
| Tailwind CSS | 3.4 | Utility-first styling |
| Framer Motion | 11 | Animations |
| Recharts | 2 | Charts (dashboard + analytics) |
| Lucide React | latest | Icons |
| date-fns | 3 | Date utilities |
| Axios | 1 | HTTP client |
| Supabase JS SDK | 2 | Auth + realtime |

### Backend
| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.109 | API framework |
| Supabase | PostgreSQL | Database + Auth + RLS |
| Pydantic | 2 | Data validation |
| httpx | latest | Async HTTP (LLM calls) |
| slowapi | latest | Rate limiting |

### Infrastructure
- **Database:** Supabase (PostgreSQL with Row Level Security), project ID `dmabraziqscumpbwhjbf` (ap-northeast-2)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Email:** Brevo SMTP via Supabase Edge Function
- **LLM:** OpenAI API / Anthropic API / Google Generative AI API (user-provided keys)

---

## Project Structure

```
yesbill/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth/               # Login, Signup, ForgotPassword
│   │   │   ├── Dashboard.jsx       # Main dashboard with stats + charts
│   │   │   ├── Services.jsx        # Manage all services
│   │   │   ├── AddService.jsx      # Add/edit service form
│   │   │   ├── Calendar.jsx        # Main multi-service calendar
│   │   │   ├── ServiceCalendarPage.jsx  # Per-service calendar views
│   │   │   ├── Bills.jsx           # Bill generation + list
│   │   │   ├── Analytics.jsx       # Spend analytics + forecasting
│   │   │   ├── ChatPage.jsx        # AI chat + agent interface
│   │   │   ├── Settings.jsx        # Profile + AI + notification settings
│   │   │   └── ...                 # Landing, Features, Pricing, etc.
│   │   ├── components/
│   │   │   ├── ui/                 # Base components (Button, Card, Toast, etc.)
│   │   │   ├── PayBillModal.jsx    # Mark bill as paid modal
│   │   │   ├── AgentButton.jsx     # Floating agent button (fixed bottom-right)
│   │   │   ├── ModelSelector.jsx   # AI provider + model picker
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.js              # Axios client + all API methods
│   │   │   └── dataService.js      # Higher-level data service layer
│   │   └── context/
│   │       └── AuthContext.jsx     # Supabase auth state
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py             # Auth endpoints
│   │   │   ├── bills.py            # Bills: config, records, generate, paid
│   │   │   ├── chat.py             # Chat, agent, conversations
│   │   │   └── ai_settings.py      # AI provider + model settings
│   │   ├── services/
│   │   │   ├── supabase.py         # All database operations
│   │   │   ├── llm_bill_service.py # LLM abstraction (OpenAI/Anthropic/Google)
│   │   │   └── chat_service.py     # Chat + agent logic (SSE streaming)
│   │   ├── schemas/                # Pydantic models
│   │   └── main.py                 # FastAPI app entry point
│   └── requirements.txt
└── README.md
```

---

## Key API Endpoints

### Bills
```
POST   /bills/generate                          Generate bill (LLM)
POST   /bills/auto-generate                     Cron: auto-generate for all users
GET    /bills/generated                         List generated bills
GET    /bills/generated/month/{year_month}      Bills for calendar view
GET    /bills/generated/{bill_id}               Single bill detail
DELETE /bills/generated/{bill_id}               Delete bill
PATCH  /bills/generated/{bill_id}/paid          Mark/unmark paid
```

### Records
```
POST /bills/records                             Create daily confirmation
GET  /bills/records?year_month=YYYY-MM          Get month's records
```

### Chat & Agent
```
POST /chat/conversations/{conv_id}/messages         Chat message (SSE stream)
POST /chat/agent/conversations/{conv_id}/messages   Agent message (SSE stream)
POST /chat/agent/execute                            Execute confirmed agent action
POST /chat/rephrase                                 Rephrase text (Alt+L)
GET  /chat/models                                   List available models
POST /chat/models/probe                             Probe model availability
```

### AI Settings
```
GET    /ai/settings                     Get AI config (provider, model, key)
PATCH  /ai/settings/{settings_id}       Update AI config
POST   /ai/settings/validate-key        Validate API key
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `user_services` | Service definitions (name, price, delivery_type, billing_day, client_info) |
| `service_confirmations` | Daily tracking (status: `delivered\|skipped\|pending`) |
| `generated_bills` | Bills (payload JSON, total_amount, is_paid, payment_method, ai_model_used) |
| `user_profiles` | User settings (timezone, currency, display_name) |
| `chat_conversations` | Conversations (title, conv_type: `main\|agent`) |
| `chat_messages` | Messages (role, content, reasoning, feedback) |
| `ai_settings` | AI config (provider, model, encrypted API key, reasoning_supported) |
| `agent_actions` | Pending agent actions (action_type, status: `pending\|confirmed\|executed`) |

### Important Notes
- `service_confirmations.status` CHECK constraint: only `delivered|skipped|pending`
- `GET /bills/generated/month/{year_month}` must be declared **before** `GET /bills/generated/{bill_id}` in router
- `upsert_service_confirmation` uses 3-column unique key: `(user_id, service_id, date)`
- `OPENAI_REASONING_EFFORT_MODELS = {"gpt-5.2"}` — only valid reasoning model for OpenAI

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project (or local Supabase CLI)
- At least one LLM API key (OpenAI / Anthropic / Google AI)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/yesbill.git
cd yesbill
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

```bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

### 4. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Delivery Type Reference

| Type | Billing Logic | Calendar Behavior |
|---|---|---|
| `home_delivery` | Rate × delivered days | Per-day Delivered/Skipped |
| `visit_based` | Fixed monthly + attendance | Per-day Visited/Missed |
| `utility` | Full price if active that month | Monthly active toggle |
| `subscription` | Fixed monthly charge | Billing day indicator |
| `payment` | Fixed monthly (EMI/Loan/Rent) | Billing day indicator |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Made with care for households tired of guessing their monthly bills.
