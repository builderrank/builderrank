import { existsSync, readFileSync } from "node:fs";

const checks = [];

const requiredFiles = [
  "dashboard.html",
  "admin-beta.html",
  "marketing-platform.html",
  "demo-remodeler.html",
  "tracker.js",
  "api/index.js",
  "api/beta-intake.js",
  "api/admin-workspaces.js",
  "api/bootstrap-workspace.js",
  "api/connect-site.js",
  "api/dashboard-data.js",
  "api/import-ai-visibility.js",
  "api/launch-readiness.js",
  "api/report-eligibility.js",
  "api/track.js",
  "api/tracking-health.js",
  "api/update-recommendation.js",
  "assets/admin-beta.js",
  "assets/dashboard.js",
  "scripts/production-env-handoff.mjs",
  "scripts/production-readiness.mjs",
  "scripts/generate-production-secrets.mjs",
  "scripts/production-smoke.mjs",
  "scripts/supabase-schema-check.mjs",
  "scripts/beta-customer-handoff.mjs",
  "scripts/beta-launch-dry-run.mjs",
  "scripts/validate-beta-customer.mjs",
  "supabase-setup.sql",
  "integrations/wordpress/builder-rank-site-signal.php",
  "integrations/wordpress/README.md",
  "docs/production-beta-launch-checklist.md",
  "docs/first-beta-customer-template.md",
  "docs/first-beta-customer.sample.json",
  "docs/demo-remodeler-customer.json",
  "docs/builderrank-link-glossary.md",
  "docs/publishing-unblock-notes.md",
  "robots.txt",
  ".env.example",
];

for (const file of requiredFiles) {
  checks.push({
    name: `Required file: ${file}`,
    ok: existsSync(file),
    detail: existsSync(file) ? "" : "Missing required beta-launch artifact.",
  });
}

const packageJson = readJson("package.json");
check("package script smoke:production", packageJson?.scripts?.["smoke:production"] === "node scripts/production-smoke.mjs");
check("package script preflight:beta", packageJson?.scripts?.["preflight:beta"] === "node scripts/beta-preflight.mjs");
check("package script production:env-handoff", packageJson?.scripts?.["production:env-handoff"] === "node scripts/production-env-handoff.mjs");
check("package script production:secrets", packageJson?.scripts?.["production:secrets"] === "node scripts/generate-production-secrets.mjs");
check("package script production:readiness", packageJson?.scripts?.["production:readiness"] === "node scripts/production-readiness.mjs");
check("package script supabase:schema-check", packageJson?.scripts?.["supabase:schema-check"] === "node scripts/supabase-schema-check.mjs");
check("package script customer:validate", packageJson?.scripts?.["customer:validate"] === "node scripts/validate-beta-customer.mjs");
check("package script customer:handoff", packageJson?.scripts?.["customer:handoff"] === "node scripts/beta-customer-handoff.mjs");
check("package script customer:dry-run", packageJson?.scripts?.["customer:dry-run"] === "node scripts/beta-launch-dry-run.mjs");
check("package script customer:demo-dry-run", packageJson?.scripts?.["customer:demo-dry-run"] === "node scripts/beta-launch-dry-run.mjs docs/demo-remodeler-customer.json");

const vercel = read("vercel.json");
const apiRouter = read("api/index.js");
const sitemap = read("sitemap.xml");
[
  "/api/beta-intake",
  "/api/admin-workspaces",
  "/api/bootstrap-workspace",
  "/api/connect-site",
  "/api/dashboard-data",
  "/api/import-ai-visibility",
  "/api/launch-readiness",
  "/api/report-eligibility",
  "/api/track",
  "/api/tracking-health",
  "/api/update-recommendation",
].forEach((pattern) => check(`api router route ${pattern}`, apiRouter.includes(pattern)));
[
  '"src": "api/index.js"',
  '"/api/(.*)"',
  '"/api/index.js?path=$1"',
  "/dashboard/?",
  "/admin-beta/?",
  "/marketing-platform/?",
  "/demo-remodeler/?",
  "/tracker.js",
].forEach((pattern) => check(`vercel route ${pattern}`, vercel.includes(pattern)));
check("vercel builds a single API router function", vercel.includes('"src": "api/index.js"') && !vercel.includes('"src": "api/**/*.js"'));
check("sitemap keeps app routes out of public index", sitemap.includes("https://builderrank.io/marketing-platform") && !sitemap.includes("https://builderrank.io/dashboard") && !sitemap.includes("https://builderrank.io/admin-beta"));

const server = read("server.js");
[
  "/api/beta-intake",
  "/api/admin-workspaces",
  "/api/bootstrap-workspace",
  "/api/connect-site",
  "/api/dashboard-data",
  "/api/import-ai-visibility",
  "/api/launch-readiness",
  "/api/report-eligibility",
  "/api/track",
  "/api/tracking-health",
  "/api/update-recommendation",
  '"/admin-beta": "/admin-beta.html"',
  '"/demo-remodeler": "/demo-remodeler.html"',
].forEach((pattern) => check(`local server route ${pattern}`, server.includes(pattern)));

const demoRemodeler = read("demo-remodeler.html");
check("demo remodeler has Site Signal installed", demoRemodeler.includes("/tracker.js") && demoRemodeler.includes("br_demo_front_range_remodels"));
check("demo remodeler tracks logged-in Builder Rank QA sessions", demoRemodeler.includes('data-skip-logged-in="false"'));

const schema = read("supabase-setup.sql");
[
  "public.br_businesses",
  "public.br_job_types",
  "public.br_competitors",
  "public.br_prompts",
  "public.br_prompt_runs",
  "public.br_ai_mentions",
  "public.br_ai_sources",
  "public.br_website_events",
  "public.br_recommendations",
  "br_prompt_runs_prompt_platform_run_at_uidx",
  "br_ai_mentions_run_business_uidx",
  "br_ai_sources_run_domain_url_uidx",
  "br_website_events_site_event_received_idx",
  "br_website_events_site_source_received_idx",
  "add column if not exists business_id uuid references public.br_businesses",
  "reports_business_created_idx",
  "reports_email_created_idx",
].forEach((pattern) => check(`schema contains ${pattern}`, schema.includes(pattern)));

