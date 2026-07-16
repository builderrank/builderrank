import { runAudit } from "../server.js";
import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  sendJson,
} from "./_shared.js";
import { assertReportRunAllowed } from "./report-eligibility.js";

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
    sendJson(response, 200, audit);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Audit failed",
      detail: error.message,
    });
  }
}
