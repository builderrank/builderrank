import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  safeString,
  sendJson,
} from "./_shared.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || "Builder Rank <kaleb@builderrank.io>";
const REPORT_EMAIL_REPLY_TO = process.env.REPORT_EMAIL_REPLY_TO || "kaleb@builderrank.io";
const REPORT_EMAIL_BCC = process.env.REPORT_EMAIL_BCC || "";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (!RESEND_API_KEY) {
    sendJson(response, 503, { error: "Report email is not configured." });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before emailing a report." });
      return;
    }

    const body = await readJsonBody(request);
    const report = body.report || {};
    const to = safeString(body.email, user.email);
    const company = safeString(report.company, "Contractor report");
    const filename = `${slugify(company)}-builder-rank.json`;
    const payload = {
      from: REPORT_EMAIL_FROM,
      to: [to],
      reply_to: REPORT_EMAIL_REPLY_TO,
      subject: `Builder Rank report: ${company}`,
      html: renderEmailHtml(report),
      text: renderEmailText(report),
      attachments: [
        {
          filename,
          content: Buffer.from(JSON.stringify({ exportedAt: new Date().toISOString(), report }, null, 2)).toString(
            "base64",
          ),
        },
      ],
    };

    if (REPORT_EMAIL_BCC) payload.bcc = REPORT_EMAIL_BCC.split(",").map((item) => item.trim()).filter(Boolean);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      throw new Error(data?.message || "Could not send report email.");
    }

    sendJson(response, 200, { ok: true, id: data.id });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Could not email report",
      detail: error.message,
    });
  }
}

function renderEmailHtml(report) {
  const score = report.score ?? "Pending";
  const grade = report.grade || "Ungraded";
  const fixes = Array.isArray(report.fixes) ? report.fixes.slice(0, 5) : [];

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Builder Rank report</h1>
      <p><strong>${escapeHtml(report.company || "Contractor report")}</strong></p>
      <p>${escapeHtml(report.website || "")}${report.market ? ` · ${escapeHtml(report.market)}` : ""}</p>
      <p><strong>AI Health Score:</strong> ${escapeHtml(score)} · <strong>Grade:</strong> ${escapeHtml(grade)}</p>
      <p>${escapeHtml(report.summary || "Your report JSON export is attached.")}</p>
      ${fixes.length ? `<h2>Highest-impact fixes</h2><ul>${fixes.map(renderFix).join("")}</ul>` : ""}
      <p>The complete JSON export is attached.</p>
    </div>
  `;
}

function renderEmailText(report) {
  const fixes = Array.isArray(report.fixes)
    ? report.fixes.slice(0, 5).map((fix) => `- ${fix.priority}: ${fix.title}`).join("\n")
    : "";

  return [
    "Builder Rank report",
    report.company || "Contractor report",
    report.website || "",
    report.market || "",
    `AI Health Score: ${report.score ?? "Pending"}`,
    `Grade: ${report.grade || "Ungraded"}`,
    report.summary || "",
    fixes ? `Highest-impact fixes:\n${fixes}` : "",
    "The complete JSON export is attached.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function renderFix(fix) {
  return `<li><strong>${escapeHtml(fix.priority || "Fix")}:</strong> ${escapeHtml(fix.title || "")}</li>`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "builder-rank-report";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}