[
  "alter table public.br_job_types",
  "alter table public.br_competitors",
  "alter table public.br_prompts",
  "alter table public.br_prompt_runs",
  "alter table public.br_ai_mentions",
  "alter table public.br_ai_sources",
  "alter table public.br_website_events",
  "alter table public.br_recommendations",
  "add column if not exists metadata jsonb",
  "add column if not exists answer_text text",
  "add column if not exists completed_at timestamptz",
].forEach((pattern) => check(`schema migration-safe contains ${pattern}`, schema.includes(pattern)));

const docs = read("docs/production-beta-launch-checklist.md");
[
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_API_TOKEN",
  "TRACKING_HASH_SALT",
  "TRACKING_ALERT_EMAIL_TO",
  "npm run production:env-handoff",
  "POST /api/bootstrap-workspace",
  "POST /api/import-ai-visibility",
  "GET /api/admin-workspaces",
  "/api/update-recommendation",
  "GET /api/tracking-health",
  "npm run smoke:production",
  "npm run production:readiness",
  "npm run preflight:beta",
  "First Beta Go/No-Go Runbook",
  "required blockers are `0`",
  "restart the local server",
  "stale Node process",
  "same fresh local server",
  "unknown tracker-event fallback",
  "npm run customer:validate",
  "qaStatus: \"stored\"",
  "qaStatus: \"stored_domain_mismatch\"",
  "qaDomain.expectedHost",
  "test panel summarizes those hosts",
  "metadata.originalEvent",
  "fall back to `page_view`",
  "customer production page URL",
  "Fresh this week",
  "healthStatus: \"healthy\"",
  "domain_mismatch",
  "/dashboard?siteId=...",
  "no lead-event QA",
  "unclaimed customer account",
  "Connect account",
  "reports.business_id",
  "workspace-linked report rows",
  "normalized website matches",
  "reportBackfill.linked",
  "newly saved report-card rows",
  "linked report-card count",
  "workspace.readiness",
  "ready for beta review",
  "npm run customer:handoff",
  "npm run customer:dry-run",
  "starter AI visibility import curl",
  "customer account claim instructions",
  "across up to three job types",
  "starter prompts across up to three profit centers",
  "service/profit-center label",
].forEach((pattern) => check(`launch docs mention ${pattern}`, docs.includes(pattern)));

const firstCustomerTemplate = read("docs/first-beta-customer-template.md");
[
  "npm run customer:validate",
  "npm run customer:handoff",
  "npm run customer:dry-run",
  "--write /tmp/builderrank-first-beta.json",
  "docs/first-beta-customer.sample.json",
  "handoff",
  "POST /api/bootstrap-workspace",
  "POST /api/import-ai-visibility",
  "across up to three job types",
  "customer account claim instructions",
  "\"jobType\": \"Bathroom remodeling\"",
  "/api/tracking-health?staleHours=24",
  "integrations/wordpress/builder-rank-site-signal.php",
  "customer production page URL",
  "qaDomain.expectedHost",
  "stored_domain_mismatch",
  "docs/demo-remodeler-customer.json",
].forEach((pattern) => check(`first customer template mentions ${pattern}`, firstCustomerTemplate.includes(pattern)));

const firstCustomerSample = readJson("docs/first-beta-customer.sample.json");
check("first customer sample has required fields", firstCustomerSample?.company && firstCustomerSample?.website && firstCustomerSample?.market && firstCustomerSample?.primaryTrade);
check("first customer sample has competitor set", Array.isArray(firstCustomerSample?.competitors) && firstCustomerSample.competitors.length >= 3);
check("first customer sample has job types", Array.isArray(firstCustomerSample?.jobTypes) && firstCustomerSample.jobTypes.length >= 1);

const demoCustomerSample = readJson("docs/demo-remodeler-customer.json");
check("demo customer payload points at demo remodeler", demoCustomerSample?.website === "https://builderrank.io/demo-remodeler" && demoCustomerSample?.qaPage === "https://builderrank.io/demo-remodeler");
check("demo customer payload uses demo Site Signal ID", demoCustomerSample?.siteId === "br_demo_front_range_remodels");
const linkGlossary = read("docs/builderrank-link-glossary.md");
check("link glossary includes core customer URLs", linkGlossary.includes("https://builderrank.io/dashboard") && linkGlossary.includes("https://builderrank.io/demo-remodeler"));

const wordpressPlugin = read("integrations/wordpress/builder-rank-site-signal.php");
const wordpressReadme = read("integrations/wordpress/README.md");
check("WordPress plugin can skip logged-in users", wordpressPlugin.includes("track_logged_in") && wordpressPlugin.includes("is_user_logged_in"));
check("WordPress install docs mention logged-out QA", wordpressReadme.includes("logged-out/incognito") && wordpressReadme.includes("Track logged-in WordPress users"));

const envExample = read(".env.example");
[
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "REPORT_EMAIL_FROM=Builder Rank <Support@builderrank.io>",
  "TRACKING_HASH_SALT",
  "ADMIN_API_TOKEN",
  "ADMIN_ALLOWED_ORIGIN",
  "TRACKING_ALERT_EMAIL_TO",
  "MAX_JSON_BODY_BYTES",
].forEach((pattern) => check(`env example mentions ${pattern}`, envExample.includes(pattern)));
check("env example tracking alerts mention domain mismatch", envExample.includes("domain mismatch") && envExample.includes("missing lead-event QA alerts"));
check("public support email is Support@builderrank.io", read("support.html").includes("Support@builderrank.io") && read("legal.html").includes("Support@builderrank.io"));
check("no stale personal builderrank email remains", ![
  "README.md",
  "about.html",
  "account.html",
  "admin-beta.html",
  "dashboard.html",
  "index.html",
  "legal.html",
  "marketing-platform.html",
  "pricing.html",
  "run-report.html",
  "support.html",
  "why-geo.html",
  "assets/client.js",
  "assets/dashboard.js",
  "assets/admin-beta.js",
  "api/email-report.js",
  "api/tracking-health.js",
  "docs/production-beta-launch-checklist.md",
].some((path) => read(path).includes("kaleb@builderrank.io")));

