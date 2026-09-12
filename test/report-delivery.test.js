import test from "node:test";
import assert from "node:assert/strict";
import { renderReportPdfBase64 } from "../api/email-report.js";
import { buildCustomerReport, opportunityFromIntents } from "../api/_customer-report.js";
import { validateAdditionalReportPurchase, verifyStripeSignature } from "../api/stripe-webhook.js";
import { assertCompleteModelResult, buildModelScores, isRetryableProviderError, normalizeRecommendationList, polishRecommendationText, truncateModelText } from "../server.js";
import { createHmac } from "node:crypto";

test("rejects incomplete live-model responses", () => {
  assert.throws(
    () => assertCompleteModelResult({ summary: "The strongest signal for AI is", recommendations: [] }, "Gemini"),
    /incomplete audit response/,
  );
});

test("retries only transient provider failures", () => {
  assert.equal(isRetryableProviderError(Object.assign(new Error("rate limited"), { statusCode: 429 })), true);
  assert.equal(isRetryableProviderError(Object.assign(new Error("provider unavailable"), { statusCode: 503 })), true);
  assert.equal(isRetryableProviderError(new Error("response incomplete: max_tokens")), true);
  assert.equal(isRetryableProviderError(Object.assign(new Error("invalid API key"), { statusCode: 401 })), false);
  assert.equal(isRetryableProviderError(Object.assign(new Error("bad request"), { statusCode: 400 })), false);
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

test("joins model recommendation fragments created at schema length boundaries", () => {
  assert.deepEqual(normalizeRecommendationList([
    "Add a service page with a What",
    "s included section in crawlable text.",
    "Publish licensing details.",
  ]), [
    "Add a service page with a What's included section in crawlable text.",
    "Publish licensing details.",
  ]);
});

test("marks visibly truncated recommendations with an ellipsis", () => {
  assert.equal(polishRecommendationText("Link to the state lookup if possible to"), "Link to the state lookup if possible to...");
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
  assert.match(pdf.toString("binary"), /3 MOVES TO CREATE MORE LEAD OPPORTUNITIES/);
  assert.doesNotMatch(pdf.toString("binary"), /Live Model Analysis|Audit Evidence|Report Card Categories/);
});

test("customer report keeps only the concise lead-opportunity view", () => {
  const customer = buildCustomerReport({
    reportRunId: "run-1",
    company: "Example Remodeler",
    website: "https://example.com/",
    market: "Denver, CO",
    score: 72,
    intents: ['"bathroom remodel contractor near me"'],
    fixes: [
      { priority: "Critical", title: "Add local proof", body: "Publish project evidence." },
      { priority: "High", title: "Strengthen reviews", body: "Ask recent customers." },
      { priority: "High", title: "Improve service pages", body: "Add pricing guidance." },
      { priority: "Medium", title: "Internal-only fourth fix", body: "Should stay private." },
    ],
    categories: [{ label: "Internal category" }],
    evidence: { pagesCrawled: ["https://example.com/private-evidence"] },
    modelAnalyses: [{ status: "complete", raw: "private model detail" }],
  });

  assert.equal(customer.positionLabel, "Good foundation");
  assert.equal(customer.opportunity, "Bathroom Remodel");
  assert.equal(customer.actions.length, 3);
  assert.equal("categories" in customer, false);
  assert.equal("evidence" in customer, false);
  assert.equal("modelAnalyses" in customer, false);
});

test("falls back to a safe opportunity label when search intent is unusable", () => {
  assert.equal(opportunityFromIntents([]), "High-intent local searches");
});

test("accepts only completed $10 Builder Rank Checkout Sessions", () => {
  const validSession = {
    object: "checkout.session",
    client_reference_id: "br_1234567890abcdef",
    mode: "payment",
    payment_status: "paid",
    amount_total: 1000,
    currency: "usd",
    customer_details: { email: "customer@example.com" },
  };

  assert.deepEqual(validateAdditionalReportPurchase(validSession), {
    accepted: true,
    checkoutReference: "br_1234567890abcdef",
  });
  assert.equal(validateAdditionalReportPurchase({ ...validSession, payment_status: "unpaid" }).pending, true);
  assert.equal(validateAdditionalReportPurchase({ ...validSession, amount_total: 999 }).accepted, false);
  assert.equal(validateAdditionalReportPurchase({ ...validSession, currency: "cad" }).accepted, false);
  assert.equal(validateAdditionalReportPurchase({ ...validSession, client_reference_id: "untrusted" }).accepted, false);
  assert.equal(validateAdditionalReportPurchase({ ...validSession, customer_details: {} }).accepted, false);
});

test("verifies Stripe signatures and rejects tampered payloads", async () => {
  const body = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = "whsec_builder_rank_test";
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");

  await assert.doesNotReject(() => verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret));
  await assert.rejects(() => verifyStripeSignature(`${body} `, `t=${timestamp},v1=${signature}`, secret), /Invalid Stripe signature/);
  await assert.rejects(() => verifyStripeSignature(body, "", secret), /Missing Stripe signature/);
  const expiredTimestamp = timestamp - 301;
  const expiredSignature = createHmac("sha256", secret).update(`${expiredTimestamp}.${body}`, "utf8").digest("hex");
  await assert.rejects(() => verifyStripeSignature(body, `t=${expiredTimestamp},v1=${expiredSignature}`, secret), /Expired Stripe signature/);
});
