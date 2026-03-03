import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "";
const BREVO_FROM_NAME = Deno.env.get("BREVO_FROM_NAME") ?? "YesBill";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const NOTIFY_EMAIL = "ishanrock1234@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Simple in-memory rate limiter ──────────────────────────────────────────
// Tracks IP → { count, windowStart }. Max 5 submissions per 60-min window.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ── Edge Function ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get submitter IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Rate limiting
  if (isRateLimited(ip)) {
    console.warn(`[contact-form] Rate limited IP: ${ip}`);
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    first_name?: string;
    last_name?: string;
    email?: string;
    message?: string;
    _hp?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { first_name, last_name, email, message, _hp } = body;

  // ── Honeypot check ────────────────────────────────────────────────────────
  // If the hidden _hp field is non-empty, treat as bot — return 200 silently
  if (_hp && _hp.trim() !== "") {
    console.warn(`[contact-form] Honeypot triggered from IP: ${ip}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Basic validation ──────────────────────────────────────────────────────
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !message?.trim()) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Save to Supabase ───────────────────────────────────────────────────────
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error: dbError } = await adminClient.from("contact_submissions").insert({
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    honeypot: _hp ?? "",
    ip_address: ip,
  });

  if (dbError) {
    console.error("[contact-form] DB insert error:", dbError.message);
    return new Response(JSON.stringify({ error: "Failed to save submission" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Send branded email ────────────────────────────────────────────────────
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    console.warn("[contact-form] Brevo not configured — skipping email");
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = buildHtml(first_name.trim(), last_name.trim(), email.trim(), message.trim());

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
      to: [{ email: NOTIFY_EMAIL, name: "YesBill Team" }],
      replyTo: { email: email.trim(), name: `${first_name.trim()} ${last_name.trim()}` },
      subject: `New contact form message from ${first_name.trim()} ${last_name.trim()}`,
      htmlContent: html,
    }),
  });

  const responseText = await brevoRes.text();
  console.log(`[contact-form] Brevo ${brevoRes.status}: ${responseText.slice(0, 200)}`);

  if (!brevoRes.ok) {
    console.error("[contact-form] Brevo error:", responseText);
    // Still return success to user — message was saved to DB
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// ── Email template ─────────────────────────────────────────────────────────
function buildHtml(
  firstName: string,
  lastName: string,
  email: string,
  message: string
): string {
  const fullName = `${firstName} ${lastName}`;
  const receivedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }) + " IST";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;background:#4F46E5;border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">YesBill</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#fff;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;">

              <!-- Accent bar -->
              <tr>
                <td style="background:linear-gradient(90deg,#4F46E5,#7C3AED);height:4px;"></td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F172A;">
                    New Contact Form Message
                  </h1>
                  <p style="margin:0 0 28px;font-size:14px;color:#64748B;">Received on ${receivedAt}</p>

                  <!-- Contact details -->
                  <div style="background:#F8FAFC;border-radius:10px;padding:20px 24px;margin-bottom:24px;border:1px solid #E5E7EB;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.8px;">From</span><br/>
                          <span style="font-size:15px;font-weight:600;color:#0F172A;">${fullName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.8px;">Email</span><br/>
                          <a href="mailto:${email}" style="font-size:15px;color:#4F46E5;text-decoration:none;">${email}</a>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Message -->
                  <div style="margin-bottom:8px;">
                    <span style="font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.8px;">Message</span>
                  </div>
                  <div style="background:#FAFAFA;border-left:3px solid #4F46E5;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                  </div>

                  <!-- Reply CTA -->
                  <div style="text-align:center;">
                    <a href="mailto:${email}?subject=Re: Your YesBill enquiry"
                       style="display:inline-block;background:#4F46E5;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
                      Reply to ${firstName}
                    </a>
                  </div>
                </td>
              </tr>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                This message was submitted via the YesBill contact form.
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
