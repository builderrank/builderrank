import {
  insertSupabaseRow,
  isAdminRequestAuthorized,
  readJsonBody,
  selectSupabaseRows,
  supabaseServiceConfigured,
  updateSupabaseRows,
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
    const workspace = normalizeWorkspace(body);
    const business = await upsertBusiness(workspace);
    const jobTypes = await ensureJobTypes(business.id, workspace.jobTypes);
    const targetTerms = await ensureTargetTerms(business, jobTypes, workspace.targetTerms);
    const competitors = await ensureCompetitors(business.id, workspace.competitors);
    const prompts = await ensurePrompts(business.id, jobTypes, workspace);
    const recommendations = await ensureRecommendations(business.id, jobTypes, workspace);

    response.status(201).json({
      ok: true,
      business,
      counts: {
        jobTypes: jobTypes.length,
        targetTerms: targetTerms.length,
        competitors: competitors.length,
        prompts: prompts.length,
        recommendations: recommendations.length,
      },
      snippet: `<script src="https://builderrank.io/tracker.js" data-site-id="${business.site_id}" async></script>`,
      handoff: buildBootstrapHandoff(business),
    });
  } catch (error) {
    response.status(error.statusCode || 400).json({
      error: "Could not bootstrap workspace.",
      detail: error.message,
    });
  }
}

function buildBootstrapHandoff(business) {
  const siteId = business.site_id;
  const snippet = `<script src="https://builderrank.io/tracker.js" data-site-id="${siteId}" async></script>`;
  return {
    siteId,
    snippet,
    dashboardUrl: `https://builderrank.io/dashboard?siteId=${encodeURIComponent(siteId)}`,
    accountUrl: "https://builderrank.io/account",
    trackingHealthUrl: `https://builderrank.io/api/tracking-health?staleHours=24`,
    wordpressPlugin: "integrations/wordpress/builder-rank-site-signal.php",
    nextSteps: [
      "Install the Site Signal snippet or WordPress plugin on the customer website.",
      "Send one page_view and one conversion test event from /admin-beta.",
      "Import the first AI visibility run for ChatGPT, Gemini, and Claude.",
      "Ask the customer to sign in, connect the Site ID, and review the dashboard URL.",
    ],
  };
}