const readinessScript = read("scripts/production-readiness.mjs");
const envHandoffScript = read("scripts/production-env-handoff.mjs");
const productionSecretsScript = read("scripts/generate-production-secrets.mjs");
const supabaseSchemaCheckScript = read("scripts/supabase-schema-check.mjs");
[
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_API_TOKEN",
  "TRACKING_HASH_SALT",
  "REPORT_EMAIL_FROM",
  "TRACKING_ALERT_EMAIL_TO",
  "MAX_JSON_BODY_BYTES",
  "ADMIN_ALLOWED_ORIGIN",
].forEach((pattern) => check(`production readiness checks ${pattern}`, readinessScript.includes(pattern)));
check("production readiness mentions tracking alert conditions", readinessScript.includes("domain mismatch") && readinessScript.includes("missing lead-event QA alerts"));
check("production readiness labels blockers and follow-ups", readinessScript.includes("required blockers") && readinessScript.includes("recommended follow-ups") && readinessScript.includes("run supabase-setup.sql") && readinessScript.includes("npm run supabase:schema-check"));
check("production readiness prints deterministic output", !readinessScript.includes("console.error") && readinessScript.includes("process.exit(1)"));
check("production env handoff prints launch sequence", envHandoffScript.includes("Required Vercel Env Vars") && envHandoffScript.includes("npm run production:secrets") && envHandoffScript.includes("npm run supabase:schema-check") && envHandoffScript.includes("npm run customer:dry-run") && envHandoffScript.includes("npm run customer:handoff") && envHandoffScript.includes("BASE_URL=https://builderrank.io npm run smoke:production") && envHandoffScript.includes("/api/tracking-health?staleHours=24"));
check("production env handoff prints vercel env templates", envHandoffScript.includes("Required Vercel Env Add Templates") && envHandoffScript.includes("Recommended Vercel Env Add Templates") && envHandoffScript.includes("printVercelEnvCommands") && envHandoffScript.includes("vercel env add ${name} production") && envHandoffScript.includes("SUPABASE_URL") && envHandoffScript.includes("REPORT_EMAIL_REPLY_TO"));
check("production secrets generator prints launch-owned secrets", productionSecretsScript.includes("randomBytes") && productionSecretsScript.includes("ADMIN_API_TOKEN") && productionSecretsScript.includes("TRACKING_HASH_SALT") && productionSecretsScript.includes("Do not reuse SUPABASE_SERVICE_ROLE_KEY"));
check("supabase schema check prints verification SQL", supabaseSchemaCheckScript.includes("expected_tables") && supabaseSchemaCheckScript.includes("expected_columns") && supabaseSchemaCheckScript.includes("expected_indexes") && supabaseSchemaCheckScript.includes("expected_policies") && supabaseSchemaCheckScript.includes("status = missing"));
check("supabase schema check covers beta tables", supabaseSchemaCheckScript.includes("br_businesses") && supabaseSchemaCheckScript.includes("br_website_events") && supabaseSchemaCheckScript.includes("br_ai_mentions") && supabaseSchemaCheckScript.includes("reports_business_created_idx") && supabaseSchemaCheckScript.includes("br_businesses_select_own"));
check("launch docs mention supabase schema verification", docs.includes("npm run supabase:schema-check") && docs.includes("status = missing") && docs.includes("launch blocker"));
check("launch docs mention production secrets generator", docs.includes("npm run production:secrets") && docs.includes("ADMIN_API_TOKEN") && docs.includes("TRACKING_HASH_SALT"));
check("README tracking-health mentions alert conditions", read("README.md").includes("domain mismatches") && read("README.md").includes("missing lead-event QA"));
check("README mentions supabase schema verification", read("README.md").includes("npm run supabase:schema-check") && read("README.md").includes("status = missing") && read("README.md").includes("launch blocker"));
check("README mentions production secrets generator", read("README.md").includes("npm run production:secrets") && read("README.md").includes("TRACKING_HASH_SALT"));

