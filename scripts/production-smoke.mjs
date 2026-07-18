import http from "node:http";
import https from "node:https";

const baseUrl = (process.env.BASE_URL || "https://builderrank.io").replace(/\/+$/, "");

const checks = [
  { method: "GET", path: "/", expect: [200] },
  { method: "GET", path: "/marketing-platform", expect: [200] },
  { method: "GET", path: "/dashboard", expect: [200], includes: ["Next Best Moves", "nextBestMoveList"] },
  { method: "GET", path: "/assets/dashboard.js", expect: [200], includes: ["renderNextBestMoves", "payload.opportunities"] },
  { method: "GET", path: "/admin-beta", expect: [200], includes: ["noindex,nofollow"] },
  { method: "GET", path: "/account", expect: [200] },
  { method: "GET", path: "/run-report", expect: [200] },
  { method: "GET", path: "/pricing", expect: [200] },
  { method: "GET", path: "/tracker.js", expect: [200] },
  { method: "GET", path: "/robots.txt", expect: [200], includes: ["Disallow: /admin-beta"] },
  { method: "GET", path: "/sitemap.xml", expect: [200], includes: ["https://builderrank.io/marketing-platform"], excludes: ["https://builderrank.io/dashboard", "https://builderrank.io/admin-beta"] },
  { method: "GET", path: "/api/dashboard-data", expect: [200], assertJson: assertDashboardDataEnvelope },
  { method: "GET", path: "/api/dashboard-data?days=90", expect: [200], assertJson: assertDashboardDataEnvelope },
  { method: "GET", path: "/api/dashboard-data?days=999", expect: [200], assertJson: assertDashboardDataEnvelope },
  { method: "GET", path: "/api/launch-readiness", expect: [200, 503], assertJson: assertLaunchReadinessEnvelope },
  {
    method: "GET",
    path: "/api/admin-workspaces",
    expect: [401, 503],
  },
  {
    method: "POST",
    path: "/api/report-eligibility",
    expect: [401, 503],
  },
  {
    method: "POST",
    path: "/api/audit",
    expect: [401, 503],
    body: {
      website: "https://example.com",
      market: "Denver, CO",
    },
  },
  {
    method: "POST",
    path: "/api/bootstrap-workspace",
    expect: [401, 503],
    body: {
      company: "Smoke Test Builders",
      website: "https://example.com",
      market: "Denver, CO",
      primaryTrade: "Bathroom remodeling",
    },
  },
  {
    method: "POST",
    path: "/api/import-ai-visibility",
    expect: [401, 503],
    body: {
      siteId: "br_smoke_test",
      runs: [
        {
          prompt: "best bathroom remodeler in Denver",
          platform: "ChatGPT",
          mentioned: true,
          rankPosition: 2,
          sources: [{ domain: "example.com", cited: true }],
        },
      ],
    },
  },
  {
    method: "POST",
    path: "/api/track",
    expect: [200, 202],
    assertJson: assertTrackQaPayload,
    body: {
      siteId: "br_smoke_test",
      event: "page_view",
      page: "/smoke-test",
      source: "production-smoke",
      metadata: {
        smokeTest: true,
        smokeVersion: 1,
      },
    },
  },
  {
    method: "POST",
    path: "/api/track",
    expect: [200, 202],
    assertJson: assertTrackUnknownEventFallback,
    body: {
      siteId: "br_smoke_unknown_event",
      event: "custom_widget_ping",
      page: "https://example.com/smoke-test",
      source: "production-smoke",
      metadata: {
        smokeTest: true,
        expectedFallback: "page_view",
      },
    },
  },
  {
    method: "GET",
    path: "/api/tracking-health",
    expect: [401, 503],
  },
  {
    method: "POST",
    path: "/api/connect-site",
    expect: [401, 503],
    body: { siteId: "br_smoke_test" },
  },
  {
    method: "PATCH",
    path: "/api/update-recommendation",
    expect: [401, 503],
    body: { recommendationId: "00000000-0000-0000-0000-000000000000", status: "in_progress" },
  },
];

let failures = 0;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const startedAt = Date.now();
  const result = await runCheck(url, check);
  const elapsed = Date.now() - startedAt;
  const statusLabel = check.expect.includes(result.status) && !result.assertionFailed ? "PASS" : "FAIL";

  if (statusLabel === "FAIL") failures += 1;

  console.log(`${statusLabel} ${check.method} ${check.path} ${result.status} ${elapsed}ms`);
  if (result.warning) console.log(`  ${result.warning}`);
}

if (failures) {
  console.error(`\n${failures} production smoke check${failures === 1 ? "" : "s"} failed for ${baseUrl}.`);
  process.exit(1);
}

