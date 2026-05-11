---
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

![AI settings screen](/img/screenshots/mobile/AI-Settings-Screen-01.jpeg)

Tap **Settings → AI Configuration** to open the AI configuration panel.

### Step 1 — Choose a Provider

![Provider settings screen](/img/screenshots/mobile/Provider-Settings-Screen-01.jpeg)

Tap the provider tab (OpenAI, Anthropic, or Google). Paste your API key into the field and tap **Validate** to test it.

1. Tap **Settings → AI Configuration**
2. Select your provider tab
3. Paste your API key
4. Tap **Validate** to test the key
5. Tap **Save**

A green checkmark appears next to a validated provider.

### Step 2 — Select a Default Model

After adding your API key, choose the **default model** you want YesBill to use for all AI features. The available models update automatically based on your validated provider.

:::tip
Start with **OpenAI GPT-4o Mini** or **Google Gemini 2.0 Flash** for low-cost usage while you're getting started.
:::

### Step 3 — Set Default Reasoning Effort

For models that support extended thinking (like Claude 3.7 Sonnet or o3-mini), you can set the **default reasoning effort**:

| Level | Behaviour | Best For |
|-------|-----------|---------|
| **Low** | Fast, minimal reasoning | Quick bill lookups |
| **Medium** | Balanced speed and depth | General Ask AI use |
| **High** | Deep reasoning, slower | Complex spending analysis |

Choose **Medium** as a sensible default for most households.

### Step 4 — Appearance Settings

![Appearance settings screen](/img/screenshots/mobile/Appearance-Settings-Screen-01.jpeg)

You can also configure the app theme (Light / Dark / System) from the **Appearance** section within Settings. Toggle it off if you prefer a cleaner interface or want to reduce AI API usage.

## Multiple Providers

You can add keys for all three providers and switch between them in **Ask AI** using the model selector. Each provider's key is stored separately and securely.

## Security

Your API keys are stored only in your browser session and sent directly to the AI provider. YesBill never stores, logs, or shares your API keys on any server or database. Your keys remain private and under your control at all times.

## Removing a Key

1. Tap **Settings → AI Configuration**
2. Tap **Remove** next to the provider
3. Confirm the removal

After removing all keys, AI features will be disabled until you add a new key.
