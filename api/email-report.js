import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  safeString,
  sendJson,
} from "./_shared.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || "Builder Rank <support@builderrank.io>";
const REPORT_EMAIL_REPLY_TO = process.env.REPORT_EMAIL_REPLY_TO || "support@builderrank.io";
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
  const pdf = createBrandedPdf();

  pdf.header(report.company || "Contractor report", report.market || "");
  pdf.scoreSummary(score, grade, report.website || "", report.summary || "No summary was generated.");
  pdf.sectionTitle("Report Card Categories");
  pdf.categories(report.categories);
  pdf.sectionTitle("Highest-Impact Fixes");
  pdf.fixes(report.fixes);
  pdf.sectionTitle("Customer Intent");
  pdf.intent(report.intents);
  pdf.sectionTitle("Live Model Analysis");
  pdf.modelAnalyses(report.modelAnalyses);
  pdf.sectionTitle("Audit Evidence");
  pdf.evidence(report.evidence);

  const followUpMessage = modelFollowUpMessage(report);
  if (followUpMessage) {
    pdf.sectionTitle("Model Follow-Up");
    pdf.bodyCard("Builder Rank review", followUpMessage);
  }

  pdf.footerNote("Reply to this email if you have questions or want help prioritizing the fixes.");
  return pdf.toBuffer().toString("base64");
}

function modelFollowUpMessage(report) {
  const incompleteModels = Array.isArray(report.modelAnalyses)
    ? report.modelAnalyses.filter((analysis) => analysis.status !== "complete")
    : [];

  if (!incompleteModels.length) return "";

  const labels = incompleteModels.map((analysis) => analysis.label || analysis.provider || "An AI model").join(", ");
  return `${labels} did not report on this run. Builder Rank will review the missing model response and follow up with the customer if additional context is needed.`;
}

function addPdfObject(objects, body) {
  objects.push(body);
  return objects.length;
}