const customerValidator = read("scripts/validate-beta-customer.mjs");
const customerHandoff = read("scripts/beta-customer-handoff.mjs");
const customerDryRun = read("scripts/beta-launch-dry-run.mjs");
check("customer validator checks bootstrap fields", customerValidator.includes("primaryTrade") && customerValidator.includes("competitors") && customerValidator.includes("suggestedSiteId"));
check("customer validator preserves launch contact fields", customerValidator.includes("ownerName") && customerValidator.includes("installMethod") && customerValidator.includes("notes") && customerValidator.includes("phone"));
check("customer validator warns on thin beta review inputs", customerValidator.includes("secondary job type") && customerValidator.includes("marketing contact email") && customerValidator.includes("isGenericWebsiteHost"));
check("customer validator warns on duplicate or non-production intake", customerValidator.includes("hasNormalizedDuplicates") && customerValidator.includes("isGenericJobType") && customerValidator.includes("isNonProductionWebsiteHost"));
check("customer validator prints handoff URLs", customerValidator.includes("Post-bootstrap handoff URLs") && customerValidator.includes("dashboard?siteId="));
check("customer validator can write normalized payload", customerValidator.includes("writeFileSync") && customerValidator.includes("Normalized bootstrap payload written") && customerValidator.includes("--write"));
check("customer handoff prints launch commands", customerHandoff.includes("/api/bootstrap-workspace") && customerHandoff.includes("/api/track") && customerHandoff.includes("/api/tracking-health?staleHours=24") && customerHandoff.includes("x-builderrank-admin-token: $ADMIN_API_TOKEN"));
check("customer handoff prints go-no-go checklist", customerHandoff.includes("Production go/no-go before bootstrap") && customerHandoff.includes("npm run supabase:schema-check") && customerHandoff.includes("npm run production:readiness") && customerHandoff.includes("npm run smoke:production"));
check("customer handoff prints snippet and review URLs", customerHandoff.includes("Install snippet") && customerHandoff.includes("/tracker.js") && customerHandoff.includes("/dashboard?siteId=") && customerHandoff.includes("/admin-beta"));
check("customer handoff prints launch contact context", customerHandoff.includes("Contact:") && customerHandoff.includes("Install method:") && customerHandoff.includes("Notes:"));
check("customer handoff prints account claim instructions", customerHandoff.includes("Customer account claim") && customerHandoff.includes("connect Site Signal ID") && customerHandoff.includes("Connect account"));
check("customer handoff includes page and lead QA payloads", customerHandoff.includes('event: "page_view"') && customerHandoff.includes('event: "lead_click"') && customerHandoff.includes("productionTestUrl"));
check("customer handoff includes starter AI import", customerHandoff.includes("/api/import-ai-visibility") && customerHandoff.includes("buildAiImportPayload") && customerHandoff.includes('"ChatGPT", "Gemini", "Claude"') && customerHandoff.includes("jobTypesForImport") && customerHandoff.includes("jobType,"));
check("customer handoff uses launch-safe AI run date", customerHandoff.includes("process.env.RUN_AT") && customerHandoff.includes("denverDateString") && customerHandoff.includes("America/Denver"));
check("customer dry-run validates handoff artifacts", customerDryRun.includes("scripts/validate-beta-customer.mjs") && customerDryRun.includes("scripts/beta-customer-handoff.mjs") && customerDryRun.includes("/api/import-ai-visibility") && customerDryRun.includes("multi-service AI import") && customerDryRun.includes("account claim step") && customerDryRun.includes("production go/no-go checklist") && customerDryRun.includes("Beta launch dry run passed"));

const bootstrapApi = read("api/bootstrap-workspace.js");
check("bootstrap API returns customer handoff", bootstrapApi.includes("buildBootstrapHandoff") && bootstrapApi.includes("dashboardUrl") && bootstrapApi.includes("nextSteps"));
check("bootstrap API seeds multi-service starter data", bootstrapApi.includes("starterPrompts") && bootstrapApi.includes("workspace.jobTypes.slice(0, 3).flatMap") && bootstrapApi.includes("starterRecommendations") && bootstrapApi.includes("serviceRecommendations"));
check("bootstrap API preserves launch contact context", bootstrapApi.includes("existingIntake") && bootstrapApi.includes("phone: workspace.phone || existing?.phone") && bootstrapApi.includes("ownerName: workspace.ownerName || existingIntake.ownerName") && bootstrapApi.includes("installMethod: workspace.installMethod || existingIntake.installMethod") && bootstrapApi.includes("notes: workspace.notes || existingIntake.notes"));

const productionSmoke = read("scripts/production-smoke.mjs");
check("production smoke checks admin noindex", productionSmoke.includes("noindex,nofollow") && productionSmoke.includes("assertionFailed"));
check("production smoke checks robots admin disallow", productionSmoke.includes("Disallow: /admin-beta") && productionSmoke.includes("/robots.txt"));
check("production smoke validates Site Signal QA payload", productionSmoke.includes("assertTrackQaPayload") && productionSmoke.includes("qaStatus") && productionSmoke.includes("installHint") && productionSmoke.includes("qaDomain") && productionSmoke.includes("acceptedAt"));
check("production smoke validates unknown tracker event fallback", productionSmoke.includes("assertTrackUnknownEventFallback") && productionSmoke.includes("custom_widget_ping") && productionSmoke.includes('payload.received !== "page_view"'));
check("production smoke validates dashboard data envelope", productionSmoke.includes("assertDashboardDataEnvelope") && productionSmoke.includes("/api/dashboard-data?days=90") && productionSmoke.includes("/api/dashboard-data?days=999") && productionSmoke.includes("dateRange.days"));
check("production smoke validates dashboard opportunity surface", productionSmoke.includes("Next Best Moves") && productionSmoke.includes("payload.opportunities") && productionSmoke.includes("live opportunity shape"));

