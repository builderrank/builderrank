import { callSupabaseRpc, extractBearerToken, getSupabaseUser, readJsonBody, selectSupabaseRows, supabaseServiceConfigured, updateSupabaseRows, insertSupabaseRow } from "./_shared.js";
import { importVisibilityBatch } from "./import-ai-visibility.js";
import { PLATFORM_CONFIG, runPlatformPrompt } from "./_ai-platforms.js";
import { recordActivity } from "./_activity.js";

const ALLOWED_PLATFORMS = new Set(Object.keys(PLATFORM_CONFIG));

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) return response.status(405).json({ error: "Method not allowed" });
  if (!supabaseServiceConfigured()) return response.status(503).json({ error: "AI monitoring credits require the Builder Rank database." });
  const user = await getSupabaseUser(extractBearerToken(request));
  if (!user?.id) return response.status(401).json({ error: "Sign in to view or spend AI monitoring credits." });
  try {
    const url = new URL(request.url || "/", "https://builderrank.io");
    const body = request.method === "POST" ? await readJsonBody(request) : {};
    const siteId = String(body.siteId || url.searchParams.get("siteId") || "").trim();
    const business = (await selectSupabaseRows("br_businesses", { select: "id,name,site_id,website_url,market,primary_trade,owner_user_id", site_id: `eq.${siteId}`, owner_user_id: `eq.${user.id}`, limit: "1" }))[0];
    if (!business) return response.status(404).json({ error: "Owned Builder Rank workspace not found." });
    if (request.method === "GET") return response.status(200).json({ ok: true, credits: await creditSummary(business.id), connections: connectionSummary() });
    const platforms = [...new Set((Array.isArray(body.platforms) ? body.platforms : []).map((item) => String(item).toLowerCase()))].filter((item) => ALLOWED_PLATFORMS.has(item));
    const targetTermIds = [...new Set((Array.isArray(body.targetTermIds) ? body.targetTermIds : []).map(String))];
    if (!platforms.length || !targetTermIds.length) throw Object.assign(new Error("Select at least one platform and Target Term."), { statusCode: 400 });
    const terms = await selectSupabaseRows("br_target_terms", { select: "id,phrase,target_market,job_type_id,status", business_id: `eq.${business.id}`, id: `in.(${targetTermIds.join(",")})`, status: "eq.active", limit: "2" });
    if (terms.length !== targetTermIds.length) throw Object.assign(new Error("One or more Target Terms are invalid or paused."), { statusCode: 400 });
    const prompts = await selectSupabaseRows("br_prompts", { select: "id,prompt_text,persona,intent,job_type_id,target_term_id", business_id: `eq.${business.id}`, target_term_id: `in.(${targetTermIds.join(",")})`, active: "eq.true", limit: "6" });
    const jobs = prompts.flatMap((prompt) => platforms.map((platform) => ({ prompt, platform })));
    const estimated = jobs.length;
    if (!estimated) throw Object.assign(new Error("These Target Terms do not have active monitoring prompts yet."), { statusCode: 400 });
    const idempotencyKey = String(body.idempotencyKey || "").trim();
    if (!/^[a-z0-9_-]{12,100}$/i.test(idempotencyKey)) throw Object.assign(new Error("A valid recheck confirmation key is required."), { statusCode: 400 });
    const reservation = await callSupabaseRpc("br_reserve_ai_recheck", { p_business_id: business.id, p_user_id: user.id, p_idempotency_key: idempotencyKey, p_platforms: platforms, p_target_term_ids: targetTermIds, p_estimated_credits: estimated });
    if (reservation?.duplicate) return response.status(200).json({ ok: true, duplicate: true, batchId: reservation.batch_id, status: reservation.status, credits: await creditSummary(business.id) });
    const batchId = reservation.batch_id;
    await updateSupabaseRows("br_ai_recheck_batches", { id: `eq.${batchId}` }, { status: "running", started_at: new Date().toISOString() });
    await recordActivity({ businessId: business.id, userId: user.id, eventType: "ai_recheck_started", eventLabel: `${estimated} prompt checks across ${platforms.join(", ")}`, entityType: "ai_recheck_batch", entityId: batchId, metadata: { platforms, targetTermIds, estimatedCredits: estimated } });
    const settled = await Promise.allSettled(jobs.map(async ({ prompt, platform }) => {
      const result = await runPlatformPrompt(platform, { prompt, business });
      await insertSupabaseRow("br_ai_recheck_runs", { batch_id: batchId, business_id: business.id, prompt_id: prompt.id, target_term_id: prompt.target_term_id, platform: PLATFORM_CONFIG[platform].label, status: "complete", credit_cost: 1, model: result.model, completed_at: new Date().toISOString() });
      return { prompt: prompt.prompt_text, promptId: prompt.id, jobType: terms.find((term) => term.id === prompt.target_term_id)?.phrase || business.primary_trade, persona: prompt.persona, intent: prompt.intent, platform: PLATFORM_CONFIG[platform].label, model: result.model, measurementMode: "api_benchmark", consumerSurface: platform === "meta" ? "Meta Model API" : `${PLATFORM_CONFIG[platform].label} API`, runAt: new Date().toISOString(), ...result };
    }));
    const successfulRuns = settled.filter((item) => item.status === "fulfilled").map((item) => item.value);
    const failures = settled.map((item, index) => item.status === "rejected" ? { platform: PLATFORM_CONFIG[jobs[index].platform].label, prompt: jobs[index].prompt.prompt_text, error: item.reason?.message || "Request failed" } : null).filter(Boolean);
    await Promise.all(failures.map((failure) => insertSupabaseRow("br_ai_recheck_runs", { batch_id: batchId, business_id: business.id, platform: failure.platform, status: "failed", credit_cost: 0, error_detail: failure.error, completed_at: new Date().toISOString() })));
    if (successfulRuns.length) await importVisibilityBatch({ siteId: business.site_id, runs: successfulRuns });
    const finalized = await callSupabaseRpc("br_finalize_ai_recheck", { p_batch_id: batchId, p_success_count: successfulRuns.length, p_failure_count: failures.length, p_failure_detail: failures.map((item) => `${item.platform}: ${item.error}`).join(" | ").slice(0, 2000) || null });
    await recordActivity({ businessId: business.id, userId: user.id, eventType: "ai_recheck_completed", eventLabel: `${successfulRuns.length} successful, ${failures.length} refunded`, entityType: "ai_recheck_batch", entityId: batchId, metadata: { chargedCredits: successfulRuns.length, refundedCredits: failures.length, status: finalized.status } });
    return response.status(200).json({ ok: true, batchId, status: finalized.status, successfulRuns: successfulRuns.length, failedRuns: failures.length, failures, chargedCredits: successfulRuns.length, refundedCredits: failures.length, credits: await creditSummary(business.id) });
  } catch (error) {
    return response.status(error.statusCode || 400).json({ error: "Could not run AI visibility recheck.", detail: error.message });
  }
}

