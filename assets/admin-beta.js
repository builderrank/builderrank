const tokenForm = document.querySelector("#adminTokenForm");
const tokenInput = document.querySelector("#adminTokenInput");
const tokenStatus = document.querySelector("#adminTokenStatus");
const bootstrapForm = document.querySelector("#adminBootstrapForm");
const importForm = document.querySelector("#adminImportForm");
const trackingHealthForm = document.querySelector("#adminTrackingHealthForm");
const trackTestForm = document.querySelector("#adminTrackTestForm");
const workspaceRefreshButton = document.querySelector("#adminWorkspaceRefresh");
const workspaceRows = document.querySelector("#adminWorkspaceRows");
const bootstrapResult = document.querySelector("#adminBootstrapResult");
const importResult = document.querySelector("#adminImportResult");
const trackingHealthResult = document.querySelector("#adminTrackingHealthResult");
const trackTestResult = document.querySelector("#adminTrackTestResult");
const workspaceResult = document.querySelector("#adminWorkspaceResult");
const readinessChecklist = document.querySelector("#adminReadinessChecklist");
const fillSampleIntakeButton = document.querySelector("#adminFillSampleIntake");
const fillPromptTemplateButton = document.querySelector("#adminFillPromptTemplate");
const runMetaBenchmarkButton = document.querySelector("#adminRunMetaBenchmark");
const launchReadinessRefreshButton = document.querySelector("#adminLaunchReadinessRefresh");
const launchReadinessSummary = document.querySelector("#adminLaunchReadinessSummary");
const launchReadinessChecks = document.querySelector("#adminLaunchReadinessChecks");
const launchReadinessResult = document.querySelector("#adminLaunchReadinessResult");
const usageRefreshButton = document.querySelector("#adminUsageRefresh");
const usageSummary = document.querySelector("#adminUsageSummary");
const usageRows = document.querySelector("#adminUsageRows");
const activityFeed = document.querySelector("#adminActivityFeed");
const recheckFeed = document.querySelector("#adminRecheckFeed");
const usageResult = document.querySelector("#adminUsageResult");

let adminToken = "";

document.querySelectorAll("[data-builder-logo]").forEach((image) => {
  image.src = "/assets/builder-rank-logo.png";
});

tokenForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  adminToken = tokenInput.value.trim();
  tokenInput.value = "";
  tokenStatus.textContent = adminToken ? "Admin token ready for this page session." : "Enter ADMIN_API_TOKEN before calling admin endpoints.";
  if (adminToken) void loadAdminWorkspaces();
  if (adminToken) void loadAdminUsage();
});

usageRefreshButton?.addEventListener("click", () => void loadAdminUsage());

