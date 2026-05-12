---
id: understanding-bills
title: Understanding Bills
sidebar_position: 1
displayed_sidebar: mobileSidebar
---

# Understanding Bills

The **Bills** tab shows your auto-generated monthly bills for every service you track.

## Bills List

<PhoneFrame src="/img/screenshots/mobile/Bills-screen-01.jpeg" alt="Bills screen" />

Each bill card shows:
- Service name and billing period (month/year)
- Total amount due
- Status: **Pending**, **Paid**, or **Overdue**

## How Bills Are Calculated

YesBill calculates bills based on your service type:

- **Home Delivery / Visit-based** — counts the number of marked days in the calendar × rate per day
- **Utility / Subscription** — fixed monthly amount regardless of calendar marks
- **Payment** — the amount you entered when recording the payment

## Viewing a Bill

1. Tap **Bills** in the bottom navigation bar.
2. Tap any bill card to see the full breakdown:
   - Day-by-day list of deliveries/visits
   - Subtotals per week
   - Grand total

## Marking a Bill as Paid

1. Open the bill by tapping its card.
2. Tap **Mark as Paid**.

![Mark as paid button](/img/screenshots/Bill-Paid-status-(Mark-as-paid)-01.png)

![Mark as paid confirmation modal](/img/screenshots/Mark-as-paid-modal-01.png)

3. The bill status changes to **Paid** and is moved to your payment history.

## Exporting Bills

You can export bills as PDF or CSV:

![Export bill as PDF or CSV](/img/screenshots/Bill-Download-as-PDF-Export-CSV-01.png)

- **Download as PDF** — a formatted bill ready to share with your service provider
- **Export as CSV** — raw data for use in spreadsheets

## Bill History

All paid bills are kept in your history. Scroll down in the Bills screen or use the filter to view older bills.

![Previous bills history](/img/screenshots/Previous-bills-01.png)

:::tip
Bills are generated automatically at the end of each month. You can also generate them manually at any time — see [Auto Generation](/mobile/bills/auto-generation).
:::

## AI Bill Summary

If you have an AI provider configured, YesBill can generate a plain-English explanation of any bill.

1. Open a bill by tapping its card.
2. Tap the **AI Summary** button (sparkle icon).
3. The AI reads your delivery data and produces a concise summary:
   - How many deliveries occurred across the month
   - Any unusual gaps or clusters in delivery patterns
   - Comparison with previous months (when available)
   - Total cost breakdown

This feature uses your configured AI provider and counts against your API usage.

See [AI Configuration](/mobile/settings/ai-configuration) if you haven't set up a provider yet.
