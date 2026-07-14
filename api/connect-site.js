import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  selectSupabaseRows,
  supabaseServiceConfigured,
  updateSupabaseRows,
} from "./_shared.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!supabaseServiceConfigured()) {
    response.status(503).json({ error: "Supabase service role is not configured." });
    return;
  }

  const user = await getSupabaseUser(extractBearerToken(request));
  if (!user?.id) {
    response.status(401).json({ error: "Sign in before connecting a website." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const siteId = safeTrim(body.siteId);

    if (!isValidSiteId(siteId)) {
      response.status(400).json({ error: "siteId must start with br_ and contain only letters, numbers, dashes, underscores, or slashes." });
      return;
    }

    const existing = await selectSupabaseRows("br_businesses", {
      select: "id,owner_user_id,name,website_url,site_id,tracking_status",
      site_id: `eq.${siteId}`,
      limit: "1",
    });
    const business = existing[0];

    if (!business) {
      response.status(404).json({ error: "No Builder Rank business found for that siteId." });
      return;
    }

    if (business.owner_user_id && business.owner_user_id !== user.id) {
      response.status(409).json({ error: "This website is already connected to another account." });
      return;
    }

    const nextTrackingStatus = business.tracking_status === "active" ? "active" : "connected";
    const rows = await updateSupabaseRows(
      "br_businesses",
      { id: `eq.${business.id}` },
      {
        owner_user_id: user.id,
        tracking_status: nextTrackingStatus,
        updated_at: new Date().toISOString(),
      },
    );
    const connectedBusiness = rows[0] || {
      ...business,
      owner_user_id: user.id,
      tracking_status: nextTrackingStatus,
    };
    const reportBackfill = await linkMatchingReportsToBusiness(user.id, connectedBusiness);
    const claimStatus = claimStatusFor({ business, trackingStatus: connectedBusiness.tracking_status, userId: user.id });

    response.status(200).json({
      ok: true,
      claimStatus,
      message: claimMessageFor(claimStatus),
      nextStep: nextStepFor(connectedBusiness.tracking_status),
      siteId,
      trackingStatus: connectedBusiness.tracking_status || "connected",
      dashboardUrl: `/dashboard?siteId=${encodeURIComponent(siteId)}`,
      reportBackfill,
      business: connectedBusiness,
    });
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: "Could not connect website.",
      detail: error.message,
    });
  }
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidSiteId(value) {
  return /^br_[a-z0-9_/-]{3,80}$/i.test(safeTrim(value));
}

function claimStatusFor({ business, trackingStatus, userId }) {
  if (business.owner_user_id === userId) return trackingStatus === "active" ? "already_active" : "already_connected";
  return trackingStatus === "active" ? "claimed_active_site" : "claimed_site";
}

function claimMessageFor(status) {
  if (status === "already_active") return "This Site Signal ID is already connected and receiving live events.";
  if (status === "already_connected") return "This Site Signal ID is already connected to your account.";
  if (status === "claimed_active_site") return "Site connected. Existing Site Signal events are already active.";
  return "Site connected. Install the Site Signal snippet, then send a test event.";
}

function nextStepFor(trackingStatus) {
  if (trackingStatus === "active") return "Open the live dashboard and confirm recent sessions, lead events, and AI visibility imports.";
  return "Install the Site Signal snippet on the customer website, then run a test page view and lead event.";
}

async function linkMatchingReportsToBusiness(userId, business) {
  if (!userId || !business?.id || !business.website_url) return { attempted: false, linked: 0 };

  try {
    const reports = await selectSupabaseRows("reports", {
      select: "id,business_id,website",
      user_id: `eq.${userId}`,
      order: "created_at.desc",
      limit: "100",
    });
    const targetWebsite = normalizeWebsiteForMatch(business.website_url);
    const reportIds = reports
      .filter((report) => !report.business_id)
      .filter((report) => normalizeWebsiteForMatch(report.website) === targetWebsite)
      .map((report) => report.id)
      .filter(Boolean);

    if (!reportIds.length) return { attempted: true, linked: 0 };

    const updated = await updateSupabaseRows("reports", { id: inFilter(reportIds) }, {
      business_id: business.id,
    });

    return { attempted: true, linked: updated.length || reportIds.length };
  } catch (error) {
    if (/business_id|schema cache|column/i.test(error.message || "")) {
      return { attempted: true, linked: 0, warning: "reports.business_id is not available yet." };
    }
    throw error;
  }
}

function normalizeWebsiteForMatch(value) {
  const text = safeTrim(value).toLowerCase();
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

function inFilter(values) {
  return `in.(${values.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(",")})`;
}
