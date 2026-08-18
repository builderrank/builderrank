import { createHmac } from "node:crypto";
import { runAudit } from "../server.js";
import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  sendJson,
} from "./_shared.js";
import { finalizeReportRun, reserveReportRun } from "./report-eligibility.js";
import { sendOperatorNotification } from "./_operator-notifications.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  let reservation;
  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before running a report." });
      return;
    }

    const body = await readJsonBody(request);
    const website = validateWebsiteInput(body.website);
    const market = validateMarketInput(body.market);
    const checkoutReference = String(body.checkoutReference || body.checkout_reference || "").trim();
    reservation = await reserveReportRun({
      userId: user.id,
      email: user.email,
      checkoutReference,
      requestFingerprint: requestFingerprint(request, user.id),
      website,
      market,
    });

    const audit = await runAudit(website, market);
    const missingModels = (audit.modelAnalyses || []).filter((item) => item.status !== "complete");
    if (missingModels.length) {
      const labels = missingModels.map((item) => item.label || item.provider).join(", ");
      throw Object.assign(new Error(`${labels} could not complete the report after automatic retries. No credit was used; please try again.`), {
        statusCode: 503,
        failureCode: "provider_incomplete",
      });
    }
    await finalizeReportRun(reservation.run_id, { success: true });
    audit.reportRunId = reservation.run_id;
    try {
      const reference = String(body.checkoutReference || body.checkout_reference || `${user.id}:${audit.website}:${Date.now()}`).slice(0, 180);
      await sendOperatorNotification({ type: "report", dedupeKey: `report:${reference}`, subject: `New Builder Rank report: ${audit.company || audit.website}`, heading: "A customer generated a new Builder Rank report", userId: user.id, fields: [
        { label: "Customer", value: user.email }, { label: "Company", value: audit.company }, { label: "Website", value: audit.website }, { label: "Market", value: audit.market }, { label: "Score", value: audit.score }, { label: "Grade", value: audit.grade }, { label: "Generated", value: new Date().toISOString() },
      ] });
    } catch (notificationError) { console.warn("Operator report notification failed", notificationError.message); }
    sendJson(response, 200, audit);
  } catch (error) {
    if (reservation?.run_id) {
      try {
        await finalizeReportRun(reservation.run_id, {
          success: false,
          failureCode: error.failureCode || (error.statusCode >= 500 ? "provider_or_server_failure" : "request_failure"),
        });
      } catch (finalizeError) {
        console.error("Could not release failed report reservation", finalizeError);
      }
    }
    sendJson(response, error.statusCode || 500, {
      error: "Audit failed",
      detail: error.message,
    });
  }
}

function validateWebsiteInput(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 2048) throw Object.assign(new Error("Enter a valid website URL."), { statusCode: 400 });
  let url;
  try { url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch {
    throw Object.assign(new Error("Enter a valid website URL."), { statusCode: 400 });
  }
  if (!["http:", "https:"].includes(url.protocol) || isPrivateHostname(url.hostname)) {
    throw Object.assign(new Error("Only public http or https websites can be audited."), { statusCode: 400 });
  }
  url.username = "";
  url.password = "";
  return url.href;
}

function validateMarketInput(value) {
  const market = String(value || "").trim();
  if (market.length > 160) throw Object.assign(new Error("Service area is too long."), { statusCode: 400 });
  return market;
}

function isPrivateHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return true;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(host)) return true;
  const match = host.match(/^172\.(\d+)\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return /^(fc|fd|fe8|fe9|fea|feb)/i.test(host);
}

function requestFingerprint(request, userId) {
  const forwarded = String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const agent = String(request.headers["user-agent"] || "unknown").slice(0, 300);
  const secret = process.env.REPORT_ABUSE_HASH_SALT || process.env.TRACKING_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createHmac("sha256", secret).update(`${forwarded}|${agent}|${userId}`).digest("hex");
}
