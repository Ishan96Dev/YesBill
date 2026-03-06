# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Auto-generated docs index for keyword search.
# To regenerate: python scripts/rebuild_docs_index.py

from __future__ import annotations
import re
from typing import Optional

_STOPWORDS = frozenset({
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'for',
    'on', 'at', 'with', 'and', 'or', 'not', 'my', 'i', 'you', 'your', 'can',
    'how', 'what', 'when', 'where', 'do', 'does', 'did', 'have', 'has', 'had',
    'be', 'been', 'by', 'it', 'this', 'that', 'from', 'as', 'about', 'if',
    'will', 'would', 'should', 'could', 'may', 'might', 'all', 'any', 'also',
    'just', 'so', 'up', 'out', 'use', 'using', 'used', 'see', 'go', 'get',
    'set', 'into', 'its', 'than', 'then', 'there', 'their', 'them', 'they', 'us', 'we',
})

DOCS_INDEX: list[dict] = [
    {
        "id": "ai-features/agent-chatbot.md",
        "title": "AI Agent Assistant",
        "section": "Ai Features",
        "content": """---
id: agent-chatbot
title: AI Agent Assistant
sidebar_position: 3
---

# AI Agent Assistant

The AI Agent is a floating chat assistant (similar to Intercom) that lives in the bottom-right corner of every page. It can answer questions AND take actions on your behalf.

## Opening the Agent

![AI agent toggle button](/img/screenshots/Intercom-Agentic-AI-Toogle-Chat-01.png)

Click the **indigo chat bubble** (🟣) in the bottom-right corner of any page to open the Agent panel.

## Chatting with the Agent

![AI agent chat interface](/img/screenshots/Intercom-Agentic-AI-Chat-01.png)

Type your question or command in the chat input. The Agent understands natural language and responds instantly.

## What the Agent Can Do

### Answer Questions
- "What services do I have?"
- "How much is my total bill this month?"
- "Is my internet marked active for February?"

### Take Actions (with Confirmation)

![AI agent action confirmation](/img/screenshots/Intercom-Agentic-AI-Chat-02.png)

- "Mark today's milk as delivered"
- "Mark yesterday's tiffin as skipped"
- "Add ₹80 to my milk daily rate"

When the Agent wants to take an action, it shows a **confirmation card**:

```
Agent: I'll mark today's milk delivery as Delivered.

[✅ Confirm]  [❌ Cancel]
```

You must confirm before any changes are made.

## Conversation History

![AI agent conversation history](/img/screenshots/Intercom-Agentic-AI-Chat-03.png)

Click the **history icon** (🕐) in the Agent panel to see past conversations. Each conversation is automatically titled based on its content.

## Agent Thinking Mode

![AI agent extended thinking](/img/screenshots/Intercom-Agentic-AI-Chat-Thinking-01.png)

When you ask the Agent a complex question (e.g. "Which service cost me the most across all of last year?"), it may enter **Thinking Mode**. You'll see a reasoning indicator while the Agent works through the problem. This produces more accurate, context-aware answers but takes a few extra seconds.

## Agent Analytics

![AI agent analytics panel](/img/screenshots/Intercom-Agentic-AI-Chat-Analytics-01.png)

Each Agent response has a small 📊 **Analytics** icon. Click it to see token usage and estimated cost for that specific message — useful if you're monitoring your AI provider spend.

## How It Differs from Ask AI

| Feature | Ask AI | Agent |
|---------|--------|-------|
| Chat interface | Full page | Floating popup |
| History | Full panel | Recent sessions |
| Actions | No | Yes, with confirmation |
| Best for | Deep analysis | Quick tasks while browsing |

:::note
The Agent is powered by the same AI provider you've configured. If AI is not set up, the Agent will prompt you to configure it.
:::
""",
    },
    {
        "id": "ai-features/ai-bill-generation.md",
        "title": "AI Bill Summaries",
        "section": "Ai Features",
        "content": """---
id: ai-bill-generation
title: AI Bill Summaries
sidebar_position: 4
---

# AI Bill Summaries

YesBill can generate a plain-English AI summary for each bill, explaining the charges in a human-readable way.

## What's in a Summary?

A typical AI bill summary includes:
- Total amount and breakdown
- Number of days delivered/visited
- Notable patterns (e.g. "3 days were skipped mid-month")
- Comparison to previous months (if available)
- Any anomalies or observations

## Generating a Summary

1. Go to **Bills**
2. Click on a bill to open it
3. Click **Generate AI Summary**
4. Wait 3–5 seconds for the summary to appear

![AI bill summary card](/img/screenshots/AI-Bill-Summary-01.png)

The summary appears as a card inside the bill, written in plain English. It covers the total charged, notable patterns (e.g. missed days), and a comparison to the previous month where data is available.

## Example Summary

> **Morning Milk — January 2026**
>
> Your milk was delivered on 27 out of 31 days in January, totalling ₹1,512. The 4 missed days were on 2nd, 14th, 15th, and 28th January. This is slightly lower than your December delivery count of 29 days. Total charge: ₹56/day × 27 days = **₹1,512**.

## Regenerating a Summary

AI summaries are stored with the bill. To refresh:
1. Open the bill
2. Click **Regenerate Summary**
3. A new summary is generated using the latest tracking data

## Cost

Each summary uses a small number of AI tokens (~500–1000 tokens depending on bill complexity). You can monitor your AI usage in **Analytics → AI Usage**.

:::tip
Generate summaries for your top 3 most expensive services each month. It takes less than a minute and gives you a clear picture of where your money is going.
:::
""",
    },
    {
        "id": "ai-features/ai-configuration.md",
        "title": "AI Configuration",
        "section": "Ai Features",
        "content": """---
id: ai-configuration
title: AI Configuration
sidebar_position: 5
---

# Configuring Your AI Provider

YesBill supports three AI providers. You need an API key from at least one provider to use AI features.

## Supported Providers

| Provider | Models Available | Best For |
|----------|-----------------|---------|
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4.1 | Speed and reliability |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Haiku | Detailed analysis |
| **Google** | Gemini 2.0 Flash, Gemini 1.5 Pro | Budget-friendly |

## Getting an API Key

### OpenAI
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** → **Create new secret key**
4. Copy the key (starts with `sk-...`)

### Anthropic
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key

### Google Gemini
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key**
3. Copy the key

## Adding Your Key to YesBill

![AI Configuration overview in Settings](/img/screenshots/Settings-AI-Configuration-01.png)

Go to **Settings → AI Configuration** to see the full configuration panel. From here you can manage providers, models, reasoning settings, and AI insights.

### Step 1 — Choose a Provider

![Choose AI provider](/img/screenshots/AI-Configuration-Choose-Provider-01.png)

Select your preferred AI provider by clicking its tab (OpenAI, Anthropic, or Google). Then paste your API key into the field provided and click **Validate** to verify it works.

1. Go to **Settings → AI Configuration**
2. Select your provider tab
3. Paste your API key
4. Click **Validate** to test the key
5. Click **Save**

### Step 2 — Select a Default Model

![Model selection in AI Configuration](/img/screenshots/AI-Configuration-Model-Selection-01.png)

After adding your API key, choose the **default model** you want YesBill to use for all AI features. The available models update automatically based on your validated provider.

:::tip
Start with **OpenAI GPT-4o Mini** or **Google Gemini 2.0 Flash** for low-cost usage while you're getting started.
:::

### Step 3 — Set Default Reasoning Effort

![Default reasoning effort setting](/img/screenshots/AI-Configuration-Default-Reasoning-efforts-01.png)

For models that support extended thinking (like Claude 3.7 Sonnet or o3-mini), you can set the **default reasoning effort**:

| Level | Behaviour | Best For |
|-------|-----------|---------|
| **Low** | Fast, minimal reasoning | Quick bill lookups |
| **Medium** | Balanced speed and depth | General Ask AI use |
| **High** | Deep reasoning, slower | Complex spending analysis |

Choose **Medium** as a sensible default for most households.

### Step 4 — Enable or Disable AI Insights

![Enable/disable AI insights toggle](/img/screenshots/AI-Configuration-Enable-Disable-AI-Insight-01.png)

The **AI Insights** toggle controls whether YesBill automatically surfaces AI-generated insights on your Dashboard and Bills pages (e.g. "Your milk spend increased 12% this month"). Toggle it off if you prefer a cleaner interface or want to reduce AI API usage.

## Multiple Providers

You can add keys for all three providers and switch between them in **Ask AI** using the model selector. Each provider's key is stored separately and securely.

## Security

Your API keys are stored only in your browser session and sent directly to the AI provider. YesBill never stores, logs, or shares your API keys on any server or database. Your keys remain private and under your control at all times.

## Removing a Key

1. Go to **Settings → AI Configuration**
2. Click **Remove** next to the provider
3. Confirm the removal

After removing all keys, AI features will be disabled until you add a new key.
""",
    },
    {
        "id": "ai-features/analytics.md",
        "title": "Analytics & AI Usage",
        "section": "Ai Features",
        "content": """---
id: analytics
title: Analytics & AI Usage
sidebar_position: 5
---

# Analytics

YesBill's Analytics section gives you a visual overview of your spending trends and AI usage.

## Spending Analytics

![Analytics dashboard](/img/screenshots/Analytics-01.png)

The Analytics page shows your household spending broken down by service and month. You can use this to:

- See total spend across all services for any given month
- Compare month-over-month spending trends
- Identify your most expensive services at a glance
- Spot months where spending was unusually high or low

### Accessing Analytics

1. Click **Analytics** in the sidebar
2. The default view shows the current month with a chart of service-wise spend
3. Use the month/year selector to browse historical data

### Charts Available

| Chart | What It Shows |
|-------|---------------|
| **Monthly Total** | Total spend across all services per month |
| **By Service** | Breakdown of costs per individual service |
| **By Type** | Grouped spend by service type (Home Delivery, Utility, etc.) |
| **Trend Line** | 6-month rolling average of your household spend |

---

## AI Usage Analytics

![AI usage analytics](/img/screenshots/Analytics-AI-Usage-01.png)

The **AI Usage** tab within Analytics tracks your AI API consumption across all AI-powered features in YesBill.

### What's Tracked

- **Total tokens used** — Combined prompt + completion tokens
- **Estimated cost** — Based on your AI provider's pricing
- **Usage by feature** — Ask AI chat, Agent, Bill Summaries
- **Usage by model** — Breakdown per AI model used
- **Daily/Monthly trends** — See when you use AI the most

### How to Monitor Costs

1. Go to **Analytics** → **AI Usage** tab
2. Review the total tokens and estimated cost for the current month
3. Use the model breakdown to see if a cheaper model can handle your queries

:::tip
If AI costs are higher than expected, switch to a smaller model (e.g. **GPT-4o Mini** or **Gemini 2.0 Flash**) for routine Ask AI queries, and save the larger models for complex bill analysis.
:::

:::note
Cost estimates are approximate and based on public pricing for each AI provider. Actual charges may vary. Always check your AI provider's billing dashboard for exact costs.
:::
""",
    },
    {
        "id": "ai-features/ask-ai.md",
        "title": "Ask AI Chat",
        "section": "Ai Features",
        "content": """---
id: ask-ai
title: Ask AI Chat
sidebar_position: 2
---

# Ask AI

Ask AI is a persistent chat interface where you can have conversations about your bills, services, and spending patterns in plain English.

## Opening Ask AI

![Ask AI chat interface](/img/screenshots/Ask-AI-01.png)

1. Click **Ask AI** in the sidebar
2. Type your question in the chat input
3. Press Enter or click **Send**

## Asking Questions

![Ask AI conversation in action](/img/screenshots/Ask-AI-02.png)

Ask AI understands natural language. Simply type as you would to a person.

### Bill Queries

- "How much did I spend on all services in February?"
- "What's my total milk bill for this year?"
- "Did I pay the internet bill in December?"

### Service Tracking

- "How many days was the tiffin delivered in January?"
- "Did the maid miss any days last week?"
- "Which services are currently active?"

### Spending Analysis

- "What's my most expensive service?"
- "How has my monthly spend changed over the last 6 months?"
- "Break down my household expenses by category"

### General Help

- "How do I add a new service?"
- "What's the difference between Visit-based and Home Delivery?"

---

## Chat Options & Conversations

![Ask AI conversation panel with options](/img/screenshots/Ask-AI-Chat-Conversation-and-Options-01.png)

Each conversation is saved automatically. The left panel shows your conversation history — click any past conversation to resume it.

![Ask AI conversation options menu](/img/screenshots/Ask-AI-Chat-Conversation-and-Options-02.png)

Right-click or hover over a conversation in the history list to access options: **Rename** or **Delete** a conversation.

---

## Per-Message Features

![Ask AI per-message action buttons](/img/screenshots/Ask-AI-Chat-Features-Analytics-Feedback-Response-Copy-Response-Buttons-01.png)

Each AI response has a set of action buttons below it:

| Button | What It Does |
|--------|-------------|
| 📊 **Analytics** | Shows token usage and cost for that specific message |
| 👍 / 👎 **Feedback** | Rate the response quality (helps improve the AI) |
| 📋 **Copy** | Copy the full response text to your clipboard |

---

## Model Selection

![Ask AI model selection dropdown](/img/screenshots/Ask-AI-Model-Selection-Options-01.png)

Use the **model selector** above the chat input to choose which AI model handles your query. Available models are based on which API keys you've configured:

- **OpenAI** — GPT-4o, GPT-4o Mini, GPT-4.1
- **Anthropic** — Claude 3.7 Sonnet, Claude 3.5 Haiku
- **Google** — Gemini 2.0 Flash, Gemini 1.5 Pro

Switch models freely between messages — each conversation remembers which model was used for each response.

---

## Reasoning Effort

![Ask AI reasoning selector](/img/screenshots/Ask-AI-Reasoning-Selector-options-01.png)

For models that support extended thinking (Claude 3.7 Sonnet, o3-mini), a **Reasoning** selector appears next to the model picker:

| Level | Speed | Depth | Use When |
|-------|-------|-------|---------|
| **Low** | Fastest | Surface | Quick factual lookups |
| **Medium** | Balanced | Standard | Most everyday questions |
| **High** | Slowest | Deep | Complex multi-month analysis |

---

## Token Usage & Thinking Analytics

![Ask AI analytics panel](/img/screenshots/Ask-AI-Analytics-01.png)

Click the 📊 icon on any message to open the **Analytics** panel showing:

- Model used and provider
- Prompt tokens and completion tokens
- Estimated cost for that query

![Ask AI analytics with thinking details](/img/screenshots/Ask-AI-Analytics-Thinking-01.png)

When using a reasoning model (High effort), the analytics panel also shows the **thinking token count** — the internal reasoning steps the model performed before responding. Thinking tokens consume more budget but produce more accurate, nuanced answers.

:::tip
Ask AI has access to all your YesBill data — services, tracking history, bills, and payments. The more data you've entered, the better the answers.
:::
""",
    },
    {
        "id": "ai-features/overview.md",
        "title": "AI Features Overview",
        "section": "Ai Features",
        "content": """---
id: overview
title: AI Features Overview
sidebar_position: 1
---

# AI Features

YesBill includes AI-powered features that help you understand your bills, manage services with natural language, and get insights about your spending.

## Available AI Features

### 🗣️ Ask AI
A chat interface where you can ask questions about your bills and services in plain English (or Hindi!).

Examples:
- "How much did I spend on household services in January?"
- "Did the maid come every day last week?"
- "Which service costs the most each month?"

→ [Learn more about Ask AI](/ai-features/ask-ai)

---

### 🤖 AI Agent (Floating Assistant)
An Intercom-style floating chat button that lets you manage services with natural language commands.

Examples:
- "Mark today's milk as delivered"
- "Mark yesterday's tiffin as skipped"
- "What services do I have?"

The Agent performs actions after your confirmation — no accidental changes.

→ [Learn more about the Agent](/ai-features/agent-chatbot)

---

### 📝 AI Bill Summaries
After bills are generated, AI can write a plain-English summary of each bill explaining the charges.

→ [Learn more about AI Bill Generation](/ai-features/ai-bill-generation)

---

## Requirements

All AI features require an API key from at least one provider:

| Provider | Where to Get Key |
|----------|----------------|
| OpenAI | [platform.openai.com](https://platform.openai.com) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) |

→ [Set up your AI provider](/ai-features/ai-configuration)

:::note
You pay your AI provider directly based on usage. YesBill does not charge extra for AI features.
:::
""",
    },
    {
        "id": "bills/auto-generation.md",
        "title": "Auto Bill Generation",
        "section": "Bills",
        "content": """---
id: auto-generation
title: Auto Bill Generation
sidebar_position: 2
---

# Auto Bill Generation

YesBill automatically generates bills at the end of each month so you don't have to calculate anything manually.

## When Are Bills Generated?

Bills are generated automatically:
- **On the 1st of each month** — for all services from the previous month
- **Via the backend cron job** — runs daily at midnight and checks for any missing bills

You can also manually trigger generation from the Bills page.

## Bill Generation Email

![Auto-generated bill notification email](/img/screenshots/Auto-Generated-Bill-Mail-01.png)

When YesBill generates a new bill, it sends you an email notification summarising the bill amount, the service it applies to, and the billing period. Click the link in the email to open the full bill directly. Make sure **Bill Generated** notifications are enabled in **Settings → Notifications**.

## How Generation Works

1. YesBill looks at your tracking data for the month
2. For day-tracked services: counts Delivered/Visited days
3. For utility services: checks if Active or Inactive
4. For fixed services: uses the configured monthly price
5. Creates a bill record with the calculated amount
6. If AI is configured, the AI generates a summary (optional)

## Manual Generation

To generate a bill immediately:
1. Go to **Bills**
2. Click **Generate Bills** (top right)
3. Select the month/year
4. Click **Generate**

## What If Data Is Missing?

If you forgot to mark some days:
- Those days remain **Pending** and are excluded from the bill
- You can still go back and mark them — then regenerate the bill
- Use **Ask AI** to ask "Did I miss any days in January?" to find gaps

## Regenerating Bills

If you mark more days after a bill is generated, you can regenerate:
1. Open the bill
2. Click **Regenerate**
3. The bill total is recalculated with updated data

:::warning
Regenerating a bill will overwrite the existing total. If you've already marked the bill as Paid, be careful before regenerating.
:::
""",
    },
    {
        "id": "bills/bill-history.md",
        "title": "Bill History",
        "section": "Bills",
        "content": """---
id: bill-history
title: Bill History
sidebar_position: 4
---

# Bill History

YesBill keeps a full history of all your bills so you can look back at any month's expenses.

## Browsing History

![Previous bills screen](/img/screenshots/Previous-bills-01.png)

1. Go to **Bills** in the sidebar
2. Use the **month/year** selector at the top to navigate to past months
3. All bills for that month are listed below

Each past bill card shows the service name, billing period, total amount, and paid/unpaid status.

## Filtering Bills

Use the filters to narrow down:
- **By status**: Paid / Unpaid / All
- **By service**: Show bills for a specific service only
- **By type**: Filter by service type (Home Delivery, Subscription, etc.)

## Bill Detail View

Click any bill to see the full breakdown:
- Line items for each day (for tracked services)
- AI-generated summary (if available)
- Payment details (method, note, date paid)
- Bill generation timestamp

## Export & Download

![Export bill as PDF or CSV](/img/screenshots/Bill-Download-as-PDF-Export-CSV-01.png)

You can download any bill as a **PDF** or **CSV** file directly from the bill detail view.

### How to Export

1. Open any bill from the Bills page
2. Click the **Download** or **Export** button (top right of the bill)
3. Choose your format:
   - **PDF** — formatted bill document, ready to share with your vendor or accountant
   - **CSV** — raw data export, useful for importing into spreadsheets
4. The file downloads to your device automatically

:::tip
Use PDF exports to settle disputes with vendors — it includes a timestamped breakdown of every tracked day.
:::

## Tips

- Use **Ask AI** to query history in plain English:
  - "How much did I spend on tiffin in November?"
  - "Which months did I pay my internet bill late?"
  - "Total household spend in Q1 2026?"
- The **Analytics** dashboard shows monthly spend trends as charts

## Data Retention

All bill data is stored indefinitely in your Supabase account. Your history is available as long as your account exists.
""",
    },
    {
        "id": "bills/marking-paid.md",
        "title": "Marking Bills as Paid",
        "section": "Bills",
        "content": """---
id: marking-paid
title: Marking Bills as Paid
sidebar_position: 3
---

# Marking Bills as Paid

Once you've paid a service for the month, record it in YesBill to keep your records clean.

## How to Mark a Bill as Paid

### From the Bills Page

1. Go to **Bills** in the sidebar
2. Find the bill you've paid
3. Click **Mark as Paid**
4. A modal opens:

![Mark as paid modal](/img/screenshots/Mark-as-paid-modal-01.png)

   - Select your **payment method**
   - Optionally add a **payment note** (e.g. UPI transaction ID)
5. Click **Confirm**

### Paid Bill Status

![Bill marked as paid status](/img/screenshots/Bill-Paid-status-(Mark-as-paid)-01.png)

Once confirmed, the bill card updates to show a green **Paid** badge along with the payment method and the date you recorded the payment.

### From the Calendar
1. Open the Service Calendar for a subscription/payment service
2. Click the billing day cell
3. Click **Mark Paid** in the popup

## Payment Methods

You can record how you paid:

| Method | Examples |
|--------|---------|
| **Cash** | Hand-to-hand cash payment |
| **UPI** | GPay, PhonePe, Paytm, BHIM |
| **Bank Transfer** | NEFT, RTGS, IMPS |
| **Cheque** | Cheque payment |
| **Card** | Debit/credit card |
| **Auto-debit** | Bank auto-debit or SI |

## Undoing a Payment

To unmark a bill as paid:
1. Open the bill
2. Click **Undo Payment** (shown when bill is marked Paid)
3. Confirm the action

## Payment History

All payment records are stored permanently. You can:
- Filter bills by "Paid" or "Unpaid" status
- See payment method and notes on each bill
- Use **Ask AI** to query payment history ("Did I pay the internet bill in December?")
""",
    },
    {
        "id": "bills/understanding-bills.md",
        "title": "Understanding Bills",
        "section": "Bills",
        "content": """---
id: understanding-bills
title: Understanding Bills
sidebar_position: 1
---

# Understanding Bills

A **bill** in YesBill is a monthly summary of what you owe for a specific service. Bills are generated automatically at the end of each month based on your tracking data.

## What's in a Bill?

Each bill contains:

- **Service name** and type
- **Billing period** (e.g. January 2026)
- **Line items** — each tracked day or charge
- **Total amount** in ₹
- **Payment status** — Paid or Unpaid
- **AI Summary** (if AI is configured) — a plain-English description of the charges

## Bill Structure by Service Type

| Service Type | Bill Items | Total Calculation |
|-------------|-----------|-------------------|
| Home Delivery | Days marked Delivered | Count × Daily Rate |
| Visit-based | Days marked Visited | Count × Daily Rate |
| Utility | Active/Inactive for month | Monthly Rate or ₹0 |
| Subscription | Fixed monthly charge | Monthly Rate |
| Payment | Fixed EMI/due amount | Monthly Rate |

## Where to Find Bills

![Bills screen](/img/screenshots/Bill-Screen-01.png)

1. Go to **Bills** in the sidebar
2. Use the month/year selector to browse bills by period
3. Click any bill to see the full breakdown

## Generated Bill Details

![Generated bill detail view](/img/screenshots/Generated-bill-01.png)

Clicking into an individual bill shows the full breakdown: each line item, the daily rate or fixed charge, and the total amount. If AI is configured, you can generate a plain-English summary directly from this screen.

## Bill with AI Summary

![Bill with AI-generated summary](/img/screenshots/Generated-AI-Bill-01.png)

When an AI summary has been generated for a bill, it appears as a highlighted card at the top of the bill detail view — giving you an at-a-glance plain-English explanation of all charges before diving into the line items.

## Bill Status

- **Unpaid** 🔴 — Bill has been generated but not yet paid
- **Paid** 🟢 — You've recorded payment for this bill

## AI Bill Summary

If you have AI configured, each bill can have an AI-generated summary that explains:
- What was charged and why
- Unusual months (e.g. "Only 18 days delivered — 3 days missed")
- Total spend in plain language

Click **Generate Summary** on any bill to create one.
""",
    },
    {
        "id": "calendar/daily-tracking.md",
        "title": "Daily Tracking",
        "section": "Calendar",
        "content": """---
id: daily-tracking
title: Daily Tracking
sidebar_position: 2
---

# Daily Tracking

Daily tracking is the core activity in YesBill. You spend a few seconds each day marking your service statuses.

## How to Mark a Day

### From the Calendar View

![Date marking modal](/img/screenshots/Calender-Date-Modal-01.png)

1. Navigate to the current month using the Calendar in the sidebar
2. Find the row for your service (e.g. "Morning Milk")
3. Click the day cell — a date modal opens
4. Select **Delivered** or **Skipped** (for home delivery) / **Visited** or **Missed** (for visit-based)
5. Click **Save** to confirm the status

### From the Service Calendar Page

![Daily tracking service calendar](/img/screenshots/Daily-Tracking-Service-Calender-01.png)

1. Click a service name to open its individual calendar
2. Click any day in the attendance grid
3. The day toggles between states with each click

## Tracking History

![Service calendar with tracking marks filled in](/img/screenshots/Daily-Service-Calender-with%20Tracking-Marks-01.png)

As you mark days throughout the month, the calendar fills in with colour-coded status indicators. Green cells are delivered/visited days, red cells are skipped/missed days, and grey cells are still pending. This filled-in view makes it easy to spot any gaps before the month ends.

## Status States

| Status | Colour | Meaning |
|--------|--------|---------|
| Pending | Grey | Not yet marked |
| Delivered / Visited | Green | Service happened |
| Skipped / Missed | Red | Service didn't happen |

:::note
**Pending** days are excluded from the bill calculation — only **Delivered/Visited** days count towards your bill.
:::

## Editing Past Days

You can mark or edit any day in the current and previous months. To go back further, navigate to the previous month using the arrow buttons.

## Bulk Marking

Coming soon: ability to mark multiple days at once (e.g. mark all Sundays as Skipped).

## Best Practices

- **Daily habit**: Mark yesterday's status when you sit down in the morning
- **Monthly habit**: Before month end, check for any Pending days and mark them
- **Don't worry about errors**: You can always click a marked day to change its status
""",
    },
    {
        "id": "calendar/overview.md",
        "title": "Calendar Overview",
        "section": "Calendar",
        "content": """---
id: overview
title: Calendar Overview
sidebar_position: 1
---

# Calendar

The Calendar is YesBill's primary tracking interface. It shows all your active services in a monthly grid and lets you mark each day's status.

![YesBill monthly calendar](/img/screenshots/Calender-01.png)

## Views

### Monthly Calendar View

The default view shows all services in a grid of days. Each service has a row, and each day has a status indicator:

- 🟢 **Delivered / Visited** — Service was received/provided
- 🔴 **Skipped / Missed** — Service did not happen
- ⬜ **Pending** — Not yet marked (default)
- 🔵 **Paid** — Bill is paid (for subscription/payment types)

![Monthly service calendar overview](/img/screenshots/Montly-Service-Calender-01.png)

### Weekly Calendar View

Switch to the **Weekly** tab to see a condensed 7-day view. This is useful for a quick check of the current week without the visual noise of the full month.

![Weekly service calendar view](/img/screenshots/Weekly-Service-Calender-01.png)

### Service Calendar (Per-Service View)

![Per-service calendar view](/img/screenshots/Service-Calender-01.png)

Click on any service name to open its dedicated calendar page with:

- Day-by-day attendance grid (for delivery/visit types)
- Monthly active toggle (for utility types)
- Billing day card with payment status (for subscription/payment types)
- **Yearly view** — 12-month paid grid overview

### Service Details Panel

![Calendar service details panel](/img/screenshots/Calender-Service-Details-01.png)

Within the service calendar, clicking a specific day or the service details section opens a **Service Details** panel that shows:

- Service name, type, and daily/monthly rate
- Current month's tracking summary (days delivered, days skipped, pending days)
- Total bill amount accrued so far this month
- A direct link to the full bill for this service

## Navigation

- Use the **← →** arrows to move between months
- Click **Today** to jump to the current month
- Use the **service filter** to show/hide specific services

## Tips

- Mark yesterday's status first thing in the morning — it takes 5 seconds
- Use the keyboard shortcut `D` for Delivered and `S` for Skipped (when a day is focused)
- The calendar remembers your scroll position when you navigate between months
""",
    },
    {
        "id": "calendar/yearly-view.md",
        "title": "Yearly View",
        "section": "Calendar",
        "content": """---
id: yearly-view
title: Yearly View
sidebar_position: 3
---

# Yearly View

The Yearly View gives you a 12-month snapshot of your bill payment history for a service.

## Accessing the Yearly View

1. Click any service name in the sidebar or Calendar view
2. On the Service Calendar page, click the **Yearly** tab at the top

## What You See

![Yearly service calendar view](/img/screenshots/Yearly-Service-Calender-01.png)

A grid of all 12 months with colour-coded payment status:

| Colour | Status |
|--------|--------|
| 🟢 Green | Bill paid |
| 🔴 Red | Bill unpaid or overdue |
| ⬜ Grey | No bill generated yet |

## Use Cases

- **EMI tracking**: Verify you haven't missed a single loan payment
- **Subscription review**: See which months a streaming service was paid
- **Annual audit**: Quickly spot any unpaid bills from the year
- **Expense history**: Get a bird's eye view of the year's spending

## Tips

- Click any month cell to jump to that month's bill detail
- The yearly view is especially useful for **Payment** and **Subscription** types where you want to verify payment continuity
""",
    },
    {
        "id": "changelog/v1.0.0.md",
        "title": "v1.0.0 — March 2026",
        "section": "Changelog",
        "content": """---
id: v1.0.0
title: v1.0.0 — March 2026
sidebar_position: 1
---

# v1.0.0 — March 2026

**YesBill v1.0.0** is the first stable release — a full-featured household expense tracker with AI-powered bill analysis, multi-service management, calendar-based daily tracking, and a conversational AI assistant. Everything you need to understand and control your monthly home expenses.

---

## Authentication & Sign-in

### Landing page & sign-up

The onboarding experience starts at the landing page, which introduces YesBill's key features before directing new users to sign up.

![Landing page](/img/screenshots/Landing-Page-01.png)

New users create an account with their email and password. A confirmation email is sent immediately to verify the address before the account is activated.

![Sign-up screen](/img/screenshots/Sign-up-01.png)

![Confirmation email](/img/screenshots/Confirm-Signup-Mail-01.png)

### Email & password login

Returning users sign in from the login screen with email and password.

![Login screen](/img/screenshots/Login-01.png)

### Google SSO

Sign in with a Google account using OAuth. No password required — your Google identity is linked to your YesBill profile automatically.

![SSO sign-in step 1](/img/screenshots/Login-Signin-using-SSO-01.png)

![SSO sign-in step 2](/img/screenshots/Login-Signin-using-SSO-02.png)

### Forgot password

A guided four-step reset flow: enter your email → receive the reset email → open the link → set a new password.

![Forgot password — enter email](/img/screenshots/Forget-Password-01.png)

![Forgot password — confirmation screen](/img/screenshots/Forget-Password-02.png)

![Password reset email](/img/screenshots/Forget-Password-email-01.png)

![Set new password](/img/screenshots/Forget-Password-Set-New-password-01.png)

---

## Onboarding

First-time users are walked through a two-step setup wizard before they reach the dashboard. Both steps can be skipped and completed later from Settings.

### Step 1 — Profile setup

Set your display name, avatar, cover image, and timezone so your bills and calendar are always in sync with your local time.

![Onboarding — profile setup](/img/screenshots/Onboard-Profile-01.png)

### Step 2 — AI configuration

Connect an AI provider (OpenAI, Anthropic, or Google Gemini) to unlock Ask AI, the AI Agent, and AI-powered bill summaries. You can skip this step and configure it later.

![Onboarding — AI configuration](/img/screenshots/Onboard-AI-Config-01.png)

### Skip modal

A confirmation dialog explains what you'll miss if you skip, making it easy to decide whether to set up now or later.

![Onboarding skip confirmation](/img/screenshots/Onboard-skip-modal-01.png)

---

## Dashboard

The dashboard is your home screen — a quick-glance summary of pending bills, active services, and overall monthly spend.

![Dashboard overview](/img/screenshots/Dashboard-01.png)

The updated dashboard layout adds prominent KPI cards for total spend, active services, pending dues, and bills this month, with quick-access navigation to the most important sections.

![Updated dashboard](/img/screenshots/Updated-Dashboard-01.png)

---

## Services

Services are the core of YesBill. Each service represents something you track and pay for every month.

### Service overview page

All your services are displayed as cards with their name, type, current amount, and quick-access controls.

![Services page](/img/screenshots/Service-page-01.png)

![Service card detail](/img/screenshots/Service-Card-01.png)

### Five service types

| Type | How it works |
|---|---|
| **Home Delivery** | Tracks daily deliveries — Delivered, Skipped, or Missed — and bills per unit delivered |
| **Visit-based** | Tracks visits by a person (e.g., maid, driver) — Visited or Skipped |
| **Utility** | Monthly active/inactive toggle for fixed-cost utilities (electricity, water, gas) |
| **Subscription** | Fixed monthly charge on a set billing day |
| **Payment** | Custom recurring payment on a fixed date |

### Adding a new service

A multi-step wizard guides you through creating any service type — name, icon, amount, billing day, and type-specific settings.

![Add service — step 1](/img/screenshots/Add-New-Service-01.png)

![Add service — step 2](/img/screenshots/Add-New-Service-02.png)

![Add service — step 3](/img/screenshots/Add-New-Service-03.png)

![Add service — step 4](/img/screenshots/Add-New-Service-04.png)

### Editing and managing services

Edit any service's details, or use the manage panel to reorder, pause, or delete services without affecting historical bill data.

![Edit service](/img/screenshots/Edit-Service-01.png)

![Manage services panel](/img/screenshots/Manage-Service-01.png)

---

## Calendar

The calendar is where you log daily activity for your services. It provides monthly, weekly, yearly, and per-service views.

### Main calendar (monthly view)

The default calendar shows all services across the current month in a compact grid. Each day displays the tracking status for every active service.

![Main calendar — monthly view](/img/screenshots/Calender-01.png)

### Per-service calendar

Each service has its own dedicated calendar page. Switch between month, week, and year views, and log status directly from any day cell.

![Per-service calendar](/img/screenshots/Service-Calender-01.png)

### Weekly view

The weekly view zooms into a 7-day window for fine-grained day-by-day tracking.

![Weekly calendar view](/img/screenshots/Weekly-Service-Calender-01.png)

### Monthly view (per-service)

A full-month grid view for a single service, showing all statuses side by side.

![Monthly per-service view](/img/screenshots/Montly-Service-Calender-01.png)

### Daily tracking

Tap any day to open the daily tracking panel. Each service shows its current status with one-tap buttons to change it.

![Daily tracking panel](/img/screenshots/Daily-Tracking-Service-Calender-01.png)

After marking selections, the calendar grid updates immediately to reflect the logged statuses.

![Daily tracking with marks filled](/img/screenshots/Daily-Service-Calender-with%20Tracking-Marks-01.png)

### Date detail modal

Click any date on the main calendar to see a combined summary of all service statuses for that day.

![Date detail modal](/img/screenshots/Calender-Date-Modal-01.png)

### Service details panel

The service details side panel appears when you tap a service name on the calendar. It shows the service's current settings, rates, and billing day.

![Service details panel](/img/screenshots/Calender-Service-Details-01.png)

### Yearly view

A 12-month summary grid showing payment activity across the full year. Useful for spotting gaps and verifying consistency.

![Yearly calendar view](/img/screenshots/Yearly-Service-Calender-01.png)

---

## Bills

Bills are auto-generated every month based on your logged calendar activity and service settings. Every bill is detailed, trackable, and exportable.

### Bill overview screen

The Bills section lists all current-cycle bills with their amounts, services, and payment status.

![Bill overview](/img/screenshots/Bill-Screen-01.png)

### Auto-generated bills

Bills are generated automatically via a scheduled cron job at the start of each month. Each bill aggregates that month's tracked activity into a final amount.

![Generated bill detail](/img/screenshots/Generated-bill-01.png)

### Auto-bill notification email

When a new monthly bill is generated, you receive an email notification summarising the charges.

![Auto-bill email notification](/img/screenshots/Auto-Generated-Bill-Mail-01.png)

### AI-enhanced bill view

When AI is configured, each bill displays an AI-generated summary card that explains the charges in plain English and highlights any notable changes.

![AI bill summary card](/img/screenshots/AI-Bill-Summary-01.png)

![Generated AI bill view](/img/screenshots/Generated-AI-Bill-01.png)

### Mark as paid

Open the **Mark as Paid** modal on any bill to record the payment method (cash, UPI, bank transfer, etc.) and add optional notes.

![Mark as paid modal](/img/screenshots/Mark-as-paid-modal-01.png)

After confirming, the bill status updates to **Paid** with a visible confirmation badge.

![Bill paid status](/img/screenshots/Bill-Paid-status-(Mark-as-paid)-01.png)

### Bill history

All past bills are archived and searchable. Filter by month, service, or payment status.

![Previous bills history](/img/screenshots/Previous-bills-01.png)

### Export as PDF or CSV

Download any bill as a formatted PDF for records, or export to CSV for spreadsheet analysis.

![Export PDF / CSV](/img/screenshots/Bill-Download-as-PDF-Export-CSV-01.png)

---

## AI Features

YesBill includes three distinct AI experiences: a persistent chat assistant, a floating action agent, and AI-generated content embedded throughout the app.

### Ask AI — persistent chat

Ask AI is a full chat interface with persistent conversation history. Ask it anything about your bills, services, spending habits, or household finances.

![Ask AI overview](/img/screenshots/Ask-AI-01.png)

![Ask AI active conversation](/img/screenshots/Ask-AI-02.png)

### Conversation options & per-message features

Each message has contextual actions — copy the response, provide thumbs-up/down feedback, and view per-message token usage and cost.

![Conversation options](/img/screenshots/Ask-AI-Chat-Conversation-and-Options-01.png)

![Message action buttons](/img/screenshots/Ask-AI-Chat-Conversation-and-Options-02.png)

![Analytics, feedback, and copy buttons per message](/img/screenshots/Ask-AI-Chat-Features-Analytics-Feedback-Response-Copy-Response-Buttons-01.png)

### Model selection

Switch between all available models from your configured AI provider. Each model is listed with its display name so you can choose the right tool for your query.

![Model selection dropdown](/img/screenshots/Ask-AI-Model-Selection-Options-01.png)

### Reasoning model support

For providers and models that support extended reasoning (e.g., OpenAI o-series, Anthropic Claude, Gemini with thinking), select the reasoning effort level — **Low**, **Medium**, or **High** — to control depth and cost.

![Reasoning selector options](/img/screenshots/Ask-AI-Reasoning-Selector-options-01.png)

### Ask AI analytics

The analytics panel shows cumulative token usage and cost across your Ask AI conversations, broken down per message.

![Ask AI analytics panel](/img/screenshots/Ask-AI-Analytics-01.png)

When a reasoning model is in use, the analytics panel additionally shows thinking tokens and reasoning cost separately.

![Ask AI analytics with thinking tokens](/img/screenshots/Ask-AI-Analytics-Thinking-01.png)

---

### AI Agent — floating assistant

The AI Agent is a floating, Intercom-style chatbot widget that lives on every screen. It can take actions in the app — creating services, logging calendar entries, looking up bills — with a confirmation step before committing any change.

![AI Agent button toggle](/img/screenshots/Intercom-Agentic-AI-Toogle-Chat-01.png)

![AI Agent chat — open](/img/screenshots/Intercom-Agentic-AI-Chat-01.png)

![AI Agent with action confirmation](/img/screenshots/Intercom-Agentic-AI-Chat-02.png)

![AI Agent followup conversation](/img/screenshots/Intercom-Agentic-AI-Chat-03.png)

### Agent thinking mode

When a reasoning-capable model is selected for the Agent, a **Thinking** indicator shows while the model reasons through multi-step tasks.

![AI Agent thinking mode](/img/screenshots/Intercom-Agentic-AI-Chat-Thinking-01.png)

### Agent analytics

Token usage, reasoning tokens, cost, and latency for every Agent message are accessible from the analytics panel inside the Agent chat.

![AI Agent analytics](/img/screenshots/Intercom-Agentic-AI-Chat-Analytics-01.png)

---

## AI Configuration

AI settings are available both during onboarding and at any time from **Settings → AI Configuration**.

### 1 — Choose your provider

Select from OpenAI, Anthropic (Claude), or Google Gemini. Enter your API key for the selected provider.

![Choose provider](/img/screenshots/AI-Configuration-Choose-Provider-01.png)

### 2 — Select a model

Choose which model to use as the default for Ask AI and the Agent. All models available on your provider are listed.

![Model selection](/img/screenshots/AI-Configuration-Model-Selection-01.png)

### 3 — Set default reasoning effort

For reasoning-capable models, choose a default effort level — Low, Medium, or High. This becomes the default across all AI features and can be overridden per-session in Ask AI.

![Default reasoning effort](/img/screenshots/AI-Configuration-Default-Reasoning-efforts-01.png)

### 4 — AI Insights toggle

Enable or disable AI-generated bill summaries globally. When enabled, each new bill gets an automatically generated natural-language summary. When disabled, the AI Bill Summary card is hidden across all bills.

![AI Insights toggle](/img/screenshots/AI-Configuration-Enable-Disable-AI-Insight-01.png)

The same configuration is accessible from the Settings page.

![Settings AI configuration](/img/screenshots/Settings-AI-Configuration-01.png)

---

## Analytics

### Spend analytics

The Analytics dashboard breaks down your total monthly spend by service type and individual service. See at a glance where your money goes each month.

![Spend analytics](/img/screenshots/Analytics-01.png)

### AI usage analytics

A dedicated AI usage panel tracks your total API consumption — input tokens, output tokens, reasoning tokens where applicable, total cost, and average latency per request.

![AI usage analytics](/img/screenshots/Analytics-AI-Usage-01.png)

---

## Settings

### Profile

Update your display name, avatar photo, cover image, bio, and timezone from the Profile settings page.

![Profile settings](/img/screenshots/Settings-Profile-01.png)

![Editing profile](/img/screenshots/Settings-Profile-Edit-01.png)

### Notifications

Configure which events trigger in-app notifications. Preferences are per notification type — bill generated, bill due, payment confirmed, and more.

![Notification settings](/img/screenshots/Settings-Notification-01.png)

The notification panel shows recent activity and can be accessed from the header bell icon on any screen.

![Notifications panel](/img/screenshots/Notifications-01.png)

### Security

The Security settings page centralises all account security actions.

![Security settings overview](/img/screenshots/Settings-Security-01.png)

#### Change password

Enter your current password and set a new one. A confirmation email is sent to your address after the change succeeds.

![Change password form](/img/screenshots/Change-Password-From-Settings-01.png)

![Password changed confirmation email](/img/screenshots/Password-Changed-Mail-After-Changing-Password-01.png)

#### Change email address

A three-email confirmation flow keeps your account secure:

1. Submit the new email address from Settings.
2. A confirmation link is sent to your **new** email address — click it to approve the change.
3. A notification email is sent to your **old** address so you are always informed if the change was not initiated by you.

![Change email form](/img/screenshots/Change-Email-from-Settings-01.png)

![Confirmation email sent to new address](/img/screenshots/Confirm-Email-Change-Mail-01.png)

![Change email in-app notification](/img/screenshots/Change-Email-notification-after-email-01.png)

![Confirmation email sent to old address](/img/screenshots/Email-is-Changed-mail-01.png)

#### Active sessions

View all currently active login sessions for your account — browser, device type, and last active timestamp. Useful for spotting unexpected access.

![Active sessions](/img/screenshots/Current-Session-from-settings-01.png)

#### Delete account

Permanently delete your account and all associated data. A confirmation dialog requires you to acknowledge the action before it proceeds.

![Delete account option](/img/screenshots/Delete-Account-From-Settings-01.png)

![Delete account confirmation dialog](/img/screenshots/Delete-account-Confirmation-From-Settings-01.png)

A final confirmation email is sent to confirm the account has been deleted.

![Account deleted confirmation email](/img/screenshots/Account-Delete-Mail-01.png)

---

## Technical

- **Backend:** FastAPI + Python with Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth — email/password + Google OAuth
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **AI:** Multi-provider — OpenAI, Anthropic Claude, Google Gemini
- **Realtime:** Supabase Realtime for live notification delivery
- **Bill generation:** Automated cron job via scheduled cloud task
- **Deployment:** Netlify (frontend) + Render (backend)

---

*Released March 2026 · YesBill v1.0.0*

""",
    },
    {
        "id": "getting-started/creating-account.md",
        "title": "Creating Your Account",
        "section": "Getting Started",
        "content": """---
id: creating-account
title: Creating Your Account
sidebar_position: 1
---

# Creating Your Account

YesBill uses Supabase Auth for secure sign-up and login. You can register with your email and password or sign in with Google.

## The Login Screen

![YesBill login screen](/img/screenshots/Login-01.png)

When you first visit the YesBill app, you'll land on the login screen. From here you can sign in with an existing account or navigate to sign up.

## Sign Up with Email

![YesBill sign up screen](/img/screenshots/Sign-up-01.png)

1. Visit the YesBill app at [ishan96dev.github.io/YesBill](https://ishan96dev.github.io/YesBill/)
2. Click **Sign Up** on the login page
3. Enter your **email address** and choose a **strong password**
   - Password must contain at least one uppercase letter, lowercase letter, number, and symbol
4. Click **Create Account**
5. Check your inbox for a **confirmation email** from YesBill
6. Click the confirmation link to verify your email address

### Confirmation Email

![Confirmation email from YesBill](/img/screenshots/Confirm-Signup-Mail-01.png)

After registering, you'll receive an email like the one above. Click the **Confirm your email** button to activate your account. Check your spam folder if it doesn't arrive within a few minutes.

## Sign In with Google (SSO)

YesBill supports Single Sign-On (SSO) via Google. No password is needed — Google authenticates you directly.

### Step 1 — Click Continue with Google

![Google SSO login — pick an account](/img/screenshots/Login-Signin-using-SSO-01.png)

On the login page, click **Continue with Google**. A Google account picker opens. Select the Google account you want to use.

### Step 2 — Authorise YesBill

![Google SSO login — authorise](/img/screenshots/Login-Signin-using-SSO-02.png)

You may see a permissions screen asking you to authorise YesBill to access your email address. Click **Allow**. You'll be redirected back to YesBill and logged in automatically.

:::tip
SSO accounts don't have a YesBill password. To change your login password, do it from your Google Account settings.
:::

## First Login

After signing in for the first time, you'll be taken through the **Onboarding** flow to set up your profile and optionally configure an AI provider.

:::tip
Use a strong, unique password for your YesBill account. You can change it later from **Settings → Security**.
:::

## Forgot Your Password?

If you can't remember your login password, YesBill provides a secure self-service reset flow.

### Step 1 — Click "Forgot Password"

![Forgot password screen – enter email](/img/screenshots/Forget-Password-01.png)

On the login screen, click the **Forgot password?** link. You'll be taken to the password reset page where you enter your registered email address.

### Step 2 — Submit Your Email

![Forgot password screen – confirmation](/img/screenshots/Forget-Password-02.png)

Enter your email and click **Send Reset Link**. You'll see a confirmation message that a reset email has been sent.

### Step 3 — Check Your Inbox

![Forgot password reset email](/img/screenshots/Forget-Password-email-01.png)

Open the email and click the **Reset Password** button. The link is valid for 24 hours — check your spam folder if it doesn't arrive within a few minutes.

### Step 4 — Set a New Password

![Set new password screen](/img/screenshots/Forget-Password-Set-New-password-01.png)

Enter your new password (and confirm it), then click **Update Password**. You'll be redirected to the login page to sign in with your new credentials.

## Other Login Issues

- **Email not verified?** Check your spam folder for the original confirmation email
- **Account locked?** Contact support at [support@yesbill.com](mailto:ishanrock1234@gmail.com)
""",
    },
    {
        "id": "getting-started/dashboard.md",
        "title": "Your Dashboard",
        "section": "Getting Started",
        "content": """---
id: dashboard
title: Your Dashboard
sidebar_position: 4
---

# Your Dashboard

After onboarding, the Dashboard is the first screen you see every time you log in. It gives you a high-level summary of your household spending and upcoming bills.

## Dashboard Overview

![YesBill dashboard](/img/screenshots/Dashboard-01.png)

The Dashboard is your command centre for everything in YesBill. It surfaces the most important information at a glance so you always know where things stand.

## Updated Dashboard

![Updated YesBill dashboard](/img/screenshots/Updated-Dashboard-01.png)

As you add more services and track more months, the Dashboard becomes richer — showing trends, recent activity across multiple services, and smarter AI-powered insights.

## What's on the Dashboard

### Key Metrics (KPI Cards)
The top row of cards shows your most important numbers for the current month:

- **Total This Month** — Sum of all generated bills for the current month
- **Unpaid Bills** — Number of bills that haven't been marked as paid
- **Services Active** — Count of live services being tracked
- **Days Tracked** — Total number of days marked across all services this month

### Recent Bills
A list of the most recently generated bills. Click any bill to open its full detail view.

### Services Summary
A quick summary of all your active services with their current month status — useful for a quick sanity check without navigating to the full Services or Calendar page.

### Quick Actions
Common shortcuts available directly from the Dashboard:
- **Mark Today's Services** — Jump to the Calendar for today's date
- **Generate Bills** — Trigger bill generation for the current month
- **Ask AI** — Open the Ask AI chat from the Dashboard

## Navigation

Use the **sidebar** on the left to navigate to all sections of the app:

| Section | What It Does |
|---------|-------------|
| **Dashboard** | This overview screen |
| **Calendar** | Day-by-day service tracking |
| **Services** | Manage your service list |
| **Bills** | View and pay your bills |
| **Analytics** | Charts and spending trends |
| **Ask AI** | Natural language queries |
| **Settings** | Profile, notifications, security |

:::tip
Bookmark the YesBill app URL so you can open it quickly each morning and mark yesterday's services in under 30 seconds.
:::
""",
    },
    {
        "id": "getting-started/first-service.md",
        "title": "Adding Your First Service",
        "section": "Getting Started",
        "content": """---
id: first-service
title: Adding Your First Service
sidebar_position: 3
---

# Adding Your First Service

After completing onboarding, add your first household service to start tracking.

## How to Add a Service

### Step 1 — Open the Add Service Form

![Add service — step 1: open the form](/img/screenshots/Add-New-Service-01.png)

Go to **Services** in the sidebar and click **+ Add Service** (top right) to open the service creation form.

### Step 2 — Enter Service Details

![Add service — step 2: fill in details](/img/screenshots/Add-New-Service-02.png)

Fill in the service details:
- **Service Name** — e.g. "Morning Milk", "Tiffin Service", "Maid"
- **Service Type** — Choose the billing model that matches your service (see the table below)
- **Daily Rate / Monthly Price** — The cost per day or per month
- **Billing Day** — Day of the month bills are due (for subscription/payment types)

### Step 3 — Configure Billing Options

![Add service — step 3: billing options](/img/screenshots/Add-New-Service-03.png)

Depending on the service type, additional fields may appear such as start date, billing cycle day, or tracking method. Fill these in as appropriate.

### Step 4 — Save and Confirm

![Add service — step 4: service created](/img/screenshots/Add-New-Service-04.png)

Click **Save**. Your service is now active and will appear on the Calendar immediately.

## Choosing the Right Service Type

| You're Tracking | Use This Type |
|----------------|---------------|
| Daily milk, newspaper, tiffin | **Home Delivery** |
| Maid, cook, gardener visits | **Visit-based** |
| Internet, DTH, electricity | **Utility** |
| Netflix, Spotify, gym | **Subscription** |
| Loan EMI, credit card | **Payment** |

## Example: Tiffin Service

- **Name:** Morning Tiffin
- **Type:** Home Delivery
- **Daily Rate:** ₹80/day
- **Tracking:** Mark each day as Delivered or Skipped

The calendar will show this service daily. At month end, your bill will be calculated as ₹80 × days delivered.

## What Happens Next?

Once a service is added:
- It appears on your **Calendar** for the current month
- You can start marking days (delivered/visited/active)
- At month end, **bills are auto-generated** based on your tracking

:::tip
Add all your regular household services at once — the more you track, the more accurate your monthly bill summary will be.
:::
""",
    },
    {
        "id": "getting-started/onboarding.md",
        "title": "Onboarding — Profile & AI Setup",
        "section": "Getting Started",
        "content": """---
id: onboarding
title: Onboarding — Profile & AI Setup
sidebar_position: 2
---

# Onboarding

When you log in for the first time, YesBill walks you through two quick setup steps.

## Step 1 — Profile Setup

![Onboarding profile setup step](/img/screenshots/Onboard-Profile-01.png)

Fill in your basic profile information:

- **Full Name** — Your name as it appears in the app
- **Display Name** — Short name used in greetings (optional)
- **Phone Number** — For WhatsApp bill notifications (optional)
- **Country & Timezone** — Used to display dates correctly
- **Profile Photo** — Upload an avatar image (optional)

Click **Save & Continue** when done.

:::info
You can update all of this later from **Settings → Profile**.
:::

## Step 2 — AI Provider Setup

![AI provider configuration during onboarding](/img/screenshots/Onboard-AI-Config-01.png)

YesBill's AI features (bill summaries, Ask AI chat, Agent assistant) require an API key from an AI provider.

### Supported Providers

| Provider | Good For |
|----------|---------|
| **OpenAI** | Best overall, fast responses |
| **Anthropic Claude** | Best for detailed analysis |
| **Google Gemini** | Budget-friendly option |

### How to Set Up

1. Select your preferred provider (e.g. OpenAI)
2. Enter your API key from the provider's developer console
3. Choose a default model
4. Click **Validate** to verify the key works
5. Click **Save & Go to Dashboard**

### Skip for Now

![Onboarding skip modal](/img/screenshots/Onboard-skip-modal-01.png)

If you're not ready to set up AI, click **Skip for now**. A confirmation modal appears reminding you that AI features will be unavailable until you add a key. Click **Skip Anyway** to go directly to the Dashboard.

You can configure AI any time later from **Settings → AI Configuration**.

:::note
AI features won't work until you add an API key. Bill tracking, calendar, and manual billing work without AI.
:::
""",
    },
    {
        "id": "intro.md",
        "title": "Introduction to YesBill",
        "section": "General",
        "content": """---
id: intro
title: Introduction to YesBill
sidebar_position: 1
---

# Welcome to YesBill

![YesBill landing page](/img/screenshots/Landing-Page-01.png)

YesBill is a smart household billing tracker designed for Indian homes. It helps you track daily service deliveries, generate monthly bills automatically, and use AI to understand your spending.

## What Is YesBill?

Most Indian households use multiple daily services — morning milk delivery, newspaper, tiffin service, maid, internet, DTH, and more. Keeping track of all of these manually in a notebook or spreadsheet is tedious and error-prone.

YesBill solves this by giving you:

- A **digital record** of every delivery, visit, and payment
- **Automatic bill generation** at the end of each month
- A **calendar view** to see your entire month at a glance
- **AI chat** to ask questions about your bills in plain English

## Who Is This For?

YesBill is built for:

- Families that use daily home delivery services (milk, newspaper, tiffin)
- Homes with domestic helpers paid on a visit basis
- Anyone who wants to track monthly subscriptions and utility bills in one place

## Key Concepts

| Term | Meaning |
|------|---------|
| **Service** | A recurring household expense (e.g. "Morning Milk", "Tiffin Service") |
| **Service Type** | The billing model: Home Delivery, Visit-based, Utility, Subscription, or Payment |
| **Calendar** | Day-by-day view to mark deliveries/visits |
| **Bill** | Auto-generated monthly summary of what you owe |
| **AI Features** | Chat assistant and bill analysis powered by OpenAI, Anthropic, or Google |

## Getting Started

1. [Create your account](/getting-started/creating-account)
2. [Complete onboarding](/getting-started/onboarding) — set up your profile and AI provider
3. [Add your first service](/getting-started/first-service)
4. Start tracking — use the calendar to mark days and let YesBill generate your bills

---

> **Note:** YesBill currently works best on desktop browsers. Mobile support is coming soon.
""",
    },
    {
        "id": "roadmap.md",
        "title": "Roadmap",
        "section": "General",
        "content": """---
id: roadmap
title: Roadmap
sidebar_position: 99
---

# Roadmap

This page tracks features that are **planned or in progress** for YesBill. Items listed here are not yet available in the app.

:::info
Have a feature request? Open an issue on [GitHub](https://github.com/ishan96dev/YesBill) or use the 👍 / 👎 feedback buttons in **Ask AI** to help us prioritise.
:::

---

## Ask AI

### Pin Conversations
> **Status:** Planned

Allow users to pin important Ask AI conversations to the top of the history list for quick access. Currently, conversations can only be renamed or deleted.

---

### Regenerate Response
> **Status:** Planned

A **Regenerate** button on each AI response to re-run the same query and get a fresh answer — useful when a response is cut off or you want to try a different phrasing. Currently, you need to re-send the message manually.

---

## Calendar

### Bulk Day Marking
> **Status:** Planned

Mark multiple days at once — for example, mark all Sundays as Skipped for a service that doesn't operate on weekends. Currently each day must be marked individually.

---

## Bills

### ~~Export as PDF / CSV~~
> **Status:** ✅ Shipped

Download any bill or a month's summary as a PDF or CSV file — available now from the bill detail view. See [Bill History](/bills/bill-history) for instructions.

---

## General

### Mobile App
> **Status:** Under Consideration

A native mobile app (iOS / Android) or a progressive web app (PWA) for easier on-the-go tracking. Currently YesBill works best on desktop browsers.

---

### WhatsApp Notifications
> **Status:** Planned

Receive bill generation alerts and daily service reminders directly on WhatsApp. The phone number field in your profile is reserved for this feature.

---

*Last updated: March 2026*
""",
    },
    {
        "id": "services/home-delivery.md",
        "title": "Home Delivery Services",
        "section": "Services",
        "content": """---
id: home-delivery
title: Home Delivery Services
sidebar_position: 2
---

# Home Delivery Services

Home Delivery is for daily services delivered to your doorstep. Each day is tracked as **Delivered** or **Skipped**.

## Common Examples

- 🥛 Morning milk (e.g. ₹28/litre × 2 litres = ₹56/day)
- 📰 Daily newspaper
- 🍱 Tiffin / lunch box service
- 🍞 Bread or bakery delivery

## Setting Up

1. Go to **Services** → **+ Add Service**
2. Select **Home Delivery** as the type
3. Enter:
   - **Service Name** (e.g. "Morning Milk")
   - **Daily Rate** in ₹ (e.g. 56)
   - **Start Date**
4. Save

## Tracking Deliveries

On the **Calendar** view, you'll see each day of the month. For each day:

- Click **Delivered** (✅) if the service was delivered
- Click **Skipped** (❌) if it was not delivered that day

Days default to **Pending** until you mark them.

## Billing Calculation

At month end:

```
Bill = Daily Rate × Number of Delivered Days
```

**Example:** Milk at ₹56/day, delivered 26 out of 30 days = ₹1,456

:::tip
Mark skipped days promptly — once the month ends, past days may be locked from editing.
:::
""",
    },
    {
        "id": "services/managing-services.md",
        "title": "Managing & Editing Services",
        "section": "Services",
        "content": """---
id: managing-services
title: Managing & Editing Services
sidebar_position: 7
---

# Managing & Editing Services

Once you have services set up, you can view their full details, edit their configuration, or remove them at any time.

## Manage Service View

![Manage service screen](/img/screenshots/Manage-Service-01.png)

The **Manage Service** screen gives you a detailed overview of a single service, including:

- Service name, type, and billing rate
- Total amount billed this month
- Days tracked and their statuses
- A quick link to the service's calendar
- Options to **Edit** or **Delete** the service

### How to Open

1. Go to **Services** in the sidebar
2. Click the menu icon (⋮) on any service card
3. Select **Manage** — or simply click the service card itself

---

## Editing a Service

![Edit service screen](/img/screenshots/Edit-Service-01.png)

You can update any service's details at any time. Changes take effect from the next billing period unless otherwise noted.

### How to Edit

1. Open the **Manage Service** screen (see above)
2. Click the **Edit** button (pencil icon or "Edit Service" button)
3. The Edit Service form opens with current values pre-filled
4. Update any of the following fields:

| Field | Notes |
|-------|-------|
| **Service Name** | Rename the service as needed |
| **Service Type** | Changing type may affect existing tracking data |
| **Daily Rate / Monthly Price** | New rate applies to future bills |
| **Billing Day** | Day of month when fixed charges are applied |
| **Start Date** | When tracking began for this service |
| **Notes** | Optional free-text notes about the service |

5. Click **Save Changes** to apply

:::tip
If you need to change just the price (e.g. your milk vendor raised rates), update the **Daily Rate** and click **Save**. Past bills will not be affected — only future months.
:::

:::warning
Changing the **Service Type** (e.g. from Home Delivery to Visit-based) will change how future days are tracked. Existing records for the current month will retain their original status labels.
:::

---

## Deleting a Service

To permanently remove a service:

1. Open the **Manage Service** screen
2. Click **Delete Service**
3. Confirm in the dialog that appears

:::warning
Deleting a service removes all associated tracking data and bills. This action **cannot be undone**. Consider marking the service as **Inactive** instead if you just want to pause it.
:::

---

## Pausing a Service

For **Utility** type services, you can mark the service as **Inactive** for a month instead of deleting it. This means you won't be charged that month but the service remains configured.

For **Home Delivery** or **Visit-based** services, simply don't mark any days as Delivered/Visited — those days won't count toward your bill.
""",
    },
    {
        "id": "services/overview.md",
        "title": "Service Types Overview",
        "section": "Services",
        "content": """---
id: overview
title: Service Types Overview
sidebar_position: 1
---

# Service Types

YesBill supports 5 types of household services, each with its own billing model and tracking method.

## Services Page

![YesBill services page](/img/screenshots/Service-page-01.png)

The **Services** page shows all your configured services at a glance. From here you can add new services, view any service's calendar, or manage and edit existing ones.

## Service Cards

![YesBill service card](/img/screenshots/Service-Card-01.png)

Each service is displayed as a card showing its name, type, rate, and current month's status. Click a card to open that service's calendar view, or use the menu (⋮) to edit or delete it.

## The 5 Types

### Home Delivery
Daily services delivered to your door. Tracked day-by-day as **Delivered** or **Skipped**.

**Examples:** Milk, newspaper, tiffin, bread, vegetables

**Billing:** Daily rate × number of days delivered

---

### Visit-based
Services where someone visits your home. Tracked day-by-day as **Visited** or **Missed**.

**Examples:** Maid, cook, driver, gardener, watchman

**Billing:** Daily rate × number of days visited

---

### Utility
Monthly services that are either active or inactive for the whole month.

**Examples:** Internet, DTH/cable, electricity (flat rate), piped gas

**Billing:** Full monthly price if marked Active, ₹0 if marked Inactive

---

### Subscription
Fixed-charge services billed on a specific day each month.

**Examples:** Netflix, Spotify, Gym membership, OTT platforms

**Billing:** Fixed price on the billing day, regardless of usage

---

### Payment
Loan repayments or credit obligations tracked monthly.

**Examples:** EMI, credit card minimum due, personal loan

**Billing:** Fixed amount due on the billing day

---

## Comparison Table

| Feature | Home Delivery | Visit-based | Utility | Subscription | Payment |
|---------|:---:|:---:|:---:|:---:|:---:|
| Day-by-day tracking | Yes | Yes | — | — | — |
| Monthly toggle | — | — | Yes | — | — |
| Fixed monthly charge | — | — | — | Yes | Yes |
| Language | Delivered/Skipped | Visited/Missed | Active/Inactive | Paid/Unpaid | Paid/Unpaid |

---

## Tips

- For a service that comes **some days but not every day** (e.g. a part-time maid), use **Visit-based**
- For a flat ₹500/month internet connection, use **Utility** — toggle it Active when the connection is active
- For an EMI that is ₹7,500/month due on the 5th, use **Payment** with billing day = 5
""",
    },
    {
        "id": "services/payments.md",
        "title": "Payment / EMI Tracking",
        "section": "Services",
        "content": """---
id: payments
title: Payment / EMI Tracking
sidebar_position: 6
---

# Payment Services (EMI Tracking)

Payment services track recurring financial obligations — like loan EMIs or credit card bills — that are due on a fixed day each month.

## Common Examples

- Home loan / car loan EMI
- Credit card minimum payment due
- Personal loan repayment
- School/college fee (monthly instalment)

## Setting Up

1. Go to **Services** → **+ Add Service**
2. Select **Payment** as the type
3. Enter:
   - **Service Name** (e.g. "Car Loan EMI")
   - **Monthly Amount** in ₹ (e.g. 12,500)
   - **Billing Day** (e.g. 7 for 7th of each month)
4. Save

## Tracking

On the **Calendar**, the payment appears only on its billing day showing a **Paid** or **Unpaid** status.

When you pay:
1. Click **Mark Paid** on the calendar or in the Bills section
2. Select your **payment method** (Bank Transfer, UPI, Cash, etc.)
3. Optionally add a **payment note** (e.g. transaction reference)

## Notes

- Payment type is identical to Subscription in how it's tracked — both are fixed charges on a billing day
- The distinction is semantic — use Payment for financial obligations (loans, dues) and Subscription for services (streaming, memberships)
- Past payment history is stored so you can verify you've never missed an EMI
""",
    },
    {
        "id": "services/subscriptions.md",
        "title": "Subscriptions",
        "section": "Services",
        "content": """---
id: subscriptions
title: Subscriptions
sidebar_position: 5
---

# Subscription Services

Subscriptions are fixed charges billed on a specific day each month. They appear on the calendar only on their billing day.

## Common Examples

- Netflix, Prime Video, Hotstar
- Spotify, Apple Music, YouTube Music
- Gym / fitness centre membership
- Magazine or news subscription
- Cloud storage (Google One, iCloud)

## Setting Up

1. Go to **Services** → **+ Add Service**
2. Select **Subscription** as the type
3. Enter:
   - **Service Name** (e.g. "Netflix")
   - **Monthly Price** in ₹
   - **Billing Day** — the day of the month this is due (e.g. 15)
4. Save

## Tracking

On the **Calendar**, the subscription appears only on its billing day as a **Paid** or **Unpaid** status badge.

- Click **Mark Paid** when you've paid for the month
- The payment is recorded with your chosen payment method

## Billing

Subscriptions contribute their fixed monthly amount to your bill each month, regardless of usage.

```
Bill = Fixed Monthly Price
```

:::note
Subscription and Payment service types both work the same way — fixed charge on a specific billing day.
:::
""",
    },
    {
        "id": "services/utility-services.md",
        "title": "Utility Services",
        "section": "Services",
        "content": """---
id: utility-services
title: Utility Services
sidebar_position: 4
---

# Utility Services

Utility services are billed at a flat monthly rate. You toggle them **Active** (full charge) or **Inactive** (₹0) for each month.

## Common Examples

- Internet / broadband
- DTH / cable TV
- Piped gas (flat-rate plan)
- Electricity (flat monthly plan)

## Setting Up

1. Go to **Services** → **+ Add Service**
2. Select **Utility** as the type
3. Enter:
   - **Service Name** (e.g. "Internet")
   - **Monthly Rate** in ₹
   - **Billing Day** (e.g. 1 for 1st of each month)
4. Save

## Tracking

Unlike Home Delivery or Visit-based, Utility services don't have a day-by-day grid. Instead, on the **Service Calendar** page:

- **Mark Active** — Service is running this month, full charge applies
- **Mark Inactive** — Service is paused/cancelled, ₹0 charge this month

## Billing Calculation

```
Bill = Monthly Rate   (if Active)
Bill = ₹0             (if Inactive)
```

**Example:** Internet plan at ₹799/month, marked Active = ₹799 in the bill

:::tip
If your internet was down for a week and you got a credit, you can still mark it Active and add a note to the bill manually.
:::
""",
    },
    {
        "id": "services/visit-based.md",
        "title": "Visit-based Services",
        "section": "Services",
        "content": """---
id: visit-based
title: Visit-based Services
sidebar_position: 3
---

# Visit-based Services

Visit-based is for services where someone comes to your home on specific days. Each day is tracked as **Visited** or **Missed**.

## Common Examples

- 🧹 Maid / domestic helper
- 👨‍🍳 Cook
- 🚗 Driver
- 🌱 Gardener / mali
- 👮 Watchman (part-time)

## Setting Up

1. Go to **Services** → **+ Add Service**
2. Select **Visit-based** as the type
3. Enter:
   - **Service Name** (e.g. "Maid")
   - **Daily Rate** in ₹
   - **Start Date**
4. Save

## Tracking Visits

On the **Calendar** view, for each day:

- Click **Visited** (✅) if the person came that day
- Click **Missed** (❌) if they did not come

:::note
**Visit-based** uses "Visited/Missed" language — not "Delivered/Skipped" — because a person visits rather than a product being delivered.
:::

## Billing Calculation

```
Bill = Daily Rate × Number of Visited Days
```

**Example:** Maid at ₹200/day, came 22 out of 26 working days = ₹4,400

## Tips

- If the maid has fixed off days (Sunday), simply don't mark those days — they'll remain Pending and won't be counted
- At month end, you can compare "visited" vs "missed" to track attendance easily
""",
    },
    {
        "id": "settings/ai-configuration.md",
        "title": "AI Configuration",
        "section": "Settings",
        "content": """---
id: ai-configuration
title: AI Configuration
sidebar_position: 4
---

# AI Configuration in Settings

The AI Configuration tab is where you manage your AI provider API keys and default model selection.

## Accessing AI Settings

Go to **Settings** → **AI Configuration** tab.

## Provider Tabs

Click the provider name (OpenAI, Anthropic, Google) to switch between them.

## Adding a Key

1. Select the provider tab
2. Paste your API key in the input field
3. Choose your preferred model from the dropdown
4. Click **Validate** — YesBill sends a test request to verify the key works
5. Click **Save**

A green checkmark (✅) appears next to a validated provider.

## Removing a Key

1. Open the provider tab
2. Click **Remove Key** or clear the field
3. Save

## Default Model

The model you select here becomes the default in Ask AI and the Agent. You can always change it per-conversation using the model selector in the chat interface.

## Model Capabilities

Some models support **Extended Thinking** (reasoning) — these show a 🧠 icon in the model selector. Reasoning models think through problems step by step before responding, which can improve accuracy for complex queries.

## Usage Monitoring

Go to **Analytics → AI Usage** to see:
- Tokens used per conversation
- Cost per message
- Total monthly AI spend

This helps you estimate your AI provider bill.

:::tip
For everyday use, **GPT-4o Mini** (OpenAI) or **Gemini 2.0 Flash** (Google) are excellent budget-friendly choices. Switch to a more powerful model for complex analysis tasks.
:::
""",
    },
    {
        "id": "settings/notifications.md",
        "title": "Notification Preferences",
        "section": "Settings",
        "content": """---
id: notifications
title: Notification Preferences
sidebar_position: 2
---

# Notification Preferences

Control which types of notifications YesBill sends you.

## Notification Settings

![Notification preferences settings](/img/screenshots/Settings-Notification-01.png)

## Accessing Notification Settings

1. Go to **Settings** → **Notifications** tab
2. Toggle each notification type on or off

## Notification Types

| Type | What Triggers It |
|------|-----------------|
| **General** | Welcome messages and announcements |
| **Bill Generated** | When a new bill is created for any service |
| **Bill Warning** | When bills are nearing due date |
| **Service Expiry** | When a service is about to end |
| **AI Config** | Reminder when no AI provider is configured |
| **Email Verification** | Security emails (email change, password reset) |

## Reading Notifications

![In-app notifications panel](/img/screenshots/Notifications-01.png)

Click the **bell icon** (🔔) in the top navbar to open the notification panel:

- Unread notifications have a blue dot (●)
- Click **Mark all as read** to clear unread indicators
- Click **Manage notification preferences** to jump to Settings

## Tips

- Disable notification types you don't find useful — only keep the ones that matter to you
- **Bill Generated** notifications are the most useful — they remind you to review and pay
- The notification panel shows the last 50 notifications. Older ones are not shown but are still in the database.
""",
    },
    {
        "id": "settings/profile.md",
        "title": "Profile Settings",
        "section": "Settings",
        "content": """---
id: profile
title: Profile Settings
sidebar_position: 1
---

# Profile Settings

Manage your personal information, avatar, and cover image from the Profile tab in Settings.

## Accessing Profile Settings

![Profile settings page](/img/screenshots/Settings-Profile-01.png)

1. Click your name/avatar in the top right
2. Select **Settings** from the dropdown
3. You're on the **Profile** tab by default

## Editing Your Profile

![Profile edit mode](/img/screenshots/Settings-Profile-Edit-01.png)

Click **Edit Profile** to enter edit mode where you can update all fields. Changes are saved when you click **Save Changes**.

## What You Can Edit

### Basic Information
- **Full Name** — Your legal or preferred full name
- **Display Name** — Short name used in greetings and the app header
- **Phone Number** — Optional, used for WhatsApp notifications
- **Bio** — A short description (up to 500 characters)
- **Country & Timezone** — Used for correct date display

### Profile Photo (Avatar)
1. Click on your avatar circle
2. Select **Upload Photo**
3. Choose an image from your device
4. The photo is uploaded and saved automatically

### Cover Image
A banner image that appears at the top of your profile card.

1. Click **Upload Cover Image** (or the camera icon on the cover area)
2. Choose a wide image (recommended: 1200×300 px or wider)
3. Save

## Saving Changes

Click **Save Changes** after editing. A success toast appears confirming the save.

:::tip
Add a recognisable profile photo and display name — it makes the app feel more personal.
:::
""",
    },
    {
        "id": "settings/security.md",
        "title": "Security Settings",
        "section": "Settings",
        "content": """---
id: security
title: Security Settings
sidebar_position: 3
---

# Security Settings

Manage your password and email address from the Security tab.

## Accessing Security Settings

![Security settings page](/img/screenshots/Settings-Security-01.png)

Go to **Settings** → **Security** tab.

## Changing Your Password

![Change password form in Security settings](/img/screenshots/Change-Password-From-Settings-01.png)

1. Enter your **Current Password**
2. Enter a **New Password** (must meet strength requirements)
3. **Confirm** the new password
4. Click **Update Password**

Password requirements:

- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol

### Password Changed Email

![Password changed confirmation email](/img/screenshots/Password-Changed-Mail-After-Changing-Password-01.png)

After a successful password change, YesBill sends a confirmation email to your registered address notifying you that the password was updated. If you didn't make this change, contact support immediately.

:::warning
After changing your password, all other active sessions will be signed out.
:::

## Changing Your Email Address

![Change email form in Security settings](/img/screenshots/Change-Email-from-Settings-01.png)

1. Enter your **New Email Address** in the email field
2. Click **Send Confirmation**
3. Check your **new email inbox** for a confirmation link
4. Click the link — you'll be taken to a confirmation page
5. Your email is updated and you're redirected to login

### Email Change — Step by Step Emails

YesBill sends three emails during an email change:

#### 1. Confirmation email to your new address

![Confirm email change email](/img/screenshots/Confirm-Email-Change-Mail-01.png)

Click the **Confirm Email Change** button in this email to verify you own the new address.

#### 2. In-app notification after change

![In-app notification after email change](/img/screenshots/Change-Email-notification-after-email-01.png)

Once the change completes, you'll see an in-app notification confirming your email address has been updated.

#### 3. Confirmation email to your old address

![Email change success email](/img/screenshots/Email-is-Changed-mail-01.png)

Your old email address also receives a notification confirming the change. If you didn't request this, contact support immediately.

:::note
A security notification email is also sent to your **old email address** when the change is complete.
:::

### If the Link Expires

Email change links expire after 24 hours. If yours expired:

1. Go back to **Settings → Security**
2. Re-enter your new email and click **Send Confirmation** again
3. A fresh confirmation link is emailed to you

## Active Sessions

![Current session panel in Security settings](/img/screenshots/Current-Session-from-settings-01.png)

The **Active Sessions** panel shows your currently logged-in devices and browsers. You can see:

- Device type and browser
- Last active time and location
- Current session badge

To sign out of all other sessions, click **Sign Out All Other Sessions**. This is useful if you think someone else might have access to your account.

## Deleting Your Account

:::danger
Account deletion is **permanent and irreversible**. All your services, tracking data, and bills will be deleted immediately and cannot be recovered.
:::

### Step 1 — Initiate Deletion

![Delete account option in Security settings](/img/screenshots/Delete-Account-From-Settings-01.png)

Scroll to the bottom of the Security settings page and click **Delete Account**.

### Step 2 — Confirm Deletion

![Delete account confirmation dialog](/img/screenshots/Delete-account-Confirmation-From-Settings-01.png)

A confirmation dialog appears. You must type your account email address to confirm before the deletion proceeds.

### Account Deletion Email

![Account deleted confirmation email](/img/screenshots/Account-Delete-Mail-01.png)

After your account is deleted, you'll receive a final confirmation email notifying you that the deletion is complete and all data has been removed.

## Linked Accounts

If you signed up with Google, your email is managed by Google. You cannot change it directly in YesBill — change it in your Google Account settings instead.
""",
    },
]