const dashboard = read("dashboard.html");
const dashboardJs = read("assets/dashboard.js");
check("dashboard loads Supabase", dashboard.includes("@supabase/supabase-js"));
check("dashboard loads assets/dashboard.js", dashboard.includes("/assets/dashboard.js"));
check("dashboard has Site Signal connect form", dashboard.includes("connectSiteForm"));
check("dashboard has live Site Signal snippet targets", dashboard.includes("connectSiteSnippet") && dashboard.includes("trackedEventsSnippet"));
check("dashboard has live Site Signal status targets", dashboard.includes("siteSignalStatusMetric") && dashboard.includes("summaryConnectionDetail"));
check("dashboard has live date range control", dashboard.includes("dateRangeSelect") && dashboard.includes("Last 7 days") && dashboard.includes("Last 90 days") && dashboard.includes("summaryAiReferralWindow"));
check("dashboard has tracked event detail column", dashboard.includes("<th>Detail</th>"));
check("dashboard has job intent columns", dashboard.includes("<th>Top Intent</th>") && dashboard.includes("<th>Job Intent</th>"));
check("dashboard has job-intent pipeline table", dashboard.includes("Job Pipeline by Intent") && dashboard.includes("jobIntentRows") && dashboard.includes("builder-rank-job-intents"));
check("dashboard has next-best-moves panel", dashboard.includes("Next Best Moves") && dashboard.includes("nextBestMoveList"));
check("dashboard has live notice", dashboard.includes("liveDashboardNotice"));
check("dashboard has report rows target", dashboard.includes("reportRows"));
check("dashboard has review task rows target", dashboard.includes("reviewTaskRows"));
check("dashboard has CTA rows target", dashboard.includes("ctaRows"));
check("dashboard has live CTA KPI copy", dashboard.includes("Top CTA / Form"));
check("dashboard has AI lead-rate KPI", dashboard.includes("summaryAiLeadRateMetric") && dashboard.includes("aiLeadRateMetric"));
check("dashboard has live Punch List summary detail", dashboard.includes("summaryActionDetail"));
check("dashboard has service-labeled review tasks", dashboard.includes("<th>Service</th>") && dashboard.includes("Bathroom remodeling</td><td>Google Business Profile"));
check("dashboard has visibility breakdown labels", dashboard.includes("visibilityBreakdownTitle") && dashboard.includes("visibilityBreakdownFirstColumn"));
check("dashboard has CSV export buttons", dashboard.includes("data-export-table=\"leadRows\"") && dashboard.includes("data-export-table=\"reportRows\"") && dashboard.includes("data-export-table=\"ctaRows\""));
check("dashboard can update recommendations", dashboardJs.includes("/api/update-recommendation"));
check("dashboard renders live leads", dashboardJs.includes("payload.leads"));
check("dashboard renders live job intent", dashboardJs.includes("row.topJobIntent") && dashboardJs.includes("row.jobIntent"));
check("dashboard renders live job-intent pipeline", dashboardJs.includes("payload.jobIntents") && dashboardJs.includes("jobIntentRowsFor") && dashboardJs.includes("#jobIntentRows"));
check("dashboard renders live competition metrics", dashboardJs.includes("formatRate(row.mentionRate)") && dashboardJs.includes("overallRankMetric"));
check("dashboard renders live visibility breakdown", dashboardJs.includes("renderLiveVisibilityBreakdown") && dashboardJs.includes("aiVisibility.platforms"));
check("dashboard renders profit-center visibility breakdown", dashboardJs.includes("Profit Center Visibility") && dashboardJs.includes("aiVisibility.jobTypes") && dashboardJs.includes("jobType.chatgpt"));
check("dashboard flags unassigned visibility prompts", dashboardJs.includes("jobType.needsJobType") && dashboardJs.includes("Assign job type"));
check("dashboard renders AI freshness badge", dashboardJs.includes("mentionRateDelta") && dashboardJs.includes("aiVisibility.dataFreshness"));
check("dashboard clears demo AI metrics for live partial data", dashboardJs.includes('averageRank.textContent = "Waiting"') && dashboardJs.includes('mentionRate.textContent = "0%"'));
check("dashboard renders live reports", dashboardJs.includes("renderLiveReports"));
check("dashboard renders live review tasks", dashboardJs.includes("renderLiveReviewTasks"));
check("dashboard clears demo review/report rows for empty live workspace", dashboardJs.includes("applyEmptyDashboardState") && dashboardJs.includes("renderLiveReviewTasks([])") && dashboardJs.includes("renderLiveReports([])"));
check("dashboard renders live top CTA KPI", dashboardJs.includes("payload.ctas?.[0]?.detail"));
check("dashboard renders live AI lead rate", dashboardJs.includes("summary.aiLeadRate") && dashboardJs.includes("summaryAiLeadRateMetric"));
check("dashboard renders live Punch List state", dashboardJs.includes("renderLivePunchListState") && dashboardJs.includes("workspace.openRecommendations"));
check("dashboard renders next-best-moves opportunities", dashboardJs.includes("renderNextBestMoves") && dashboardJs.includes("payload.opportunities") && dashboardJs.includes("nextBestMovesForScenario"));
check("dashboard renders workspace readiness notice", dashboardJs.includes("workspace.readiness") && dashboardJs.includes("Workspace ready for beta review") && dashboardJs.includes("Live workspace needs setup") && dashboardJs.includes("readiness.blockers"));
check("dashboard renders recommendation service labels", dashboardJs.includes("recommendationJobTypeLabel") && dashboardJs.includes("recommendation.jobTypeLabel") && dashboardJs.includes("All services"));
check("dashboard summarizes Site Signal claim result", dashboardJs.includes("connectSiteSummary") && dashboardJs.includes("payload.reportBackfill") && dashboardJs.includes("saved report") && dashboardJs.includes("Tracking:"));
check("dashboard prefills site id from URL", dashboardJs.includes("prefillSiteIdFromUrl") && dashboardJs.includes("siteId"));
check("dashboard passes selected site id to live API", dashboardJs.includes("selectedSiteIdFromUrl") && dashboardJs.includes("dashboardDataEndpoint(selectedSiteId)") && dashboardJs.includes('params.set("siteId", siteId)'));
check("dashboard passes date range to live API", dashboardJs.includes("dateRangeSelect") && dashboardJs.includes("selectedDateRangeDays") && dashboardJs.includes("dashboardDataEndpoint") && dashboardJs.includes("days: String(selectedDateRangeDays())"));
check("dashboard updates live Site Signal UI", dashboardJs.includes("updateSiteSignalUi") && dashboardJs.includes("business.tracking_status"));
check("dashboard renders Site Signal health states", dashboardJs.includes("siteSignalHealthCopy") && dashboardJs.includes("Needs lead test") && dashboardJs.includes("Domain mismatch") && dashboardJs.includes("Healthy"));
check("dashboard updates live source mix", dashboardJs.includes("updateLiveSourceMix") && dashboardJs.includes("payload.sourceMix"));
check("dashboard renders source lead signal", dashboard.includes("Lead Signal") && dashboardJs.includes("sourceSignalFallback"));
check("dashboard exports table CSV", dashboardJs.includes("exportTableToCsv") && dashboardJs.includes("escapeCsvCell"));

