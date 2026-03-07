# YesBill Frontend (Next.js)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-10-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20SSR-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](../LICENSE)

Primary frontend for [YesBill](https://yesbill.vercel.app) — a household service billing tracker with AI-powered bill analysis, multi-service management, and a conversational AI agent. Built with Next.js 14 App Router, full TypeScript, and deployed on Vercel.

> **Note:** The original Vite + React frontend lives in [`../frontend/`](../frontend/). It is kept as a legacy reference. All active development happens here.

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2 | App Router, SSR, middleware, image optimisation |
| [React](https://react.dev) | 18.2 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5.3 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion) | 10 | Animations & transitions |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2.39 | Auth client |
| [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side) | 0.9 | SSR-safe session cookies + middleware |
| [Axios](https://axios-http.com) | 1.6 | HTTP client (FastAPI backend calls) |
| [Recharts](https://recharts.org) | 3.7 | Dashboard + analytics charts |
| [Lucide React](https://lucide.dev) | 0.307 | Icon library |
| [date-fns](https://date-fns.org) | 3.6 | Date utilities |
| [react-markdown](https://github.com/remarkjs/react-markdown) | 10 | AI chat message rendering |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | 4 | GitHub Flavored Markdown in chat |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | 0.14 | Client-side PDF bill export |
| [@vercel/analytics](https://vercel.com/analytics) | 1.6 | Page-view analytics |
| [class-variance-authority](https://cva.style) | 0.7 | Component variant management |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | 2.6 | Safe Tailwind class merging |

---

## Quick Start

### Prerequisites

- Node.js 18+
- A running [YesBill backend](../backend/README.md) instance
- A [Supabase](https://supabase.com) project

### 1 — Install dependencies

```bash
cd frontend-next
npm install
```

### 2 — Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
# Supabase (public — safe to expose in the browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# FastAPI backend URL (Render / Railway / Fly.io / localhost)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3 — Start the dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**

---

## Available Scripts

```bash
npm run dev          # Next.js dev server with hot-reload (port 3000)
npm run build        # Production build → .next/
npm run start        # Serve the production build locally
npm run lint         # ESLint (next/core-web-vitals ruleset)
npm run type-check   # TypeScript check without emitting files
```

---

## Project Structure

```
frontend-next/
├── app/                          # Next.js App Router (file-system routing)
│   ├── layout.tsx                # Root layout — fonts, providers, Vercel Analytics
│   ├── page.tsx                  # Landing page (SSR)
│   ├── globals.css               # Tailwind base + CSS custom properties
│   │
│   ├── dashboard/                # Main app dashboard
│   ├── services/                 # Service list + management
│   ├── add-service/              # Add / edit service form
│   ├── calendar/                 # Multi-service monthly calendar
│   ├── bills/                    # Bill generation, list, and detail
│   ├── analytics/                # Spend analytics + forecasting
│   ├── chat/                     # AI ask-AI + AI agent
│   ├── settings/                 # Profile, notifications, security, AI config
│   ├── setup/                    # First-time onboarding wizard
│   │
│   ├── auth/                     # Supabase OAuth callback handler
│   ├── login/                    # Login page
│   ├── signup/                   # Sign-up page
│   ├── forgot-password/          # Password reset request
│   │
│   ├── about/                    # Public marketing pages
│   ├── features/
│   ├── pricing/
│   ├── blog/
│   ├── careers/
│   ├── contact/
│   ├── testimonials/
│   ├── roadmap/
│   ├── privacy/
│   ├── terms/
│   └── security/
│
├── components/
│   ├── pages/                    # Client components — one per route page
│   │   ├── DashboardClient.tsx
│   │   ├── BillsClient.tsx
│   │   ├── CalendarViewClient.tsx
│   │   ├── ChatClient.tsx
│   │   ├── AnalyticsClient.tsx
│   │   ├── SettingsClient.tsx
│   │   ├── ServicesClient.tsx
│   │   ├── AddServiceClient.tsx
│   │   ├── SetupClient.tsx
│   │   ├── LoginClient.tsx
│   │   ├── SignupClient.tsx
│   │   └── ...                   # All other page-level client components
│   │
│   ├── agent/                    # AI Agent floating UI
│   │   ├── AgentButton.jsx       # Floating intercom-style toggle button
│   │   ├── AgentPopup.jsx        # Agent chat popup
│   │   └── ActionConfirmCard.jsx # Confirmation cards before agent executes actions
│   │
│   ├── chat/                     # Ask-AI chat components
│   │   ├── ChatInput.jsx         # Message input (with Alt+L rephrase)
│   │   ├── MessageList.jsx       # Scrollable message thread
│   │   ├── MarkdownRenderer.jsx  # Renders AI markdown responses
│   │   ├── ModelSelector.jsx     # AI provider / model picker
│   │   ├── ConversationSidebar.jsx
│   │   ├── FeedbackButtons.jsx   # Thumbs up/down per message
│   │   ├── AnalyticsPopover.jsx  # Token + cost breakdown per message
│   │   └── AtMentionPicker.jsx   # @mention autocomplete in chat input
│   │
│   ├── landing/                  # Public landing page sections
│   │   ├── Hero.jsx
│   │   ├── Features.jsx
│   │   ├── Testimonials.jsx
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   └── Background.jsx
│   │
│   ├── layout/
│   │   ├── AppLayout.jsx         # Authenticated app shell (sidebar + header)
│   │   └── Header.jsx            # Top navigation bar
│   │
│   ├── ui/                       # Primitive UI components
│   │   ├── button.jsx            # shadcn/ui Button
│   │   ├── card.jsx              # shadcn/ui Card
│   │   ├── input.jsx / label.jsx / popover.jsx / tooltip.jsx / skeleton.jsx
│   │   ├── modern-button.jsx     # Gradient CTA buttons
│   │   ├── modern-card.jsx       # Elevated card variants
│   │   ├── enhanced-input.jsx    # Input with icons + error state
│   │   ├── enhanced-select.jsx   # Custom styled select
│   │   ├── enhanced-checkbox.jsx
│   │   ├── DatePicker.jsx        # Calendar date picker
│   │   ├── MonthPicker.jsx       # Month/year picker
│   │   ├── stat-card.jsx         # Dashboard KPI card
│   │   ├── quick-action-card.jsx
│   │   ├── time-range-dropdown.jsx
│   │   ├── toaster-custom.jsx    # Toast notification system
│   │   └── PasswordStrengthBar.jsx
│   │
│   ├── skeletons/                # Loading skeleton screens
│   ├── loading/                  # Full-page loading states
│   ├── dash/                     # Dashboard-specific sub-components
│   ├── hero-graphics/            # Landing page SVG / animated graphics
│   │
│   ├── Calendar.jsx              # Monthly calendar grid
│   ├── DayCell.jsx               # Single calendar cell
│   ├── MultiServiceDayCell.jsx   # Calendar cell with multiple services
│   ├── DayServicesModal.jsx      # Modal for marking services on a day
│   ├── DailyTracker.jsx          # Per-service daily tracking view
│   ├── ServiceDateTable.jsx      # Table view of service dates
│   ├── StatsCards.jsx            # Dashboard summary cards
│   ├── SummaryCard.jsx           # Bill summary card
│   ├── PayBillModal.jsx          # Mark bill as paid modal
│   ├── DeleteBillModal.jsx       # Delete bill confirmation modal
│   ├── ClientDetailsModal.jsx    # Provider service client info modal
│   ├── ServiceExpiryBanner.jsx   # Banner for expiring services
│   ├── TopBar.jsx                # Page-level top bar
│   ├── PageWrapper.jsx           # Consistent page padding wrapper
│   ├── GoogleSignInButton.jsx    # Google OAuth button
│   ├── AuthCard.jsx              # Auth form card shell
│   ├── AuthSidePanel.jsx         # Auth page decorative side panel
│   └── ErrorBoundaryWrapper.tsx  # React error boundary
│
├── hooks/
│   ├── useUser.js                # Authenticated user + profile state
│   ├── useTimezone.js            # User timezone preference
│   ├── useNotifications.js       # Realtime in-app notifications
│   └── usePageReady.js           # Page hydration readiness flag
│
├── services/
│   ├── api.js                    # Axios instance + all FastAPI endpoint wrappers
│   ├── authService.js            # Supabase auth helpers (sign in, sign up, OAuth)
│   ├── chatService.js            # Chat + agent SSE stream handlers
│   ├── dataService.js            # Higher-level data fetch + transform layer
│   ├── aiSettingsService.js      # AI provider + model config API calls
│   ├── notificationService.js    # Notification read/dismiss API calls
│   └── profileService.js        # User profile update + avatar API calls
│
├── lib/
│   ├── supabase.js               # Supabase browser client singleton
│   ├── utils.js                  # cn() helper (clsx + tailwind-merge)
│   ├── timezone.js               # Timezone formatting utilities
│   ├── countries.js              # Country/currency lookup data
│   ├── suppressAbortErrors.js    # Silences AbortError in console
│   └── welcomeSession.js         # First-login welcome flow state
│
├── middleware.ts                 # Next.js edge middleware — auth + route protection
├── next.config.js                # Next.js config (images, SSR, react strict mode)
├── tailwind.config.js            # Tailwind + shadcn/ui CSS variable tokens
├── tsconfig.json                 # TypeScript config (strict, path aliases)
├── vercel.json                   # Vercel deployment config (region: sin1)
└── .env.example                  # Environment variable template
```

---

## Architecture

### App Router Pattern

Each route in `app/` follows the **Server Component shell + Client Component page** pattern:

```
app/dashboard/
├── page.tsx          # Server component — metadata, layout, passes props
└── (client logic)    # Delegates to components/pages/DashboardClient.tsx
```

This keeps server-side concerns (metadata, auth checks) separate from client-side state and interactivity.

### Authentication & Route Protection

Authentication is handled by **Next.js middleware** (`middleware.ts`) using `@supabase/ssr`:

- **Protected routes** — `/dashboard`, `/services`, `/calendar`, `/bills`, `/analytics`, `/chat`, `/settings`, `/setup`, `/support`, `/add-service` → redirect to `/login` if unauthenticated
- **Auth-only routes** — `/login`, `/signup` → redirect to `/dashboard` if already authenticated
- `/forgot-password` is intentionally unprotected so Google OAuth users can set a password

Session cookies are automatically refreshed on every request via the middleware.

### State Management

No global state library — state is managed through:

| Pattern | Used For |
|---|---|
| React `useState` / `useReducer` | Local component state |
| Custom hooks (`useUser`, `useTimezone`) | Shared auth + profile state |
| `useNotifications` | Supabase Realtime subscription |
| Prop drilling / callbacks | Cross-component communication |
| Supabase Auth listeners | Session change events |

### API Communication

All FastAPI calls go through `services/api.js` — an Axios instance with:
- Base URL from `NEXT_PUBLIC_API_BASE_URL`
- Request interceptor that attaches the Supabase JWT as `Authorization: Bearer <token>`
- Named export functions for every endpoint (e.g. `getBills()`, `generateBill()`, `markBillPaid()`)

AI chat and agent messages use **Server-Sent Events (SSE)** via `chatService.js` for streaming responses.

---

## Features

### Core App
- **Authentication** — Email/password sign-up, Google OAuth (SSO), forgot-password flow
- **Onboarding** — Two-step setup wizard (profile + AI config) for new users
- **Dashboard** — KPI cards, spend trend chart, active service summary, recent bills
- **Services** — Full CRUD for 5 service types with client details, expiry banners, and active/inactive toggle
- **Calendar** — Monthly multi-service grid, per-day delivery modal, per-service calendar view
- **Bills** — Auto-generated and manual bills, AI summaries, mark-as-paid, PDF export, delete
- **Analytics** — Monthly spend breakdown, per-service charts, YoY comparison, spend forecast
- **AI Chat** — Persistent conversations, model/reasoning selection, per-message token analytics, thumbs feedback, markdown rendering, export
- **AI Agent** — Floating intercom-style assistant, executes real actions (mark deliveries, update services, mark bills paid) with confirmation cards
- **Settings** — Profile editor, timezone + currency, notification preferences, AI provider configuration, password/email change, active sessions, account deletion

### AI & Chat
- **Providers:** OpenAI (GPT-4o, GPT-5.2), Anthropic (Claude 3.5 Sonnet), Google (Gemini 2.0 Flash, 2.5 Pro)
- **Reasoning support:** Configurable effort (`low` / `medium` / `high` / `xhigh`) for supported models
- **Streaming:** SSE-based streaming with real-time token rendering
- **Per-message analytics:** Token count, cost, model used, reasoning summary toggle
- **Alt+L:** Rephrase selected text in the chat input
- **@mentions:** `@service`, `@bill` autocomplete in chat

---

## Design System

### CSS Custom Properties

All theme tokens are defined in `globals.css` and consumed via Tailwind's `hsl(var(--token))` pattern (shadcn/ui convention):

| Token | Light value | Used for |
|---|---|---|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `222 47% 11%` | Primary text |
| `--primary` | `173 83% 25%` | Teal brand color (`#0F766E`) |
| `--muted` | `210 40% 96%` | Subtle backgrounds |
| `--border` | `214 32% 91%` | Dividers, input borders |
| `--radius` | `0.75rem` | Global border radius |

### Conventions

- **Cards:** `rounded-2xl shadow-lg` / `rounded-3xl` for hero cards
- **Inputs / Buttons:** `rounded-xl`
- **Hover:** `hover:-translate-y-0.5 transition-all duration-200`
- **Shadows:** `shadow-sm` (default), `shadow-lg shadow-black/5` (cards), `shadow-xl` (modals)
- **Typography:** Inter / Geist Sans via `font-sans`, `-tracking-tight` for headings
- **Dark text on teal:** `text-white` on `bg-teal-700` / `bg-[#0F766E]`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon public key |
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | FastAPI backend base URL |
| `NEXT_PUBLIC_BASE_PATH` | ❌ | Set only for GitHub Pages static export (e.g. `/YesBill`) |

All variables are prefixed `NEXT_PUBLIC_` — they are embedded in the client bundle and safe to expose in the browser (no secrets).

---

## Deployment

The app is deployed on **Vercel** (region: `sin1` — Singapore). Every push to `main` triggers an automatic deploy.

### Vercel (production)

```bash
# Vercel auto-deploys on push — or deploy manually:
npx vercel --prod
```

The `vercel.json` configures:
- Framework: `nextjs` (SSR fully enabled — no static export)
- Region: `sin1`
- CORS headers on `/api/*` routes

### Manual production build

```bash
npm run build    # Outputs to .next/
npm run start    # Serves .next/ on port 3000
```

### GitHub Pages (static export)

For static hosting, set `NEXT_PUBLIC_BASE_PATH=/YesBill` in the environment and uncomment `basePath` / `assetPrefix` in `next.config.js`. The `output: 'export'` flag is not set by default — add it only for the static export branch.

---

## Related

- [Backend README](../backend/README.md)
- [Docs Site README](../docs-site/README.md)
- [Frontend (Legacy Vite) README](../frontend/README.md)
- [Root README](../README.md)