function createBrandedPdf() {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const pages = [];
  let current = null;
  let y = 0;

  const colors = {
    ink: [0.07, 0.07, 0.07],
    muted: [0.42, 0.42, 0.45],
    orange: [1, 0.475, 0],
    black: [0.02, 0.02, 0.02],
    panel: [0.96, 0.96, 0.94],
    line: [0.82, 0.82, 0.82],
    white: [1, 1, 1],
  };

  function beginPage() {
    current = [];
    pages.push(current);
    y = pageHeight - margin;
    rect(0, 0, pageWidth, pageHeight, colors.white);
    rect(0, pageHeight - 122, pageWidth, 122, colors.black);
    rect(0, pageHeight - 122, pageWidth, 5, colors.orange);
    text("BUILDER RANK", margin, pageHeight - 48, 12, "bold", colors.orange);
    text("AI visibility report", margin, pageHeight - 70, 10, "regular", colors.white);
    y = pageHeight - 150;
  }

  function ensureSpace(height) {
    if (!current || y - height < margin + 26) beginPage();
  }

  function op(value) {
    current.push(value);
  }

  function color(value) {
    return value.map((item) => Number(item).toFixed(3)).join(" ");
  }

  function rect(x, bottomY, width, height, fill) {
    op(`${color(fill)} rg\n${x} ${bottomY} ${width} ${height} re f`);
  }

  function strokeRect(x, bottomY, width, height, stroke = colors.line) {
    op(`${color(stroke)} RG\n${x} ${bottomY} ${width} ${height} re S`);
  }

  function text(value, x, baselineY, size = 10, font = "regular", fill = colors.ink) {
    const fontName = font === "bold" ? "F2" : "F1";
    op(`${color(fill)} rg\nBT\n/${fontName} ${size} Tf\n${x} ${baselineY} Td\n(${escapePdfText(value)}) Tj\nET`);
  }

  function lines(value, x, startY, options = {}) {
    const size = options.size || 10;
    const lineHeight = options.lineHeight || Math.ceil(size * 1.35);
    const maxWidth = options.maxWidth || contentWidth;
    const font = options.font || "regular";
    const fill = options.fill || colors.ink;
    const wrapped = wrapPdfText(value, maxWidth, size);
    wrapped.forEach((line, index) => text(line, x, startY - index * lineHeight, size, font, fill));
    return wrapped.length * lineHeight;
  }

  function sectionTitle(title) {
    ensureSpace(48);
    y -= 6;
    text(title, margin, y, 15, "bold", colors.ink);
    rect(margin, y - 12, 72, 3, colors.orange);
    y -= 28;
  }

  function header(company, market) {
    if (!current) beginPage();
    text(company, margin, pageHeight - 98, 28, "bold", colors.white);
    text(market || "Market not set", margin, pageHeight - 116, 11, "regular", colors.white);
  }

  function scoreSummary(score, grade, website, summary) {
    ensureSpace(160);
    const cardY = y - 130;
    rect(margin, cardY, contentWidth, 130, colors.panel);
    strokeRect(margin, cardY, contentWidth, 130, colors.line);
    rect(margin, cardY + 126, contentWidth, 4, colors.orange);
    text("AI Health Score", margin + 20, cardY + 96, 11, "bold", colors.muted);
    text(String(score), margin + 20, cardY + 56, 34, "bold", colors.orange);
    text(`Grade ${grade}`, margin + 110, cardY + 63, 17, "bold", colors.ink);
    text(website || "Website not set", margin + 110, cardY + 43, 10, "regular", colors.muted);
    lines(summary, margin + 250, cardY + 94, {
      size: 10,
      lineHeight: 14,
      maxWidth: contentWidth - 275,
      fill: colors.ink,
    });
    y = cardY - 24;
  }

  function bodyCard(title, body, eyebrow = "") {
    const bodyLines = wrapPdfText(body || "No details were generated.", contentWidth - 32, 9.5);
    const height = 42 + bodyLines.length * 13;
    ensureSpace(height + 12);
    const cardY = y - height;
    rect(margin, cardY, contentWidth, height, colors.panel);
    strokeRect(margin, cardY, contentWidth, height, colors.line);
    if (eyebrow) text(eyebrow, margin + 16, cardY + height - 18, 8, "bold", colors.orange);
    text(title, margin + 16, cardY + height - (eyebrow ? 36 : 22), 12, "bold", colors.ink);
    bodyLines.forEach((line, index) => text(line, margin + 16, cardY + height - (eyebrow ? 52 : 38) - index * 13, 9.5, "regular", colors.muted));
    y = cardY - 12;
  }

  function categories(categoriesValue) {
    if (!Array.isArray(categoriesValue) || !categoriesValue.length) {
      bodyCard("No category data", "The report did not include category scoring.");
      return;
    }

    categoriesValue.forEach((category) => {
      const checks = Array.isArray(category.checks) ? category.checks : [];
      const checkLines = checks.flatMap((check) => wrapPdfText(`- ${check.label || "Check"} (${check.status || "status"})`, contentWidth - 52, 8.8));
      const height = 82 + checkLines.length * 11;
      ensureSpace(height + 12);
      const cardY = y - height;
      rect(margin, cardY, contentWidth, height, colors.panel);
      strokeRect(margin, cardY, contentWidth, height, colors.line);
      text(category.label || "Category", margin + 16, cardY + height - 22, 12, "bold", colors.ink);
      text(String(category.score ?? "--"), margin + contentWidth - 58, cardY + height - 22, 15, "bold", colors.orange);
      const descriptionHeight = lines(category.description || "", margin + 16, cardY + height - 40, {
        size: 8.8,
        lineHeight: 11,
        maxWidth: contentWidth - 90,
        fill: colors.muted,
      });
      const barY = cardY + height - 52 - Math.max(descriptionHeight, 11);
      rect(margin + 16, barY, contentWidth - 32, 6, [0.86, 0.86, 0.86]);
      rect(margin + 16, barY, (contentWidth - 32) * clampPdfScore(category.score) / 100, 6, colors.orange);
      checkLines.forEach((line, index) => text(line, margin + 20, barY - 16 - index * 11, 8.8, "regular", colors.ink));
      y = cardY - 12;
    });
  }

  function fixes(fixesValue) {
    const fixesList = Array.isArray(fixesValue) && fixesValue.length ? fixesValue : [{ priority: "Fix", title: "No fixes were generated.", body: "" }];
    fixesList.slice(0, 8).forEach((fix) => {
      bodyCard(fix.title || "Recommended fix", fix.body || "No details were generated.", fix.priority || "Fix");
    });
  }

  function intent(intents) {
    const items = Array.isArray(intents) && intents.length ? intents : ["No customer intents were generated."];
    bodyCard("Searches AI should connect to this contractor", items.slice(0, 10).map((item) => `- ${item}`).join("\n"));
  }

  function modelAnalyses(modelAnalysesValue) {
    const analyses = Array.isArray(modelAnalysesValue) && modelAnalysesValue.length
      ? modelAnalysesValue
      : [{ label: "Local heuristic mode", status: "skipped", score: "--", summary: "No live model analysis was included with this report." }];

    analyses.forEach((analysis) => {
      const title = `${analysis.label || analysis.provider || "AI model"}: ${analysis.score ?? "--"} (${analysis.status || "status"})`;
      const recommendations = Array.isArray(analysis.recommendations) && analysis.recommendations.length
        ? `\n${analysis.recommendations.slice(0, 5).map((item) => `- ${item}`).join("\n")}`
        : "";
      bodyCard(title, `${analysis.summary || "No model summary was generated."}${recommendations}`);
    });
  }

  function evidence(evidenceValue) {
    if (!evidenceValue) {
      bodyCard("Crawler evidence", "No crawler evidence was included with this report.");
      return;
    }

    const pages = Array.isArray(evidenceValue.pagesCrawled) ? evidenceValue.pagesCrawled : [];
    const body = [
      `${pages.length} pages crawled`,
      pages.length ? pages.slice(0, 8).map((page) => `- ${page}`).join("\n") : "",
      evidenceValue.llmsTxtFound ? "llms.txt found" : "No llms.txt found",
      evidenceValue.wordsRead ? `${evidenceValue.wordsRead} readable words analyzed.` : "",
      evidenceValue.title ? `Page title: ${evidenceValue.title}` : "",
    ].filter(Boolean).join("\n");
    bodyCard("What the local crawler read", body);
  }

  function footerNote(note) {
    ensureSpace(44);
    rect(margin, y - 34, contentWidth, 34, [1, 0.94, 0.88]);
    text(note, margin + 14, y - 21, 9.5, "bold", colors.ink);
    y -= 50;
  }

  function toBuffer() {
    if (!current) beginPage();
    return buildPdfFromPages(pages);
  }

  return {
    header,
    scoreSummary,
    sectionTitle,
    categories,
    fixes,
    intent,
    modelAnalyses,
    evidence,
    bodyCard,
    footerNote,
    toBuffer,
  };
}

function buildPdfFromPages(pageContents) {
  const objects = [
    null,
    null,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const pageIds = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;

  pageContents.forEach((ops) => {
    const content = `${ops.join("\n")}\n`;
    const contentId = addPdfObject(objects, `<< /Length ${Buffer.byteLength(content, "binary")} >>\nstream\n${content}endstream`);
    const pageId = addPdfObject(
      objects,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  return assemblePdf(objects, catalogId);
}

function wrapPdfText(value, maxWidth, size) {
  const text = String(value || "").replace(/\r/g, "");
  const maxChars = Math.max(18, Math.floor(maxWidth / (size * 0.52)));
  return text.split("\n").flatMap((paragraph) => {
    if (!paragraph) return [""];
    const words = paragraph.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });

    if (line) lines.push(line);
    return lines.length ? lines : [""];
  });
}

function clampPdfScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
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
