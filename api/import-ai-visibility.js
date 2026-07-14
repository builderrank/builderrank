import {
  insertSupabaseRow,
  isAdminRequestAuthorized,
  readJsonBody,
  selectSupabaseRows,
  supabaseServiceConfigured,
  updateSupabaseRows,
  upsertSupabaseRow,
} from "./_shared.js";

const allowedMethods = new Set(["POST", "OPTIONS"]);
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";
const ADMIN_ALLOWED_ORIGIN = process.env.ADMIN_ALLOWED_ORIGIN || "https://builderrank.io";

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (!allowedMethods.has(request.method)) {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (!ADMIN_API_TOKEN) {
    response.status(503).json({ error: "ADMIN_API_TOKEN is not configured." });
    return;
  }

  if (!isAdminRequestAuthorized(request, ADMIN_API_TOKEN)) {
    response.status(401).json({ error: "Admin token required." });
    return;
  }

  if (!supabaseServiceConfigured()) {
    response.status(503).json({ error: "Supabase service role is not configured." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const batch = normalizeBatch(body);
    const business = await findBusiness(batch.siteId);
    const prompts = await loadPrompts(business.id);
    const jobTypes = await loadJobTypes(business.id);
    const imported = [];

    for (const run of batch.runs) {
      const prompt = await ensurePrompt(business.id, prompts, jobTypes, run);
      const promptRun = await upsertPromptRun(prompt.id, run);
      const mention = await upsertMention(business.id, promptRun.id, run);
      const sources = await upsertSources(business.id, promptRun.id, run.sources);
      imported.push({ promptRunId: promptRun.id, promptId: prompt.id, jobTypeId: prompt.job_type_id || null, mentionId: mention.id, sources: sources.length });
    }

    response.status(202).json({
      ok: true,
      business: {
        id: business.id,
        name: business.name,
        siteId: business.site_id,
      },
      importedRuns: imported.length,
      imported,
    });
  } catch (error) {
    response.status(error.statusCode || 400).json({
      error: "Could not import AI visibility batch.",
      detail: error.message,
    });
  }
}

async function findBusiness(siteId) {
  const rows = await selectSupabaseRows("br_businesses", {
    select: "id,name,site_id",
    site_id: `eq.${siteId}`,
    limit: "1",
  });
  const business = rows[0];

  if (!business?.id) {
    throw Object.assign(new Error("No Builder Rank business found for that siteId."), { statusCode: 404 });
  }

  return business;
}

async function loadPrompts(businessId) {
  const rows = await selectSupabaseRows("br_prompts", {
    select: "id,prompt_text,persona,intent,job_type_id,active",
    business_id: `eq.${businessId}`,
    limit: "250",
  });
  return new Map(rows.map((row) => [normalizeText(row.prompt_text), row]));
}

async function loadJobTypes(businessId) {
  const rows = await selectSupabaseRows("br_job_types", {
    select: "id,label,slug,priority,active",
    business_id: `eq.${businessId}`,
    active: "eq.true",
    order: "priority.asc",
    limit: "50",
  });
  return rows;
}

async function ensurePrompt(businessId, prompts, jobTypes, run) {
  const jobType = findJobType(jobTypes, run.jobType);
  if (run.promptId) {
    const rows = await selectSupabaseRows("br_prompts", {
      select: "id,prompt_text,persona,intent,job_type_id,active",
      id: `eq.${run.promptId}`,
      business_id: `eq.${businessId}`,
      limit: "1",
    });
    if (rows[0]) return await assignPromptJobType(rows[0], jobType, prompts);
  }

  const key = normalizeText(run.prompt);
  const existing = prompts.get(key);
  if (existing) {
    return await assignPromptJobType(existing, jobType, prompts);
  }

  const rows = await insertSupabaseRow("br_prompts", {
    business_id: businessId,
    job_type_id: jobType?.id || null,
    prompt_text: run.prompt,
    persona: run.persona || "Homeowner ready to hire",
    intent: run.intent || "hire_local_contractor",
    active: true,
  });
  const prompt = rows[0];
  if (prompt) prompts.set(key, prompt);
  return prompt;
}

async function assignPromptJobType(prompt, jobType, prompts) {
  if (!prompt?.id || prompt.job_type_id || !jobType?.id) return prompt;
  const updated = await updateSupabaseRows("br_prompts", { id: `eq.${prompt.id}` }, { job_type_id: jobType.id });
  const row = updated[0] || { ...prompt, job_type_id: jobType.id };
  if (row.prompt_text) prompts.set(normalizeText(row.prompt_text), row);
  return row;
}

async function upsertPromptRun(promptId, run) {
  const rows = await upsertSupabaseRow(
    "br_prompt_runs",
    {
      prompt_id: promptId,
      platform: run.platform,
      model: run.model || null,
      run_status: "complete",
      raw_response: run.rawResponse || {},
      answer_text: run.answerText || "",
      run_at: run.runAt,
      completed_at: run.completedAt || new Date().toISOString(),
    },
    "prompt_id,platform,run_at",
  );
  return rows[0];
}

async function upsertMention(businessId, promptRunId, run) {
  const rows = await upsertSupabaseRow(
    "br_ai_mentions",
    {
      prompt_run_id: promptRunId,
      business_id: businessId,
      mentioned: run.mentioned,
      mention_text: run.mentionText || "",
      rank_position: run.rankPosition || null,
      sentiment: run.sentiment || null,
      confidence: run.confidence,
    },
    "prompt_run_id,business_id",
  );
  return rows[0];
}

async function upsertSources(businessId, promptRunId, sources) {
  const rows = [];

  for (const source of sources) {
    const inserted = await upsertSupabaseRow(
      "br_ai_sources",
      {
        prompt_run_id: promptRunId,
        business_id: businessId,
        domain: source.domain,
        url: source.url || "",
        source_type: source.type || "unknown",
        cited: source.cited,
      },
      "prompt_run_id,domain,url",
    );
    if (inserted[0]) rows.push(inserted[0]);
  }

  return rows;
}

function normalizeBatch(body) {
  const siteId = safeTrim(body.siteId);
  if (!/^br_[a-z0-9_/-]{3,80}$/i.test(siteId)) {
    throw new Error("siteId must start with br_ and contain only letters, numbers, dashes, underscores, or slashes.");
  }

  if (!Array.isArray(body.runs) || !body.runs.length) {
    throw new Error("runs must include at least one AI visibility check.");
  }

  return {
    siteId,
    runs: body.runs.map(normalizeRun).slice(0, 100),
  };
}

function normalizeRun(value) {
  const prompt = safeTrim(value.prompt || value.promptText).slice(0, 1000);
  const promptId = safeTrim(value.promptId);
  const platform = safeTrim(value.platform).slice(0, 80);
  const runAt = normalizeDate(value.runAt);

  if (!prompt && !promptId) throw new Error("Each run needs prompt or promptId.");
  if (!platform) throw new Error("Each run needs platform.");

  return {
    prompt,
    promptId,
    jobType: safeTrim(value.jobType || value.service || value.profitCenter).slice(0, 120),
    persona: safeTrim(value.persona).slice(0, 120),
    intent: safeTrim(value.intent).slice(0, 120),
    platform,
    model: safeTrim(value.model).slice(0, 120),
    answerText: safeTrim(value.answerText || value.answer).slice(0, 10000),
    rawResponse: isPlainObject(value.rawResponse) ? value.rawResponse : {},
    runAt,
    completedAt: normalizeDate(value.completedAt || runAt),
    mentioned: Boolean(value.mentioned),
    mentionText: safeTrim(value.mentionText).slice(0, 2000),
    rankPosition: normalizeRank(value.rankPosition || value.rank),
    sentiment: safeTrim(value.sentiment).slice(0, 60),
    confidence: normalizeConfidence(value.confidence, Boolean(value.mentioned)),
    sources: normalizeSources(value.sources || value.citations),
  };
}

function findJobType(jobTypes, value) {
  const target = normalizeSlug(value);
  if (!target) return null;
  return jobTypes.find((jobType) => normalizeSlug(jobType.slug) === target || normalizeSlug(jobType.label) === target) || null;
}

function normalizeSources(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((source) => {
      const url = normalizeUrl(source.url);
      const domain = safeTrim(source.domain || domainFromUrl(url)).toLowerCase().replace(/^www\./, "");
      return {
        domain: domain.slice(0, 180),
        url,
        type: safeTrim(source.type || source.sourceType).slice(0, 80),
        cited: source.cited !== false,
      };
    })
    .filter((source) => source.domain)
    .slice(0, 20);
}

function normalizeRank(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeConfidence(value, mentioned = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) return mentioned ? 80 : 50;
  return Math.max(0, Math.min(100, number));
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("Invalid run date.");
  return date.toISOString();
}

function normalizeUrl(value) {
  const text = safeTrim(value).slice(0, 1500);
  if (!text) return "";
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function domainFromUrl(value) {
  try {
    return value ? new URL(value).hostname : "";
  } catch {
    return "";
  }
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeText(value) {
  return safeTrim(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeSlug(value) {
  return safeTrim(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", ADMIN_ALLOWED_ORIGIN);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-builderrank-admin-token");
  response.setHeader("Access-Control-Max-Age", "86400");
}
