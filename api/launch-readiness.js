import { sendJson } from "./_shared.js";

const required = [
  ["SUPABASE_URL", validSupabaseUrl, "Set the production Supabase project URL."],
  ["SUPABASE_SERVICE_ROLE_KEY", strongSecret, "Required for saved reports, Site Signal storage, admin workspace setup, and dashboard data."],
  ["ADMIN_API_TOKEN", strongSecret, "Required for /admin-beta, workspace bootstrap, AI imports, and tracking health."],
  ["TRACKING_HASH_SALT", strongSecret, "Required so Site Signal visitor hashes are stable and not tied to another secret."],
  ["RESEND_API_KEY", strongSecret, "Required for report delivery and tracking-health alerts."],
  ["REPORT_EMAIL_FROM", validReportFrom, "Use Builder Rank <Support@builderrank.io> after Resend domain verification."],
  ["REPORT_EMAIL_REPLY_TO", validReplyTo, "Use Support@builderrank.io so customer replies land in Google Workspace."],
];

const recommended = [
  ["TRACKING_ALERT_EMAIL_TO", Boolean, "Recommended for stale Site Signal, domain mismatch, and missing lead-event QA alerts."],
  ["STRIPE_WEBHOOK_SECRET", Boolean, "Recommended before paid report reconciliation is considered production-ready."],
  ["HUBSPOT_ACCESS_TOKEN", Boolean, "Recommended if private beta intake should sync into HubSpot."],
  ["OPENAI_API_KEY", Boolean, "Recommended for full ChatGPT report-card analysis."],
  ["ANTHROPIC_API_KEY", Boolean, "Recommended for full Claude report-card analysis."],
  ["GEMINI_API_KEY", Boolean, "Recommended for full Gemini report-card analysis."],
];

const optional = [
  ["ADMIN_ALLOWED_ORIGIN", validAdminOrigin, "Optional admin CORS origin should be one exact https origin, usually https://builderrank.io."],
  ["MAX_JSON_BODY_BYTES", validBodyLimit, "Optional JSON body cap should stay between 100000 and 2000000 bytes during beta."],
];

export default async function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const requiredChecks = required.map(([name, test, hint]) => envCheck(name, test, hint, true));
  const recommendedChecks = recommended.map(([name, test, hint]) => envCheck(name, test, hint, false));
  const optionalChecks = optional.map(([name, test, hint]) => optionalEnvCheck(name, test, hint));
  const blockers = requiredChecks.filter((check) => !check.ok);
  const warnings = [...recommendedChecks, ...optionalChecks].filter((check) => !check.ok);

  sendJson(response, blockers.length ? 503 : 200, {
    ok: blockers.length === 0,
    service: "builderrank-launch-readiness",
    checkedAt: new Date().toISOString(),
    summary: {
      required: `${requiredChecks.length - blockers.length}/${requiredChecks.length}`,
      recommended: `${recommendedChecks.filter((check) => check.ok).length}/${recommendedChecks.length}`,
      optionalWarnings: optionalChecks.filter((check) => !check.ok).length,
      blockers: blockers.length,
      warnings: warnings.length,
    },
    required: requiredChecks,
    recommended: recommendedChecks,
    optional: optionalChecks,
    nextSteps: buildNextSteps(blockers),
  });
}

function envCheck(name, test, hint, requiredFlag) {
  const value = clean(process.env[name]);
  const ok = Boolean(value) && test(value);
  return {
    name,
    ok,
    status: ok ? "ready" : value ? "weak" : "missing",
    required: requiredFlag,
    hint,
  };
}

function optionalEnvCheck(name, test, hint) {
  const value = clean(process.env[name]);
  const ok = !value || test(value);
  return {
    name,
    ok,
    status: ok ? (value ? "ready" : "not_set") : "invalid",
    required: false,
    hint,
  };
}

function buildNextSteps(blockers) {
  if (!blockers.length) {
    return [
      "Run supabase-setup.sql in production Supabase.",
      "Run npm run supabase:schema-check and confirm no status = missing rows.",
      "Run npm run customer:dry-run -- docs/first-beta-customer.sample.json.",
      "Bootstrap the first customer in /admin-beta and run Site Signal QA.",
    ];
  }

  return [
    "Run npm run production:secrets locally to generate ADMIN_API_TOKEN and TRACKING_HASH_SALT.",
    "Add every missing required env var to Vercel Production and redeploy.",
    `Fix required blockers: ${blockers.map((check) => check.name).join(", ")}.`,
    "Reload /admin-beta and confirm Launch Readiness shows zero blockers before bootstrapping a customer.",
  ];
}

function validSupabaseUrl(value) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
}

function validReportFrom(value) {
  return /support@builderrank\.io/i.test(value) && /^Builder Rank\s*</i.test(value);
}

function validReplyTo(value) {
  return /^support@builderrank\.io$/i.test(value);
}

function validAdminOrigin(value) {
  return /^https:\/\/[a-z0-9.-]+$/i.test(value) && !value.includes("*");
}

function validBodyLimit(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 100_000 && parsed <= 2_000_000;
}

function strongSecret(value) {
  const text = clean(value);
  return text.length >= 24 && !/^(your_|change_me|placeholder|test|demo|local|builderrank-local|generate-)/i.test(text);
}

function clean(value) {
  return String(value || "").trim();
}
