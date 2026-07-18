import { isAdminRequestAuthorized, selectSupabaseRows, supabaseServiceConfigured } from "./_shared.js";

const allowedMethods = new Set(["GET", "OPTIONS"]);
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";
const ADMIN_ALLOWED_ORIGIN = process.env.ADMIN_ALLOWED_ORIGIN || "https://builderrank.io";
const STALE_EVENT_HOURS = 24;

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
    const url = new URL(request.url || "/", "https://builderrank.io");
    const limit = clamp(Number.parseInt(url.searchParams.get("limit") || "50", 10), 1, 100);
    const workspaces = await loadWorkspaces(limit);

    response.status(200).json({
      ok: true,
      checkedAt: new Date().toISOString(),
      workspaces,
    });
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: "Could not load admin workspaces.",
      detail: error.message,
    });
  }
}

async function loadWorkspaces(limit) {
  const businesses = await selectSupabaseRows("br_businesses", {
    select: "id,owner_user_id,site_id,name,website_url,market,primary_trade,phone,beta_intake,tracking_status,beta_status,created_at,updated_at",
    order: "updated_at.desc",
    limit: String(limit),
  });

  const rows = [];
  for (const business of businesses) {
    const eventQueries = business.site_id ? [
      selectSupabaseRows("br_website_events", {
        select: "id,event,received_at,source_name,page_url",
        site_id: `eq.${business.site_id}`,
        received_at: `gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`,
        order: "received_at.desc",
        limit: "100",
      }),
      selectSupabaseRows("br_website_events", {
        select: "id,event,received_at,source_name,page_url",
        site_id: `eq.${business.site_id}`,
        order: "received_at.desc",
        limit: "1",
      }),
    ] : [[], []];
    const [
      recentEvents,
      lastEvents,
      jobTypes,
      competitors,
      prompts,
      recommendations,
      reports,
    ] = await Promise.all([
      ...eventQueries,
      selectSupabaseRows("br_job_types", {
        select: "id",
        business_id: `eq.${business.id}`,
        limit: "100",
      }),
      selectSupabaseRows("br_competitors", {
        select: "id",
        business_id: `eq.${business.id}`,
        active: "eq.true",
        limit: "100",
      }),
      selectSupabaseRows("br_prompts", {
        select: "id,job_type_id",
        business_id: `eq.${business.id}`,
        active: "eq.true",
        limit: "200",
      }),
      selectSupabaseRows("br_recommendations", {
        select: "id,status",
        business_id: `eq.${business.id}`,
        limit: "100",
      }),
      loadWorkspaceReports(business),
    ]);
    const promptRuns = prompts.length ? await selectSupabaseRows("br_prompt_runs", {
      select: "id,prompt_id,run_at,completed_at,run_status",
      prompt_id: inFilter(prompts.map((prompt) => prompt.id)),
      order: "run_at.desc",
      limit: "250",
    }) : [];
    const lastEvent = lastEvents[0] || recentEvents[0] || null;
    const recentLeadEvents = recentEvents.filter((event) => isLeadEvent(event.event)).length;
    const domainMismatch = recentEvents.length ? recentEvents.some((event) => !eventMatchesBusinessDomain(event.page_url, business.website_url)) : false;
    const promptRunSummary = summarizePromptRuns(promptRuns, prompts);
    const openRecommendations = recommendations.filter((item) => item.status !== "complete").length;
    const reportSummary = summarizeReports(reports);
    const lastEventAgeHours = eventAgeHours(lastEvent?.received_at);
    const trackingHealthStatus = trackingHealthStatusFor(lastEventAgeHours, domainMismatch);
    const readiness = workspaceReadiness({
      business,
      lastEvent,
      lastEventAgeHours,
      recentLeadEvents,
      domainMismatch,
      promptRunSummary,
      prompts,
      competitors,
      openRecommendations,
    });

    rows.push({
      id: business.id,
      name: business.name,
      websiteUrl: business.website_url,
      market: business.market,
      primaryTrade: business.primary_trade,
      contact: workspaceContact(business),
      siteId: business.site_id,
      hasOwner: Boolean(business.owner_user_id),
      trackingStatus: business.tracking_status,
      betaStatus: business.beta_status,
      lastEventAt: lastEvent?.received_at || null,
      lastEventAgeHours,
      trackingHealthStatus,
      lastEventName: lastEvent?.event || "",
      lastPageUrl: lastEvent?.page_url || "",
      lastSource: lastEvent?.source_name || "",
      domainMismatch,
      recentEvents: recentEvents.length,
      recentLeadEvents,
      jobTypes: jobTypes.length,
      competitors: competitors.length,
      prompts: prompts.length,
      promptRuns: promptRunSummary.count,
      unassignedAiRuns: promptRunSummary.unassignedRuns,
      lastAiRunAt: promptRunSummary.lastRunAt,
      aiFreshness: freshnessLabel(promptRunSummary.lastRunAt),
      openRecommendations,
      linkedReports: reportSummary.count,
      latestReportAt: reportSummary.latestReportAt,
      readinessStatus: readiness.status,
      readinessTone: readiness.tone,
      nextStep: readiness.nextStep,
      readinessScore: readiness.score,
      readinessBlockers: readiness.blockers,
      readinessChecks: readiness.checks,
      updatedAt: business.updated_at,
    });
  }

  return rows;
}

