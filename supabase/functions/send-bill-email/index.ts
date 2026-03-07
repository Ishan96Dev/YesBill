import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "bills@yesbill.app";
const BREVO_FROM_NAME = Deno.env.get("BREVO_FROM_NAME") ?? "YesBill";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://yesbill.vercel.app";
const CURRENT_YEAR = new Date().getFullYear();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Build HTML (Outlook-compatible table-based layout) ─────────────────────
function buildBillEmail(params: {
  user_name: string;
  month: string;
  total: number;
  currency: string;
  bill_title: string;
  services_count: number;
  ai_summary: string;
  recommendation: string;
  pdf_url?: string;
  services?: { name: string; total: number }[];
}): string {
  const {
    user_name,
    month,
    total,
    currency,
    bill_title,
    services_count,
    ai_summary,
    recommendation,
    pdf_url,
    services = [],
  } = params;

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  // ── Service rows — bgcolor on each <td> so Outlook renders the alternating rows
  const serviceRows = services.length > 0
    ? services.map((s, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#F9FAFB";
        const amt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(s.total);
        return `<tr>
              <td bgcolor="${bg}" style="background-color:${bg}; padding: 12px 16px; color: #374151; font-size: 14px; border-bottom: 1px solid #E5E7EB;">${escHtml(s.name)}</td>
              <td bgcolor="${bg}" style="background-color:${bg}; padding: 12px 16px; color: #374151; font-size: 14px; text-align: right; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${currency}${amt}</td>
            </tr>`;
      }).join("")
    : `<tr>
         <td colspan="2" bgcolor="#ffffff" style="background-color:#ffffff; padding: 12px 16px; color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">${escHtml(bill_title)}</td>
       </tr>`;

  // ── PDF download button (bulletproof VML for Outlook)
  const pdfSection = pdf_url
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 0;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escHtml(pdf_url)}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="20%" strokecolor="#0D9488" fillcolor="#0D9488">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Download PDF Bill</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${escHtml(pdf_url)}" style="display:inline-block;background-color:#0D9488;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;mso-padding-alt:0;">&#x1F4C4; Download PDF Bill</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>`
    : "";

  // ── Recommendation block inside AI Insights
  const recommendationBlock = recommendation
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px;">
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 8px; padding: 14px 16px; border-left: 4px solid #FCD34D;">
            <p style="margin: 0 0 6px; color: #92400E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">&#x1F4A1; Recommendation</p>
            <p style="margin: 0; color: #451A03; font-size: 13px; line-height: 1.6;">${escHtml(recommendation)}</p>
          </td>
        </tr>
      </table>`
    : "";

  return `<!--
  YesBill - Bill Generated Notification Email
  Outlook-compatible: uses bgcolor attributes + VML buttons, no CSS gradients
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${escHtml(month)} Bill - YesBill</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, li { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdfa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0fdfa" style="background-color: #f0fdfa; padding: 40px 20px;">
    <tr>
      <td align="center" valign="top">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td bgcolor="#0F766E" style="background-color: #0F766E; padding: 40px 40px 36px; text-align: center; border-radius: 16px 16px 0 0;">
              <!-- Logo in white pill -->
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 20px; padding: 12px 20px; margin-bottom: 16px;">
                    <img src="https://dmabraziqscumpbwhjbf.supabase.co/storage/v1/object/public/branding/yesbill_logo_black.png?width=280&amp;quality=85"
                         alt="YesBill" width="140" height="auto"
                         style="width: 140px; max-width: 140px; height: auto; display: block;"
                         border="0">
                  </td>
                </tr>
              </table>
              <p style="margin: 14px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">Daily Service Billing Tracker</p>
              <!-- Badge -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top: 12px;">
                <tr>
                  <td bgcolor="#1B8980" style="background-color: #1B8980; border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 4px 14px;">
                    <p style="margin: 0; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">BILL AUTO-GENERATED</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ GREETING ═══ -->
          <tr>
            <td style="padding: 40px 40px 0;">
              <h2 style="margin: 0 0 10px; color: #0F172A; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                Hi ${escHtml(user_name)}, your bill is ready! &#x1F389;
              </h2>
              <p style="margin: 0; color: #64748B; font-size: 15px; line-height: 1.7;">
                Your <strong style="color: #0F766E;">${escHtml(bill_title)}</strong> has been auto-generated for <strong style="color: #0F172A;">${escHtml(month)}</strong>.
              </p>
            </td>
          </tr>

          <!-- ═══ SERVICE BREAKDOWN ═══ -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin: 0 0 12px; color: #0F172A; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Service Breakdown</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E5E7EB; border-radius: 10px;">
                <!-- Header row -->
                <tr>
                  <th bgcolor="#F8FAFC" style="background-color: #F8FAFC; padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB;">Service</th>
                  <th bgcolor="#F8FAFC" style="background-color: #F8FAFC; padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB;">Amount</th>
                </tr>
                <!-- Service rows -->
                ${serviceRows}
                <!-- Total row -->
                <tr>
                  <td bgcolor="#0F766E" style="background-color: #0F766E; padding: 14px 16px; color: #ffffff; font-size: 14px; font-weight: 700; border-radius: 0 0 0 10px;">Total</td>
                  <td bgcolor="#0F766E" style="background-color: #0F766E; padding: 14px 16px; color: #ffffff; font-size: 16px; font-weight: 800; text-align: right; border-radius: 0 0 10px 0;">${currency}${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ TOTAL AMOUNT DUE ═══ -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#ECFDF5" style="background-color: #ECFDF5; border: 2px solid #6EE7B7; border-radius: 12px; padding: 20px 24px; text-align: center;">
                    <p style="margin: 0 0 6px; color: #065F46; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">Total Amount Due</p>
                    <p style="margin: 0 0 4px; color: #064E3B; font-size: 30px; font-weight: 900; letter-spacing: -1px;">${currency}${formattedTotal}</p>
                    <p style="margin: 0; color: #047857; font-size: 13px; font-weight: 500;">${services_count} service${services_count === 1 ? "" : "s"} tracked &bull; ${escHtml(month)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ AI INSIGHTS ═══ -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#FFFBEB" style="background-color: #FFFBEB; border: 2px solid #FDE68A; border-radius: 12px; padding: 20px 24px;">
                    <p style="margin: 0 0 10px; color: #78350F; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">&#x2B50; AI Insights</p>
                    <p style="margin: 0; color: #451A03; font-size: 14px; line-height: 1.7;">${escHtml(ai_summary)}</p>
                    ${recommendationBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ CTA BUTTONS ═══ -->
          <tr>
            <td style="padding: 24px 40px 0;">
              ${pdfSection}
              <!-- View Full Bill button (bulletproof VML) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${SITE_URL}/bills" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="20%" strokecolor="#0F766E" fillcolor="#0F766E">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Full Bill &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${SITE_URL}/bills" style="display:inline-block;background-color:#0F766E;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;mso-padding-alt:0;">View Full Bill &rarr;</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; padding: 32px 40px; text-align: center; border-top: 2px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                This is an automated notification from YesBill.<br>
                You're receiving this because you have email notifications enabled.
              </p>
              <p style="margin: 0 0 16px; color: #94A3B8; font-size: 12px;">
                <a href="${SITE_URL}/settings" style="color: #0F766E; text-decoration: none;">Manage notification preferences</a>
              </p>
              <p style="margin: 0; color: #CBD5E1; font-size: 12px;">
                &copy; ${CURRENT_YEAR} YesBill &bull; Daily Service Billing Tracker
              </p>
            </td>
          </tr>

        </table><!-- /Card -->
      </td>
    </tr>
  </table><!-- /Outer wrapper -->

</body>
</html>`;
}

/** Escape HTML special characters to prevent XSS */
function escHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Edge Function handler ──────────────────────────────────────────────────
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

  if (!BREVO_API_KEY) {
    console.error("[send-bill-email] BREVO_API_KEY is not set");
    return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const to_email = (body.to_email as string)?.trim();
  const to_name = (body.to_name as string) || "there";
  const user_name = (body.user_name as string) || to_name;
  const month = (body.month as string) || "this month";
  const total = Number(body.total) || 0;
  const currency = (body.currency as string) || "INR";
  const bill_title = (body.bill_title as string) || "Your Bill";
  const services_count = Number(body.services_count) || 1;
  const ai_summary = (body.ai_summary as string) || `Your ${month} bill totals ${currency}${total.toFixed(2)}.`;
  const recommendation = (body.recommendation as string) || "";
  const pdf_url = (body.pdf_url as string) || "";
  const services = (body.services as { name: string; total: number }[]) || [];

  if (!to_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to_email)) {
    return new Response(JSON.stringify({ error: "Invalid or missing to_email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const htmlContent = buildBillEmail({
    user_name,
    month,
    total,
    currency,
    bill_title,
    services_count,
    ai_summary,
    recommendation,
    pdf_url,
    services,
  });

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  const brevoPayload = {
    sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
    to: [{ email: to_email, name: to_name }],
    subject: `Your ${month} Bill is Ready — ${currency}${formattedTotal} | YesBill`,
    htmlContent,
  };

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    const responseText = await resp.text();
    console.log(`[send-bill-email] Brevo HTTP ${resp.status} for ${to_email}: ${responseText.slice(0, 200)}`);

    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: `Brevo error: ${resp.status}`, detail: responseText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[send-bill-email] Fetch error for ${to_email}:`, err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
