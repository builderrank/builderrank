import { sendJson } from "./_shared.js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hosepwwflfpqgemfcafj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Tq-L9aiYVbdtij2JL3oW3Q_FBDNokzQ";

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
    sendJson(response, awake ? 200 : 503, {
      ok: awake,
      service: "supabase-keepalive",
      supabaseStatus: keepalive.status,
      checkedAt: new Date().toISOString(),
      detail: awake ? "Supabase responded. Project is awake." : body.slice(0, 500),
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