async function upsertBusiness(workspace) {
  const existingRows = await selectSupabaseRows("br_businesses", {
    select: "id,site_id,name,website_url,market,owner_user_id,primary_trade,phone,tracking_status,beta_status,beta_intake",
    site_id: `eq.${workspace.siteId}`,
    limit: "1",
  });
  const existing = existingRows[0];
  const existingIntake = existing?.beta_intake && typeof existing.beta_intake === "object" ? existing.beta_intake : {};
  const payload = {
    owner_user_id: workspace.ownerUserId || existing?.owner_user_id || null,
    site_id: workspace.siteId,
    name: workspace.company,
    website_url: workspace.website,
    market: workspace.market,
    primary_trade: workspace.primaryTrade,
    phone: workspace.phone || existing?.phone || null,
    beta_status: "active",
    tracking_status: existing?.tracking_status || "not_installed",
    beta_intake: {
      ...existingIntake,
      email: workspace.email || existingIntake.email || "",
      ownerName: workspace.ownerName || existingIntake.ownerName || "",
      phone: workspace.phone || existingIntake.phone || "",
      installMethod: workspace.installMethod || existingIntake.installMethod || "",
      notes: workspace.notes || existingIntake.notes || "",
      onboardingSource: "admin_bootstrap",
      bootstrappedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const rows = await updateSupabaseRows("br_businesses", { id: `eq.${existing.id}` }, payload);
    return rows[0] || { ...existing, ...payload };
  }

  const rows = await insertSupabaseRow("br_businesses", payload);
  return rows[0];
}

async function ensureJobTypes(businessId, jobTypeLabels) {
  const existingRows = await selectSupabaseRows("br_job_types", {
    select: "id,label,slug,priority,profit_weight,active",
    business_id: `eq.${businessId}`,
    limit: "100",
  });
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  const rows = [];

  for (let index = 0; index < jobTypeLabels.length; index += 1) {
    const label = jobTypeLabels[index];
    const slug = slugify(label);
    const existing = existingBySlug.get(slug);
    const payload = {
      label,
      priority: index + 1,
      profit_weight: index === 0 ? 1.25 : 1,
      active: true,
    };

    if (existing?.id) {
      const updated = await updateSupabaseRows("br_job_types", { id: `eq.${existing.id}` }, payload);
      rows.push(updated[0] || { ...existing, ...payload });
      continue;
    }

    const inserted = await insertSupabaseRow("br_job_types", {
      business_id: businessId,
      label,
      slug,
      ...payload,
    });
    if (inserted[0]) {
      existingBySlug.set(slug, inserted[0]);
      rows.push(inserted[0]);
    }
  }

  return rows;
}

async function ensureCompetitors(businessId, competitors) {
  const existingRows = await selectSupabaseRows("br_competitors", {
    select: "id,name,website_url,google_business_url,active,notes",
    business_id: `eq.${businessId}`,
    limit: "100",
  });
  const existingByKey = new Map(existingRows.map((row) => [competitorKey(row.name, row.website_url), row]));
  const rows = [];

  for (const competitor of competitors) {
    const key = competitorKey(competitor.name, competitor.website);
    const existing = existingByKey.get(key) || existingRows.find((row) => sameText(row.name, competitor.name));
    const payload = {
      name: competitor.name,
      website_url: competitor.website || existing?.website_url || null,
      notes: competitor.notes || existing?.notes || null,
      active: true,
    };

    if (existing?.id) {
      const updated = await updateSupabaseRows("br_competitors", { id: `eq.${existing.id}` }, payload);
      rows.push(updated[0] || { ...existing, ...payload });
      continue;
    }

    const inserted = await insertSupabaseRow("br_competitors", {
      business_id: businessId,
      ...payload,
    });
    if (inserted[0]) {
      existingByKey.set(key, inserted[0]);
      rows.push(inserted[0]);
    }
  }

  return rows;
}

async function ensurePrompts(businessId, jobTypes, workspace) {
  const prompts = workspace.prompts.length ? workspace.prompts : starterPrompts(workspace);
  const existingRows = await selectSupabaseRows("br_prompts", {
    select: "id,job_type_id,prompt_text,persona,intent,active",
    business_id: `eq.${businessId}`,
    limit: "150",
  });
  const existingByPrompt = new Map(existingRows.map((row) => [normalizePrompt(row.prompt_text), row]));
  const rows = [];

  for (const prompt of prompts.slice(0, 30)) {
    const jobType = findJobType(jobTypes, prompt.jobType || workspace.jobTypes[0]);
    const text = prompt.text || prompt;
    const existing = existingByPrompt.get(normalizePrompt(text));
    const payload = {
      job_type_id: jobType?.id || existing?.job_type_id || null,
      prompt_text: text,
      persona: prompt.persona || existing?.persona || "Homeowner ready to hire",
      intent: prompt.intent || existing?.intent || "hire_local_contractor",
      active: true,
    };

    if (existing?.id) {
      const updated = await updateSupabaseRows("br_prompts", { id: `eq.${existing.id}` }, payload);
      rows.push(updated[0] || { ...existing, ...payload });
      continue;
    }

    const inserted = await insertSupabaseRow("br_prompts", {
      business_id: businessId,
      ...payload,
    });
    if (inserted[0]) {
      existingByPrompt.set(normalizePrompt(text), inserted[0]);
      rows.push(inserted[0]);
    }
  }

  return rows;
}

async function ensureTargetTerms(business, jobTypes, phrases) {
  if (!phrases.length) return [];
  const existingRows = await selectSupabaseRows("br_target_terms", { select: "id,job_type_id,phrase,target_market,priority,status", business_id: `eq.${business.id}`, status: "neq.archived", limit: "10" });
  const existingByPhrase = new Map(existingRows.map((row) => [normalizePrompt(row.phrase), row]));
  const rows = [];
  for (let index = 0; index < phrases.length; index += 1) {
    const phrase = phrases[index];
    const existing = existingByPhrase.get(normalizePrompt(phrase));
    const term = existing || (await insertSupabaseRow("br_target_terms", { business_id: business.id, job_type_id: jobTypes[0]?.id || null, phrase, target_market: business.market, priority: index + 1, status: "active" }))[0];
    if (!term) continue;
    rows.push(term);
    const promptTexts = [`best ${phrase} in ${business.market}`, `who should I hire for ${phrase} near ${business.market}`, `${phrase} companies with strong reviews in ${business.market}`];
    const existingPrompts = await selectSupabaseRows("br_prompts", { select: "id,prompt_text", business_id: `eq.${business.id}`, limit: "250" });
    const knownPrompts = new Set(existingPrompts.map((row) => normalizePrompt(row.prompt_text)));
    for (const promptText of promptTexts) {
      if (knownPrompts.has(normalizePrompt(promptText))) continue;
      await insertSupabaseRow("br_prompts", { business_id: business.id, job_type_id: term.job_type_id || jobTypes[0]?.id || null, target_term_id: term.id, prompt_text: promptText, persona: "Homeowner ready to hire", intent: "target_term", active: true });
    }
    const title = `Optimize for “${phrase}”`;
    const existingRecommendation = (await selectSupabaseRows("br_recommendations", { select: "id", business_id: `eq.${business.id}`, title: `eq.${title}`, limit: "1" }))[0];
    if (!existingRecommendation) await insertSupabaseRow("br_recommendations", { business_id: business.id, job_type_id: term.job_type_id || jobTypes[0]?.id || null, target_term_id: term.id, priority: "high", title, body: `Strengthen the service page, project proof, FAQs, schema, internal links, GBP services, and citations around “${phrase}” in ${business.market}. Recheck ChatGPT, Gemini, and Claude after approved changes go live.`, status: "open", source: "target_terms" });
  }
  return rows;
}

async function ensureRecommendations(businessId, jobTypes, workspace) {
  const recommendations = workspace.recommendations.length ? workspace.recommendations : starterRecommendations(workspace);
  const existingRows = await selectSupabaseRows("br_recommendations", {
    select: "id,job_type_id,priority,title,body,status,source",
    business_id: `eq.${businessId}`,
    limit: "100",
  });
  const existingByTitle = new Map(existingRows.map((row) => [normalizePrompt(row.title), row]));
  const rows = [];

  for (const recommendation of recommendations.slice(0, 20)) {
    const jobType = findJobType(jobTypes, recommendation.jobType || workspace.jobTypes[0]);
    const existing = existingByTitle.get(normalizePrompt(recommendation.title));
    const payload = {
      job_type_id: jobType?.id || existing?.job_type_id || null,
      priority: recommendation.priority || existing?.priority || "high",
      title: recommendation.title,
      body: recommendation.body,
      status: recommendation.status || existing?.status || "open",
      source: recommendation.source || existing?.source || "admin_bootstrap",
    };

    if (existing?.id) {
      const updated = await updateSupabaseRows("br_recommendations", { id: `eq.${existing.id}` }, payload);
      rows.push(updated[0] || { ...existing, ...payload });
      continue;
    }

    const inserted = await insertSupabaseRow("br_recommendations", {
      business_id: businessId,
      ...payload,
    });
    if (inserted[0]) {
      existingByTitle.set(normalizePrompt(recommendation.title), inserted[0]);
      rows.push(inserted[0]);
    }
  }

  return rows;
}

function normalizeWorkspace(body) {
  const company = safeTrim(body.company || body.name).slice(0, 160);
  const website = normalizeWebsite(body.website || body.websiteUrl);
  const market = safeTrim(body.market).slice(0, 120);
  const primaryTrade = safeTrim(body.primaryTrade || body.trade || body.jobType).slice(0, 120);

  if (!company) throw new Error("company is required.");
  if (!website) throw new Error("website is required.");
  if (!market) throw new Error("market is required.");
  if (!primaryTrade) throw new Error("primaryTrade or jobType is required.");

  const jobTypes = uniqueList([primaryTrade, ...normalizeStringList(body.jobTypes)]).slice(0, 8);
  const competitors = normalizeCompetitors(body.competitors).slice(0, 12);
  const siteId = safeTrim(body.siteId) || `br_${slugify(company).slice(0, 34)}_${Math.random().toString(36).slice(2, 8)}`;

  if (!/^br_[a-z0-9_/-]{3,80}$/i.test(siteId)) {
    throw new Error("siteId must start with br_ and contain only letters, numbers, dashes, underscores, or slashes.");
  }

  return {
    company,
    website,
    market,
    primaryTrade,
    jobTypes,
    competitors,
    siteId,
    ownerUserId: safeTrim(body.ownerUserId),
    email: safeTrim(body.email).toLowerCase(),
    ownerName: safeTrim(body.ownerName || body.contactName).slice(0, 160),
    phone: safeTrim(body.phone).slice(0, 60),
    installMethod: safeTrim(body.installMethod).slice(0, 80),
    notes: safeTrim(body.notes).slice(0, 1000),
    prompts: normalizePrompts(body.prompts),
    recommendations: normalizeRecommendations(body.recommendations),
    targetTerms: normalizeStringList(body.targetTerms || [body.targetTerm1, body.targetTerm2]).map((item) => item.slice(0, 100)).filter((item) => item.length >= 3).slice(0, 2),
  };
}

function starterPrompts(workspace) {
  return workspace.jobTypes.slice(0, 3).flatMap((jobType) => [
    { text: `best ${jobType} contractor in ${workspace.market}`, intent: "discovery" },
    { text: `who should I hire for ${jobType} near ${workspace.market}`, intent: "location" },
    { text: `${jobType} company with good reviews in ${workspace.market}`, intent: "reputation" },
    { text: `${jobType} cost and contractor recommendations in ${workspace.market}`, intent: "high_intent" },
    { text: `compare ${workspace.company} to other ${jobType} contractors`, intent: "comparison" },
  ].map((prompt) => ({ ...prompt, jobType })));
}

function starterRecommendations(workspace) {
  const serviceRecommendations = workspace.jobTypes.slice(0, 3).flatMap((jobType, index) => [
    {
      priority: index === 0 ? "high" : "medium",
      title: `Publish ${jobType} service schema`,
      body: `Add service-specific schema with ${workspace.market} service area, license, review proof, and estimate CTA.`,
      jobType,
    },
    {
      priority: index === 0 ? "high" : "medium",
      title: `Add ${jobType} project proof`,
      body: "Add crawlable project examples with scope, neighborhoods, photos, timeline, and testimonial language.",
      jobType,
    },
    {
      priority: "medium",
      title: `Create ${jobType} FAQ block`,
      body: "Answer homeowner questions about cost, timeline, permits, materials, warranty, and how estimates work.",
      jobType,
    },
  ]);

  return [
    ...serviceRecommendations,
    {
      priority: "medium",
      title: "Update Google Business Profile services",
      body: `Add ${workspace.jobTypes.slice(0, 3).join(", ")} and related high-profit services to GBP so AI can connect website claims to local profile data.`,
      jobType: workspace.jobTypes[0],
    },
    {
      priority: "high",
      title: "Align Instagram and Facebook business identity",
      body: `Use the same business name, category, ${workspace.jobTypes.slice(0, 3).join(", ")} services, ${workspace.market} coverage, phone, and website identity across both Meta profiles.`,
      jobType: workspace.jobTypes[0],
      source: "meta_ai",
    },
    {
      priority: "high",
      title: "Publish Meta-readable project proof",
      body: "Pair crawlable website project pages with Instagram and Facebook posts that clearly name the service, city or neighborhood, scope, outcome, and customer proof.",
      jobType: workspace.jobTypes[0],
      source: "meta_ai",
    },
    {
      priority: "medium",
      title: "Verify Meta AI consumer answers",
      body: "Run controlled discovery, comparison, reputation, service, and location prompts inside Instagram Meta AI and record the profile, location, timestamp, answer, position, and sources.",
      jobType: workspace.jobTypes[0],
      source: "meta_ai",
    },
  ];
}

function normalizePrompts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === "string" ? { text: item.trim() } : {
      text: safeTrim(item.text || item.prompt),
      persona: safeTrim(item.persona),
      intent: safeTrim(item.intent),
      jobType: safeTrim(item.jobType),
    })
    .filter((item) => item.text)
    .slice(0, 30);
}

