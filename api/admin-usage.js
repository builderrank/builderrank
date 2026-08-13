import { isAdminRequestAuthorized, readJsonBody, selectSupabaseRows, updateSupabaseRows, insertSupabaseRow, supabaseServiceConfigured } from "./_shared.js";
import { recordActivity } from "./_activity.js";

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";

export default async function handler(request, response) {
  if (!["GET", "PATCH"].includes(request.method)) return response.status(405).json({ error: "Method not allowed" });
  if (!ADMIN_API_TOKEN || !isAdminRequestAuthorized(request, ADMIN_API_TOKEN)) return response.status(401).json({ error: "Admin token required." });
  if (!supabaseServiceConfigured()) return response.status(503).json({ error: "Supabase service role is not configured." });
  try {
    if (request.method === "PATCH") {
      const body = await readJsonBody(request);
      const businessId = String(body.businessId || "").trim();
      const allowed = ["monthly_allowance", "purchased_credits", "daily_limit", "per_batch_limit", "cooldown_minutes", "customer_rechecks_enabled"];
      const updates = {};
      for (const key of allowed) if (body[key] !== undefined) updates[key] = key === "customer_rechecks_enabled" ? Boolean(body[key]) : Math.max(0, Number.parseInt(body[key], 10) || 0);
      if (!businessId || !Object.keys(updates).length) throw Object.assign(new Error("Business and at least one limit are required."), { statusCode: 400 });
      let account = (await selectSupabaseRows("br_ai_credit_accounts", { select: "business_id", business_id: `eq.${businessId}`, limit: "1" }))[0];
      if (!account) account = (await insertSupabaseRow("br_ai_credit_accounts", { business_id: businessId, ...updates }))[0];
      else account = (await updateSupabaseRows("br_ai_credit_accounts", { business_id: `eq.${businessId}` }, { ...updates, updated_at: new Date().toISOString() }))[0];
      await recordActivity({ businessId, eventType: "admin_credit_limits_changed", eventLabel: "AI credit safeguards updated", entityType: "credit_account", entityId: businessId, metadata: updates });
      return response.status(200).json({ ok: true, account });
    }
    const url = new URL(request.url || "/", "https://builderrank.io");
    const days = Math.max(1, Math.min(Number(url.searchParams.get("days")) || 30, 365));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [businesses, accounts, batches, activities, ledger] = await Promise.all([
      selectSupabaseRows("br_businesses", { select: "id,name,site_id,market,owner_user_id", order: "name.asc", limit: "250" }),
      selectSupabaseRows("br_ai_credit_accounts", { select: "business_id,monthly_allowance,purchased_credits,period_used,period_start,period_end,daily_limit,per_batch_limit,cooldown_minutes,customer_rechecks_enabled,updated_at", limit: "250" }),
      selectSupabaseRows("br_ai_recheck_batches", { select: "id,business_id,user_id,platforms,estimated_credits,charged_credits,status,failure_detail,created_at,completed_at", created_at: `gte.${since}`, order: "created_at.desc", limit: "1000" }),
      selectSupabaseRows("br_activity_events", { select: "id,business_id,user_id,event_type,event_label,entity_type,entity_id,metadata,created_at", created_at: `gte.${since}`, order: "created_at.desc", limit: "1000" }),
      selectSupabaseRows("br_ai_credit_ledger", { select: "id,business_id,batch_id,entry_type,credit_delta,note,created_at", created_at: `gte.${since}`, order: "created_at.desc", limit: "1000" }),
    ]);
    const accountByBusiness = new Map(accounts.map((row) => [row.business_id, row]));
    const customers = businesses.map((business) => {
      const account = accountByBusiness.get(business.id) || { monthly_allowance: 120, purchased_credits: 0, period_used: 0, daily_limit: 36, per_batch_limit: 24, cooldown_minutes: 30, customer_rechecks_enabled: true };
      const ownBatches = batches.filter((row) => row.business_id === business.id);
      const ownActivity = activities.filter((row) => row.business_id === business.id);
      const total = Number(account.monthly_allowance) + Number(account.purchased_credits);
      return { businessId: business.id, name: business.name, siteId: business.site_id, market: business.market, hasOwner: Boolean(business.owner_user_id), credits: { total, used: Number(account.period_used), remaining: Math.max(0, total - Number(account.period_used)), monthlyAllowance: Number(account.monthly_allowance), purchasedCredits: Number(account.purchased_credits), periodEnd: account.period_end }, limits: { daily: Number(account.daily_limit), batch: Number(account.per_batch_limit), cooldownMinutes: Number(account.cooldown_minutes), enabled: account.customer_rechecks_enabled }, usage: { rechecks: ownBatches.length, charged: ownBatches.reduce((sum, row) => sum + Number(row.charged_credits || 0), 0), failures: ownBatches.filter((row) => row.status === "failed" || row.status === "partial").length, sessions: ownActivity.filter((row) => row.event_type === "dashboard_session").length, changes: ownActivity.filter((row) => ["recommendation_status_changed","target_term_created","target_term_status_changed"].includes(row.event_type)).length, lastActiveAt: ownActivity[0]?.created_at || null } };
    });
    return response.status(200).json({ ok: true, days, summary: { customers: customers.length, creditsCharged: batches.reduce((sum, row) => sum + Number(row.charged_credits || 0), 0), rechecks: batches.length, failedOrPartial: batches.filter((row) => row.status === "failed" || row.status === "partial").length, sessions: activities.filter((row) => row.event_type === "dashboard_session").length, customerChanges: activities.filter((row) => ["recommendation_status_changed","target_term_created","target_term_status_changed"].includes(row.event_type)).length }, customers, recentActivity: activities.slice(0, 100), recentBatches: batches.slice(0, 100), ledger: ledger.slice(0, 100) });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ error: "Could not load AI usage controls.", detail: error.message });
  }
}
