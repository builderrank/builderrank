import {
  extractBearerToken,
  getSupabaseUser,
  selectSupabaseRows,
  supabaseServiceConfigured,
} from "./_shared.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!supabaseServiceConfigured()) {
    response.status(200).json({ ok: true, mode: "demo", reason: "Supabase service role is not configured." });
    return;
  }

  const user = await getSupabaseUser(extractBearerToken(request));
  if (!user?.id) {
    response.status(200).json({ ok: true, mode: "demo", reason: "No signed-in dashboard user." });
    return;
  }

  try {
    const requestedSiteId = siteIdFromRequest(request);
    const dateRangeDays = dateRangeDaysFromRequest(request);
    const businessFilters = {
      select: "id,name,website_url,market,site_id,primary_trade,tracking_status,beta_status",
      owner_user_id: `eq.${user.id}`,
      limit: "1",
    };
    if (requestedSiteId) businessFilters.site_id = `eq.${requestedSiteId}`;

    const businesses = await selectSupabaseRows("br_businesses", {
      ...businessFilters,
    });
    const business = businesses[0];

    if (requestedSiteId && !business) {
      response.status(404).json({ error: "No owned Builder Rank workspace found for that siteId." });
      return;
    }

    if (!business?.site_id) {
      response.status(200).json({ ok: true, mode: "empty", business: business || null });
      return;
    }

    const since = new Date(Date.now() - dateRangeDays * 24 * 60 * 60 * 1000).toISOString();
    const [
      events,
      jobTypes,
      competitors,
      prompts,
      mentions,
      aiSources,
      recommendations,
      reports,
    ] = await Promise.all([
      selectSupabaseRows("br_website_events", {
        select: "event,page_url,page_title,source_type,source_name,landing_path,session_id,metadata,received_at",
        site_id: `eq.${business.site_id}`,
        received_at: `gte.${since}`,
        order: "received_at.desc",
        limit: "500",
      }),
      selectSupabaseRows("br_job_types", {
        select: "id,label,slug,priority,profit_weight,active",
        business_id: `eq.${business.id}`,
        order: "priority.asc",
        limit: "25",
      }),
      selectSupabaseRows("br_competitors", {
        select: "id,name,website_url,google_business_url,active,notes,created_at",
        business_id: `eq.${business.id}`,
        active: "eq.true",
        order: "created_at.asc",
        limit: "25",
      }),
      selectSupabaseRows("br_prompts", {
        select: "id,job_type_id,prompt_text,persona,intent,active,created_at",
        business_id: `eq.${business.id}`,
        active: "eq.true",
        order: "created_at.desc",
        limit: "75",
      }),
      selectSupabaseRows("br_ai_mentions", {
        select: "id,prompt_run_id,mentioned,mention_text,rank_position,sentiment,confidence,created_at",
        business_id: `eq.${business.id}`,
        created_at: `gte.${since}`,
        order: "created_at.desc",
        limit: "250",
      }),
      selectSupabaseRows("br_ai_sources", {
        select: "id,prompt_run_id,domain,url,source_type,cited,created_at",
        business_id: `eq.${business.id}`,
        created_at: `gte.${since}`,
        order: "created_at.desc",
        limit: "250",
      }),
      selectSupabaseRows("br_recommendations", {
        select: "id,job_type_id,priority,title,body,status,source,created_at,completed_at",
        business_id: `eq.${business.id}`,
        order: "created_at.desc",
        limit: "25",
      }),
      loadSavedReports(user.id, business),
    ]);
    const promptRuns = prompts.length
      ? await selectSupabaseRows("br_prompt_runs", {
        select: "id,prompt_id,platform,model,run_status,answer_text,run_at,completed_at",
        prompt_id: inFilter(prompts.map((prompt) => prompt.id)),
        run_at: `gte.${since}`,
        order: "run_at.desc",
        limit: "250",
      })
      : [];

    const workspace = summarizeWorkspace({ jobTypes, competitors, prompts, recommendations });
    const aiVisibility = summarizeAiVisibility({ prompts, promptRuns, mentions, jobTypes });
    const summary = summarizeEvents(events, business);
    const formattedRecommendations = formatRecommendations(recommendations, jobTypes);
    const pages = rollupPages(events);
    const jobIntents = rollupJobIntents(events);
    const ctas = rollupCtas(events);
    workspace.readiness = workspaceReadiness({ workspace, summary, aiVisibility, reports });

    response.status(200).json({
      ok: true,
      mode: "live",
      dateRange: { days: dateRangeDays, since },
      business,
      workspace,
      jobTypes: formatJobTypes(jobTypes),
      competitors: formatCompetitors(competitors, promptRuns, business),
      aiVisibility,
      citations: rollupCitations({ prompts, promptRuns, mentions, aiSources }),
      recommendations: formattedRecommendations,
      summary,
      events: rollupEvents(events),
      leads: rollupLeads(events),
      jobIntents,
      ctas,
      pages,
      opportunities: buildNextBestMoves({ summary, pages, jobIntents, ctas, recommendations: formattedRecommendations, aiVisibility }),
      sources: rollupSources(events, aiSources),
      sourceMix: rollupSourceMix(events, aiSources),
      reports: formatReports(reports),
    });
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: "Could not load dashboard data.",
      detail: error.message,
    });
  }
}

