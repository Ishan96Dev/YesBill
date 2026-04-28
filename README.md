# YesBill — Household Service Billing Tracker

> Track daily services, generate AI-powered bills, and never dispute a monthly charge again.

![Status](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
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

### Flutter Mobile App (`yesbill-mobile/`)
- Native Android app built with Flutter 3.41.6
- Full feature parity with the web app — dashboard, calendar, services, bills, analytics, AI chat, AI agent
- **Docs screen:** Browse the full YesBill documentation in-app with collapsible sidebar navigation and rendered markdown
- Offline-capable assets: all 32 documentation pages bundled locally
- Push notifications support (Firebase Cloud Messaging)
- Bottom nav bar with primary tabs + "More" drawer for secondary screens
- Dark / light theme following system preference
- Built with: flutter_riverpod, go_router, supabase_flutter, flutter_markdown, url_launcher, lucide_icons

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

### Frontend (Active — `frontend-next/`)
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14 | Full-stack React framework |
| React | 18.2 | UI library |
| TypeScript | 5.3 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| Framer Motion | 10 | Animations |
| Recharts | 3.7 | Charts (dashboard + analytics) |
| Lucide React | 0.307 | Icons |
| date-fns | 3.6 | Date utilities |
| Axios | 1.6 | HTTP client |
| Supabase JS SDK | 2.39 | Auth + realtime |
| @supabase/ssr | 0.9 | SSR-safe auth helpers |
| react-markdown | 10 | AI response rendering |
| html2pdf.js | 0.14 | PDF bill export |

> **Legacy:** The original `frontend/` (Vite + React) is kept for reference. Active development is in `frontend-next/`.

### Backend
| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.115.6 | API framework |
| Uvicorn | 0.32.1 | ASGI server |
| Supabase Python | 2.10.0 | Database + Auth + RLS |
| Pydantic | 2.10.3 | Data validation |
| python-jose | 3.3 | JWT handling |
| slowapi | 0.1.9 | Rate limiting |

### Infrastructure
- **Database:** Supabase (PostgreSQL with Row Level Security), project ID `dmabraziqscumpbwhjbf` (ap-northeast-2)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Frontend:** Vercel (Next.js, `frontend-next/`)
- **Backend:** Render (FastAPI, Dockerized)
- **Email:** Brevo SMTP via Supabase Edge Functions (`send-bill-email`, `notify-password-change`, `notify-account-deleted`)
- **LLM:** OpenAI API / Anthropic API / Google Generative AI API (user-provided keys stored per-user in Supabase)

---

## Project Structure

```
yesbill/
├── frontend-next/              # PRIMARY frontend — Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Main dashboard
│   │   ├── services/           # Service CRUD
│   │   ├── add-service/        # Add/edit service form
│   │   ├── calendar/           # Multi-service calendar
│   │   ├── bills/              # Bill generation + list
│   │   ├── analytics/          # Spend analytics + forecasting
│   │   ├── chat/               # AI chat + agent interface
│   │   ├── settings/           # Profile + AI + notification settings
│   │   ├── auth/               # Login, Signup, ForgotPassword
│   │   └── ...                 # Landing pages (features, pricing, blog, etc.)
│   ├── components/
│   │   ├── PayBillModal.jsx    # Mark bill as paid
│   │   ├── Calendar.jsx        # Calendar grid component
│   │   ├── StatsCards.jsx      # Dashboard KPI cards
│   │   ├── SummaryCard.jsx     # Bill summary component
│   │   └── ...                 # Feature-specific components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Axios API wrappers
│   └── lib/                    # Utilities (cn, supabase client)
├── frontend/                   # Legacy Vite + React frontend (reference)
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py             # Auth endpoints
│   │   │   ├── bills.py            # Bills: generate, CRUD, payment, email
│   │   │   ├── chat.py             # Chat, agent (SSE streaming)
│   │   │   └── ai_settings.py      # AI provider + model settings
│   │   ├── services/
│   │   │   ├── supabase.py         # All database operations
│   │   │   ├── llm_bill_service.py # LLM abstraction (OpenAI/Anthropic/Google)
│   │   │   └── chat_service.py     # Chat + agent logic
│   │   ├── schemas/                # Pydantic models
│   │   └── main.py                 # FastAPI app entry point
│   └── requirements.txt
├── supabase/
│   └── functions/
│       ├── send-bill-email/        # Bill email via Brevo
│       ├── notify-password-change/ # Password-changed email
│       ├── notify-account-deleted/ # Account-deleted email
│       ├── contact-form/           # Contact form handler
│       └── bill-scheduler/         # Cron bill trigger
├── docs-site/                  # Docusaurus documentation site
├── email-templates/            # Supabase Auth HTML email templates
├── yesbill-mobile/             # Flutter Android app
│   ├── lib/
│   │   ├── presentation/
│   │   │   ├── screens/        # Dashboard, Calendar, Bills, AI Chat, AI Agent, Docs, ...
│   │   │   ├── widgets/        # Shared widgets (AppScaffold, ShellHeaderActions, ...)
│   │   │   └── router/         # go_router routes
│   │   ├── providers/          # Riverpod providers
│   │   └── core/               # Theme, constants, utilities
│   ├── assets/
│   │   ├── docs/               # 32 bundled documentation markdown files
│   │   └── images/             # App images
│   └── android/                # Android project
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
cd frontend-next
npm install
```

Create `frontend-next/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

### 4. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### 5. Mobile App (Android)

**Prerequisites:** Flutter 3.41.6, Android SDK, `google-services.json` from your Firebase project

```bash
cd yesbill-mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# Debug build
flutter run

# Release APK
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://your-api.com
```

APK output: `yesbill-mobile/build/app/outputs/flutter-apk/app-release.apk`

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