const dashboardApi = read("api/dashboard-data.js");
check("dashboard API loads event metadata", dashboardApi.includes("metadata,received_at"));
check("dashboard API filters selected owned site id", dashboardApi.includes("siteIdFromRequest") && dashboardApi.includes("businessFilters.site_id"));
check("dashboard API supports bounded date ranges", dashboardApi.includes("dateRangeDaysFromRequest") && dashboardApi.includes("[7, 30, 90].includes(days)") && dashboardApi.includes("dateRange: { days: dateRangeDays, since }"));
check("dashboard API returns AI freshness", dashboardApi.includes("latestRunAt") && dashboardApi.includes("function freshnessLabel"));
check("dashboard API returns profit-center visibility", dashboardApi.includes("rollupJobTypeVisibility") && dashboardApi.includes("jobTypes: rollupJobTypeVisibility") && dashboardApi.includes("platformMentionRate"));
check("dashboard API flags unassigned visibility prompts", dashboardApi.includes("needsJobType") && dashboardApi.includes("Add jobType to the AI import"));
check("dashboard API rolls up event details", dashboardApi.includes("function eventDetail") && dashboardApi.includes("metadata.targetText"));
check("dashboard API rolls up leads", dashboardApi.includes("leads: rollupLeads(events)") && dashboardApi.includes("function rollupLeads"));
check("dashboard API rolls up job intent", dashboardApi.includes("function jobIntentForEvent") && dashboardApi.includes("topJobIntent") && dashboardApi.includes("inferJobIntent"));
check("dashboard API returns job-intent pipeline", dashboardApi.includes("const jobIntents = rollupJobIntents(events)") && dashboardApi.includes("jobIntents,") && dashboardApi.includes("function rollupJobIntents") && dashboardApi.includes("topPage"));
check("dashboard API returns next-best-moves opportunities", dashboardApi.includes("opportunities: buildNextBestMoves") && dashboardApi.includes("function buildNextBestMoves") && dashboardApi.includes("parsePercent") && dashboardApi.includes("Profit center"));
check("dashboard API returns recommendation service labels", dashboardApi.includes("formatRecommendations(recommendations, jobTypes)") && dashboardApi.includes("jobTypeLabel") && dashboardApi.includes("jobTypeById"));
check("dashboard API returns AI lead rate", dashboardApi.includes("aiLeadRate") && dashboardApi.includes("aiLeadEvents"));
check("dashboard API returns Site Signal health status", dashboardApi.includes("healthStatus") && dashboardApi.includes("trackingHealthStatus") && dashboardApi.includes("needs_lead_qa") && dashboardApi.includes("domain_mismatch"));
check("dashboard API returns workspace readiness", dashboardApi.includes("workspaceReadiness") && dashboardApi.includes("ready: blockers.length === 0") && dashboardApi.includes("Site Signal healthy") && dashboardApi.includes("Prompt set ready"));
check("dashboard API detects Site Signal domain mismatch", dashboardApi.includes("eventMatchesBusinessDomain") && dashboardApi.includes("domainMismatch"));
check("dashboard API summary uses shared lead-event definition", dashboardApi.includes("const quoteEvents = events.filter((event) => isLeadEvent(event.event))"));
check("dashboard API rolls up CTAs", dashboardApi.includes("const ctas = rollupCtas(events)") && dashboardApi.includes("ctas,") && dashboardApi.includes("function rollupCtas"));
check("dashboard API loads saved reports", dashboardApi.includes('selectSupabaseRows("reports"') && dashboardApi.includes("reports: formatReports(reports)"));
check("dashboard API scopes saved reports to workspace or normalized website", dashboardApi.includes("loadSavedReports(user.id, business)") && dashboardApi.includes("business_id: `eq.${business.id}`") && dashboardApi.includes("normalizeWebsiteForMatch") && dashboardApi.includes("fallbackReports.filter"));
check("dashboard API rolls up competitor mentions", dashboardApi.includes("answer_text") && dashboardApi.includes("mentionRateForEntity"));
check("dashboard API rolls up source mix", dashboardApi.includes("sourceMix: rollupSourceMix") && dashboardApi.includes("function sourceCategory"));
check("dashboard API rolls up source lead signals", dashboardApi.includes("sourceSignalLabel") && dashboardApi.includes("leadEvents") && dashboardApi.includes("citationSignals"));

const account = read("account.html");
const accountJs = read("assets/client.js");
check("account has Site Signal panel", account.includes("accountSiteSignalPanel"));
check("account loads assets/client.js", account.includes("/assets/client.js"));
check("account links dashboard setup with site id", accountJs.includes("/dashboard?siteId="));
check("account labels Site Signal actions by state", accountJs.includes("Connect in dashboard") && accountJs.includes("Open live dashboard") && accountJs.includes("setAccountDashboardSetupLabel"));
check("account suggests workspace candidate from report history", accountJs.includes("accountWorkspaceCandidateFromReports") && accountJs.includes("accountReportHistoryCache") && accountJs.includes("Connect saved report to dashboard"));
check("client links newly saved reports to connected workspace", accountJs.includes("findConnectedBusinessIdForWebsite") && accountJs.includes("reportRow.business_id") && accountJs.includes("normalizeWebsiteForMatch"));

const connectSiteApi = read("api/connect-site.js");
check("connect-site validates site id format", connectSiteApi.includes("isValidSiteId") && connectSiteApi.includes("^br_"));
check("connect-site preserves active tracking status", connectSiteApi.includes('business.tracking_status === "active" ? "active" : "connected"'));
check("connect-site returns customer claim handoff", connectSiteApi.includes("claimStatus") && connectSiteApi.includes("dashboardUrl") && connectSiteApi.includes("nextStepFor"));
check("connect-site backfills matching saved reports", connectSiteApi.includes("linkMatchingReportsToBusiness") && connectSiteApi.includes("reportBackfill") && connectSiteApi.includes("normalizeWebsiteForMatch"));

