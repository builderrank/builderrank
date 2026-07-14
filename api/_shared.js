import { timingSafeEqual } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hosepwwflfpqgemfcafj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_JSON_BODY_BYTES = parsePositiveInteger(process.env.MAX_JSON_BODY_BYTES, 1_000_000);

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const rawBody = await readRawBody(request);
  if (!rawBody) return {};
  return JSON.parse(rawBody);
}

export async function readRawBody(request) {
  if (typeof request.body === "string") {
    assertBodySize(Buffer.byteLength(request.body), "Request body is too large.");
    return request.body;
  }
  if (Buffer.isBuffer(request.body)) {
    assertBodySize(request.body.byteLength, "Request body is too large.");
    return request.body.toString("utf8");
  }

  let body = "";
  for await (const chunk of request) {
    const text = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    body += text;
    assertBodySize(Buffer.byteLength(body), "Request body is too large.");
  }
  return body;
}

function assertBodySize(size, message) {
  if (size <= MAX_JSON_BODY_BYTES) return;
  throw Object.assign(new Error(message), { statusCode: 413 });
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

export function requireSupabaseServiceRole() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw Object.assign(new Error("SUPABASE_SERVICE_ROLE_KEY is not configured."), { statusCode: 503 });
  }
}

export function supabaseServiceConfigured() {
  return Boolean(SUPABASE_SERVICE_ROLE_KEY);
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

export async function upsertSupabaseRow(table, payload, onConflict) {
  requireSupabaseServiceRole();

  const params = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.hint || `Could not upsert ${table} row.`;
    throw Object.assign(new Error(message), { statusCode: response.status, details: data });
  }

  return data;
}

export async function updateSupabaseRows(table, query = {}, payload = {}) {
  requireSupabaseServiceRole();

  const params = new URLSearchParams(query);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: "PATCH",
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
    const message = data?.message || data?.hint || `Could not update ${table} rows.`;
    throw Object.assign(new Error(message), { statusCode: response.status, details: data });
  }

  return Array.isArray(data) ? data : [];
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

export function isAdminRequestAuthorized(request, expectedToken = process.env.ADMIN_API_TOKEN || "") {
  const expected = safeString(expectedToken);
  if (!expected) return false;

  const candidates = [
    safeString(request.headers["x-builderrank-admin-token"]),
    extractBearerToken(request),
  ].filter(Boolean);

  return candidates.some((candidate) => constantTimeEqual(candidate, expected));
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
