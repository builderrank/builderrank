import test from "node:test";
import assert from "node:assert/strict";
import { renderReportPdfBase64 } from "../api/email-report.js";
import { assertCompleteModelResult, buildModelScores, truncateModelText } from "../server.js";

test("rejects incomplete live-model responses", () => {
  assert.throws(
    () => assertCompleteModelResult({ summary: "The strongest signal for AI is", recommendations: [] }, "Gemini"),
    /incomplete audit response/,
  );
});

test("does not invent model scores when providers do not report", () => {
  assert.deepEqual(buildModelScores(72, {}, [
    { provider: "chatgpt", status: "skipped", score: null },
    { provider: "claude", status: "error", score: null },
    { provider: "gemini", status: "complete", score: 68 },
  ]), { chatgpt: null, claude: null, gemini: 68 });
});

test("truncates model text without cutting a completed sentence", () => {
  const first = "This is a complete and useful sentence with enough detail for the customer to understand the result. ";
  const value = `${first}${"Additional supporting detail ".repeat(30)}`;
  assert.equal(truncateModelText(value, 180), first.trim());
});

test("creates a branded PDF attachment from report data", () => {
  const encoded = renderReportPdfBase64({
    company: "Example Remodeler",
    market: "Denver, CO",
    website: "https://example.com/",
    score: 72,
    grade: "B",
    summary: "AI can identify the business, with additional local proof needed before confident recommendations.",
    categories: [{ label: "Entity Check", score: 72, description: "Can AI verify the business?", checks: [{ label: "Phone found", status: "pass" }] }],
    fixes: [{ priority: "High", title: "Add local proof", body: "Publish service-area and project evidence." }],
    intents: ["bathroom remodeler near me"],
    modelAnalyses: [],
    evidence: { pagesCrawled: ["https://example.com/"], wordsRead: 500, llmsTxtFound: false },
  });
  const pdf = Buffer.from(encoded, "base64");
  assert.equal(pdf.subarray(0, 8).toString(), "%PDF-1.4");
  assert.ok(pdf.length > 1000);
});
