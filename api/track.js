import crypto from "node:crypto";
import {
  insertSupabaseRow,
  readJsonBody,
  selectSupabaseRows,
  supabaseServiceConfigured,
  updateSupabaseRows,
} from "./_shared.js";

const allowedMethods = new Set(["POST", "OPTIONS"]);
const allowedEvents = new Set(["page_view", "phone_click", "email_click", "lead_click", "quote_click", "form_submit"]);
const botUserAgentPattern = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|linkedinbot|twitterbot|whatsapp|uptime|monitor|pingdom|gtmetrix/i;

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

  try {
    const body = await readJsonBody(request);
    const event = normalizeTrackingEvent(body, request);
    let stored = false;
    let storageWarning = "";
    const filtered = event.isBot;
    let qaStatus = filtered ? "filtered_bot" : "accepted";
    let qaDomain = null;

    if (!filtered && supabaseServiceConfigured()) {
      try {
        const businesses = await selectSupabaseRows("br_businesses", {
          select: "id,website_url,tracking_status",
          site_id: `eq.${event.siteId}`,
          limit: "1",
        });
        const business = businesses[0];
        if (!business?.id) {
          storageWarning = "Unknown Site Signal ID. Event accepted but not stored.";
          qaStatus = "unknown_site_id";
        } else {
          await insertSupabaseRow("br_website_events", toSupabaseEvent(event, business.id));
          stored = true;
          qaStatus = "stored";
          qaDomain = domainQaFor(event.pageUrl, business.website_url);
          const domainMatches = qaDomain.matches;
          if (!domainMatches) {
            storageWarning = "Event stored, but page URL does not match the workspace website.";
            qaStatus = "stored_domain_mismatch";
          }
          if (business.tracking_status !== "active") {
            try {
              await updateSupabaseRows("br_businesses", { id: `eq.${business.id}` }, {
                tracking_status: "active",
                updated_at: event.receivedAt,
              });
            } catch (error) {
              storageWarning = [storageWarning, `Event stored, but tracking status was not updated: ${error.message}`].filter(Boolean).join(" ");
              if (qaStatus === "stored") qaStatus = "stored_with_warning";
            }
          }
        }
      } catch (error) {
        storageWarning = error.message;
        qaStatus = "storage_error";
      }
    } else if (!filtered && !supabaseServiceConfigured()) {
      storageWarning = "Supabase service role is not configured. Event accepted but not stored.";
      qaStatus = "accepted_no_storage";
    }

    response.status(202).json({
      ok: true,
      received: event.event,
      sourceType: event.sourceType,
      acceptedAt: event.receivedAt,
      filtered,
      stored,
      qaStatus,
      qaDomain,
      installHint: installHintFor({ filtered, stored, qaStatus }),
      storageWarning,
    });
  } catch (error) {
    response.status(error.statusCode || 400).json({ error: "Invalid tracking event", detail: error.message });
  }
}

function installHintFor({ filtered, stored, qaStatus }) {
  if (qaStatus === "stored_domain_mismatch") return "Stored, but the page URL does not match the workspace website. Test from the production customer domain or update the workspace website.";
  if (stored) return "Stored. Refresh /admin-beta workspace summary or the customer dashboard to confirm the event appears.";
  if (filtered) return "Filtered as likely bot or monitor traffic. Test from a normal logged-out browser.";
  if (qaStatus === "unknown_site_id") return "Bootstrap this Site Signal ID before install QA, then resend the test event.";
  if (qaStatus === "accepted_no_storage") return "Local/demo mode accepted the event. Configure Supabase service role before real install QA.";
  if (qaStatus === "storage_error") return "Accepted but storage failed. Check Supabase schema, service role, and Site Signal ID.";
  return "Accepted but not stored.";
}

function toSupabaseEvent(event, businessId) {
  return {
    site_id: event.siteId,
    business_id: businessId || null,
    event: event.event,
    page_url: event.pageUrl,
    page_title: event.pageTitle,
    referrer: event.referrer,
    source_type: event.sourceType,
    source_name: event.sourceName,
    landing_path: event.landingPath,
    session_id: event.sessionId,
    utm: event.utm,
    metadata: event.metadata,
    user_agent: event.userAgent,
    received_at: event.receivedAt,
  };
}