const admin = read("admin-beta.html");
const adminJs = read("assets/admin-beta.js");
const robotsTxt = read("robots.txt");
check("admin beta loads assets/admin-beta.js", admin.includes("/assets/admin-beta.js"));
check("admin beta is noindexed", admin.includes('name="robots"') && admin.includes("noindex,nofollow"));
check("robots.txt disallows admin beta", robotsTxt.includes("Disallow: /admin-beta"));
check("admin beta has bootstrap form", admin.includes("adminBootstrapForm"));
check("admin beta captures launch contact context", admin.includes("ownerName") && admin.includes("installMethod") && admin.includes("Operator notes") && adminJs.includes("form.get(\"ownerName\")") && adminJs.includes("form.get(\"installMethod\")"));
check("admin beta has import form", admin.includes("adminImportForm"));
check("admin beta import captures run metadata", admin.includes("name=\"runAt\"") && admin.includes("name=\"confidence\"") && admin.includes("name=\"persona\""));
check("admin beta import captures job type", admin.includes('name="jobType"') && adminJs.includes('jobType: form.get("jobType")'));
check("admin beta has health form", admin.includes("adminTrackingHealthForm"));
check("admin beta health form mentions attention alert", admin.includes("Email alert if attention needed"));
check("admin beta has Site Signal test form", admin.includes("adminTrackTestForm"));
check("admin beta can choose test event type", admin.includes("name=\"eventType\"") && admin.includes("value=\"lead_click\""));
check("admin beta requires customer page URL for Site Signal test", admin.includes('name="pageUrl" type="url" required') && adminJs.includes("Enter the customer production page URL") && !adminJs.includes("builder-rank-site-signal-test"));
check("admin beta has workspace summary", admin.includes("adminWorkspaceRows"));
check("admin beta has AI data workspace column", admin.includes("<th>AI data</th>"));
check("admin beta has readiness workspace column", admin.includes("<th>Readiness</th>"));
check("admin beta has contact workspace column", admin.includes("<th>Contact</th>") && adminJs.includes("workspaceContactLine") && adminJs.includes("No contact context"));
check("admin beta calls workspace summary API", adminJs.includes("/api/admin-workspaces"));
check("admin beta can send test tracking event", adminJs.includes("postPublicTrackEvent") && adminJs.includes("/api/track"));
check("admin beta test event renders QA summary", adminJs.includes("postPublicTrackEvent") && adminJs.includes("trackingQaSummary(data) +"));
check("admin beta test event renders domain QA summary", adminJs.includes("trackingQaDomainLine") && adminJs.includes("Domain QA: expected") && adminJs.includes("received"));
check("admin beta sends test conversion metadata", adminJs.includes("testEventMetadata") && adminJs.includes("formLabel"));
check("admin beta parses cited source state", adminJs.includes("citedState") && adminJs.includes("not_cited"));
check("admin beta renders AI freshness", adminJs.includes("workspace.aiFreshness") && adminJs.includes("workspace.lastAiRunAt"));
check("admin beta renders unassigned AI run count", adminJs.includes("aiDataLine") && adminJs.includes("workspace.unassignedAiRuns") && adminJs.includes("unassigned"));
check("admin beta renders workspace readiness", adminJs.includes("workspace.readinessStatus") && adminJs.includes("workspace.nextStep") && adminJs.includes("readinessBlockers") && adminJs.includes("readinessScore"));
check("admin beta renders launch readiness", admin.includes("adminLaunchReadinessSummary") && adminJs.includes("loadLaunchReadiness") && adminJs.includes("/api/launch-readiness") && adminJs.includes("Production required checks are ready"));
check("admin beta renders linked report count", adminJs.includes("workspace.linkedReports") && adminJs.includes("workspace.latestReportAt"));
check("admin beta renders bootstrap summary", adminJs.includes("bootstrapWorkspaceSummary") && adminJs.includes("handoff.dashboardUrl") && adminJs.includes("counts.jobTypes"));
check("admin beta renders copyable bootstrap handoff", adminJs.includes("handoff.accountUrl") && adminJs.includes("handoff.trackingHealthUrl") && adminJs.includes("handoff.snippet") && adminJs.includes("Next steps:"));
check("admin beta renders AI import summary", adminJs.includes("aiImportSummary") && adminJs.includes("importedRuns") && adminJs.includes("Fresh this week"));
check("admin beta refreshes workspace table after setup actions", adminJs.includes("if (data?.ok) void loadAdminWorkspaces()"));
check("admin beta renders tracking QA summary", adminJs.includes("trackingQaSummary") && adminJs.includes("qaStatus"));
check("admin beta renders tracking health summary", adminJs.includes("trackingHealthSummary") && adminJs.includes("domainMismatchSites") && adminJs.includes("noLeadQaSites") && adminJs.includes("siteActionLines") && adminJs.includes("Tracking health failed"));

const adminWorkspacesApi = read("api/admin-workspaces.js");
const sharedApi = read("api/_shared.js");
check("admin workspace summary returns recent lead events", adminWorkspacesApi.includes("recentLeadEvents") && adminWorkspacesApi.includes("function isLeadEvent"));
check("admin workspace summary returns AI freshness", adminWorkspacesApi.includes("lastAiRunAt") && adminWorkspacesApi.includes("function freshnessLabel"));
check("admin workspace summary flags unassigned AI runs", adminWorkspacesApi.includes("unassignedAiRuns") && adminWorkspacesApi.includes("Assign AI job types") && adminWorkspacesApi.includes("promptRunSummary.unassignedRuns"));
check("admin workspace summary returns readiness", adminWorkspacesApi.includes("readinessStatus") && adminWorkspacesApi.includes("readinessBlockers") && adminWorkspacesApi.includes("readinessChecks") && adminWorkspacesApi.includes("function workspaceReadiness"));
check("admin workspace summary returns contact context", adminWorkspacesApi.includes("function workspaceContact") && adminWorkspacesApi.includes("beta_intake") && adminWorkspacesApi.includes("installMethod") && adminWorkspacesApi.includes("contact: workspaceContact"));
check("admin workspace summary returns linked reports", adminWorkspacesApi.includes("loadWorkspaceReports") && adminWorkspacesApi.includes("linkedReports") && adminWorkspacesApi.includes("latestReportAt"));
check("admin workspace summary normalizes report website fallback", adminWorkspacesApi.includes("filterReportsByBusinessWebsite") && adminWorkspacesApi.includes("normalizeWebsiteForMatch") && adminWorkspacesApi.includes("fallbackReports"));
check("admin workspace readiness catches domain mismatch", adminWorkspacesApi.includes("Domain mismatch") && adminWorkspacesApi.includes("eventMatchesBusinessDomain") && adminWorkspacesApi.includes("domainMismatch"));
check("admin workspace readiness catches stale tracking", adminWorkspacesApi.includes("STALE_EVENT_HOURS") && adminWorkspacesApi.includes("Site Signal stale") && adminWorkspacesApi.includes("trackingHealthStatus"));
check("admin workspace readiness requires lead-event QA", adminWorkspacesApi.includes("Test lead event") && adminWorkspacesApi.includes("recentLeadEvents"));
check("admin workspace readiness requires claimed account", adminWorkspacesApi.includes("Connect account") && adminWorkspacesApi.includes("Boolean(business.owner_user_id)") && adminWorkspacesApi.includes("claim this Site ID"));
check("admin workspace readiness returns full blocker list", adminWorkspacesApi.includes("blockers.map((check) => check.nextStep)") && adminWorkspacesApi.includes("readinessCheck(\"prompts\"") && adminWorkspacesApi.includes("readinessCheck(\"competitors\""));
check("admin beta renders tracking health line", adminJs.includes("eventHealthLine") && adminJs.includes("trackingHealthStatus"));
[
  "api/admin-workspaces.js",
  "api/bootstrap-workspace.js",
  "api/import-ai-visibility.js",
  "api/tracking-health.js",
].forEach((path) => {
  const source = read(path);
  check(`admin API CORS is origin scoped: ${path}`, source.includes("ADMIN_ALLOWED_ORIGIN") && !source.includes('Access-Control-Allow-Origin", "*"'));
  check(`admin API uses shared token authorization: ${path}`, source.includes("isAdminRequestAuthorized(request, ADMIN_API_TOKEN)") && !source.includes("function isAuthorized"));
});
check("shared API uses constant-time admin token compare", sharedApi.includes("timingSafeEqual") && sharedApi.includes("isAdminRequestAuthorized") && sharedApi.includes("extractBearerToken(request)"));

