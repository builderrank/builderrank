import { isAdminRequestAuthorized, readJsonBody, selectSupabaseRows, supabaseServiceConfigured } from "./_shared.js";

const allowedMethods = new Set(["GET", "POST", "OPTIONS"]);
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const REPORT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || "Builder Rank <support@builderrank.io>";
const REPORT_EMAIL_REPLY_TO = process.env.REPORT_EMAIL_REPLY_TO || "support@builderrank.io";
const TRACKING_ALERT_EMAIL_TO = process.env.TRACKING_ALERT_EMAIL_TO || process.env.REPORT_EMAIL_BCC || "";
const ADMIN_ALLOWED_ORIGIN = process.env.ADMIN_ALLOWED_ORIGIN || "https://builderrank.io";

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (!allowedMethods.has(request.method)) {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (!ADMIN_API_TOKEN) {
    response.status(503).json({ error: "ADMIN_API_TOKEN is not configured." });
    return;
  }

  if (!isAdminRequestAuthorized(request, ADMIN_API_TOKEN)) {
    response.status(401).json({ error: "Admin token required." });
    return;
  }

  if (!supabaseServiceConfigured()) {
    response.status(503).json({ error: "Supabase service role is not configured." });
    return;
  }

  try {
    const options = await requestOptions(request);
    const report = await buildTrackingHealthReport(options);
    const shouldNotify = options.notify && (report.stale.length > 0 || report.domainMismatch.length > 0 || report.needsLeadQa.length > 0);
    const notification = shouldNotify ? await sendTrackingAlert(report) : { sent: false };

    response.status(200).json({
      ok: true,
      ...report,
      notification,
    });
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: "Could not check tracking health.",
      detail: error.message,
    });
  }
}

async function requestOptions(request) {
  const url = new URL(request.url || "/", "https://builderrank.io");
  const body = request.method === "POST" ? await readJsonBody(request) : {};
  const staleHours = Number.parseInt(body.staleHours || url.searchParams.get("staleHours") || "24", 10);
  const notify = Boolean(body.notify || url.searchParams.get("notify") === "1");

  return {
    staleHours: Number.isFinite(staleHours) && staleHours > 0 ? Math.min(staleHours, 168) : 24,
    notify,
  };
}

async function buildTrackingHealthReport(options) {
  const businesses = await selectSupabaseRows("br_businesses", {
    select: "id,name,website_url,site_id,tracking_status,beta_status,updated_at",
    site_id: "not.is.null",
    order: "updated_at.desc",
    limit: "100",
  });
  const cutoff = new Date(Date.now() - options.staleHours * 60 * 60 * 1000);
  const rows = [];

  for (const business of businesses) {
    const recentEvents = await selectSupabaseRows("br_website_events", {
      select: "id,received_at,event,source_name,page_url",
      site_id: `eq.${business.site_id}`,
      received_at: `gte.${cutoff.toISOString()}`,
      order: "received_at.desc",
      limit: "25",
    });
    const lastEvents = recentEvents.length ? recentEvents : await selectSupabaseRows("br_website_events", {
      select: "id,received_at,event,source_name,page_url",
      site_id: `eq.${business.site_id}`,
      order: "received_at.desc",
      limit: "1",
    });
    const lastEvent = lastEvents[0] || null;
    const recentLeadEvents = recentEvents.filter((event) => isLeadEvent(event.event)).length;
    const stale = !recentEvents.length;
    const domainMismatch = !stale && recentEvents.some((event) => !eventMatchesBusinessDomain(event.page_url, business.website_url));
    const needsLeadQa = !stale && recentLeadEvents === 0;
    const healthStatus = stale ? "stale" : domainMismatch ? "domain_mismatch" : needsLeadQa ? "needs_lead_qa" : "healthy";

    rows.push({
      businessId: business.id,
      name: business.name,
      websiteUrl: business.website_url,
      siteId: business.site_id,
      trackingStatus: business.tracking_status,
      betaStatus: business.beta_status,
      recentEvents: recentEvents.length,
      recentLeadEvents,
      lastEventAt: lastEvent?.received_at || null,
      lastEventName: lastEvent?.event || "",
      lastSource: lastEvent?.source_name || "",
      lastPageUrl: lastEvent?.page_url || "",
      stale,
      domainMismatch,
      needsLeadQa,
      healthStatus,
    });
  }

  const stale = rows.filter((row) => row.stale);
  const domainMismatch = rows.filter((row) => row.domainMismatch);
  const needsLeadQa = rows.filter((row) => row.needsLeadQa);
  const healthy = rows.filter((row) => row.healthStatus === "healthy");

  return {
    checkedAt: new Date().toISOString(),
    staleAfterHours: options.staleHours,
    totalSites: rows.length,
    healthySites: healthy.length,
    staleSites: stale.length,
    domainMismatchSites: domainMismatch.length,
    noLeadQaSites: needsLeadQa.length,
    stale,
    domainMismatch,
    needsLeadQa,
    sites: rows,
  };
}

async function sendTrackingAlert(report) {
  const recipients = TRACKING_ALERT_EMAIL_TO.split(",").map((item) => item.trim()).filter(Boolean);

  if (!RESEND_API_KEY) return { sent: false, reason: "RESEND_API_KEY is not configured." };
  if (!recipients.length) return { sent: false, reason: "TRACKING_ALERT_EMAIL_TO is not configured." };

  const payload = {
    from: REPORT_EMAIL_FROM,
    to: recipients,
    reply_to: REPORT_EMAIL_REPLY_TO,
    subject: trackingAlertSubject(report),
    html: renderAlertHtml(report),
    text: renderAlertText(report),
  };

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    return { sent: false, reason: data?.message || "Resend could not send tracking alert." };
  }

  return { sent: true, id: data.id, to: recipients };
}