async function creditSummary(businessId) {
  let account = (await selectSupabaseRows("br_ai_credit_accounts", { select: "monthly_allowance,purchased_credits,period_used,period_start,period_end,daily_limit,per_batch_limit,cooldown_minutes,customer_rechecks_enabled", business_id: `eq.${businessId}`, limit: "1" }))[0];
  if (!account) account = (await insertSupabaseRow("br_ai_credit_accounts", { business_id: businessId }))[0];
  if (new Date(account.period_end) <= new Date()) account = (await updateSupabaseRows("br_ai_credit_accounts", { business_id: `eq.${businessId}` }, { period_used: 0, period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString() }))[0];
  const total = Number(account.monthly_allowance) + Number(account.purchased_credits);
  return { remaining: Math.max(0, total - Number(account.period_used)), used: Number(account.period_used), total, monthlyAllowance: Number(account.monthly_allowance), purchasedCredits: Number(account.purchased_credits), periodStart: account.period_start, periodEnd: account.period_end, dailyLimit: Number(account.daily_limit), perBatchLimit: Number(account.per_batch_limit), cooldownMinutes: Number(account.cooldown_minutes), enabled: account.customer_rechecks_enabled };
}
function connectionSummary() { return Object.fromEntries(Object.entries(PLATFORM_CONFIG).map(([key, value]) => [key, { label: value.label, connected: Boolean(value.key && (key !== "meta" || (value.baseUrl && value.model))) }])); }
