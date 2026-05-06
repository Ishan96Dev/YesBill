package com.yesbill.yesbill_mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider

/**
 * Calendar widget — 4×2
 *
 * Reads data written by Flutter's WidgetService.pushCalendarData():
 *   cal_date       — formatted date string e.g. "Wed, 6 May"
 *   cal_delivered  — number of services delivered today
 *   cal_total      — total active services today
 *   cal_s{1-4}_name    — service display name (null = hide row)
 *   cal_s{1-4}_status  — "delivered" | "absent" | "pending"
 *
 * Tapping the widget opens yesbill://calendar deep link.
 */
class CalendarWidgetProvider : HomeWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences,
    ) {
        val date = widgetData.getString("cal_date", "Today") ?: "Today"
        val delivered = widgetData.getString("cal_delivered", "–") ?: "–"
        val total = widgetData.getString("cal_total", "–") ?: "–"

        val names = (1..4).map { i -> widgetData.getString("cal_s${i}_name", null) }
        val statuses = (1..4).map { i ->
            widgetData.getString("cal_s${i}_status", "pending") ?: "pending"
        }

        val containerIds = listOf(
            R.id.widget_cal_s1, R.id.widget_cal_s2,
            R.id.widget_cal_s3, R.id.widget_cal_s4,
        )
        val nameIds = listOf(
            R.id.widget_cal_s1_name, R.id.widget_cal_s2_name,
            R.id.widget_cal_s3_name, R.id.widget_cal_s4_name,
        )
        val dotIds = listOf(
            R.id.widget_cal_s1_dot, R.id.widget_cal_s2_dot,
            R.id.widget_cal_s3_dot, R.id.widget_cal_s4_dot,
        )

        // Tap → open calendar screen
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("yesbill://calendar")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val tapPending = PendingIntent.getActivity(
            context, 1001, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_calendar).apply {
                setTextViewText(R.id.widget_cal_date, date)
                setTextViewText(R.id.widget_cal_count, delivered)
                setTextViewText(R.id.widget_cal_total, "/$total")

                names.forEachIndexed { i, name ->
                    if (name != null) {
                        setViewVisibility(containerIds[i], View.VISIBLE)
                        setTextViewText(nameIds[i], name)

                        val (symbol, color) = when (statuses[i]) {
                            "delivered" -> Pair("✓", 0xFF10B981.toInt())
                            "absent"    -> Pair("–", 0xFFEF4444.toInt())
                            else        -> Pair("·", 0x80FFFFFF.toInt())
                        }
                        setTextViewText(dotIds[i], symbol)
                        setTextColor(dotIds[i], color)
                    } else {
                        setViewVisibility(containerIds[i], View.GONE)
                    }
                }

                setOnClickPendingIntent(R.id.widget_cal_root, tapPending)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
