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
 * Services widget — 4×2
 *
 * Reads data written by Flutter's WidgetService.pushServicesData():
 *   svc_count          — total active services count string
 *   svc_s{1-4}_name    — service display name (null = hide row)
 *   svc_s{1-4}_detail  — rate string, e.g. "₹45/day"
 *
 * Tapping the widget opens yesbill://services deep link.
 */
class ServicesWidgetProvider : HomeWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences,
    ) {
        val count = widgetData.getString("svc_count", "0") ?: "0"

        val names = (1..4).map { i -> widgetData.getString("svc_s${i}_name", null) }
        val details = (1..4).map { i ->
            widgetData.getString("svc_s${i}_detail", "") ?: ""
        }

        val rowIds = listOf(
            R.id.widget_svc_row1, R.id.widget_svc_row2,
            R.id.widget_svc_row3, R.id.widget_svc_row4,
        )
        val nameIds = listOf(
            R.id.widget_svc_s1_name, R.id.widget_svc_s2_name,
            R.id.widget_svc_s3_name, R.id.widget_svc_s4_name,
        )
        val detailIds = listOf(
            R.id.widget_svc_s1_detail, R.id.widget_svc_s2_detail,
            R.id.widget_svc_s3_detail, R.id.widget_svc_s4_detail,
        )

        // Tap → open services screen
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("yesbill://services")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val tapPending = PendingIntent.getActivity(
            context, 1002, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_services).apply {
                val label = if (count == "1") "1 active" else "$count active"
                setTextViewText(R.id.widget_svc_count, label)

                names.forEachIndexed { i, name ->
                    if (name != null) {
                        setViewVisibility(rowIds[i], View.VISIBLE)
                        setTextViewText(nameIds[i], name)
                        setTextViewText(detailIds[i], details[i])
                    } else {
                        setViewVisibility(rowIds[i], View.GONE)
                    }
                }

                setOnClickPendingIntent(R.id.widget_svc_root, tapPending)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
