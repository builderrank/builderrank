import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  safeString,
  selectSupabaseRows,
} from "./_shared.js";
import { buildCustomerReport } from "./_customer-report.js";
import { renderReportPdfBase64 } from "./email-report.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.id) return response.status(401).json({ error: "Log in before downloading a report." });

    const body = await readJsonBody(request);
    const reportRunId = safeString(body.reportRunId);
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(reportRunId)) {
      return response.status(400).json({ error: "A completed report run is required." });
    }

    const rows = await selectSupabaseRows("br_internal_reports", {
      select: "report",
      report_run_id: `eq.${reportRunId}`,
      user_id: `eq.${user.id}`,
      limit: "1",
    });
    if (!rows[0]?.report) return response.status(404).json({ error: "Report not found." });

    const report = buildCustomerReport({ ...rows[0].report, reportRunId });
    const filename = `${slugify(report.company)}-builder-rank.pdf`;
    const pdf = Buffer.from(renderReportPdfBase64(report), "base64");
    response.statusCode = 200;
    response.setHeader("content-type", "application/pdf");
    response.setHeader("content-disposition", `attachment; filename="${filename}"`);
    response.setHeader("cache-control", "private, no-store");
    response.end(pdf);
  } catch (error) {
    response.status(error.statusCode || 500).json({ error: "Could not download report.", detail: error.message });
  }
}

function slugify(value) {
  return String(value || "builder-rank-report").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "builder-rank-report";
}