async function loadAdminUsage() {
  if (!adminToken) { if (usageResult) usageResult.textContent = "Enter ADMIN_API_TOKEN first."; return; }
  usageRefreshButton.disabled = true;
  usageRefreshButton.textContent = "Refreshing…";
  try {
    const response = await fetch("/api/admin-usage?days=30", { headers: { "x-builderrank-admin-token": adminToken } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error || "Could not load usage.");
    renderUsageDashboard(data);
    if (usageResult) usageResult.textContent = `Private report refreshed ${new Date().toLocaleString()}. ${data.summary.customers} customer workspaces included.`;
  } catch (error) { if (usageResult) usageResult.textContent = error.message; }
  finally { usageRefreshButton.disabled = false; usageRefreshButton.textContent = "Refresh usage"; }
}

function renderUsageDashboard(data) {
  const summary = data.summary || {};
  usageSummary.innerHTML = [
    [summary.creditsCharged || 0, "credits charged", "Successful platform prompt checks in 30 days"],
    [summary.rechecks || 0, "rechecks", `${summary.failedOrPartial || 0} failed or partial batches`],
    [summary.sessions || 0, "dashboard sessions", "Deduplicated to one session per 15 minutes"],
    [summary.customerChanges || 0, "customer changes", "Target Terms and recommendation workflow updates"],
  ].map(([value, label, detail]) => `<article><strong>${value}</strong><span>${escapeHtml(label)}</span><p>${escapeHtml(detail)}</p></article>`).join("");
  usageRows.innerHTML = (data.customers || []).map((row) => `<tr>
    <td><strong>${escapeHtml(row.name)}</strong><br><code>${escapeHtml(row.siteId || "No Site ID")}</code></td>
    <td><strong>${row.credits.remaining} / ${row.credits.total}</strong><br><span>${row.credits.used} used this cycle</span></td>
    <td>${row.usage.rechecks} batches · ${row.usage.charged} charged<br><span>${row.usage.failures} failed/partial</span></td>
    <td>${row.usage.sessions} sessions · ${row.usage.changes} changes<br><span>${row.usage.lastActiveAt ? relativeTime(row.usage.lastActiveAt) : "No recorded activity"}</span></td>
    <td>${row.limits.enabled ? "Enabled" : "Paused"}<br><span>${row.limits.batch}/batch · ${row.limits.daily}/day · ${row.limits.cooldownMinutes}m</span></td>
    <td><button type="button" data-usage-business="${escapeHtml(row.businessId)}" data-usage-enabled="${row.limits.enabled}">${row.limits.enabled ? "Pause rechecks" : "Enable rechecks"}</button></td>
  </tr>`).join("") || '<tr><td colspan="6">No customer workspaces found.</td></tr>';
  activityFeed.innerHTML = feedCards(data.recentActivity || [], (row) => [row.event_label || row.event_type, row.created_at]);
  recheckFeed.innerHTML = feedCards(data.recentBatches || [], (row) => [`${row.status} · ${row.charged_credits || 0}/${row.estimated_credits} credits · ${(row.platforms || []).join(", ")}`, row.created_at]);
}

function feedCards(rows, format) { return rows.slice(0, 12).map((row) => { const [label, time] = format(row); return `<article><strong>${escapeHtml(label)}</strong><span>${escapeHtml(relativeTime(time))}</span></article>`; }).join("") || "<p>No activity recorded yet.</p>"; }

usageRows?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-usage-business]");
  if (!button || !adminToken) return;
  button.disabled = true;
  try {
    const response = await fetch("/api/admin-usage", { method: "PATCH", headers: { "x-builderrank-admin-token": adminToken, "content-type": "application/json" }, body: JSON.stringify({ businessId: button.dataset.usageBusiness, customer_rechecks_enabled: button.dataset.usageEnabled !== "true" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error || "Could not change safeguard.");
    await loadAdminUsage();
  } catch (error) { if (usageResult) usageResult.textContent = error.message; button.disabled = false; }
});

bootstrapForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(bootstrapForm);
  const payload = {
    company: form.get("company"),
    website: form.get("website"),
    market: form.get("market"),
    primaryTrade: form.get("primaryTrade"),
    ownerName: form.get("ownerName"),
    email: form.get("email"),
    phone: form.get("phone"),
    installMethod: form.get("installMethod"),
    siteId: form.get("siteId"),
    jobTypes: listFromTextarea(form.get("jobTypes")),
    competitors: listFromTextarea(form.get("competitors")),
    targetTerms: listFromTextarea(form.get("targetTerms")).slice(0, 2),
    notes: form.get("notes"),
  };

  const data = await postAdminJson("/api/bootstrap-workspace", payload, bootstrapResult, bootstrapForm);
  if (data?.ok) void loadAdminWorkspaces();
});

importForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(importForm);
  const payload = {
    siteId: form.get("siteId"),
    runs: [
      {
        prompt: form.get("prompt"),
        jobType: form.get("jobType"),
        platform: form.get("platform"),
        measurementMode: form.get("measurementMode"),
        consumerSurface: form.get("consumerSurface"),
        model: form.get("model"),
        runAt: form.get("runAt"),
        mentioned: form.get("mentioned") === "on",
        rankPosition: form.get("rankPosition"),
        confidence: form.get("confidence"),
        sentiment: form.get("sentiment"),
        verifiedLocation: form.get("verifiedLocation"),
        verifiedAt: form.get("measurementMode") === "consumer_verified" ? new Date().toISOString() : null,
        serviceAccuracy: form.get("serviceAccuracy"),
        geoAccuracy: form.get("geoAccuracy"),
        persona: form.get("persona"),
        intent: form.get("intent"),
        mentionText: form.get("mentionText"),
        answerText: form.get("answerText"),
        sources: parseSources(form.get("sources")),
      },
    ],
  };

  const data = await postAdminJson("/api/import-ai-visibility", payload, importResult, importForm);
  if (data?.ok) void loadAdminWorkspaces();
});

trackingHealthForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(trackingHealthForm);
  const payload = {
    staleHours: form.get("staleHours"),
    notify: form.get("notify") === "on",
  };

  await postAdminJson("/api/tracking-health", payload, trackingHealthResult, trackingHealthForm);
});

workspaceRefreshButton?.addEventListener("click", () => {
  void loadAdminWorkspaces();
});

launchReadinessRefreshButton?.addEventListener("click", () => {
  void loadLaunchReadiness();
});

fillSampleIntakeButton?.addEventListener("click", () => {
  if (!bootstrapForm) return;
  setFormValue(bootstrapForm, "company", "Front Range Remodels");
  setFormValue(bootstrapForm, "website", "https://front-range-remodels.com");
  setFormValue(bootstrapForm, "market", "Denver, CO");
  setFormValue(bootstrapForm, "primaryTrade", "Remodeling contractor");
  setFormValue(bootstrapForm, "ownerName", "Jordan Smith");
  setFormValue(bootstrapForm, "email", "owner@example.com");
  setFormValue(bootstrapForm, "phone", "(303) 555-0147");
  setFormValue(bootstrapForm, "installMethod", "WordPress plugin");
  setFormValue(bootstrapForm, "siteId", "br_front_range_remodels");
  setFormValue(bootstrapForm, "jobTypes", "Bathroom remodeling\nKitchen remodeling\nBasement finishing");
  setFormValue(bootstrapForm, "competitors", "Mile High Bath Co.\nSummit Remodel Group\nDenver Design Build\nUrban Tile & Bath");
  setFormValue(bootstrapForm, "targetTerms", "bathroom remodeler Denver\nwalk-in shower contractor");
  setFormValue(bootstrapForm, "notes", "Friendly beta customer. Wants more bathroom and kitchen projects. Marketing contact can install the WordPress plugin.");
});

fillPromptTemplateButton?.addEventListener("click", () => {
  if (!importForm) return;
  const siteId = bootstrapForm?.elements.siteId?.value || "br_front_range_remodels";
  const jobType = bootstrapForm?.elements.jobTypes?.value?.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || "Bathroom remodeling";
  const market = bootstrapForm?.elements.market?.value || "Denver, CO";
  const website = bootstrapForm?.elements.website?.value || "https://front-range-remodels.com";
  const domain = domainFromUrl(website) || "front-range-remodels.com";
  setFormValue(importForm, "siteId", siteId);
  setFormValue(importForm, "platform", "ChatGPT");
  setFormValue(importForm, "measurementMode", "api_benchmark");
  setFormValue(importForm, "model", "gpt-5.2");
  setFormValue(importForm, "jobType", jobType);
  setFormValue(importForm, "runAt", new Date().toISOString().slice(0, 10));
  setFormValue(importForm, "rankPosition", "2");
  setFormValue(importForm, "confidence", "85");
  setFormValue(importForm, "sentiment", "positive");
  setFormValue(importForm, "persona", "Homeowner ready to hire");
  setFormValue(importForm, "intent", "hire_local_contractor");
  setFormValue(importForm, "prompt", `best ${jobType.toLowerCase()} company in ${market}`);
  setFormValue(importForm, "answerText", "Paste the AI answer here. Capture whether the customer appears, what competitors appear, and which sources the model references.");
  setFormValue(importForm, "mentionText", "Customer was mentioned as a local option with relevant project proof.");
  setFormValue(importForm, "sources", `${domain}|${website}|direct_site|cited\ngoogle.com/maps|https://google.com/maps|gbp|cited\nhouzz.com|https://www.houzz.com/|directory|not_cited`);
});

