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
    const slug = slugify(company);
    const payload = {
      from: REPORT_EMAIL_FROM,
      to: [to],
      reply_to: REPORT_EMAIL_REPLY_TO,
      subject: `Your Builder Rank report is ready: ${company}`,
      html: renderEmailHtml(report),
      text: renderEmailText(report),
      attachments: [
        {
          filename: `${slug}-builder-rank.pdf`,
          content: renderReportPdfBase64(report),
        },
        {
          filename: `${slug}-builder-rank.json`,
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
      console.warn("Resend report email failed", {
        status: resendResponse.status,
        message: data?.message,
        name: data?.name,
      });
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
  const followUpMessage = modelFollowUpMessage(report);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:640px">
      <h1 style="margin-bottom:8px">Your Builder Rank report is ready</h1>
      <p>Thank you for purchasing a Builder Rank report. The attached PDF gives you a clean copy of the results, and the JSON export is included for your records.</p>
      <p><strong>${escapeHtml(report.company || "Contractor report")}</strong></p>
      <p>${escapeHtml(report.website || "")}${report.market ? ` · ${escapeHtml(report.market)}` : ""}</p>
      <p><strong>AI Health Score:</strong> ${escapeHtml(score)} · <strong>Grade:</strong> ${escapeHtml(grade)}</p>
      <p>${escapeHtml(report.summary || "Your report JSON export is attached.")}</p>
      ${fixes.length ? `<h2>Highest-impact fixes</h2><ul>${fixes.map(renderFix).join("")}</ul>` : ""}
      ${followUpMessage ? `<h2>Model follow-up</h2><p>${escapeHtml(followUpMessage)}</p>` : ""}
      <p>If you have questions about the results or want help prioritizing the fixes, reply to this email.</p>
    </div>
  `;
}

function renderEmailText(report) {
  const followUpMessage = modelFollowUpMessage(report);
  const fixes = Array.isArray(report.fixes)
    ? report.fixes.slice(0, 5).map((fix) => `- ${fix.priority}: ${fix.title}`).join("\n")
    : "";

  return [
    "Your Builder Rank report is ready",
    "Thank you for purchasing a Builder Rank report. The attached PDF gives you a clean copy of the results, and the JSON export is included for your records.",
    report.company || "Contractor report",
    report.website || "",
    report.market || "",
    `AI Health Score: ${report.score ?? "Pending"}`,
    `Grade: ${report.grade || "Ungraded"}`,
    report.summary || "",
    fixes ? `Highest-impact fixes:\n${fixes}` : "",
    followUpMessage ? `Model follow-up:\n${followUpMessage}` : "",
    "If you have questions about the results or want help prioritizing the fixes, reply to this email.",
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

function renderReportPdfBase64(report) {
  const score = report.score ?? "Pending";
  const grade = report.grade || "Ungraded";
  const lines = [
    "Builder Rank Report",
    "",
    "Thank you for purchasing a Builder Rank report.",
    "This basic PDF summarizes the completed AI visibility report.",
    "",
    `Company: ${report.company || "Contractor report"}`,
    `Website: ${report.website || ""}`,
    `Market: ${report.market || ""}`,
    `AI Health Score: ${score}`,
    `Grade: ${grade}`,
    "",
    "Summary",
    report.summary || "No summary was generated.",
    "",
    "Highest-impact fixes",
    ...formatPdfFixes(report.fixes),
    "",
    "Customer intent",
    ...formatPdfList(report.intents),
    "",
    ...formatPdfModelFollowUp(report),
    "",
    "Reply to this email if you have questions or want help prioritizing the fixes.",
  ];

  return buildSimplePdf(lines).toString("base64");
}

function formatPdfFixes(fixes) {
  if (!Array.isArray(fixes) || !fixes.length) return ["No fixes were generated."];

  return fixes.slice(0, 8).flatMap((fix) => [
    `${fix.priority || "Fix"}: ${fix.title || ""}`,
    fix.body || "",
    "",
  ]);
}

function formatPdfList(items) {
  if (!Array.isArray(items) || !items.length) return ["No items were generated."];
  return items.slice(0, 8).map((item) => `- ${item}`);
}

function formatPdfModelFollowUp(report) {
  const message = modelFollowUpMessage(report);
  return message ? ["Model follow-up", message] : [];
}

function modelFollowUpMessage(report) {
  const incompleteModels = Array.isArray(report.modelAnalyses)
    ? report.modelAnalyses.filter((analysis) => analysis.status !== "complete")
    : [];

  if (!incompleteModels.length) return "";

  const labels = incompleteModels.map((analysis) => analysis.label || analysis.provider || "An AI model").join(", ");
  return `${labels} did not report on this run. Builder Rank will review the missing model response and follow up with the customer if additional context is needed.`;
}

function buildSimplePdf(lines) {
  const objects = [null, null, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pages = paginatePdfLines(lines);
  const pageIds = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;

  pages.forEach((pageLines) => {
    const content = renderPdfPageContent(pageLines);
    const contentId = addPdfObject(objects, `<< /Length ${Buffer.byteLength(content, "binary")} >>\nstream\n${content}\nendstream`);
    const pageId = addPdfObject(
      objects,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  return assemblePdf(objects, catalogId);
}

function paginatePdfLines(lines) {
  const pages = [];
  let currentPage = [];

  lines.flatMap(wrapPdfLine).forEach((line) => {
    if (currentPage.length >= 42) {
      pages.push(currentPage);
      currentPage = [];
    }
    currentPage.push(line);
  });

  if (currentPage.length) pages.push(currentPage);
  return pages.length ? pages : [["Builder Rank Report"]];
}

function wrapPdfLine(line) {
  const text = String(line || "");
  if (text.length <= 86) return [text];

  const wrapped = [];
  let remaining = text;
  while (remaining.length > 86) {
    const breakAt = remaining.lastIndexOf(" ", 86);
    const index = breakAt > 24 ? breakAt : 86;
    wrapped.push(remaining.slice(0, index));
    remaining = remaining.slice(index).trim();
  }
  if (remaining) wrapped.push(remaining);
  return wrapped;
}

function renderPdfPageContent(lines) {
  const escapedLines = lines.map((line) => `(${escapePdfText(line)}) Tj`);
  return `BT\n/F1 11 Tf\n50 742 Td\n14 TL\n${escapedLines.join("\nT*\n")}\nET`;
}

function addPdfObject(objects, body) {
  objects.push(body);
  return objects.length;
}

function assemblePdf(objects, catalogId) {
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "binary"));
    chunks.push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "binary");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(chunks.join(""), "binary");
}

function escapePdfText(value) {
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
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