console.log(`\nProduction smoke checks passed for ${baseUrl}.`);

async function runCheck(url, check) {
  try {
    const response = await request(url, check);
    const assertion = assertionWarning(response, check);
    return {
      status: response.status,
      warning: responseWarning(response) || assertion,
      assertionFailed: Boolean(assertion),
    };
  } catch (error) {
    return { status: 0, warning: error.message };
  }
}

function request(url, check) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = check.body ? JSON.stringify(check.body) : "";
    const client = target.protocol === "https:" ? https : http;
    const requestOptions = {
      method: check.method,
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: `${target.pathname}${target.search}`,
      headers: body ? {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      } : undefined,
      timeout: Number(process.env.SMOKE_TIMEOUT_MS || 8000),
    };

    const req = client.request(requestOptions, (res) => {
      let responseBody = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        responseBody += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: responseBody,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out after ${requestOptions.timeout}ms`));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function assertionWarning(response, check) {
  const warnings = [];
  if (Array.isArray(check.includes)) {
    const missing = check.includes.filter((pattern) => !response.body.includes(pattern));
    if (missing.length) warnings.push(`Missing expected response content: ${missing.join(", ")}`);
  }
  if (Array.isArray(check.excludes)) {
    const present = check.excludes.filter((pattern) => response.body.includes(pattern));
    if (present.length) warnings.push(`Found excluded response content: ${present.join(", ")}`);
  }

  if (typeof check.assertJson === "function") {
    const payload = parseJson(response.body);
    if (!payload) {
      warnings.push("Expected a JSON response body.");
    } else {
      const jsonWarning = check.assertJson(payload);
      if (jsonWarning) warnings.push(jsonWarning);
    }
  }

  return warnings.join(" ");
}

function responseWarning(response) {
  const contentType = response.headers["content-type"] || "";
  if (!contentType.includes("application/json")) return "";

  const payload = parseJson(response.body);

  if (!payload?.error && !payload?.reason) return "";
  return payload.error || payload.reason;
}

function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function assertTrackQaPayload(payload) {
  const requiredTypes = [
    ["stored", "boolean"],
    ["filtered", "boolean"],
    ["qaStatus", "string"],
    ["installHint", "string"],
    ["sourceType", "string"],
    ["acceptedAt", "string"],
  ];

  const missing = requiredTypes
    .filter(([key, type]) => typeof payload?.[key] !== type)
    .map(([key, type]) => `${key}:${type}`);

  if (missing.length) return `Invalid /api/track QA payload fields: ${missing.join(", ")}`;

  if (payload.qaDomain !== null && payload.qaDomain !== undefined) {
    const domainFieldsValid = typeof payload.qaDomain.expectedHost === "string"
      && typeof payload.qaDomain.receivedHost === "string"
      && typeof payload.qaDomain.matches === "boolean";
    if (!domainFieldsValid) return "Invalid /api/track qaDomain payload shape.";
  }

  return "";
}

function assertLaunchReadinessEnvelope(payload) {
  if (payload?.service !== "builderrank-launch-readiness") return "Invalid launch-readiness service label.";
  if (!payload.summary || !Array.isArray(payload.required) || !Array.isArray(payload.nextSteps)) {
    return "Invalid launch-readiness payload shape.";
  }
  if (!payload.required.some((check) => check.name === "ADMIN_API_TOKEN")) {
    return "Launch readiness did not check ADMIN_API_TOKEN.";
  }
  return "";
}

function assertTrackUnknownEventFallback(payload) {
  const baseWarning = assertTrackQaPayload(payload);
  if (baseWarning) return baseWarning;
  if (payload.received !== "page_view") {
    return `Unknown /api/track event should fall back to page_view, received ${payload.received || "missing"}.`;
  }
  return "";
}

function assertDashboardDataEnvelope(payload) {
  if (payload?.ok !== true) return "Invalid /api/dashboard-data response: ok must be true.";
  if (!["demo", "empty", "live"].includes(payload.mode)) return "Invalid /api/dashboard-data response: mode must be demo, empty, or live.";

  if (payload.mode === "live") {
    const days = payload.dateRange?.days;
    if (![7, 30, 90].includes(days)) return "Invalid /api/dashboard-data live dateRange.days.";
    if (!Array.isArray(payload.opportunities)) return "Invalid /api/dashboard-data live response: opportunities must be an array.";
    const invalidMove = payload.opportunities.find((move) => !move || typeof move.title !== "string" || typeof move.nextStep !== "string");
    if (invalidMove) return "Invalid /api/dashboard-data live opportunity shape.";
  }

  return "";
}