function siteIdFromRequest(request) {
  const url = new URL(request.url || "/", "https://builderrank.io");
  const siteId = safeTrim(url.searchParams.get("siteId"));
  return isValidSiteId(siteId) ? siteId : "";
}

function dateRangeDaysFromRequest(request) {
  const url = new URL(request.url || "/", "https://builderrank.io");
  const days = Number.parseInt(url.searchParams.get("days") || "30", 10);
  if ([7, 30, 90].includes(days)) return days;
  return 30;
}

function isValidSiteId(value) {
  return /^br_[a-z0-9_/-]{3,80}$/i.test(safeTrim(value));
}

function summarizeWorkspace({ jobTypes, competitors, prompts, recommendations }) {
  return {
    jobTypesTracked: jobTypes.filter((row) => row.active !== false).length,
    competitorsTracked: competitors.length,
    promptsTracked: prompts.length,
    openRecommendations: recommendations.filter((row) => row.status !== "complete").length,
  };
}

function workspaceReadiness({ workspace, summary, aiVisibility, reports }) {
  const checks = [
    readinessCheck("site_signal", summary.healthStatus === "healthy", "Site Signal healthy", siteSignalReadinessLabel(summary.healthStatus)),
    readinessCheck("lead_qa", Number(summary.recentLeadEvents || 0) > 0, "Lead event verified", "Send one call, form, email, or quote-click QA event"),
    readinessCheck("ai_import", Number(aiVisibility.completedRuns || 0) > 0, aiVisibility.dataFreshness || "AI checks imported", "Import first ChatGPT/Gemini/Claude visibility run"),
    readinessCheck("competitors", Number(workspace.competitorsTracked || 0) >= 3, "Competitor set ready", "Add at least three local competitors"),
    readinessCheck("prompts", Number(workspace.promptsTracked || 0) >= 10, "Prompt set ready", "Seed ten or more buyer prompts"),
    readinessCheck("punch_list", Number(workspace.openRecommendations || 0) > 0, "Punch List seeded", "Seed first implementation recommendations"),
    readinessCheck("reports", Array.isArray(reports) && reports.length > 0, "Report history linked", "Link any saved report-card history", false),
  ];
  const required = checks.filter((check) => check.required !== false);
  const passedRequired = required.filter((check) => check.ok).length;
  const blockers = required.filter((check) => !check.ok).map((check) => check.nextStep);
  const optional = checks.filter((check) => check.required === false && !check.ok).map((check) => check.nextStep);
  const score = required.length ? Math.round((passedRequired / required.length) * 100) : 0;

  return {
    score,
    ready: blockers.length === 0,
    label: blockers.length ? `${blockers.length} setup step${blockers.length === 1 ? "" : "s"} left` : "Ready for beta review",
    checks,
    blockers,
    optional,
  };
}

function readinessCheck(key, ok, label, nextStep, required = true) {
  return { key, ok: Boolean(ok), label, nextStep, required };
}

function siteSignalReadinessLabel(healthStatus) {
  if (healthStatus === "healthy") return "Site Signal healthy";
  if (healthStatus === "domain_mismatch") return "Fix Site Signal domain mismatch";
  if (healthStatus === "needs_lead_qa") return "Send one lead-event QA test";
  return "Install Site Signal and send a test event";
}

function formatJobTypes(jobTypes) {
  return jobTypes.map((row) => ({
    id: row.id,
    label: row.label,
    slug: row.slug,
    priority: row.priority,
    profitWeight: Number(row.profit_weight || 1),
    active: row.active !== false,
  }));
}

