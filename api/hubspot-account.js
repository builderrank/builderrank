import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  sendJson,
} from "./_shared.js";
import { syncHubSpotAccount } from "./_hubspot.js";

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
    const profile = {
      ...(body.profile || {}),
      email: user.email,
    };
    const result = await syncHubSpotAccount(profile);
    sendJson(response, 200, { ok: true, result });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Could not sync HubSpot account",
      detail: error.message,
    });
  }
}
