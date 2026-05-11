---
id: auto-generation
title: Auto Bill Generation
sidebar_position: 2
---

# Auto Bill Generation

YesBill can generate bills automatically at month-end, or you can trigger generation manually whenever you need.

## Generating a Bill

![Generate bill screen](/img/screenshots/mobile/Generate-Bill-Screen-01.jpeg)

1. Tap **Bills** in the bottom navigation bar.
2. Tap the **Generate Bill** button (or the **+** icon).
3. Select the **service** and **billing month**.
4. Review the preview showing the calculated total.
5. Tap **Generate** to confirm.

The bill is added to your Bills list instantly.

## Automatic Monthly Generation

YesBill schedules automatic bill generation at the end of each month. You'll receive a push notification when bills are ready.

:::tip
Make sure all calendar marks for the month are complete before the auto-generation runs, or trigger it manually after you've finished marking.
:::

## How Generation Works

1. YesBill looks at your tracking data for the month.
2. For delivery/visit services: counts marked days.
3. For utility/subscription services: uses the configured monthly rate.
4. Creates a bill record with the calculated total.

## What If Data Is Missing?

If you forgot to mark some days:

- Go back to the Calendar and mark the missing days.
- Then generate (or regenerate) the bill.
- Use **Ask AI** to ask *"Did I miss any days this month?"* to find gaps.

## Regenerating Bills

If you mark more days after a bill is generated, you can regenerate it:

1. Open the bill by tapping its card.
2. Tap **Regenerate**.
3. The bill total is recalculated with updated data.

:::warning
Regenerating a bill overwrites the existing total. If you've already marked the bill as Paid, be careful before regenerating.
:::