const importApi = read("api/import-ai-visibility.js");
check("AI visibility import normalizes confidence fallback", importApi.includes("normalizeConfidence(value.confidence, Boolean(value.mentioned))") && importApi.includes("mentioned ? 80 : 50"));
check("AI visibility import maps prompts to job types", importApi.includes("loadJobTypes") && importApi.includes("findJobType") && importApi.includes("job_type_id: jobType?.id || null") && importApi.includes("jobTypeId"));
check("AI visibility import backfills existing prompt job types", importApi.includes("assignPromptJobType") && importApi.includes("if (rows[0]) return await assignPromptJobType") && importApi.includes("updateSupabaseRows(\"br_prompts\""));
check("AI visibility import requires explicit job type match", importApi.includes("if (!target) return null") && !importApi.includes("|| jobTypes[0] || null"));

const trackingHealthApi = read("api/tracking-health.js");
check("tracking health reports lead-event QA", trackingHealthApi.includes("needs_lead_qa") && trackingHealthApi.includes("recentLeadEvents") && trackingHealthApi.includes("noLeadQaSites"));
check("tracking health reports domain mismatch", trackingHealthApi.includes("domain_mismatch") && trackingHealthApi.includes("domainMismatchSites") && trackingHealthApi.includes("eventMatchesBusinessDomain"));
check("tracking health classifies healthy sites", trackingHealthApi.includes('healthStatus === "healthy"') && trackingHealthApi.includes("function isLeadEvent"));
check("tracking health alerts on lead QA too", trackingHealthApi.includes("report.needsLeadQa.length > 0") && trackingHealthApi.includes("trackingAlertSubject") && trackingHealthApi.includes("renderAlertSiteText"));

const tracker = read("tracker.js");
check("tracker sends page views", tracker.includes('send("page_view")'));
check("tracker captures phone clicks", tracker.includes('send("phone_click"'));
check("tracker captures form submits", tracker.includes('send("form_submit"'));
check("tracker infers job intent", tracker.includes("inferJobIntent") && tracker.includes("eventMetadata.jobIntent"));
check("tracker classifies AI-tagged UTM traffic", tracker.includes("classifyTaggedSource") && tracker.includes("utm.ref") && tracker.includes("perplexity"));

const trackApi = read("api/track.js");
check("track API marks known sites active", trackApi.includes('tracking_status: "active"') && trackApi.includes("updateSupabaseRows"));
check("track API preserves scalar metadata", trackApi.includes('typeof value === "number"') && trackApi.includes('typeof value === "boolean"') && trackApi.includes(".slice(0, 30)"));
check("track API aliases known events without inflating unknown leads", trackApi.includes("originalEvent") && trackApi.includes('"pageview"') && trackApi.includes('"form_submission"') && trackApi.includes('return "page_view";') && !trackApi.includes('return "lead_click";\n}'));
check("track API ignores unknown Site Signal IDs", trackApi.includes("Unknown Site Signal ID") && trackApi.includes("Event accepted but not stored") && trackApi.includes("business?.id"));
check("track API returns install QA status", trackApi.includes("qaStatus") && trackApi.includes("installHintFor"));
check("track API returns domain mismatch QA", trackApi.includes("stored_domain_mismatch") && trackApi.includes("domainQaFor") && trackApi.includes("qaDomain") && trackApi.includes("expectedHost") && trackApi.includes("receivedHost") && trackApi.includes("website_url"));
check("track API does not use Supabase service key as hash salt", trackApi.includes("function trackingHashSalt") && !trackApi.includes("SUPABASE_SERVICE_ROLE_KEY || \"builderrank-local\""));

check("shared API reader limits JSON body size", sharedApi.includes("MAX_JSON_BODY_BYTES") && sharedApi.includes("statusCode: 413"));
check("shared API reader falls back on invalid body limit", sharedApi.includes("parsePositiveInteger") && sharedApi.includes("1_000_000"));

const failures = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
}

if (failures.length) {
  console.error(`\n${failures.length} beta preflight check${failures.length === 1 ? "" : "s"} failed.`);
  process.exit(1);
}

console.log(`\nBeta preflight passed with ${checks.length} checks.`);

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function readJson(path) {
  try {
    return JSON.parse(read(path));
  } catch {
    return null;
  }
}
