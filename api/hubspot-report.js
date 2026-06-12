import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  sendJson,
} from "./_shared.js";
import { syncHubSpotReport } from "./_hubspot.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before syncing HubSpot." });
      return;
    }

    const body = await readJsonBody(request);
    const report = {
      ...(body.report || {}),
      email: user.email,
    };
    const result = await syncHubSpotReport(report);
    sendJson(response, 200, { ok: true, result });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Could not sync HubSpot report",
      detail: error.message,
    });
  }
}
