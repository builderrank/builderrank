import { runAudit } from "../server.js";
import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  sendJson,
} from "./_shared.js";
import { assertReportRunAllowed } from "./report-eligibility.js";
import { sendOperatorNotification } from "./_operator-notifications.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before running a report." });
      return;
    }

    const body = await readJsonBody(request);
    await assertReportRunAllowed({
      email: user.email,
      checkoutReference: body.checkoutReference || body.checkout_reference,
    });

    const audit = await runAudit(body.website, body.market);
    try {
      const reference = String(body.checkoutReference || body.checkout_reference || `${user.id}:${audit.website}:${Date.now()}`).slice(0, 180);
      await sendOperatorNotification({ type: "report", dedupeKey: `report:${reference}`, subject: `New Builder Rank report: ${audit.company || audit.website}`, heading: "A customer generated a new Builder Rank report", userId: user.id, fields: [
        { label: "Customer", value: user.email }, { label: "Company", value: audit.company }, { label: "Website", value: audit.website }, { label: "Market", value: audit.market }, { label: "Score", value: audit.score }, { label: "Grade", value: audit.grade }, { label: "Generated", value: new Date().toISOString() },
      ] });
    } catch (notificationError) { console.warn("Operator report notification failed", notificationError.message); }
    sendJson(response, 200, audit);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Audit failed",
      detail: error.message,
    });
  }
}