function workspaceContact(business) {
  const intake = business?.beta_intake && typeof business.beta_intake === "object" ? business.beta_intake : {};
  return {
    ownerName: safeTrim(intake.ownerName || intake.contactName),
    email: safeTrim(intake.email).toLowerCase(),
    phone: safeTrim(business.phone || intake.phone),
    installMethod: safeTrim(intake.installMethod),
    contractStatus: safeTrim(intake.contractStatus),
    contractTerm: safeTrim(intake.contractTerm),
    plan: safeTrim(intake.plan),
    notes: safeTrim(intake.notes),
  };
}

async function loadWorkspaceReports(business) {
  try {
    const linkedReports = await selectSupabaseRows("reports", {
      select: "id,business_id,website,created_at",
      business_id: `eq.${business.id}`,
      order: "created_at.desc",
      limit: "25",
    });
    if (linkedReports.length) return linkedReports;

    const fallbackReports = await selectSupabaseRows("reports", {
      select: "id,business_id,website,created_at",
      order: "created_at.desc",
      limit: "100",
    });
    return filterReportsByBusinessWebsite(fallbackReports, business.website_url).slice(0, 25);
  } catch (error) {
    if (!/business_id|schema cache|column/i.test(error.message || "")) throw error;
    const fallbackReports = await selectSupabaseRows("reports", {
      select: "id,website,created_at",
      order: "created_at.desc",
      limit: "100",
    });
    return filterReportsByBusinessWebsite(fallbackReports, business.website_url).slice(0, 25);
  }
}