function formatCompetitors(competitors, promptRuns = [], business = {}) {
  const entities = [
    {
      name: business.name,
      website: business.website_url || "",
      googleBusinessUrl: "",
      notes: "Customer workspace",
      isCustomer: true,
    },
    ...competitors.map((row) => ({
      name: row.name,
      website: row.website_url || "",
      googleBusinessUrl: row.google_business_url || "",
      notes: row.notes || "",
      isCustomer: false,
    })),
  ].filter((row) => row.name);
  const completedRuns = promptRuns.filter((run) => run.run_status === "complete" || run.completed_at || run.answer_text);
  const platformSet = new Set(completedRuns.map((run) => normalizePlatform(run.platform)).filter(Boolean));

  const rows = entities.map((entity) => {
    const platformRates = {};
    platformSet.forEach((platform) => {
      const runs = completedRuns.filter((run) => normalizePlatform(run.platform) === platform);
      platformRates[platform] = mentionRateForEntity(entity.name, runs);
    });

    return {
      name: entity.name,
      website: entity.website,
      googleBusinessUrl: entity.googleBusinessUrl,
      notes: entity.notes,
      isCustomer: entity.isCustomer,
      mentionRate: mentionRateForEntity(entity.name, completedRuns),
      chatgpt: platformRates.chatgpt ?? null,
      gemini: platformRates.gemini ?? null,
      claude: platformRates.claude ?? null,
      avgPosition: null,
    };
  });

  const hasMentionData = rows.some((row) => row.mentionRate != null);

  return rows
    .sort((left, right) => {
      if (!hasMentionData) {
        if (left.isCustomer) return -1;
        if (right.isCustomer) return 1;
        return 0;
      }
      return (right.mentionRate ?? -1) - (left.mentionRate ?? -1);
    })
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
}

function summarizeAiVisibility({ prompts, promptRuns, mentions, jobTypes = [] }) {
  const completedRuns = promptRuns.filter((run) => run.run_status === "complete" || run.completed_at);
  const latestRunAt = latestTimestamp(completedRuns.map((run) => run.completed_at || run.run_at));
  const mentionedRows = mentions.filter((mention) => mention.mentioned);
  const rankedRows = mentionedRows.filter((mention) => Number.isFinite(Number(mention.rank_position)));
  const averageRank = rankedRows.length
    ? rankedRows.reduce((sum, mention) => sum + Number(mention.rank_position), 0) / rankedRows.length
    : null;
  const mentionRate = mentions.length ? Math.round((mentionedRows.length / mentions.length) * 100) : null;

  return {
    promptsTracked: prompts.length,
    completedRuns: completedRuns.length,
    latestRunAt,
    dataFreshness: freshnessLabel(latestRunAt),
    mentionRate,
    averageRank: averageRank ? Number(averageRank.toFixed(1)) : null,
    visibilityScore: mentionRate == null ? null : Math.round(mentionRate * 0.82 + Math.max(0, 18 - (averageRank || 8) * 2)),
    platforms: rollupPlatforms(promptRuns, mentions),
    jobTypes: rollupJobTypeVisibility({ jobTypes, prompts, promptRuns, mentions }),
  };
}

function latestTimestamp(values) {
  return values
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() || null;
}

function freshnessLabel(value) {
  if (!value) return "Waiting for first import";
  const ageDays = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays <= 7) return "Fresh this week";
  if (ageDays <= 14) return "Needs next weekly run";
  return "Stale AI checks";
}

function rollupPlatforms(promptRuns, mentions) {
  const mentionByRunId = new Map();
  mentions.forEach((mention) => {
    const bucket = mentionByRunId.get(mention.prompt_run_id) || { total: 0, mentioned: 0 };
    bucket.total += 1;
    if (mention.mentioned) bucket.mentioned += 1;
    mentionByRunId.set(mention.prompt_run_id, bucket);
  });

  const rows = new Map();
  promptRuns.forEach((run) => {
    const platform = run.platform || "Unknown";
    const row = rows.get(platform) || { platform, runs: 0, mentions: 0, totalMentions: 0 };
    const mentionBucket = mentionByRunId.get(run.id) || { total: 0, mentioned: 0 };
    row.runs += 1;
    row.mentions += mentionBucket.mentioned;
    row.totalMentions += mentionBucket.total;
    rows.set(platform, row);
  });

  return [...rows.values()].map((row) => ({
    ...row,
    mentionRate: row.totalMentions ? Math.round((row.mentions / row.totalMentions) * 100) : null,
  }));
}

function rollupJobTypeVisibility({ jobTypes, prompts, promptRuns, mentions }) {
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const jobTypeById = new Map(jobTypes.map((jobType) => [jobType.id, jobType]));
  const mentionByRunId = new Map();

  mentions.forEach((mention) => {
    const bucket = mentionByRunId.get(mention.prompt_run_id) || { total: 0, mentioned: 0 };
    bucket.total += 1;
    if (mention.mentioned) bucket.mentioned += 1;
    mentionByRunId.set(mention.prompt_run_id, bucket);
  });

  const rows = new Map();
  promptRuns.forEach((run) => {
    const prompt = promptById.get(run.prompt_id);
    const jobType = jobTypeById.get(prompt?.job_type_id);
    const label = jobType?.label || "Unassigned prompts";
    const key = jobType?.id || "unassigned";
    const row = rows.get(key) || {
      label,
      needsJobType: !jobType,
      fix: jobType ? "" : "Add jobType to the AI import or update this prompt's profit center.",
      runs: 0,
      mentions: 0,
      totalMentions: 0,
      chatgpt: { mentions: 0, total: 0 },
      gemini: { mentions: 0, total: 0 },
      claude: { mentions: 0, total: 0 },
    };
    const mentionBucket = mentionByRunId.get(run.id) || { total: 0, mentioned: 0 };
    const platform = normalizePlatform(run.platform);
    row.runs += 1;
    row.mentions += mentionBucket.mentioned;
    row.totalMentions += mentionBucket.total;
    if (row[platform]) {
      row[platform].mentions += mentionBucket.mentioned;
      row[platform].total += mentionBucket.total;
    }
    rows.set(key, row);
  });

  return [...rows.values()].map((row) => ({
    label: row.label,
    needsJobType: row.needsJobType,
    fix: row.fix,
    runs: row.runs,
    mentionRate: row.totalMentions ? Math.round((row.mentions / row.totalMentions) * 100) : null,
    chatgpt: platformMentionRate(row.chatgpt),
    gemini: platformMentionRate(row.gemini),
    claude: platformMentionRate(row.claude),
  }));
}