function normalizeRecommendations(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      priority: safeTrim(item.priority),
      title: safeTrim(item.title),
      body: safeTrim(item.body || item.summary),
      status: safeTrim(item.status),
      source: safeTrim(item.source),
      jobType: safeTrim(item.jobType),
    }))
    .filter((item) => item.title && item.body)
    .slice(0, 20);
}

function normalizeCompetitors(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => typeof item === "string" ? { name: item.trim() } : {
        name: safeTrim(item.name),
        website: item.website ? normalizeWebsite(item.website, { optional: true }) : "",
        notes: safeTrim(item.notes),
      })
      .filter((item) => item.name);
  }

  return normalizeStringList(value).map((name) => ({ name }));
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map(safeTrim).filter(Boolean);
  return safeTrim(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values) {
  return [...new Set(values.map(safeTrim).filter(Boolean))];
}

function findJobType(jobTypes, label) {
  const slug = slugify(label);
  return jobTypes.find((jobType) => jobType.slug === slug) || jobTypes[0];
}

function competitorKey(name, website) {
  return `${slugify(name)}|${normalizeHost(website)}`;
}

function normalizeHost(value) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {
    return "";
  }
}

function normalizePrompt(value) {
  return safeTrim(value).toLowerCase().replace(/\s+/g, " ");
}

function sameText(left, right) {
  return normalizePrompt(left) === normalizePrompt(right);
}

function normalizeWebsite(value, options = {}) {
  const text = safeTrim(value);
  if (!text && options.optional) return "";
  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  const url = new URL(withProtocol);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Website must use http or https.");
  }

  return url.href;
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return safeTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "site";
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", ADMIN_ALLOWED_ORIGIN);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-builderrank-admin-token");
  response.setHeader("Access-Control-Max-Age", "86400");
}
