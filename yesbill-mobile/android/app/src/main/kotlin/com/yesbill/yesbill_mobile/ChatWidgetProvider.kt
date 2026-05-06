package com.yesbill.yesbill_mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider

/**
 * Chat widget — 2×2
 *
 * Reads data written by Flutter's WidgetService.pushChatData():
 *   chat_greeting — personalized greeting, e.g. "Hello, Ishan!"
 *
 * Tapping the widget opens yesbill://chat deep link.
 */
class ChatWidgetProvider : HomeWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences,
    ) {
        val greeting = widgetData.getString("chat_greeting", "Hello!") ?: "Hello!"

        // Tap → open chat screen
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("yesbill://chat")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val tapPending = PendingIntent.getActivity(
            context, 1003, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_chat).apply {
                setTextViewText(R.id.widget_chat_greeting, greeting)
                setOnClickPendingIntent(R.id.widget_chat_root, tapPending)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