function filterReportsByBusinessWebsite(reports = [], websiteUrl = "") {
  const targetWebsite = normalizeWebsiteForMatch(websiteUrl);
  return targetWebsite
    ? reports.filter((report) => normalizeWebsiteForMatch(report.website) === targetWebsite)
    : reports;
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

function summarizeReports(reports = []) {
  const latestReportAt = reports
    .map((report) => new Date(report.created_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() || null;

  return {
    count: reports.length,
    latestReportAt,
  };
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function isLeadEvent(eventName) {
  return /phone_click|form_submit|lead_click|quote_click|email_click/i.test(eventName);
}

function summarizePromptRuns(promptRows, prompts = []) {
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const runs = promptRows
    .filter((run) => run.run_status === "complete" || run.completed_at || run.run_at);
  const unassignedRuns = runs.filter((run) => !promptById.get(run.prompt_id)?.job_type_id).length;
  const lastRunAt = runs
    .map((run) => new Date(run.completed_at || run.run_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() || null;

  return {
    count: runs.length,
    unassignedRuns,
    lastRunAt,
  };
}

function workspaceReadiness({ business, lastEvent, lastEventAgeHours, recentLeadEvents, domainMismatch, promptRunSummary, prompts, competitors, openRecommendations }) {
  const trackingIsFresh = !lastEvent || !Number.isFinite(lastEventAgeHours) || lastEventAgeHours <= STALE_EVENT_HOURS;
  const checks = [
    readinessCheck("site_id", Boolean(business.site_id), "Site ID assigned", "Bootstrap or assign a Site Signal ID.", "Needs Site ID", "blocked"),
    readinessCheck("site_signal_installed", Boolean(lastEvent), "Site Signal event received", "Install the snippet/plugin, then send a test event.", "Install Site Signal", "setup"),
    readinessCheck("site_signal_fresh", trackingIsFresh, "Site Signal fresh", "Re-test the snippet/plugin before trusting live dashboard data.", "Site Signal stale", "blocked"),
    readinessCheck("domain_match", !domainMismatch, "Tracked domain matches workspace", "Confirm Site Signal is installed on the production customer domain.", "Domain mismatch", "blocked"),
    readinessCheck("lead_qa", Number(recentLeadEvents || 0) > 0, "Lead event QA complete", "Send a quote, form, phone, or email test event before customer review.", "Test lead event", "setup"),
    readinessCheck("ai_import", Number(promptRunSummary.count || 0) > 0, "AI checks imported", "Run the first ChatGPT/Gemini/Claude visibility import.", "Import AI checks", "setup"),
    readinessCheck("ai_job_types", Number(promptRunSummary.unassignedRuns || 0) === 0, "AI checks assigned to job types", "Add jobType to imported AI checks so profit-center visibility is accurate.", "Assign AI job types", "setup"),
    readinessCheck("prompts", prompts.length >= 10, "Prompt set ready", "Add at least ten buyer prompts for ranking context.", "Add prompts", "setup"),
    readinessCheck("competitors", competitors.length >= 3, "Competitor set ready", "Add at least three local competitors for ranking context.", "Add competitors", "setup"),
    readinessCheck("account_claimed", Boolean(business.owner_user_id), "Customer account connected", "Have the customer sign in and claim this Site ID before review.", "Connect account", "setup"),
    readinessCheck("punch_list", Number(openRecommendations || 0) > 0, "Punch List ready", "Seed the first implementation recommendations.", "Seed Punch List", "setup"),
  ];
  const blockers = checks.filter((check) => !check.ok);
  const firstBlocker = blockers[0];
  const score = Math.round(((checks.length - blockers.length) / checks.length) * 100);

  if (firstBlocker) {
    return {
      status: firstBlocker.status,
      tone: firstBlocker.tone,
      nextStep: firstBlocker.nextStep,
      score,
      blockers: blockers.map((check) => check.nextStep),
      checks,
    };
  }

  const liveBeta = openRecommendations <= 0;
  return {
    status: liveBeta ? "Live beta" : "Ready to review",
    tone: liveBeta ? "live" : "ready",
    nextStep: liveBeta ? "Monitor weekly AI freshness and Site Signal health." : "Review dashboard with customer and choose Punch List tasks.",
    score,
    blockers: [],
    checks,
  };
}

function readinessCheck(key, ok, label, nextStep, status, tone) {
  return { key, ok: Boolean(ok), label, nextStep, status, tone };
}

function inFilter(values) {
  return `in.(${values.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(",")})`;
}

function eventAgeHours(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.round((Date.now() - timestamp) / (60 * 60 * 1000));
}

function trackingHealthStatusFor(ageHours, domainMismatch = false) {
  if (!Number.isFinite(ageHours)) return "No events";
  if (ageHours > STALE_EVENT_HOURS) return "Stale";
  if (domainMismatch) return "Domain mismatch";
  return "Healthy";
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

function freshnessLabel(value) {
  if (!value) return "No AI import";
  const ageDays = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays <= 7) return "Fresh this week";
  if (ageDays <= 14) return "Needs weekly run";
  return "Stale AI checks";
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", ADMIN_ALLOWED_ORIGIN);
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-builderrank-admin-token");
  response.setHeader("Access-Control-Max-Age", "86400");
}
