import { isAdminRequestAuthorized, selectSupabaseRows } from "./_shared.js";

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  if (!ADMIN_API_TOKEN || !isAdminRequestAuthorized(request, ADMIN_API_TOKEN)) {
    return response.status(401).json({ error: "Admin token required." });
  }

  try {
    const url = new URL(request.url || "/", "https://builderrank.io");
    const limit = Math.max(1, Math.min(50, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const rows = await selectSupabaseRows("br_internal_reports", {
      select: "id,report_run_id,email,company,website,market,score,report,created_at",
      order: "created_at.desc",
      limit: String(limit),
    });
    return response.status(200).json({ ok: true, reports: rows });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ error: "Could not load private reports.", detail: error.message });
  }
}