runMetaBenchmarkButton?.addEventListener("click", async () => {
  if (!importForm) return;
  const siteId = String(importForm.elements.siteId?.value || bootstrapForm?.elements.siteId?.value || "").trim();
  if (!siteId) {
    if (importResult) importResult.textContent = "Enter the customer Site ID before running the Meta benchmark.";
    return;
  }
  if (!adminToken) {
    if (importResult) importResult.textContent = "Enter ADMIN_API_TOKEN first.";
    return;
  }
  runMetaBenchmarkButton.disabled = true;
  runMetaBenchmarkButton.textContent = "Running Meta...";
  if (importResult) importResult.textContent = "Running the configured customer prompt set through Meta Model API. This may take a minute.";
  try {
    const response = await fetch("/api/run-meta-benchmark", {
      method: "POST",
      headers: { "x-builderrank-admin-token": adminToken, "content-type": "application/json" },
      body: JSON.stringify({ siteId, limit: 5 }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const missing = Array.isArray(data.missing) && data.missing.length ? ` Missing: ${data.missing.join(", ")}.` : "";
      throw new Error(`${data.detail || data.error || "Could not run Meta benchmark."}${missing}`);
    }
    const partial = data.failedRuns ? ` ${data.failedRuns} prompt${data.failedRuns === 1 ? "" : "s"} could not be completed; successful results were still saved.` : "";
    if (importResult) importResult.textContent = `Meta benchmark complete: ${data.importedRuns || 0} prompt runs imported with ${data.model || "the configured model"}.${partial}`;
    void loadAdminWorkspaces();
  } catch (error) {
    if (importResult) importResult.textContent = error.message;
  } finally {
    runMetaBenchmarkButton.disabled = false;
    runMetaBenchmarkButton.textContent = "Run Meta Benchmark";
  }
});

trackTestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(trackTestForm);
  const siteId = String(form.get("siteId") || "").trim();
  const eventType = String(form.get("eventType") || "page_view").trim();
  const eventDetail = String(form.get("eventDetail") || "Builder Rank install test CTA").trim();
  const pageUrl = String(form.get("pageUrl") || "").trim();

  if (!pageUrl) {
    if (trackTestResult) trackTestResult.textContent = "Enter the customer production page URL before sending a Site Signal test event.";
    return;
  }

  await postPublicTrackEvent({
    siteId,
    event: eventType,
    pageUrl,
    pageTitle: "Builder Rank Site Signal Test",
    sourceType: "direct",
    sourceName: "Builder Rank admin test",
    landingPath: pathFromUrl(pageUrl),
    sessionId: `admin-test-${Date.now()}`,
    metadata: testEventMetadata(eventType, eventDetail, pageUrl),
  }, trackTestResult, trackTestForm);
  void loadAdminWorkspaces();
});

