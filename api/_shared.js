const SUPABASE_URL = process.env.SUPABASE_URL || "https://hosepwwflfpqgemfcafj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const rawBody = await readRawBody(request);
  if (!rawBody) return {};
  return JSON.parse(rawBody);
}

export async function readRawBody(request) {
  if (typeof request.body === "string") return request.body;
  if (Buffer.isBuffer(request.body)) return request.body.toString("utf8");

  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  return body;
}

export function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

export function requireSupabaseServiceRole() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw Object.assign(new Error("SUPABASE_SERVICE_ROLE_KEY is not configured."), { statusCode: 503 });
  }
}

export async function getSupabaseUser(accessToken) {
  if (!accessToken) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY || "",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function insertSupabaseRow(table, payload) {
  requireSupabaseServiceRole();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.hint || `Could not insert ${table} row.`;
    throw Object.assign(new Error(message), { statusCode: response.status, details: data });
  }

  return data;
}

export async function selectSupabaseRows(table, query = {}) {
  requireSupabaseServiceRole();

  const params = new URLSearchParams(query);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.hint || `Could not read ${table} rows.`;
    throw Object.assign(new Error(message), { statusCode: response.status, details: data });
  }

  return Array.isArray(data) ? data : [];
}

export function extractBearerToken(request) {
  const authorization = request.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

export function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
