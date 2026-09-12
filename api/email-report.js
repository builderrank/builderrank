import {
  extractBearerToken,
  callSupabaseRpc,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  safeString,
  selectSupabaseRows,
  sendJson,
} from "./_shared.js";
import { buildCustomerReport } from "./_customer-report.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || "Builder Rank <support@builderrank.io>";
const REPORT_EMAIL_REPLY_TO = process.env.REPORT_EMAIL_REPLY_TO || "support@builderrank.io";
const REPORT_EMAIL_BCC = process.env.REPORT_EMAIL_BCC || process.env.OPERATOR_EMAIL_TO || "kaleb@builderrank.io";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (!RESEND_API_KEY) {
    sendJson(response, 503, { error: "Report email is not configured." });
    return;
  }

  let claimedRunId = "";
  let claimedUserId = "";
  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before emailing a report." });
      return;
    }

    const body = await readJsonBody(request);
    const reportRunId = safeString(body.reportRunId || body.report?.reportRunId);
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(reportRunId)) {
      throw Object.assign(new Error("A completed report run is required before email delivery."), { statusCode: 400 });
    }
    const claim = await callSupabaseRpc("br_claim_report_email", { p_run_id: reportRunId, p_user_id: user.id });
    if (claim?.already_sent) {
      sendJson(response, 200, { ok: true, alreadySent: true });
      return;
    }
    claimedRunId = reportRunId;
    claimedUserId = user.id;
    const internalRows = await selectSupabaseRows("br_internal_reports", {
      select: "report",
      report_run_id: `eq.${reportRunId}`,
      user_id: `eq.${user.id}`,
      limit: "1",
    });
    if (!internalRows[0]?.report) {
      throw Object.assign(new Error("The private source report could not be found."), { statusCode: 404 });
    }
    const report = buildCustomerReport({ ...internalRows[0].report, reportRunId });
    const to = safeString(user.email).toLowerCase();
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

    await callSupabaseRpc("br_finalize_report_email", { p_run_id: reportRunId, p_user_id: user.id, p_success: true, p_provider_id: data.id || null });
    claimedRunId = "";
    sendJson(response, 200, { ok: true, id: data.id });
  } catch (error) {
    if (claimedRunId && claimedUserId) {
      try {
        await callSupabaseRpc("br_finalize_report_email", {
          p_run_id: claimedRunId,
          p_user_id: claimedUserId,
          p_success: false,
          p_provider_id: null,
        });
      } catch (finalizeError) {
        console.error("Could not release report email claim", finalizeError);
      }
    }
    sendJson(response, error.statusCode || 500, {
      error: "Could not email report",
      detail: error.message,
    });
  }
}

