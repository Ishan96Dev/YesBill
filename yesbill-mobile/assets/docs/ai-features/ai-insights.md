---
id: ai-insights
title: AI Insights
sidebar_position: 4
displayed_sidebar: mobileSidebar
---

# AI Insights

AI Insights is an intelligent spending summary panel that appears on your **Dashboard**. It uses your configured AI provider to analyse your bills and deliver actionable observations in plain English.

## What AI Insights Does

After each bill generation, the AI analyses your monthly data and surfaces:

- **Spending trend** — whether your total spend this month is higher, lower, or similar to last month
- **Service breakdown** — which services cost the most and why
- **Delivery pattern notes** — e.g. "Milk delivery dropped 4 days in November compared to October"
- **Budget alerts** — flags services that exceeded a significant portion of your monthly total
- **Recommendations** — suggestions such as "Consider pausing Service X for a week to reduce costs"

## Enabling AI Insights

<PhoneFrame src="/img/screenshots/mobile/AI-Settings-Screen-01.jpeg" alt="AI settings with Insights toggle" />

1. Open **Settings → AI Configuration**.
2. Toggle **Enable AI Insights** to ON.
3. Return to the Dashboard — the Insights panel appears below your month summary card.

AI Insights refreshes automatically after each bill generation and each time you open the Dashboard while connected to the internet.

:::info
AI Insights requires a configured AI provider with a valid API key. See [AI Configuration](/mobile/settings/ai-configuration) to set one up.
:::

## Viewing Insights on the Dashboard

<PhoneFrame src="/img/screenshots/mobile/Dashboard-screen-01.jpeg" alt="Dashboard with AI Insights panel" />

The Insights panel on the Dashboard shows:
- A short headline (e.g. "Spend is up 12% from October")
- Two or three bullet observations
- A **See Full Analysis** link that opens the detailed AI response

Tap **Refresh** to regenerate insights at any time.

## Privacy

Your bill data is sent to the AI provider you configured (OpenAI, Anthropic, Google AI, or Ollama). YesBill only forwards the data needed to generate the insight — no additional data is shared.

For maximum privacy, use **Ollama** — your data stays entirely on your device or local network.

See [AI Configuration](/mobile/settings/ai-configuration) for provider options.
