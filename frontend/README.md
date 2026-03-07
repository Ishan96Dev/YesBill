# YesBill Frontend (Legacy — Vite + React)

> **Note:** The primary active frontend is [`frontend-next/`](../frontend-next/) — a Next.js 14 App Router rewrite with full TypeScript and Vercel deployment. This Vite + React frontend is kept as a reference implementation.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-10-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://netlify.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](../LICENSE)

React + TypeScript frontend for YesBill — a household expense tracker with AI-powered bill analysis, multi-service management, and a conversational AI assistant.

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 18 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5.3 | Type safety |
| [Vite](https://vitejs.dev) | 5 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion) | 10 | Animations & transitions |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2.39 | Auth client + Realtime |
| [React Router](https://reactrouter.com) | 6 | Client-side routing |
| [Recharts](https://recharts.org) | 3.7 | Analytics charts |
| [Axios](https://axios-http.com) | 1.6 | HTTP client |
| [date-fns](https://date-fns.org) | 3.6 | Date utilities |
| [Lucide React](https://lucide.dev) | 0.307 | Icon library |
| [react-markdown](https://github.com/remarkjs/react-markdown) | 10 | AI response rendering |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | 0.14 | PDF export |
| [shadcn/ui](https://ui.shadcn.com) | — | Accessible component primitives |

---

## Quick Start

### Prerequisites

- Node.js 18+
- A running [YesBill backend](../backend/README.md) instance
- A [Supabase](https://supabase.com) project

### 1 — Install dependencies

```bash
cd frontend
npm install
```

### 2 — Configure environment

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3 — Start the dev server

```bash
npm run dev
```

App runs at **http://localhost:5173**

---

## Features

- **Authentication** — Email/password sign-up, Google OAuth (SSO), forgot-password flow
- **Onboarding wizard** — Two-step profile + AI configuration setup with skip support
- **Dashboard** — KPI cards for spend, active services, pending bills
- **Services** — Five service types (Home Delivery, Visit-based, Utility, Subscription, Payment) with full CRUD
- **Calendar** — Monthly, weekly, per-service, and yearly tracking views with one-tap status updates
- **Bills** — Auto-generated bills, AI summaries, mark-as-paid modal, PDF/CSV export
- **Ask AI** — Persistent chat with model/reasoning selection, per-message analytics, feedback buttons
- **AI Agent** — Floating Intercom-style assistant that can take actions in the app
- **Analytics** — Spend breakdown charts + AI token/cost usage dashboard
- **Settings** — Profile editor, notification preferences, security (password/email change, active sessions, account deletion)
- **Realtime notifications** — Supabase Realtime for live in-app notification delivery

---

## Project Structure

```
frontend/src/
├── components/
│   ├── ui/                   # shadcn/ui primitives (Button, Input, etc.)
│   ├── layout/               # Navbar, Sidebar, page wrappers
│   ├── chat/                 # Ask AI + AI Agent components
│   │   └── ConversationSidebar.jsx
│   └── ...                   # Feature-specific components
├── pages/
│   ├── auth/                 # Login, Signup, ForgotPassword
│   ├── Dashboard.jsx
│   ├── Services.jsx
│   ├── Calendar.jsx
│   ├── Bills.jsx
│   ├── Analytics.jsx
│   ├── AskAI.jsx
│   └── Settings.jsx
├── hooks/                    # Custom React hooks
├── services/                 # API client wrappers (Axios)
├── lib/
│   └── utils.ts              # cn() helper + shared utilities
├── styles/                   # Global CSS
├── App.jsx                   # Routes + providers
└── main.jsx                  # Entry point
```

---

## Design System

### Colors

| Token | Light | Dark |
|---|---|---|
| Background | `#FAFAFA` | `#020617` |
| Surface | `#FFFFFF` | `#0F172A` |
| Primary | `#4F46E5` | `#6366F1` |
| Text primary | `#0F172A` | `#F8FAFC` |
| Text secondary | `#64748B` | `#94A3B8` |
| Border | `#E5E7EB` | `#1E293B` |

### Key UI conventions

- Border radius: `rounded-2xl` for cards, `rounded-xl` for inputs/buttons
- Shadows: `shadow-lg shadow-black/5` (cards), `shadow-2xl` (modals)
- Hover: `hover:-translate-y-1 hover:shadow-xl transition-all duration-300`
- Focus: `focus:ring-2 focus:ring-primary`
- Typography: Inter / Geist Sans, `font-sans`, `-tracking-tight` for headings

---

## Available Scripts

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + production build → dist/
npm run preview    # Preview the production build locally
npm run lint       # ESLint
npm run format     # Prettier (src/**/*.{ts,tsx,css})
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

---

## Deployment

The frontend is deployed on **Netlify** with SPA redirect rules configured in `netlify.toml`. Every push to `main` triggers an automatic deploy.

```bash
# Manual production build
npm run build
# Output → dist/ — deploy this directory to any static host
```

---

## Related

- [Frontend Next.js README](../frontend-next/README.md)
- [Backend README](../backend/README.md)
- [Docs Site README](../docs-site/README.md)
- [Root README](../README.md)

