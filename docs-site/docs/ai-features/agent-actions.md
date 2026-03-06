---
id: agent-actions
title: Agent Actions
sidebar_position: 4
---

# Agent Actions

The AI Agent can take real actions on your YesBill account — not just answer questions. Every action shows a **confirmation card** before anything is changed, so you're always in control.

:::tip How it works
1. Tell the Agent what you want in plain language
2. The Agent shows you a confirmation card with a preview of the change
3. Tap **Confirm Changes** to apply — or **Cancel** to abort
:::

---

## Generate Bill

Ask the Agent to generate a monthly bill for one or more of your services.

**Example prompts:**
- "Generate my February bill"
- "Create a bill for milk and tiffin for January 2026"
- "Generate bill for all services last month and email it to me"

**What the Agent collects before generating:**
1. Which services to include (by name or "all")
2. Which month (YYYY-MM)
3. Whether to send the bill to your email

**Confirmation card shows:**
- Estimated total (calculated from your calendar records, no AI needed for the estimate)
- Month and included services

**After confirming:**
- A full AI-powered bill is generated with insights and recommendations
- A notification is sent: "Bill generated"
- If you requested email, the bill is sent to your account email (respects your notification preferences)

:::note
The estimated total on the confirmation card is a quick estimate. The final bill total uses AI analysis of your delivery records and may differ slightly.
:::

---

## Create Service

Ask the Agent to add a new service to your account without going to the Services page.

**Example prompts:**
- "Add a new milk service, ₹30 per day, home delivery"
- "Create a Netflix subscription, ₹649 per month"
- "Add an electricity service, utility type"

**Required fields the Agent will ask for:**
| Field | Description |
|-------|-------------|
| Name | Service name (e.g., "Milk", "Tiffin", "Netflix") |
| Price | Amount per billing cycle |
| Delivery type | `home_delivery`, `subscription`, `utility`, `payment`, or `visit_based` |

**Optional fields (Agent infers sensible defaults):**
- Frequency type (daily/weekly/monthly)
- Schedule (morning/afternoon/evening)
- Icon
- Notes
- Billing day
- Start / end date

**Confirmation card shows:** All fields in a mini table — Name, Price, Type, Schedule, and any extras.

**After confirming:**
- Service is created as an active consumer-role service
- A notification is sent: "New Service Added"
- Service immediately appears in your Services page

:::info
Provider-role service creation (for service providers managing multiple customers) is a planned feature — see the [Roadmap](/roadmap).
:::

---

## Edit Service

Ask the Agent to update one or more fields of an existing service.

**Example prompts:**
- "Change milk price to ₹35"
- "Update my tiffin schedule to morning and change the notes to 'lunch only on weekdays'"
- "Rename Netflix to Netflix Premium and set price to ₹799"

**How the Agent finds your service:**
Just say the service name — the Agent matches it directly. No need to look up IDs.

**Editable fields:**
| Field | Description |
|-------|-------------|
| name | Rename the service |
| price | New price |
| notes | Update description/notes |
| billing_day | Day of month for billing |
| schedule | morning / afternoon / evening / anytime |
| icon | Icon identifier |
| type | daily / weekly / monthly / custom |
| delivery_type | Change delivery/billing model |
| start_date | Start date (YYYY-MM-DD) |
| end_date | End date (YYYY-MM-DD) |

**Confirmation card shows:** Only the fields being changed, with old value → new value for each.

**After confirming:**
- All specified fields are updated atomically
- A notification is sent: "Service Updated: [Service Name]"

:::tip
You can change multiple fields at once in a single message. The Agent collects everything before showing the confirmation card.
:::

---

## Toggle Service Active / Inactive

Ask the Agent to activate or deactivate a service.

**Example prompts:**
- "Deactivate my milk service — I'm going on vacation"
- "Reactivate tiffin service"
- "Turn off Netflix for now"

**How it works:**
- The Agent asks (or infers from context) which service to toggle
- Inactive services are hidden from the daily calendar and won't be included in auto-generated bills
- You can reactivate at any time

**After confirming:**
- Service active state is updated
- A notification is sent: "Service Activated" or "Service Deactivated"

---

## Mark Bill as Paid / Unpaid

Ask the Agent to record a payment for a generated bill.

**Example prompts:**
- "Mark my January bill as paid"
- "I paid the February bill via UPI"
- "Mark the milk bill unpaid — payment bounced"

**What the Agent collects:**
1. Which bill (by month or bill title)
2. Paid or unpaid
3. Payment method (optional — e.g., "UPI", "cash", "bank transfer")

**After confirming:**
- Bill payment status is updated
- If marked paid, a notification is sent: "Payment Recorded"

---

## Update Calendar Day

Ask the Agent to mark a service delivery for a specific past day.

**Example prompts:**
- "Mark today's milk as delivered"
- "Yesterday's tiffin was skipped"
- "Mark 2026-03-05 electricity as delivered"
- "Today's newspaper — mark as not delivered"

**Rules:**
- Only dates within the **last 30 days** (including today) can be updated
- Future dates are not allowed
- Accepted date formats: `today`, `yesterday`, `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`
- For multiple dates, mention them all — the Agent handles each one

**Status values:**
| Status | Meaning |
|--------|---------|
| `delivered` | Service was received/used |
| `skipped` | Service was skipped/not needed |
| `not_delivered` | Service was not delivered |

**After confirming:**
- Calendar record is updated
- Affects your monthly bill calculation for quantity-based services

---

## Confirmation Card

Every action above shows a confirmation card in the chat before applying changes:

```
┌─────────────────────────────────────────────┐
│ ⚠️  Action Required                         │
├─────────────────────────────────────────────│
│ Edit 'Milk' — update: Price, Schedule        │
│                                             │
│ PRICE    ₹30.00  →  ₹35.00                  │
│ SCHEDULE Morning  →  Evening                │
├─────────────────────────────────────────────│
│ [  Cancel  ]        [  Confirm Changes  ]   │
└─────────────────────────────────────────────┘
```

- **Cancel** — discards the action, nothing is changed
- **Confirm Changes** — applies the action immediately
- If anything goes wrong, an error message appears inline with a chance to retry

---

## Tips & Best Practices

- **Be specific with service names** — say "milk" not "my morning delivery" to avoid ambiguity
- **Batch calendar updates** — "mark Monday, Tuesday and Wednesday milk as delivered" works in one message
- **Check the diff before confirming** — the confirmation card shows exactly what will change
- **Agent remembers context** — within the same conversation you don't need to repeat service names