function platformMentionRate(bucket) {
  return bucket?.total ? Math.round((bucket.mentions / bucket.total) * 100) : null;
}

function rollupCitations({ prompts, promptRuns, mentions, aiSources }) {
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const runById = new Map(promptRuns.map((run) => [run.id, run]));
  const latestMentionByRunId = new Map();
  mentions.forEach((mention) => {
    if (!latestMentionByRunId.has(mention.prompt_run_id)) latestMentionByRunId.set(mention.prompt_run_id, mention);
  });

  return promptRuns.slice(0, 25).map((run) => {
    const prompt = promptById.get(run.prompt_id);
    const mention = latestMentionByRunId.get(run.id);
    const source = aiSources.find((item) => item.prompt_run_id === run.id && item.cited) || aiSources.find((item) => item.prompt_run_id === run.id);
    return {
      prompt: prompt?.prompt_text || "Prompt run",
      platform: run.platform || "Unknown",
      mentioned: mention?.mentioned ? "Yes" : "No",
      rank: mention?.rank_position ? `#${mention.rank_position}` : "-",
      source: source?.domain || "No citation captured",
      fix: mention?.mentioned ? "Protect this source and add project proof." : "Add direct website proof for this prompt.",
      runAt: run.run_at,
    };
  });
}

function formatRecommendations(recommendations, jobTypes = []) {
  const jobTypeById = new Map(jobTypes.map((jobType) => [jobType.id, jobType]));
  return recommendations.map((row) => ({
    id: row.id,
    jobTypeId: row.job_type_id || "",
    jobTypeLabel: jobTypeById.get(row.job_type_id)?.label || "",
    priority: row.priority,
    title: row.title,
    body: row.body,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  }));
}

function formatReports(reports) {
  return reports.map((row) => ({
    id: row.id,
    businessId: row.business_id || "",
    company: row.company || "",
    website: row.website || "",
    market: row.market || "",
    score: row.score ?? "",
    grade: row.grade || "",
    checkoutReference: row.checkout_reference || "",
    createdAt: row.created_at,
  }));
}

async function loadSavedReports(userId, business = {}) {
  const baseQuery = {
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: "12",
  };
  const website = safeTrim(business.website_url);

  try {
    if (business.id) {
      const workspaceReports = await selectSupabaseRows("reports", {
        select: "id,business_id,company,website,market,score,grade,checkout_reference,created_at",
        ...baseQuery,
        business_id: `eq.${business.id}`,
      });
      if (workspaceReports.length) return workspaceReports;
    }

    const fallbackReports = await selectSupabaseRows("reports", {
      select: "id,business_id,company,website,market,score,grade,checkout_reference,created_at",
      ...baseQuery,
      limit: "50",
    });
    const targetWebsite = normalizeWebsiteForMatch(website);
    return targetWebsite
      ? fallbackReports.filter((report) => normalizeWebsiteForMatch(report.website) === targetWebsite).slice(0, 12)
      : fallbackReports.slice(0, 12);
  } catch (error) {
    if (!/business_id|checkout_reference|schema cache|column/i.test(error.message || "")) throw error;
    const fallbackReports = await selectSupabaseRows("reports", {
      select: "id,company,website,market,score,grade,created_at",
      ...baseQuery,
      limit: "50",
    });
    const targetWebsite = normalizeWebsiteForMatch(website);
    return targetWebsite
      ? fallbackReports.filter((report) => normalizeWebsiteForMatch(report.website) === targetWebsite).slice(0, 12)
      : fallbackReports.slice(0, 12);
  }
}

