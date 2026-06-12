import { runAudit } from "../server.js";
import { extractBearerToken, getSupabaseUser, requireSupabaseServiceRole, sendJson } from "./_shared.js";

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

    const audit = await runAudit(request.body?.website, request.body?.market);
    sendJson(response, 200, audit);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Audit failed",
      detail: error.message,
    });
  }
}
