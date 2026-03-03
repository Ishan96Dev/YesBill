---
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
