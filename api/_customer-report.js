const GENERIC_OPPORTUNITY = "High-intent local searches";

export function buildCustomerReport(report = {}) {
  const fixes = Array.isArray(report.actions)
    ? report.actions.slice(0, 3).map((action, index) => ({ ...toCustomerAction(action, index), ...action, number: index + 1 }))
    : Array.isArray(report.fixes) ? report.fixes.slice(0, 3).map(toCustomerAction) : [];
  const completeModels = Array.isArray(report.modelAnalyses)
    ? report.modelAnalyses.filter((analysis) => analysis?.status === "complete").length
    : 0;

  return {
    reportRunId: report.reportRunId || "",
    company: report.company || "Contractor report",
    website: report.website || "",
    market: report.market || "",
    score: Number.isFinite(Number(report.score)) ? Number(report.score) : null,
    positionLabel: report.positionLabel || customerPositionLabel(report.score),
    opportunity: report.opportunity || opportunityFromIntents(report.intents),
    opportunitySummary: report.opportunitySummary || "Homeowners are increasingly using AI to compare local contractors. Strengthening these signals gives AI and potential customers better reasons to choose your business.",
    modelCoverage: report.modelCoverage || (completeModels ? `${completeModels} AI models reviewed` : "AI review complete"),
    actions: fixes,
    goal: report.goal || "More qualified homeowners discovering your business, visiting your website, and requesting an estimate.",
  };
}

function toCustomerAction(fix = {}, index) {
  return {
    number: index + 1,
    title: String(fix.title || "Strengthen your online proof").trim(),
    body: String(fix.body || "Make the business easier for AI and homeowners to understand and trust.").trim(),
  };
}

export function customerPositionLabel(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "Review complete";
  if (value >= 85) return "Strong position";
  if (value >= 70) return "Good foundation";
  if (value >= 60) return "Growth opportunity";
  return "Large opportunity to improve";
}

export function opportunityFromIntents(intents) {
  const first = Array.isArray(intents) ? String(intents[0] || "") : "";
  const cleaned = first
    .replace(/["']/g, "")
    .replace(/\b(best|top|licensed|local)\b/gi, "")
    .replace(/\b(near me|in [a-z][a-z .,'-]+)$/i, "")
    .replace(/\b(contractor|company|business)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 4 || cleaned.length > 52) return GENERIC_OPPORTUNITY;
  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
