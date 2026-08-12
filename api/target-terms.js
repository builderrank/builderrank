import {
  extractBearerToken,
  getSupabaseUser,
  insertSupabaseRow,
  readJsonBody,
  selectSupabaseRows,
  supabaseServiceConfigured,
  updateSupabaseRows,
} from "./_shared.js";

const allowedStatuses = new Set(["active", "paused", "archived"]);

export default async function handler(request, response) {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(request.method)) return response.status(405).json({ error: "Method not allowed" });
  if (!supabaseServiceConfigured()) return response.status(503).json({ error: "Target Terms requires the configured Builder Rank database." });

  const user = await getSupabaseUser(extractBearerToken(request));
  if (!user?.id) return response.status(401).json({ error: "Log in to manage Target Terms." });

  try {
    const body = request.method === "GET" ? {} : await readJsonBody(request);
    const url = new URL(request.url || "/", "https://builderrank.io");
    const siteId = safeTrim(body.siteId || url.searchParams.get("siteId"));
    const targetTermId = safeTrim(body.targetTermId || body.id || url.searchParams.get("id"));
    const business = await ownedBusiness(user.id, siteId, targetTermId);
    if (!business) return response.status(404).json({ error: "Owned Builder Rank workspace not found." });

    if (request.method === "GET") return response.status(200).json({ ok: true, targetTerms: await loadTerms(business.id) });
    if (request.method === "POST") {
      const active = (await loadTerms(business.id)).filter((row) => row.status === "active");
      if (active.length >= 2) return response.status(409).json({ error: "Pause one active term before adding another. Each workspace can actively target up to two terms." });
      const phrase = normalizePhrase(body.phrase || body.term);
      const duplicate = (await loadTerms(business.id)).find((row) => row.phrase.toLowerCase() === phrase.toLowerCase() && row.status !== "archived");
      if (duplicate) return response.status(409).json({ error: "That target term already exists for this workspace." });
      const jobTypeId = await validJobTypeId(business.id, body.jobTypeId);
      const term = (await insertSupabaseRow("br_target_terms", {
        business_id: business.id,
        job_type_id: jobTypeId,
        phrase,
        target_market: safeTrim(body.market || business.market).slice(0, 120),
        priority: active.length + 1,
        status: "active",
        created_by: user.id,
      }))[0];
      if (!term?.id) throw new Error("Target term could not be saved.");
      const generated = await seedTargetTermWork(business, term);
      return response.status(201).json({ ok: true, targetTerm: formatTerm(term), generated });
    }

    const term = await ownedTerm(business.id, targetTermId);
    if (!term) return response.status(404).json({ error: "Target term not found." });
    const status = request.method === "DELETE" ? "archived" : safeTrim(body.status);
    if (!allowedStatuses.has(status)) return response.status(400).json({ error: "Status must be active, paused, or archived." });
    if (status === "active" && term.status !== "active") {
      const active = (await loadTerms(business.id)).filter((row) => row.status === "active" && row.id !== term.id);
      if (active.length >= 2) return response.status(409).json({ error: "Only two Target Terms can be active at once." });
    }
    const updated = (await updateSupabaseRows("br_target_terms", { id: `eq.${term.id}` }, { status, updated_at: new Date().toISOString() }))[0] || { ...term, status };
    return response.status(200).json({ ok: true, targetTerm: formatTerm(updated) });
  } catch (error) {
    return response.status(error.statusCode || 400).json({ error: "Could not update Target Terms.", detail: error.message });
  }
}

async function ownedBusiness(userId, siteId, targetTermId) {
  if (siteId) return (await selectSupabaseRows("br_businesses", { select: "id,site_id,name,market,primary_trade", owner_user_id: `eq.${userId}`, site_id: `eq.${siteId}`, limit: "1" }))[0];
  if (!targetTermId) return null;
  const term = (await selectSupabaseRows("br_target_terms", { select: "business_id", id: `eq.${targetTermId}`, limit: "1" }))[0];
  if (!term?.business_id) return null;
  return (await selectSupabaseRows("br_businesses", { select: "id,site_id,name,market,primary_trade", id: `eq.${term.business_id}`, owner_user_id: `eq.${userId}`, limit: "1" }))[0];
}

async function loadTerms(businessId) {
  const rows = await selectSupabaseRows("br_target_terms", { select: "id,business_id,job_type_id,phrase,target_market,priority,status,created_at,updated_at", business_id: `eq.${businessId}`, status: "neq.archived", order: "priority.asc,created_at.asc", limit: "10" });
  return rows.map(formatTerm);
}

async function ownedTerm(businessId, id) {
  if (!id) return null;
  return (await selectSupabaseRows("br_target_terms", { select: "id,business_id,job_type_id,phrase,target_market,priority,status,created_at,updated_at", id: `eq.${id}`, business_id: `eq.${businessId}`, limit: "1" }))[0];
}

async function validJobTypeId(businessId, value) {
  const id = safeTrim(value);
  if (!id) return null;
  return (await selectSupabaseRows("br_job_types", { select: "id", id: `eq.${id}`, business_id: `eq.${businessId}`, active: "eq.true", limit: "1" }))[0]?.id || null;
}

async function seedTargetTermWork(business, term) {
  const market = term.target_market || business.market || "the service area";
  const promptTexts = [`best ${term.phrase} in ${market}`, `who should I hire for ${term.phrase} near ${market}`, `${term.phrase} companies with strong reviews in ${market}`];
  const existingPrompts = await selectSupabaseRows("br_prompts", { select: "id,prompt_text", business_id: `eq.${business.id}`, limit: "250" });
  const known = new Set(existingPrompts.map((row) => row.prompt_text.toLowerCase()));
  let prompts = 0;
  for (const promptText of promptTexts) {
    if (known.has(promptText.toLowerCase())) continue;
    const inserted = await insertSupabaseRow("br_prompts", { business_id: business.id, job_type_id: term.job_type_id, target_term_id: term.id, prompt_text: promptText, persona: "Homeowner ready to hire", intent: "target_term", active: true });
    if (inserted[0]) prompts += 1;
  }
  const title = `Optimize for “${term.phrase}”`;
  const existing = (await selectSupabaseRows("br_recommendations", { select: "id", business_id: `eq.${business.id}`, title: `eq.${title}`, limit: "1" }))[0];
  let recommendations = 0;
  if (!existing) {
    const inserted = await insertSupabaseRow("br_recommendations", {
      business_id: business.id,
      job_type_id: term.job_type_id,
      target_term_id: term.id,
      priority: "high",
      title,
      body: `Strengthen the primary service page, project proof, FAQs, schema, internal links, GBP services, and trusted citations around “${term.phrase}” in ${market}. Recheck ChatGPT, Gemini, and Claude after approved changes go live.`,
      status: "open",
      source: "target_terms",
    });
    if (inserted[0]) recommendations = 1;
  }
  return { prompts, recommendations };
}

function normalizePhrase(value) {
  const phrase = safeTrim(value).replace(/\s+/g, " ").slice(0, 100);
  if (phrase.length < 3) throw new Error("Enter a target term or phrase with at least 3 characters.");
  if (phrase.split(" ").length > 12) throw new Error("Keep each target phrase to 12 words or fewer.");
  return phrase;
}
function formatTerm(row) { return { id: row.id, jobTypeId: row.job_type_id || "", phrase: row.phrase, market: row.target_market || "", priority: row.priority, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }; }
function safeTrim(value) { return String(value || "").trim(); }
