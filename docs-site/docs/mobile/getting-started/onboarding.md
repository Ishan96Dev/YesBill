---
id: onboarding
title: Setting Up Your Account
sidebar_position: 2
displayed_sidebar: mobileSidebar
---

# Setting Up Your Account

After signing in for the first time, YesBill guides you through a **two-step onboarding** flow to configure your profile and (optionally) an AI provider.

## Step 1 — Profile Setup

<PhoneFrame src="/img/screenshots/mobile/Profile-Edit-Profile-Screen-01.jpeg" alt="Profile setup during onboarding" />

![Onboarding — Profile Setup](/img/screenshots/Onboard-Profile-01.png)

Fill in your profile information:

| Field | Required | Notes |
|-------|----------|-------|
| **Full Name** | ✅ | Displayed in the app |
| **Display Name** | Optional | Short name used in greetings |
| **Phone Number** | Optional | For WhatsApp bill notifications |
| **Country & Timezone** | ✅ | Dates and billing months are based on this |
| **Profile Photo** | Optional | Upload an avatar from your gallery |

Tap **Save & Continue** when done. You can update all of this later from **Settings → Profile**.

## Step 2 — AI Provider Setup

<PhoneFrame src="/img/screenshots/mobile/AI-Settings-Screen-01.jpeg" alt="AI provider setup during onboarding" />

![AI Configuration during onboarding](/img/screenshots/Onboard-AI-Config-01.png)

YesBill's AI features — bill summaries, Ask AI chat, and the AI Agent — require an API key from an AI provider.

### Supported Providers

| Provider | Best For | Get a Key |
|----------|---------|-----------|
| **OpenAI** | Most capable models (GPT-5 series) | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic** | Balanced speed + intelligence (Claude) | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **Google AI** | Budget-friendly (Gemini Flash) | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **Ollama** | Local models — no API key needed | [ollama.com](https://ollama.com) |

### How to Configure

1. Select your preferred **AI Provider** from the list.
2. Enter your **API Key** (not required for Ollama).
3. Select a **default model** from the available options.
4. Tap **Save & Go to Dashboard**.

### Skip for Now

![Skip AI config modal](/img/screenshots/Onboard-skip-modal-01.png)

If you're not ready to set up AI, tap **Skip for now**. A confirmation modal appears reminding you that AI features will be unavailable until you add a key.

:::warning AI features locked until configured
Skipping AI config disables **Bill Summaries**, **Ask AI Chat**, and the **AI Agent**. You'll see a reminder notification in the bell icon.
Manual bill tracking, calendar, and payments work without AI.
:::

Tap **Skip Anyway** to go directly to the Dashboard. You can configure AI any time later from **Settings → AI Configuration**.

## What's Next?

After completing onboarding:

1. [Explore your dashboard](/mobile/getting-started/dashboard)
2. [Add your first service](/mobile/services/managing-services)
3. Mark deliveries in the **Calendar**
4. Let YesBill generate your first **Bill** at month-end
5. [Chat with Ask AI](/mobile/ai-features/ask-ai) about your expenses
