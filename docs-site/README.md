# YesBill Docs

[![Built with Docusaurus](https://img.shields.io/badge/Built%20with-Docusaurus%203.7-3ECC5F?style=flat-square&logo=docusaurus&logoColor=white)](https://docusaurus.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MDX](https://img.shields.io/badge/MDX-Supported-F9AC00?style=flat-square&logo=mdx&logoColor=white)](https://mdxjs.com)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](../LICENSE)

Official documentation site for [YesBill](https://yesbill.app) — built with [Docusaurus 3](https://docusaurus.io) with local full-text search.

---

## Overview

The docs site covers everything a user needs to get started with and master YesBill:

| Section | Description |
|---|---|
| **Getting Started** | Account creation, onboarding, first service |
| **Services** | All 5 service types with setup guides |
| **Calendar** | Daily, weekly, monthly, yearly tracking |
| **Bills** | Auto-generation, payment, export |
| **AI Features** | Ask AI, AI Agent, bill summaries, configuration |
| **Settings** | Profile, notifications, security |
| **Release Notes** | Full changelog with screenshots |
| **Roadmap** | Planned features and upcoming work |

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [Docusaurus](https://docusaurus.io) | 3.7.0 | Static site framework |
| [React](https://react.dev) | 18 | Component rendering |
| [MDX](https://mdxjs.com) | 3 | Markdown + JSX content |
| [docusaurus-lunr-search](https://github.com/praveenn77/docusaurus-lunr-search) | 3.6 | Local full-text search |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start local dev server (port 3001)
npm start

# Build for production
npm run build

# Serve the production build locally
npm run serve
```

The dev server runs at **http://localhost:3001**.

---

## Project Structure

```
docs-site/
├── docs/                         # All documentation content
│   ├── intro.md                  # Welcome / overview page
│   ├── getting-started/
│   │   ├── creating-account.md
│   │   ├── onboarding.md
│   │   └── first-service.md
│   ├── services/
│   │   ├── overview.md
│   │   ├── home-delivery.md
│   │   ├── visit-based.md
│   │   ├── utility-services.md
│   │   ├── subscriptions.md
│   │   └── payments.md
│   ├── calendar/
│   │   ├── overview.md
│   │   ├── daily-tracking.md
│   │   └── yearly-view.md
│   ├── bills/
│   │   ├── understanding-bills.md
│   │   ├── auto-generation.md
│   │   ├── marking-paid.md
│   │   └── bill-history.md
│   ├── ai-features/
│   │   ├── overview.md
│   │   ├── ask-ai.md
│   │   ├── agent-chatbot.md
│   │   ├── ai-bill-generation.md
│   │   └── ai-configuration.md
│   ├── settings/
│   │   ├── profile.md
│   │   ├── notifications.md
│   │   ├── security.md
│   │   └── ai-configuration.md
│   ├── changelog/
│   │   └── v1.0.0.md             # Full release notes with screenshots
│   └── roadmap.md
├── static/
│   └── img/
│       └── screenshots/          # 75+ app screenshots referenced in docs
├── src/
│   ├── components/               # Custom React components
│   ├── css/custom.css            # Theme overrides
│   └── pages/                    # Custom standalone pages
├── docusaurus.config.js          # Site configuration
├── sidebars.js                   # Sidebar navigation structure
└── package.json
```

---

## Adding Content

### New doc page

Create a `.md` or `.mdx` file in the appropriate `docs/` subdirectory:

```md
---
id: my-page
title: My Page Title
sidebar_position: 3
---

# My Page Title

Content goes here.
```

Then register it in `sidebars.js`:

```js
items: ['category/my-page'],
```

### Adding screenshots

1. Place the screenshot in `static/img/screenshots/`.
2. Reference it in any doc:

```md
![Alt text](/img/screenshots/My-Screenshot-01.png)
```

---

## Configuration

Key settings are in `docusaurus.config.js`:

| Setting | Value |
|---|---|
| Site URL | `https://yesbill.app` |
| Dev port | `3001` |
| Search | Local (lunr) — no Algolia required |
| Theme | Classic with custom CSS |

---

## Deployment

The docs site is built as a static output and can be deployed to any static host (Netlify, Vercel, GitHub Pages):

```bash
npm run build
# Output → build/
```

---

## Related

- [Frontend README](../frontend/README.md)
- [Backend README](../backend/README.md)
- [Root README](../README.md)
<!-- last-deploy: 2026-03-03 06:12 -->