function renderEmailHtml(report) {
  const score = report.score ?? "Pending";
  const actions = Array.isArray(report.actions) ? report.actions.slice(0, 3) : [];

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:640px">
      <h1 style="margin-bottom:8px">Your Builder Rank report is ready</h1>
      <p>We reviewed how clearly AI systems can understand and recommend your business. Your one-page opportunity brief is attached.</p>
      <p><strong>${escapeHtml(report.company || "Contractor report")}</strong></p>
      <p>${escapeHtml(report.website || "")}${report.market ? ` · ${escapeHtml(report.market)}` : ""}</p>
      <p><strong>Current AI position:</strong> ${escapeHtml(score)}/100 · ${escapeHtml(report.positionLabel)}</p>
      <p><strong>Where more jobs can come from:</strong> ${escapeHtml(report.opportunity)}</p>
      ${actions.length ? `<h2>3 moves to create more lead opportunities</h2><ol>${actions.map(renderAction).join("")}</ol>` : ""}
      <p><strong>The goal:</strong> ${escapeHtml(report.goal)}</p>
      <p>Reply to this email if you want to walk through the findings and decide what to fix first.</p>
    </div>
  `;
}

function renderEmailText(report) {
  const actions = Array.isArray(report.actions)
    ? report.actions.slice(0, 3).map((action) => `${action.number}. ${action.title}\n${action.body}`).join("\n\n")
    : "";

  return [
    "Your Builder Rank report is ready",
    "We reviewed how clearly AI systems can understand and recommend your business. Your one-page opportunity brief is attached.",
    report.company || "Contractor report",
    report.website || "",
    report.market || "",
    `Current AI position: ${report.score ?? "Pending"}/100 · ${report.positionLabel || "Review complete"}`,
    `Where more jobs can come from: ${report.opportunity || "High-intent local searches"}`,
    actions ? `3 moves to create more lead opportunities:\n${actions}` : "",
    `The goal: ${report.goal || "More qualified homeowners discovering your business and requesting an estimate."}`,
    "Reply to this email if you want to walk through the findings and decide what to fix first.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function renderAction(action) {
  return `<li><strong>${escapeHtml(action.title || "Recommended action")}</strong><br>${escapeHtml(action.body || "")}</li>`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "builder-rank-report";
}

export function renderReportPdfBase64(report) {
  return createLeadOpportunityPdf(buildCustomerReport(report)).toString("base64");
}

function createLeadOpportunityPdf(report) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const orange = [1, 0.365, 0.08];
  const ink = [0.06, 0.06, 0.07];
  const muted = [0.34, 0.34, 0.37];
  const pale = [0.965, 0.957, 0.945];
  const white = [1, 1, 1];
  const ops = [];
  const color = (value) => value.map((item) => Number(item).toFixed(3)).join(" ");
  const rect = (x, bottomY, width, height, fill) => ops.push(`${color(fill)} rg\n${x} ${bottomY} ${width} ${height} re f`);
  const text = (value, x, baselineY, size = 10, bold = false, fill = ink) => {
    ops.push(`${color(fill)} rg\nBT\n/${bold ? "F2" : "F1"} ${size} Tf\n${x} ${baselineY} Td\n(${escapePdfText(value)}) Tj\nET`);
  };
  const lines = (value, x, startY, size, maxWidth, lineHeight, bold = false, fill = ink, maxLines = 3) => {
    wrapPdfText(value, maxWidth, size).slice(0, maxLines).forEach((line, index) => text(line, x, startY - index * lineHeight, size, bold, fill));
  };

  rect(0, 0, pageWidth, pageHeight, white);
  text("BUILDER", margin, 756, 13, true, ink);
  text("RANK", margin + 58, 756, 13, true, orange);
  text("AI LEAD OPPORTUNITY BRIEF", 397, 756, 9, true, ink);
  rect(margin, 742, contentWidth, 1, ink);

  text(report.company || "Contractor report", margin, 704, 24, true, ink);
  text([report.market, report.website].filter(Boolean).join("  |  "), margin, 684, 9, false, muted);

  text("YOUR OPPORTUNITY", margin, 644, 10, true, orange);
  lines("Get found by more homeowners. Create more chances to earn the estimate request and win the job.", margin, 620, 18, 350, 23, true, ink, 3);
  rect(420, 565, 150, 82, pale);
  text("CURRENT AI POSITION", 436, 625, 8, true, muted);
  text(`${report.score ?? "--"} / 100`, 436, 594, 25, true, orange);
  text(report.positionLabel || "Review complete", 436, 576, 9, true, ink);

  rect(0, 467, pageWidth, 76, pale);
  text("WHERE MORE JOBS CAN COME FROM", margin, 518, 9, true, ink);
  text(report.opportunity || "High-intent local searches", margin, 492, 18, true, ink);
  lines(report.opportunitySummary, 326, 516, 9, 244, 13, false, muted, 4);

  text("3 MOVES TO CREATE MORE LEAD OPPORTUNITIES", margin, 430, 13, true, ink);
  rect(margin, 417, contentWidth, 1, ink);
  const actions = report.actions?.length ? report.actions.slice(0, 3) : [{ number: 1, title: "Strengthen your online proof", body: "Make the business easier for AI and homeowners to understand and trust." }];
  const rowTops = [382, 292, 202];
  actions.forEach((action, index) => {
    const y = rowTops[index];
    text(String(index + 1).padStart(2, "0"), margin + 8, y, 28, true, orange);
    text(action.title || "Recommended action", margin + 82, y + 2, 13, true, ink);
    lines(action.body || "", margin + 82, y - 18, 9.5, 420, 13, false, muted, 3);
    rect(margin, y - 58, contentWidth, 0.7, [0.78, 0.78, 0.78]);
  });

  text("THE GOAL", margin, 112, 9, true, orange);
  lines(report.goal, margin + 76, 113, 12, 430, 16, true, ink, 3);
  rect(margin, 57, contentWidth, 1, ink);
  text("Reply to your Builder Rank email to review the findings and decide what to fix first.", margin, 38, 8.5, false, muted);

  return buildPdfFromPages([ops]);
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
    ink: [0.97, 0.97, 0.97],
    muted: [0.70, 0.70, 0.73],
    orange: [1, 0.475, 0],
    black: [0.02, 0.02, 0.02],
    panel: [0.055, 0.055, 0.055],
    line: [0.23, 0.23, 0.23],
    white: [1, 1, 1],
    red: [0.95, 0.31, 0.34],
  };

  function beginPage() {
    current = [];
    pages.push(current);
    y = pageHeight - margin;
    rect(0, 0, pageWidth, pageHeight, colors.black);
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
    ensureSpace(180);
    const cardY = y - 150;
    rect(margin, cardY, contentWidth, 150, colors.panel);
    strokeRect(margin, cardY, contentWidth, 150, colors.line);
    rect(margin, cardY + 146, contentWidth, 4, colors.orange);
    text("AI Health Score", margin + 20, cardY + 116, 11, "bold", colors.muted);
    text(String(score), margin + 20, cardY + 76, 34, "bold", colors.orange);
    text(`Grade ${grade}`, margin + 110, cardY + 113, 17, "bold", colors.ink);
    text(website || "Website not set", margin + 110, cardY + 91, 10, "regular", colors.muted);
    lines(summary, margin + 110, cardY + 65, {
      size: 10,
      lineHeight: 14,
      maxWidth: contentWidth - 135,
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
      rect(margin + 16, barY, contentWidth - 32, 6, [0.18, 0.18, 0.18]);
      rect(margin + 16, barY, (contentWidth - 32) * clampPdfScore(category.score) / 100, 6, colors.orange);
      checkLines.forEach((line, index) => {
        const failed = /\(fail\)/i.test(line);
        text(failed ? "x" : "+", margin + 20, barY - 16 - index * 11, 9, "bold", failed ? colors.red : colors.orange);
        text(line.replace(/^[-+]\s*/, ""), margin + 32, barY - 16 - index * 11, 8.8, "regular", colors.ink);
      });
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
      const cleanedRecommendations = normalizePdfRecommendations(analysis.recommendations);
      const recommendations = cleanedRecommendations.length
        ? `\n${cleanedRecommendations.slice(0, 5).map((item) => `- ${item}`).join("\n")}`
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
    rect(margin, y - 34, contentWidth, 34, [0.13, 0.075, 0.035]);
    text(note, margin + 14, y - 21, 9.5, "bold", colors.orange);
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

function normalizePdfRecommendations(values) {
  const normalized = Array.isArray(values) ? values.map((item) => String(item || "").trim()).filter(Boolean) : [];
  const merged = [];
  for (const value of normalized) {
    if (merged.length && /^s included\b/i.test(value) && /\bwhat(?:\.\.\.|…)?$/i.test(merged[merged.length - 1])) {
      const prior = merged.pop().replace(/(?:\.\.\.|…)$/, "");
      merged.push(`${prior}'s${value.slice(1)}`);
    } else {
      merged.push(value);
    }
  }
  return merged.map((item) => /[.!?…]$/.test(item) ? item : `${item.replace(/[,:;\s]+$/, "")}...`);
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
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
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
