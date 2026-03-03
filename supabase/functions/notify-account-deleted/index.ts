import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "";
const BREVO_FROM_NAME = Deno.env.get("BREVO_FROM_NAME") ?? "YesBill";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userEmail = user.email ?? "";

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

  const userName = profile?.display_name || userEmail.split("@")[0];
  const deletedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
  const supportUrl = "mailto:support@yesbill.com";

  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    console.error("[notify-account-deleted] Missing secrets: BREVO_API_KEY or BREVO_FROM_EMAIL");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = buildHtml(userName, deletedAt, supportUrl);

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
      to: [{ email: userEmail, name: userName }],
      subject: "Your YesBill account has been deleted",
      htmlContent: html,
    }),
  });

  const responseText = await brevoRes.text();
  console.log(`[notify-account-deleted] Brevo ${brevoRes.status} for ${userEmail}: ${responseText.slice(0, 200)}`);

  if (!brevoRes.ok) {
    return new Response(JSON.stringify({ error: responseText }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function buildHtml(userName: string, deletedAt: string, supportUrl: string): string {
  return `<!--
  YesBill - Account Deleted Notification Email
-->
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted - YesBill</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #475569; padding: 40px 40px 36px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 20px; padding: 12px 16px; margin-bottom: 16px;">
                <img src="https://dmabraziqscumpbwhjbf.supabase.co/storage/v1/object/public/branding/yesbill_logo_black.png?width=280&quality=85"
                     alt="YesBill"
                     style="width: 140px; height: auto; display: block; max-width: 140px;"
                     width="140"
                     height="auto"
                     loading="eager"
                     fetchpriority="high"
                     decoding="async"
                     onerror="this.style.display='none'">
              </div>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 15px; font-weight: 500;">
                Daily Service Billing Tracker
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <!-- Wave Icon -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
                  👋
                </div>
              </div>

              <h2 style="margin: 0 0 12px; color: #0F172A; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                Account Deleted
              </h2>

              <p style="margin: 0 0 32px; color: #64748B; font-size: 16px; line-height: 1.7; text-align: center;">
                Hi ${userName}, your YesBill account has been permanently deleted. We're sorry to see you go.
              </p>

              <!-- Confirmation Card -->
              <div style="background-color: #F8FAFC; border-left: 4px solid #64748B; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; color: #374151; font-size: 15px; font-weight: 700;">
                  ✅ Account permanently deleted
                </p>
                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                  Deleted on: <strong>${deletedAt}</strong>
                </p>
              </div>

              <!-- What was removed -->
              <div style="background-color: #F8FAFC; border-left: 4px solid #94A3B8; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #374151; font-size: 15px; font-weight: 700;">
                  🗑️ What has been removed:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #6B7280; font-size: 14px; line-height: 1.8;">
                  <li style="margin-bottom: 6px;">Your profile and account information</li>
                  <li style="margin-bottom: 6px;">All services and billing records</li>
                  <li style="margin-bottom: 6px;">Calendar data and payment history</li>
                  <li style="margin-bottom: 6px;">AI configuration and preferences</li>
                  <li style="margin-bottom: 0;">All other associated data</li>
                </ul>
              </div>

              <!-- Mistake / Come back section -->
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 12px; padding: 20px 24px;">
                <p style="margin: 0 0 10px; color: #1E40AF; font-size: 15px; font-weight: 700;">
                  💙 Was this a mistake?
                </p>
                <p style="margin: 0 0 18px; color: #1D4ED8; font-size: 14px; line-height: 1.7;">
                  Account deletion is permanent and cannot be undone. However, if you'd like to start fresh or if this was done in error, please contact our support team right away — we'll do our best to help.
                </p>
                <!-- Support CTA (Bulletproof) -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${supportUrl}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="25%" strokecolor="#3B82F6" fillcolor="#3B82F6">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:600;">📧 Contact Support</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${supportUrl}" style="display: inline-block; padding: 16px 40px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 15px; mso-padding-alt: 0;">
                        📧 Contact Support
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 40px 40px 35px; text-align: center; border-top: 2px solid #E2E8F0;">
              <p style="margin: 0 0 12px; color: #94A3B8; font-size: 14px; font-weight: 500;">
                Thank you for using YesBill. We hope to see you again someday. 🙏
              </p>
              <p style="margin: 0 0 20px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                This is a confirmation that your account has been permanently deleted.<br>
                You will no longer receive emails from us.
              </p>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 8px; color: #64748B; font-size: 13px; font-weight: 600;">
                  Questions or Concerns?
                </p>
                <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                  Contact our support team at <a href="mailto:support@yesbill.com" style="color: #64748B; text-decoration: none;">support@yesbill.com</a>
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #CBD5E1; font-size: 12px;">
                © 2026 YesBill. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