function renderAlertHtml(report) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:680px">
      <h1>Builder Rank Site Signal alert</h1>
      <p>${trackingAlertSummary(report)}</p>
      ${report.stale.length ? `
        <h2>Stale Site Signal</h2>
        <p>These connected sites had no events in the last ${report.staleAfterHours} hours.</p>
        <ul>
          ${report.stale.map((site) => renderAlertSiteHtml(site, "Re-test the snippet/plugin and confirm a page view stores." )).join("")}
        </ul>
      ` : ""}
      ${report.domainMismatch.length ? `
        <h2>Domain mismatch</h2>
        <p>These sites have recent events, but one or more events came from a page URL that does not match the workspace website.</p>
        <ul>
          ${report.domainMismatch.map((site) => renderAlertSiteHtml(site, "Confirm the snippet is installed on the production customer domain, not a staging or unrelated site.")).join("")}
        </ul>
      ` : ""}
      ${report.needsLeadQa.length ? `
        <h2>Needs lead-event QA</h2>
        <p>These sites have recent events, but no quote, form, phone, or email lead event yet.</p>
        <ul>
          ${report.needsLeadQa.map((site) => renderAlertSiteHtml(site, "Send a test quote, form, phone, or email event before customer review.")).join("")}
        </ul>
      ` : ""}
    </div>
  `;
}

function renderAlertSiteHtml(site, action) {
  return `
    <li>
      <strong>${escapeHtml(site.name)}</strong><br>
      ${escapeHtml(site.websiteUrl || "")}<br>
      Site ID: ${escapeHtml(site.siteId)}<br>
      Status: ${escapeHtml(site.healthStatus || "unknown")}<br>
      Recent events: ${Number(site.recentEvents || 0)} · Recent lead events: ${Number(site.recentLeadEvents || 0)}<br>
      Last page: ${escapeHtml(site.lastPageUrl || "")}<br>
      Last event: ${escapeHtml(site.lastEventAt || "Never")}<br>
      Action: ${escapeHtml(action)}
    </li>
  `;
}

function trackingAlertSubject(report) {
  const parts = [];
  if (report.staleSites) parts.push(`${report.staleSites} stale`);
  if (report.domainMismatchSites) parts.push(`${report.domainMismatchSites} domain mismatch`);
  if (report.noLeadQaSites) parts.push(`${report.noLeadQaSites} need lead QA`);
  return `Builder Rank Site Signal alert: ${parts.join(", ") || "all clear"}`;
}

function trackingAlertSummary(report) {
  const staleCopy = `${report.staleSites} stale site${report.staleSites === 1 ? "" : "s"}`;
  const domainCopy = `${report.domainMismatchSites} domain mismatch${report.domainMismatchSites === 1 ? "" : "es"}`;
  const leadQaCopy = `${report.noLeadQaSites} site${report.noLeadQaSites === 1 ? "" : "s"} need lead-event QA`;
  return `${staleCopy}; ${domainCopy}; ${leadQaCopy}.`;
}

function renderAlertText(report) {
  const lines = [
    "Builder Rank Site Signal alert",
    trackingAlertSummary(report),
  ];

  if (report.stale.length) {
    lines.push(
      `Stale Site Signal: no events in the last ${report.staleAfterHours} hours.`,
      ...report.stale.map((site) => renderAlertSiteText(site, "Re-test the snippet/plugin and confirm a page view stores.")),
    );
  }

  if (report.needsLeadQa.length) {
    lines.push(
      "Needs lead-event QA: recent tracking exists, but no quote, form, phone, or email event has stored yet.",
      ...report.needsLeadQa.map((site) => renderAlertSiteText(site, "Send a test quote, form, phone, or email event before customer review.")),
    );
  }

  if (report.domainMismatch.length) {
    lines.push(
      "Domain mismatch: recent tracking exists, but an event page URL does not match the workspace website.",
      ...report.domainMismatch.map((site) => renderAlertSiteText(site, "Confirm the snippet is installed on the production customer domain, not a staging or unrelated site.")),
    );
  }

  return lines.join("\n\n");
}

function renderAlertSiteText(site, action) {
  return [
    site.name,
    site.websiteUrl || "",
    `Site ID: ${site.siteId}`,
    `Status: ${site.healthStatus || "unknown"}`,
    `Recent events: ${Number(site.recentEvents || 0)}`,
    `Recent lead events: ${Number(site.recentLeadEvents || 0)}`,
    `Last page: ${site.lastPageUrl || ""}`,
    `Last event: ${site.lastEventAt || "Never"}`,
    `Action: ${action}`,
  ].filter(Boolean).join("\n");
}

function isLeadEvent(eventName) {
  return /phone_click|form_submit|lead_click|quote_click|email_click/i.test(eventName);
}

function eventMatchesBusinessDomain(pageUrl, websiteUrl) {
  const eventHost = hostnameFor(pageUrl);
  const businessHost = hostnameFor(websiteUrl);
  if (!eventHost || !businessHost) return true;
  return eventHost === businessHost || eventHost.endsWith(`.${businessHost}`);
}

function hostnameFor(value) {
  const text = safeTrim(value).toLowerCase();
  if (!text) return "";
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, "");
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", ADMIN_ALLOWED_ORIGIN);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-builderrank-admin-token");
  response.setHeader("Access-Control-Max-Age", "86400");
}
