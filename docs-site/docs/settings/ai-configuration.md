---
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

## Ollama (Local Models)

YesBill supports **Ollama** — run AI models entirely on your own machine with no API key and no usage costs.

To use Ollama you need to:
1. Install Ollama and pull a model
2. Start Ollama with the correct host binding
3. Expose it via a Cloudflare Tunnel so YesBill's backend can reach it
4. Paste the tunnel URL in Settings → Ollama Base URL → Fetch Models → Save

See the full step-by-step guide: [Ollama Setup →](./ollama-setup)
