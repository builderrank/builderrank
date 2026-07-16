import { selectSupabaseRows, sendJson, supabaseServiceConfigured } from "./_shared.js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hosepwwflfpqgemfcafj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Tq-L9aiYVbdtij2JL3oW3Q_FBDNokzQ";
const ADDITIONAL_REPORT_PAYMENT_URL = process.env.STRIPE_ADDITIONAL_REPORT_PAYMENT_URL || "https://buy.stripe.com/7sYbJ10Gd8TM9NqcVa8bS01";

export default async function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const keepalive = await fetch(`${SUPABASE_URL}/rest/v1/reports?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    const body = await keepalive.text();
    const awake = [200, 204, 401, 403].includes(keepalive.status);
    const checks = [
      {
        name: "supabase_rest_awake",
        ok: awake,
        detail: awake ? "Supabase REST responded." : body.slice(0, 500),
      },
      {
        name: "additional_report_payment_url",
        ok: Boolean(ADDITIONAL_REPORT_PAYMENT_URL),
        detail: ADDITIONAL_REPORT_PAYMENT_URL ? "Additional report checkout URL is configured." : "Missing $10 Stripe payment link.",
      },
    ];

    if (supabaseServiceConfigured()) {
      const businesses = await selectSupabaseRows("br_businesses", {
        select: "id,site_id,tracking_status",
        site_id: "eq.br_builderrank",
        limit: "1",
      });
      checks.push({
        name: "builderrank_site_signal_workspace",
        ok: Boolean(businesses[0]?.id),
        detail: businesses[0]?.id ? `Workspace ${businesses[0].site_id} found.` : "Missing br_builderrank workspace row.",
      });

      const events = await selectSupabaseRows("br_website_events", {
        select: "id,event,received_at",
        site_id: "eq.br_builderrank",
        order: "received_at.desc",
        limit: "1",
      });
      checks.push({
        name: "site_signal_events_table",
        ok: Array.isArray(events),
        detail: events[0]?.received_at ? `Latest br_builderrank event at ${events[0].received_at}.` : "Traffic table readable; no events found yet.",
      });
    } else {
      checks.push({
        name: "supabase_service_role",
        ok: false,
        detail: "SUPABASE_SERVICE_ROLE_KEY is not configured; cannot verify private traffic tables.",
      });
    }

    const ok = checks.every((check) => check.ok);
    sendJson(response, ok ? 200 : 503, {
      ok,
      service: "supabase-keepalive",
      supabaseStatus: keepalive.status,
      checkedAt: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    sendJson(response, 503, {
      ok: false,
      service: "supabase-keepalive",
      error: "Could not reach Supabase.",
      detail: error.message,
      checkedAt: new Date().toISOString(),
    });
  }
}