function normalizeTrackingEvent(body, request) {
  const siteId = safeTrim(body.siteId);
  const rawEvent = safeTrim(body.event).toLowerCase();
  const event = normalizeEventName(rawEvent);

  if (!siteId) {
    throw new Error("Missing siteId.");
  }

  if (!/^br_[a-z0-9_/-]{3,80}$/i.test(siteId)) {
    throw new Error("Invalid siteId.");
  }

  const userAgent = safeTrim(request.headers["user-agent"]).slice(0, 500);
  const metadata = sanitizeObject(body.metadata);
  const ipHash = hashIpAddress(getClientIp(request));
  const pageUrl = normalizeUrl(body.pageUrl || body.page || body.url);
  const referrer = normalizeUrl(body.referrer, { optional: true });

  return {
    siteId,
    event,
    pageUrl,
    pageTitle: safeTrim(body.pageTitle).slice(0, 300),
    referrer,
    sourceType: normalizeSourceType(body.sourceType),
    sourceName: safeTrim(body.sourceName || body.source).slice(0, 120) || "Unknown",
    landingPath: safeTrim(body.landingPath).slice(0, 500),
    sessionId: safeTrim(body.sessionId).slice(0, 120),
    utm: sanitizeObject(body.utm),
    metadata: {
      ...metadata,
      ...(rawEvent && rawEvent !== event ? { originalEvent: rawEvent } : {}),
      ipHash,
      isBot: isLikelyBot(userAgent),
      receivedHost: request.headers.host || "",
    },
    userAgent,
    isBot: isLikelyBot(userAgent),
    receivedAt: new Date().toISOString(),
  };
}

function normalizeEventName(value) {
  const event = safeTrim(value).toLowerCase().replace(/[-\s]+/g, "_") || "page_view";
  if (allowedEvents.has(event)) return event;
  if (["page", "pageview", "view", "visit"].includes(event)) return "page_view";
  if (["phone", "call", "call_click", "tel_click"].includes(event)) return "phone_click";
  if (["email", "mail", "email_link", "mail_click"].includes(event)) return "email_click";
  if (["form", "submit", "form_submission"].includes(event)) return "form_submit";
  if (["lead", "quote", "estimate", "schedule", "booking", "book", "contact", "cta_click", "conversion"].includes(event)) return "lead_click";
  return "page_view";
}

function normalizeSourceType(value) {
  const sourceType = safeTrim(value).toLowerCase();
  if (["ai_assistant", "search", "directory", "referral", "direct", "unknown"].includes(sourceType)) return sourceType;
  return sourceType ? "referral" : "unknown";
}

function normalizeUrl(value, options = {}) {
  const text = safeTrim(value).slice(0, 1500);
  if (!text && options.optional) return "";
  if (!text) return "";

  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function getClientIp(request) {
  const forwardedFor = safeTrim(request.headers["x-forwarded-for"]).split(",")[0].trim();
  return forwardedFor || safeTrim(request.headers["x-real-ip"]) || safeTrim(request.socket?.remoteAddress);
}

function hashIpAddress(value) {
  const ip = safeTrim(value);
  if (!ip) return "";
  const salt = trackingHashSalt();
  if (!salt) return "";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function trackingHashSalt() {
  const explicitSalt = safeTrim(process.env.TRACKING_HASH_SALT);
  if (explicitSalt) return explicitSalt;
  return supabaseServiceConfigured() ? "" : "builderrank-local";
}

function isLikelyBot(userAgent) {
  return Boolean(userAgent && botUserAgentPattern.test(userAgent));
}

function eventMatchesBusinessDomain(pageUrl, websiteUrl) {
  return domainQaFor(pageUrl, websiteUrl).matches;
}

function domainQaFor(pageUrl, websiteUrl) {
  const eventHost = hostnameFor(pageUrl);
  const businessHost = hostnameFor(websiteUrl);
  const matches = !eventHost || !businessHost || eventHost === businessHost || eventHost.endsWith(`.${businessHost}`);
  return {
    expectedHost: businessHost,
    receivedHost: eventHost,
    matches,
  };
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

function sanitizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 30)
      .map(([key, entry]) => [safeTrim(key).slice(0, 80), safeTrim(entry).slice(0, 500)])
      .filter(([key, entry]) => key && entry),
  );
}

function safeTrim(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Max-Age", "86400");
}