function normalizeWebsiteForMatch(value) {
  const text = safeTrim(value).toLowerCase();
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

function summarizeEvents(events, business = {}) {
  const sessions = new Set(events.map((event) => event.session_id).filter(Boolean));
  const aiEvents = events.filter((event) => event.source_type === "ai_assistant");
  const quoteEvents = events.filter((event) => isLeadEvent(event.event));
  const aiSessions = new Set(aiEvents.map((event) => event.session_id).filter(Boolean));
  const aiLeadEvents = aiEvents.filter((event) => isLeadEvent(event.event));
  const aiReferralCount = aiSessions.size || aiEvents.length;
  const lastEvent = events[0]?.received_at || null;
  const recentLeadEvents = quoteEvents.length;
  const domainMismatch = events.length ? events.some((event) => !eventMatchesBusinessDomain(event.page_url, business.website_url)) : false;
  const healthStatus = trackingHealthStatus({ lastEvent, recentLeadEvents, domainMismatch });

  return {
    trackedSessions: sessions.size,
    aiReferrals: aiReferralCount,
    aiLeadRate: aiReferralCount ? `${Math.round((aiLeadEvents.length / aiReferralCount) * 100)}%` : "0%",
    quoteEvents: quoteEvents.length,
    recentLeadEvents,
    lastEvent,
    domainMismatch,
    healthStatus,
    topSource: topByCount(events.map((event) => event.source_name).filter(Boolean)) || "Direct",
    topLandingPage: topByCount(events.map((event) => event.landing_path).filter(Boolean)) || "/",
  };
}

function trackingHealthStatus({ lastEvent, recentLeadEvents, domainMismatch }) {
  if (!lastEvent) return "stale";
  const ageHours = (Date.now() - new Date(lastEvent).getTime()) / (60 * 60 * 1000);
  if (!Number.isFinite(ageHours) || ageHours > 24) return "stale";
  if (domainMismatch) return "domain_mismatch";
  if (!recentLeadEvents) return "needs_lead_qa";
  return "healthy";
}

function rollupEvents(events) {
  const rows = new Map();

  events.forEach((event) => {
    const detail = eventDetail(event);
    const key = [event.event, event.landing_path || pathFromUrl(event.page_url), event.source_name || "Unknown", detail].join("|");
    const row = rows.get(key) || {
      event: event.event,
      page: event.landing_path || pathFromUrl(event.page_url),
      source: event.source_name || "Unknown",
      detail,
      count: 0,
      lastSeen: event.received_at,
    };
    row.count += 1;
    if (event.received_at > row.lastSeen) row.lastSeen = event.received_at;
    rows.set(key, row);
  });

  return [...rows.values()].sort((a, b) => b.count - a.count).slice(0, 12);
}

function rollupPages(events) {
  const rows = new Map();

  events.forEach((event) => {
    const page = event.landing_path || pathFromUrl(event.page_url);
    const row = rows.get(page) || { page, aiSessions: new Set(), phoneClicks: 0, forms: 0, quoteClicks: 0, visits: 0, jobIntents: [] };
    row.visits += event.event === "page_view" ? 1 : 0;
    if (event.source_type === "ai_assistant" && event.session_id) row.aiSessions.add(event.session_id);
    if (event.event === "phone_click") row.phoneClicks += 1;
    if (event.event === "form_submit") row.forms += 1;
    if (event.event === "lead_click" || event.event === "quote_click") row.quoteClicks += 1;
    row.jobIntents.push(jobIntentForEvent(event));
    rows.set(page, row);
  });

  return [...rows.values()]
    .map((row) => ({
      ...row,
      aiSessions: row.aiSessions.size,
      topJobIntent: topByCount(row.jobIntents) || "General",
      conversion: row.visits ? `${Math.round(((row.phoneClicks + row.forms + row.quoteClicks) / row.visits) * 100)}%` : "0%",
    }))
    .sort((a, b) => b.aiSessions - a.aiSessions)
    .slice(0, 12);
}

function rollupLeads(events) {
  const rows = new Map();

  events.forEach((event) => {
    const source = event.source_name || event.source_type || "Unknown";
    const row = rows.get(source) || {
      source,
      sessions: new Set(),
      visits: 0,
      calls: 0,
      forms: 0,
      quoteClicks: 0,
      leadEvents: 0,
      jobIntents: [],
    };

    if (event.session_id) row.sessions.add(event.session_id);
    if (event.event === "page_view") row.visits += 1;
    if (event.event === "phone_click") row.calls += 1;
    if (event.event === "form_submit") row.forms += 1;
    if (event.event === "lead_click" || event.event === "quote_click") row.quoteClicks += 1;
    if (isLeadEvent(event.event)) row.leadEvents += 1;
    row.jobIntents.push(jobIntentForEvent(event));
    rows.set(source, row);
  });

  return [...rows.values()]
    .map((row) => {
      const sessionCount = row.sessions.size || row.visits || row.leadEvents;
      return {
        source: row.source,
        sessions: sessionCount,
        calls: row.calls,
        forms: row.forms,
        quoteClicks: row.quoteClicks,
        topJobIntent: topByCount(row.jobIntents) || "General",
        leadRate: sessionCount ? `${Math.round((row.leadEvents / sessionCount) * 100)}%` : "0%",
      };
    })
    .sort((a, b) => (b.calls + b.forms + b.quoteClicks) - (a.calls + a.forms + a.quoteClicks))
    .slice(0, 12);
}

function rollupJobIntents(events) {
  const rows = new Map();

  events.forEach((event) => {
    const intent = jobIntentForEvent(event) || "General";
    const row = rows.get(intent) || {
      intent,
      sessions: new Set(),
      visits: 0,
      aiSessions: new Set(),
      leadEvents: 0,
      phoneClicks: 0,
      forms: 0,
      quoteClicks: 0,
      pages: [],
    };

    if (event.session_id) row.sessions.add(event.session_id);
    if (event.source_type === "ai_assistant" && event.session_id) row.aiSessions.add(event.session_id);
    if (event.event === "page_view") row.visits += 1;
    if (event.event === "phone_click") row.phoneClicks += 1;
    if (event.event === "form_submit") row.forms += 1;
    if (event.event === "lead_click" || event.event === "quote_click") row.quoteClicks += 1;
    if (isLeadEvent(event.event)) row.leadEvents += 1;
    row.pages.push(event.landing_path || pathFromUrl(event.page_url));
    rows.set(intent, row);
  });

  return [...rows.values()]
    .map((row) => {
      const sessionCount = row.sessions.size || row.visits || row.leadEvents;
      return {
        intent: row.intent,
        sessions: sessionCount,
        visits: row.visits,
        aiSessions: row.aiSessions.size,
        leadEvents: row.leadEvents,
        phoneClicks: row.phoneClicks,
        forms: row.forms,
        quoteClicks: row.quoteClicks,
        leadRate: sessionCount ? `${Math.round((row.leadEvents / sessionCount) * 100)}%` : "0%",
        topPage: topByCount(row.pages.filter(Boolean)) || "/",
      };
    })
    .sort((a, b) => (b.leadEvents - a.leadEvents) || (b.aiSessions - a.aiSessions) || (b.sessions - a.sessions))
    .slice(0, 12);
}

function rollupCtas(events) {
  const rows = new Map();

  events.filter((event) => isLeadEvent(event.event)).forEach((event) => {
    const detail = eventDetail(event);
    const page = event.landing_path || pathFromUrl(event.page_url);
    const source = event.source_name || "Unknown";
    const key = [event.event, detail, page, source].join("|");
    const row = rows.get(key) || {
      detail,
      type: leadEventLabel(event.event),
      page,
      source,
      jobIntent: jobIntentForEvent(event),
      count: 0,
      lastSeen: event.received_at,
    };
    row.count += 1;
    if (event.received_at > row.lastSeen) row.lastSeen = event.received_at;
    rows.set(key, row);
  });

  return [...rows.values()].sort((a, b) => b.count - a.count).slice(0, 12);
}

function buildNextBestMoves({ summary = {}, pages = [], jobIntents = [], ctas = [], recommendations = [], aiVisibility = {} }) {
  const moves = [];
  const weakIntent = jobIntents
    .filter((row) => Number(row.sessions || 0) >= 3 && parsePercent(row.leadRate) < 8)
    .sort((left, right) => Number(right.aiSessions || 0) - Number(left.aiSessions || 0))[0];
  if (weakIntent) {
    moves.push({
      priority: "High",
      type: "Profit center",
      title: `Improve ${weakIntent.intent || "service"} conversion`,
      detail: `${weakIntent.aiSessions || 0} AI-assisted sessions and ${weakIntent.leadRate || "0%"} lead rate. Start with ${weakIntent.topPage || "the top service page"}.`,
      nextStep: "Tighten the page CTA, add project proof, and answer buyer questions for this job type.",
    });
  }

  const pageGap = pages
    .filter((row) => Number(row.aiSessions || 0) > 0 && Number(row.phoneClicks || 0) + Number(row.forms || 0) + Number(row.quoteClicks || 0) === 0)
    .sort((left, right) => Number(right.aiSessions || 0) - Number(left.aiSessions || 0))[0];
  if (pageGap) {
    moves.push({
      priority: "High",
      type: "Landing page",
      title: "Add a conversion path to AI traffic",
      detail: `${pageGap.page} has ${pageGap.aiSessions} AI sessions with no tracked calls, forms, or quote clicks.`,
      nextStep: "Add a phone-first CTA, short estimate form, and job-specific trust proof above the fold.",
    });
  }

  const openRecommendation = recommendations.find((item) => item.status !== "complete");
  if (openRecommendation) {
    moves.push({
      priority: priorityLabel(openRecommendation.priority),
      type: "Punch List",
      title: openRecommendation.title,
      detail: openRecommendation.body,
      nextStep: `Start this ${openRecommendation.jobTypeLabel || "all-service"} task, then mark it live after the website or profile change ships.`,
    });
  }

  if (!summary.recentLeadEvents && summary.healthStatus === "needs_lead_qa") {
    moves.push({
      priority: "High",
      type: "Site Signal",
      title: "Verify lead-event tracking",
      detail: "Site Signal has recent traffic, but no call, form, email, or quote-click QA event yet.",
      nextStep: "Send one test lead event from /admin-beta before the customer review.",
    });
  }

  if (Number(aiVisibility.completedRuns || 0) === 0) {
    moves.push({
      priority: "High",
      type: "AI Visibility",
      title: "Import the first AI visibility run",
      detail: "The dashboard has no completed ChatGPT, Gemini, or Claude prompt checks yet.",
      nextStep: "Run the starter AI import across the first three profit centers.",
    });
  }

  const ctaWinner = ctas[0];
  if (ctaWinner && moves.length < 5) {
    moves.push({
      priority: "Medium",
      type: "CTA",
      title: `Scale the winning CTA: ${ctaWinner.detail || ctaWinner.type}`,
      detail: `${ctaWinner.count || 0} tracked events from ${ctaWinner.page || "the website"} for ${ctaWinner.jobIntent || "general"} intent.`,
      nextStep: "Reuse this CTA language on the top service and market pages.",
    });
  }

  return moves.slice(0, 5);
}

function parsePercent(value) {
  const number = Number.parseFloat(String(value || "").replace("%", ""));
  return Number.isFinite(number) ? number : 0;
}

function priorityLabel(priority) {
  const value = safeTrim(priority || "medium");
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Medium";
}

function leadEventLabel(eventName) {
  if (eventName === "phone_click") return "Call";
  if (eventName === "email_click") return "Email";
  if (eventName === "form_submit") return "Form";
  if (eventName === "quote_click") return "Quote CTA";
  return "Lead CTA";
}

function jobIntentForEvent(event) {
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata : {};
  return firstNonEmpty(
    metadata.jobIntent,
    inferJobIntent([
      event.landing_path,
      event.page_url,
      event.page_title,
      metadata.targetText,
      metadata.targetHref,
      metadata.formLabel,
      metadata.formAction,
    ].join(" ")),
    "General",
  );
}

function inferJobIntent(value) {
  const text = normalizeTextForSearch(value);
  const intents = [
    [/bath|shower|tub|tile|vanity/, "Bathroom"],
    [/kitchen|cabinet|countertop|backsplash/, "Kitchen"],
    [/roof|shingle|gutter|storm damage/, "Roofing"],
    [/hvac|furnace|air conditioning|ac repair|heat pump/, "HVAC"],
    [/water damage|restoration|mold|flood|fire damage/, "Restoration"],
    [/addition|adu|garage|basement|whole home/, "Additions"],
    [/deck|patio|outdoor living|pergola/, "Outdoor living"],
    [/floor|hardwood|carpet|luxury vinyl|lvp/, "Flooring"],
    [/window|door|siding/, "Exterior"],
    [/emergency|repair|service call/, "Emergency service"],
  ];
  const match = intents.find(([pattern]) => pattern.test(text));
  return match?.[1] || "General";
}

function rollupSources(events, aiSources = []) {
  const rows = new Map();

  events.forEach((event) => {
    const source = event.source_name || "Unknown";
    const row = rows.get(source) || {
      source,
      type: event.source_type || "unknown",
      count: 0,
      sessions: new Set(),
      leadEvents: 0,
      citationSignals: 0,
      lastSeen: event.received_at,
    };
    row.count += 1;
    if (event.session_id) row.sessions.add(event.session_id);
    if (isLeadEvent(event.event)) row.leadEvents += 1;
    if (event.received_at > row.lastSeen) row.lastSeen = event.received_at;
    rows.set(source, row);
  });

  aiSources.forEach((source) => {
    const key = source.domain || "Unknown";
    const row = rows.get(key) || {
      source: key,
      type: source.source_type || "ai_citation",
      count: 0,
      sessions: new Set(),
      leadEvents: 0,
      citationSignals: 0,
      lastSeen: source.created_at,
    };
    const citationWeight = source.cited ? 2 : 1;
    row.count += citationWeight;
    row.citationSignals += citationWeight;
    if (source.created_at > row.lastSeen) row.lastSeen = source.created_at;
    rows.set(key, row);
  });

  const total = Math.max([...rows.values()].reduce((sum, row) => sum + row.count, 0), 1);

  return [...rows.values()]
    .map((row) => {
      const sessionCount = row.sessions.size || row.count;
      return {
        source: row.source,
        type: row.type,
        count: row.count,
        share: `${Math.round((row.count / total) * 100)}%`,
        sessions: row.sessions.size,
        leadEvents: row.leadEvents,
        citationSignals: row.citationSignals,
        leadRate: sessionCount ? `${Math.round((row.leadEvents / sessionCount) * 100)}%` : "0%",
        signal: sourceSignalLabel(row),
        lastSeen: row.lastSeen,
      };
    })
    .sort((a, b) => (b.leadEvents - a.leadEvents) || (b.citationSignals - a.citationSignals) || (b.count - a.count))
    .slice(0, 12);
}

function sourceSignalLabel(row) {
  if (row.leadEvents) return `${row.leadEvents} lead${row.leadEvents === 1 ? "" : "s"} · ${row.sessions.size || row.count} visits`;
  if (row.citationSignals) return `${row.citationSignals} AI citation signal${row.citationSignals === 1 ? "" : "s"}`;
  return `${row.count} event${row.count === 1 ? "" : "s"}`;
}

function rollupSourceMix(events, aiSources = []) {
  const rows = new Map([
    ["direct", { key: "direct", label: "Direct website", tone: "teal", count: 0 }],
    ["directory", { key: "directory", label: "Directories & reviews", tone: "amber", count: 0 }],
    ["gbp", { key: "gbp", label: "Google Business Profile", tone: "blue", count: 0 }],
    ["ai", { key: "ai", label: "AI assistants", tone: "purple", count: 0 }],
    ["other", { key: "other", label: "Other sources", tone: "pink", count: 0 }],
  ]);

  events.forEach((event) => {
    const key = sourceCategory(event.source_type, event.source_name);
    rows.get(key).count += 1;
  });

  aiSources.forEach((source) => {
    const key = sourceCategory(source.source_type, source.domain);
    rows.get(key).count += source.cited ? 2 : 1;
  });

  const total = Math.max([...rows.values()].reduce((sum, row) => sum + row.count, 0), 1);

  return [...rows.values()].map((row) => ({
    ...row,
    share: Math.round((row.count / total) * 100),
  }));
}

function sourceCategory(type, name) {
  const text = `${type || ""} ${name || ""}`.toLowerCase();
  if (/ai_assistant|chatgpt|claude|gemini|perplexity|copilot/.test(text)) return "ai";
  if (/gbp|google business|google\.com\/maps|maps\.google|google maps/.test(text)) return "gbp";
  if (/direct_site|direct website|direct/.test(text)) return "direct";
  if (/directory|review|houzz|angi|angie|yelp|bbb|homeadvisor|thumbtack/.test(text)) return "directory";
  return "other";
}

function eventMatchesBusinessDomain(pageUrl, websiteUrl) {
  const eventHost = hostnameFor(pageUrl);
  const businessHost = hostnameFor(websiteUrl);
  if (!eventHost || !businessHost) return true;
  return eventHost === businessHost || eventHost.endsWith(`.${businessHost}`);
}

function hostnameFor(value) {
  const text = safeTrim(value).toLowerCase();
  if (!text) return "";
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, "");
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function isLeadEvent(eventName) {
  return /phone_click|form_submit|lead_click|quote_click|email_click/i.test(eventName);
}

function eventDetail(event) {
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata : {};
  if (event.event === "form_submit") {
    return firstNonEmpty(
      metadata.formLabel,
      metadata.formName && `Form: ${metadata.formName}`,
      metadata.formId && `Form #${metadata.formId}`,
      metadata.formAction,
      "Form submit",
    );
  }

  if (event.event === "phone_click") {
    return firstNonEmpty(metadata.targetText, metadata.targetHref, "Phone CTA");
  }

  if (event.event === "email_click") {
    return firstNonEmpty(metadata.targetText, metadata.targetHref, "Email CTA");
  }

  if (event.event === "lead_click" || event.event === "quote_click") {
    return firstNonEmpty(metadata.targetText, metadata.ctaType && `${metadata.ctaType} CTA`, metadata.targetHref, "Lead CTA");
  }

  return firstNonEmpty(metadata.targetText, metadata.formLabel, event.page_title, "Page view");
}

function firstNonEmpty(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function topByCount(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function mentionRateForEntity(name, runs) {
  if (!runs.length) return null;
  const needle = normalizeEntityName(name);
  if (!needle) return null;
  const mentioned = runs.filter((run) => normalizeTextForSearch(run.answer_text).includes(needle)).length;
  return Math.round((mentioned / runs.length) * 100);
}

function normalizePlatform(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("chatgpt") || text.includes("openai") || text.includes("gpt")) return "chatgpt";
  if (text.includes("gemini") || text.includes("google")) return "gemini";
  if (text.includes("claude") || text.includes("anthropic")) return "claude";
  return text.trim();
}

function normalizeEntityName(value) {
  return normalizeTextForSearch(value)
    .replace(/\b(llc|inc|co|company|contractors?|builders?|remodels?|remodeling|construction)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pathFromUrl(value) {
  try {
    return new URL(value).pathname || "/";
  } catch {
    return "/";
  }
}

function inFilter(values) {
  return `in.(${values.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(",")})`;
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}