def search_docs(query: str, max_results: int = 3, snippet_len: int = 450) -> list[dict]:
    """
    Keyword search across all YesBill docs.
    Scores by presence (not count) to avoid large files dominating.
    Returns list of {id, title, section, snippet} sorted by relevance score.
    """
    words = set(re.findall(r'\b[a-z0-9]+\b', query.lower())) - _STOPWORDS
    if not words:
        return []
    scored: list[tuple[int, dict]] = []
    for doc in DOCS_INDEX:
        content_lower = doc['content'].lower()
        title_lower = doc['title'].lower()
        score = 0
        best_pos: Optional[int] = None
        for word in words:
            # Title match weighted heavily
            if word in title_lower:
                score += 10
            # Body: check presence in section headings (## ...) vs body text
            heading_hits = len(re.findall(r'#+\s+[^\n]*' + re.escape(word) + r'[^\n]*', content_lower))
            score += heading_hits * 3
            # Body presence (binary per word — 1 point, not count)
            if word in content_lower:
                score += 2
                idx = content_lower.find(word)
                if best_pos is None:
                    best_pos = idx
        if score > 0:
            start = max(0, (best_pos or 0) - 60)
            end = min(len(doc['content']), start + snippet_len)
            snippet = doc['content'][start:end].strip()
            scored.append((score, {**doc, 'snippet': snippet}))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:max_results]]
