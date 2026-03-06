import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "";
const BREVO_FROM_NAME = Deno.env.get("BREVO_FROM_NAME") ?? "YesBill";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://app.yesbill.com";

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
  const changedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
  const resetUrl = `${FRONTEND_URL}/forgot-password`;

  const html = buildHtml(userName, changedAt, resetUrl);

  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    console.error("[notify-password-change] Missing secrets: BREVO_API_KEY or BREVO_FROM_EMAIL");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
      bcc: [{ email: "ishanrock1234@gmail.com", name: "YesBill Admin" }],
      subject: "Your YesBill password has been changed",
      htmlContent: html,
    }),
  });

  const responseText = await brevoRes.text();
  console.log(`[notify-password-change] Brevo ${brevoRes.status} for ${userEmail}: ${responseText.slice(0, 200)}`);

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

function buildHtml(userName: string, changedAt: string, resetUrl: string): string {
  return `<!--
  YesBill - Password Changed Notification Email
-->
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - YesBill</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 40px 40px 36px; text-align: center;">
              <!-- Logo in white rounded container -->
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
              <!-- Lock Icon -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
                  🔒
                </div>
              </div>

              <h2 style="margin: 0 0 10px; color: #0F172A; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                Password Changed
              </h2>

              <p style="margin: 0 0 30px; color: #64748B; font-size: 16px; line-height: 1.7; text-align: center;">
                Hi ${userName}, your YesBill account password was successfully updated.
              </p>

              <!-- Success Info Card -->
              <div style="background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%); border: 2px solid #A7F3D0; border-radius: 14px; padding: 24px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0 0 8px; color: #065F46; font-size: 15px; font-weight: 700;">
                  ✅ Password updated successfully
                </p>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                  Changed on: <strong>${changedAt}</strong>
                </p>
              </div>

              <!-- Security Warning -->
              <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%); border-left: 4px solid #F59E0B; padding: 22px 24px; border-radius: 12px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; color: #78350F; font-size: 15px; font-weight: 700;">
                  ⚠️ Wasn't you?
                </p>
                <p style="margin: 0 0 16px; color: #92400E; font-size: 14px; line-height: 1.7;">
                  If you didn't make this change, your account may be compromised. <strong>Reset your password immediately</strong> and contact our support team.
                </p>
                <!-- Reset CTA (Bulletproof) -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="25%" strokecolor="#F59E0B" fillcolor="#F59E0B">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:600;">🔑 Reset My Password</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; mso-padding-alt: 0;">
                        🔑 Reset My Password
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Security Tips -->
              <div style="background-color: #F0F9FF; border: 2px solid #BAE6FD; padding: 20px; border-radius: 12px;">
                <p style="margin: 0 0 12px; color: #0C4A6E; font-size: 15px; font-weight: 700;">
                  🛡️ Keep your account secure
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #0369A1; font-size: 14px; line-height: 1.7;">
                  <li style="margin-bottom: 8px;">Never share your password with anyone</li>
                  <li style="margin-bottom: 8px;">Use a unique password not used on other sites</li>
                  <li style="margin-bottom: 8px;">Enable Google sign-in as a backup login method</li>
                  <li style="margin-bottom: 0;">Contact support if you notice any suspicious activity</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 40px 40px 35px; text-align: center; border-top: 2px solid #E2E8F0;">
              <p style="margin: 0 0 20px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                This is an automated security notification from YesBill.<br>
                You're receiving this because a password change was made to your account.
              </p>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 8px; color: #64748B; font-size: 13px; font-weight: 600;">
                  Need Help?
                </p>
                <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                  Contact our support team at <a href="mailto:support@yesbill.com" style="color: #059669; text-decoration: none;">support@yesbill.com</a>
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