async function loadAdminWorkspaces() {
  if (!adminToken) {
    if (workspaceResult) workspaceResult.textContent = "Enter ADMIN_API_TOKEN first.";
    return;
  }

  workspaceRefreshButton.disabled = true;
  workspaceRefreshButton.textContent = "Refreshing...";
  if (workspaceResult) workspaceResult.textContent = "Loading workspaces...";

  try {
    const response = await fetch("/api/admin-workspaces?limit=50", {
      headers: {
        "x-builderrank-admin-token": adminToken,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error || "Could not load workspaces.");
    renderWorkspaceRows(data.workspaces || []);
    renderReadinessChecklist(data.workspaces || []);
    if (workspaceResult) workspaceResult.textContent = `${data.workspaces?.length || 0} workspace${data.workspaces?.length === 1 ? "" : "s"} loaded.`;
  } catch (error) {
    if (workspaceResult) workspaceResult.textContent = error.message;
  } finally {
    workspaceRefreshButton.disabled = false;
    workspaceRefreshButton.textContent = "Refresh";
  }
}

async function loadLaunchReadiness() {
  if (!launchReadinessSummary) return;

  if (launchReadinessRefreshButton) {
    launchReadinessRefreshButton.disabled = true;
    launchReadinessRefreshButton.textContent = "Checking...";
  }
  launchReadinessSummary.innerHTML = "<article><strong>Checking production setup...</strong><p>Reading safe launch readiness signals.</p></article>";
  if (launchReadinessChecks) launchReadinessChecks.innerHTML = "";
  if (launchReadinessResult) launchReadinessResult.textContent = "";

  try {
    const response = await fetch("/api/launch-readiness");
    const data = await response.json().catch(() => ({}));
    renderLaunchReadiness(data, response.ok);
  } catch (error) {
    launchReadinessSummary.innerHTML = `<article class="needs-work"><strong>Could not check launch readiness</strong><p>${escapeHtml(error.message)}</p></article>`;
    if (launchReadinessResult) launchReadinessResult.textContent = error.message;
  } finally {
    if (launchReadinessRefreshButton) {
      launchReadinessRefreshButton.disabled = false;
      launchReadinessRefreshButton.textContent = "Recheck";
    }
  }
}

function renderLaunchReadiness(data, responseOk) {
  const summary = data?.summary || {};
  const blockers = Number(summary.blockers || 0);
  const warnings = Number(summary.warnings || 0);
  const ready = Boolean(data?.ok && responseOk);
  const tone = ready ? "is-ready" : "needs-work";
  const nextSteps = Array.isArray(data?.nextSteps) ? data.nextSteps : [];
  const required = Array.isArray(data?.required) ? data.required : [];
  const recommended = Array.isArray(data?.recommended) ? data.recommended : [];
  const optional = Array.isArray(data?.optional) ? data.optional : [];

  launchReadinessSummary.innerHTML = `
    <article class="${tone}">
      <span>${ready ? "Ready" : "Blocked"}</span>
      <strong>${ready ? "Production required checks are ready" : `${blockers} required blocker${blockers === 1 ? "" : "s"}`}</strong>
      <p>${ready ? "You can move into Supabase schema verification, customer dry-run, and workspace bootstrap." : "Fix these before bootstrapping a real GC or service-business workspace."}</p>
    </article>
    <article>
      <span>Required</span>
      <strong>${escapeHtml(summary.required || "0/0")}</strong>
      <p>Secrets and services needed for customer onboarding.</p>
    </article>
    <article>
      <span>Follow-ups</span>
      <strong>${warnings}</strong>
      <p>Recommended integrations or optional config warnings.</p>
    </article>
    <article>
      <span>Next</span>
      <strong>${escapeHtml(nextSteps[0] || "Run customer dry-run")}</strong>
      <p>${escapeHtml(nextSteps.slice(1, 3).join(" "))}</p>
    </article>
  `;

  if (launchReadinessChecks) {
    launchReadinessChecks.innerHTML = [
      ...required.map((check) => readinessCheckCard(check, true)),
      ...recommended.filter((check) => !check.ok).map((check) => readinessCheckCard(check, false)),
      ...optional.filter((check) => !check.ok).map((check) => readinessCheckCard(check, false)),
    ].join("");
  }

  if (launchReadinessResult) {
    launchReadinessResult.textContent = launchReadinessTextSummary(data);
  }
}

function readinessCheckCard(check, requiredCheck) {
  const ok = Boolean(check.ok);
  return `
    <article class="${ok ? "is-ready" : "needs-work"}">
      <span>${ok ? "Ready" : requiredCheck ? "Blocker" : "Follow-up"}</span>
      <strong>${escapeHtml(check.name || "Check")}</strong>
      <p>${escapeHtml(check.hint || check.status || "")}</p>
    </article>
  `;
}

function launchReadinessTextSummary(data) {
  const lines = [
    `Checked: ${data?.checkedAt || "unknown"}`,
    `Required: ${data?.summary?.required || "0/0"}`,
    `Blockers: ${data?.summary?.blockers || 0}`,
    `Warnings: ${data?.summary?.warnings || 0}`,
    "",
    "Next steps:",
    ...(Array.isArray(data?.nextSteps) ? data.nextSteps.map((step, index) => `${index + 1}. ${step}`) : ["1. Re-run launch readiness."]),
  ];
  return lines.join("\n");
}

function renderReadinessChecklist(workspaces) {
  if (!readinessChecklist) return;
  const workspace = [...workspaces].sort((a, b) => Number(b.readinessScore || 0) - Number(a.readinessScore || 0))[0];

  if (!workspace) {
    readinessChecklist.innerHTML = "<article><strong>No workspace yet</strong><p>Bootstrap the customer workspace, then refresh to see the onboarding checklist.</p></article>";
    return;
  }

  const checks = [
    ["Workspace created", Boolean(workspace.siteId), workspace.siteId || "Assign Site Signal ID"],
    ["Site Signal installed", Boolean(workspace.lastEventAt), workspace.lastEventAt ? `Last event ${relativeTime(workspace.lastEventAt)}` : "Send a page-view test"],
    ["Lead-event QA passed", Number(workspace.recentLeadEvents || 0) > 0, `${workspace.recentLeadEvents || 0} recent lead events`],
    ["Domain matches", !workspace.domainMismatch && Boolean(workspace.lastEventAt), workspace.domainMismatch ? "Fix installed domain" : "No mismatch flagged"],
    ["AI visibility imported", Number(workspace.promptRuns || 0) > 0, `${workspace.promptRuns || 0} prompt runs`],
    ["Competitors loaded", Number(workspace.competitors || 0) >= 3, `${workspace.competitors || 0} competitors`],
    ["Punch List seeded", Number(workspace.openRecommendations || 0) > 0, `${workspace.openRecommendations || 0} open tasks`],
    ["Customer account connected", Boolean(workspace.hasOwner), workspace.hasOwner ? "Claimed" : "Have customer sign in and connect Site ID"],
  ];

  readinessChecklist.innerHTML = `
    <article class="admin-readiness-overview">
      <strong>${escapeHtml(workspace.name || "Beta workspace")} · ${escapeHtml(readinessStatusLabel(workspace))}</strong>
      <p>${escapeHtml(workspace.nextStep || readinessLine(workspace))}</p>
      <a href="/dashboard?siteId=${encodeURIComponent(workspace.siteId || "")}">Open customer dashboard</a>
    </article>
    ${checks.map(([label, ok, detail]) => `
      <article class="${ok ? "is-ready" : "needs-work"}">
        <span>${ok ? "Ready" : "Todo"}</span>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(detail)}</p>
      </article>
    `).join("")}
  `;
}

function renderWorkspaceRows(workspaces) {
  if (!workspaceRows) return;

  if (!workspaces.length) {
    workspaceRows.innerHTML = "<tr><td colspan=\"8\">No beta workspaces found yet.</td></tr>";
    return;
  }

  workspaceRows.innerHTML = workspaces.map((workspace) => `
    <tr>
      <td><strong>${escapeHtml(workspace.name)}</strong><br><span>${escapeHtml(workspace.market || "Market not set")}</span></td>
      <td>${workspaceContactLine(workspace)}${workspace.contact?.notes ? `<br><span>${escapeHtml(workspace.contact.notes)}</span>` : ""}</td>
      <td><code>${escapeHtml(workspace.siteId || "No site ID")}</code></td>
      <td>${escapeHtml(workspace.trackingStatus || "unknown")} · ${workspace.hasOwner ? "owned" : "unclaimed"}</td>
      <td>${escapeHtml(workspace.lastEventAt ? relativeTime(workspace.lastEventAt) : "Never")}<br><span>${escapeHtml(eventHealthLine(workspace))}</span></td>
      <td>${escapeHtml(workspace.aiFreshness || "No AI import")}<br><span>${aiDataLine(workspace)}</span></td>
      <td><span class="admin-readiness is-${escapeHtml(workspace.readinessTone || "setup")}">${escapeHtml(readinessStatusLabel(workspace))}</span><br><span>${escapeHtml(readinessLine(workspace))}</span></td>
      <td>${workspace.jobTypes} jobs · ${workspace.competitors} competitors · ${workspace.prompts} prompts · ${workspace.openRecommendations} open · ${workspace.recentLeadEvents || 0} leads 7d · ${workspace.linkedReports || 0} reports${workspace.latestReportAt ? ` · ${escapeHtml(relativeTime(workspace.latestReportAt))}` : ""}</td>
    </tr>
  `).join("");
}

function workspaceContactLine(workspace) {
  const contact = workspace.contact || {};
  const parts = [
    contact.ownerName,
    contact.email,
    contact.phone,
    agreementLine(contact),
    contact.installMethod ? `Install: ${contact.installMethod}` : "",
  ].filter(Boolean);
  return parts.length ? parts.map(escapeHtml).join("<br>") : "<span>No contact context</span>";
}

function agreementLine(contact = {}) {
  const term = contact.contractTerm === "12_months" ? "12 months" : contact.contractTerm === "6_months" ? "6 months" : "";
  const status = contact.contractStatus === "agreement_signed" ? "signed" : contact.contractStatus === "signature_pending" ? "signature pending" : "";
  const plan = contact.plan ? ` · ${contact.plan}` : "";
  if (!term && !status && !plan) return "";
  return `Agreement: ${[term, status].filter(Boolean).join(" · ")}${plan}`;
}

function readinessStatusLabel(workspace) {
  const score = Number(workspace.readinessScore);
  const status = workspace.readinessStatus || "Needs review";
  return Number.isFinite(score) ? `${score}% · ${status}` : status;
}

function readinessLine(workspace) {
  const blockers = Array.isArray(workspace.readinessBlockers) ? workspace.readinessBlockers : [];
  if (!blockers.length) return workspace.nextStep || "Review workspace setup.";
  const extraCount = blockers.length - 1;
  return extraCount > 0 ? `${blockers[0]} +${extraCount} more` : blockers[0];
}

function aiDataLine(workspace) {
  const parts = [
    `${workspace.promptRuns || 0} runs`,
    workspace.lastAiRunAt ? relativeTime(workspace.lastAiRunAt) : "Never",
  ];
  if (workspace.unassignedAiRuns) parts.push(`${workspace.unassignedAiRuns} unassigned`);
  return parts.join(" · ");
}

function eventHealthLine(workspace) {
  const status = workspace.trackingHealthStatus || "No events";
  const eventName = workspace.lastEventName || "no event";
  const age = workspace.lastEventAgeHours != null && Number.isFinite(Number(workspace.lastEventAgeHours)) ? `${workspace.lastEventAgeHours}h old` : "no age";
  if (workspace.domainMismatch && workspace.lastPageUrl) return `${status} · ${eventName} · ${age} · ${workspace.lastPageUrl}`;
  return `${status} · ${eventName} · ${age}`;
}

async function postAdminJson(path, payload, output, form) {
  if (!adminToken) {
    output.textContent = "Enter ADMIN_API_TOKEN first.";
    return;
  }

  const button = form.querySelector("button[type='submit']");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Working...";
  output.textContent = "Calling Builder Rank...";

  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-builderrank-admin-token": adminToken,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    output.textContent = adminResponseSummary(path, data) + "\n\n" + JSON.stringify(data, null, 2);
    return data;
  } catch (error) {
    output.textContent = error.message;
    return null;
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function adminResponseSummary(path, data) {
  if (path === "/api/bootstrap-workspace") return bootstrapWorkspaceSummary(data);
  if (path === "/api/import-ai-visibility") return aiImportSummary(data);
  if (path === "/api/tracking-health") return trackingHealthSummary(data);
  return trackingQaSummary(data);
}

async function postPublicTrackEvent(payload, output, form) {
  const button = form.querySelector("button[type='submit']");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Sending...";
  output.textContent = "Sending test Site Signal event...";

  try {
    const response = await fetch("/api/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    output.textContent = trackingQaSummary(data) + "\n\n" + JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function trackingQaSummary(data) {
  if (!data || typeof data !== "object") return "Site Signal QA: no JSON response.";
  const status = data.qaStatus || (data.stored ? "stored" : "accepted");
  const stored = data.stored ? "stored" : "not stored";
  const domain = trackingQaDomainLine(data.qaDomain);
  return [`Site Signal QA: ${status} (${stored}). ${data.installHint || ""}`.trim(), domain].filter(Boolean).join("\n");
}

function trackingQaDomainLine(domain) {
  if (!domain || typeof domain !== "object") return "";
  const expected = domain.expectedHost || "unknown";
  const received = domain.receivedHost || "unknown";
  const status = domain.matches ? "matches workspace" : "does not match workspace";
  return `Domain QA: expected ${expected}; received ${received}; ${status}.`;
}

function bootstrapWorkspaceSummary(data) {
  if (!data || typeof data !== "object") return "Workspace bootstrap: no JSON response.";
  if (!data.ok) return `Workspace bootstrap failed: ${data.detail || data.error || "Unknown error"}`;
  const business = data.business || {};
  const counts = data.counts || {};
  const handoff = data.handoff || {};
  const nextSteps = Array.isArray(handoff.nextSteps) ? handoff.nextSteps : [];
  const lines = [
    `Workspace bootstrap: ${business.name || "customer"} ready with Site ID ${handoff.siteId || business.site_id || "not assigned"}.`,
    `${Number(counts.jobTypes || 0)} job types · ${Number(counts.competitors || 0)} competitors · ${Number(counts.prompts || 0)} prompts · ${Number(counts.recommendations || 0)} Punch List tasks.`,
    `Dashboard: ${handoff.dashboardUrl || "/dashboard"}`,
    `Account: ${handoff.accountUrl || "/account"}`,
    `Health check: ${handoff.trackingHealthUrl || "/api/tracking-health?staleHours=24"}`,
    `WordPress plugin: ${handoff.wordpressPlugin || "integrations/wordpress/builder-rank-site-signal.php"}`,
    `Snippet: ${handoff.snippet || data.snippet || "Site Signal snippet unavailable"}`,
    "Next steps:",
    ...(nextSteps.length ? nextSteps.map((step, index) => `${index + 1}. ${step}`) : ["1. Install Site Signal, send page-view and lead-event tests, then import AI visibility checks."]),
  ];
  return lines.join("\n");
}

function aiImportSummary(data) {
  if (!data || typeof data !== "object") return "AI import: no JSON response.";
  if (!data.ok) return `AI import failed: ${data.detail || data.error || "Unknown error"}`;
  const business = data.business || {};
  const sourceCount = (Array.isArray(data.imported) ? data.imported : []).reduce((sum, run) => sum + Number(run.sources || 0), 0);
  return [
    `AI import: ${Number(data.importedRuns || 0)} run${data.importedRuns === 1 ? "" : "s"} imported for ${business.name || business.siteId || "workspace"}.`,
    `${sourceCount} cited/source row${sourceCount === 1 ? "" : "s"} captured. Refresh workspaces and confirm AI freshness says Fresh this week.`,
  ].join("\n");
}

function trackingHealthSummary(data) {
  if (!data || typeof data !== "object") return "Tracking health: no JSON response.";
  if (!data.ok) return `Tracking health failed: ${data.detail || data.error || "Unknown error"}`;
  const total = Number(data.totalSites || 0);
  const healthy = Number(data.healthySites || 0);
  const stale = Number(data.staleSites || 0);
  const domainMismatch = Number(data.domainMismatchSites || 0);
  const leadQa = Number(data.noLeadQaSites || 0);
  const notification = data.notification?.sent ? "Alert sent." : data.notification?.reason ? `Alert not sent: ${data.notification.reason}` : "No alert sent.";
  const actionLines = [
    ...siteActionLines(data.stale, "stale"),
    ...siteActionLines(data.domainMismatch, "domain mismatch"),
    ...siteActionLines(data.needsLeadQa, "needs lead QA"),
  ];
  const actions = actionLines.length ? `\n${actionLines.join("\n")}` : "\nAll tracked sites are healthy.";
  return `Tracking health: ${healthy}/${total} healthy · ${stale} stale · ${domainMismatch} domain mismatch · ${leadQa} need lead QA. ${notification}${actions}`;
}

function siteActionLines(sites, label) {
  return (Array.isArray(sites) ? sites : []).slice(0, 5).map((site) => {
    const name = site.name || site.siteId || "Workspace";
    const recent = Number(site.recentEvents || 0);
    const leads = Number(site.recentLeadEvents || 0);
    return `- ${name}: ${label} (${recent} events, ${leads} lead events)`;
  });
}

function listFromTextarea(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function setFormValue(form, name, value) {
  const field = form.elements[name];
  if (!field) return;
  field.value = value;
}

function parseSources(value) {
  return listFromTextarea(value).map((line) => {
    const [domainOrUrl, url, type, citedState] = line.split("|").map((item) => item?.trim() || "");
    const parsedDomain = domainFromUrl(domainOrUrl);
    return {
      domain: parsedDomain || domainOrUrl,
      url: url || (parsedDomain ? domainOrUrl : ""),
      type: type || "unknown",
      cited: !/^(false|no|not_cited|uncited)$/i.test(citedState || ""),
    };
  });
}

function domainFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathFromUrl(value) {
  try {
    return new URL(value).pathname || "/";
  } catch {
    return "/";
  }
}

function testEventMetadata(eventType, detail, pageUrl) {
  const base = {
    test: "true",
    tool: "admin-beta",
    targetText: detail,
    targetHref: pageUrl,
    ctaType: eventType === "phone_click" ? "phone" : eventType === "email_click" ? "email" : "quote",
  };

  if (eventType === "form_submit") {
    return {
      ...base,
      formLabel: detail,
      formName: "builder-rank-install-test",
      formAction: pageUrl,
      formMethod: "post",
    };
  }

  return base;
}

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

void loadLaunchReadiness();
