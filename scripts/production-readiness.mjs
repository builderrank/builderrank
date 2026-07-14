const required = [
  {
    name: "SUPABASE_URL",
    test: (value) => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value),
    hint: "Set this to the production Supabase project URL.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    test: strongSecret,
    hint: "Required for server-side dashboard, tracker, reports, and account APIs.",
  },
  {
    name: "ADMIN_API_TOKEN",
    test: strongSecret,
    hint: "Required for /admin-beta, workspace bootstrap, imports, and tracking health.",
  },
  {
    name: "TRACKING_HASH_SALT",
    test: strongSecret,
    hint: "Required so Site Signal IP hashes are stable and not tied to another secret.",
  },
  {
    name: "RESEND_API_KEY",
    test: strongSecret,
    hint: "Required for report delivery and tracking-health alerts.",
  },
  {
    name: "REPORT_EMAIL_FROM",
    test: (value) => /support@builderrank\.io/i.test(value) && /^Builder Rank\s*</i.test(value),
    hint: "Use Builder Rank <Support@builderrank.io> after Resend domain verification.",
  },
  {
    name: "REPORT_EMAIL_REPLY_TO",
    test: (value) => /^support@builderrank\.io$/i.test(value),
    hint: "Use Support@builderrank.io so customer replies land in Google Workspace.",
  },
];

const recommended = [
  {
    name: "TRACKING_ALERT_EMAIL_TO",
    hint: "Recommended for stale Site Signal, domain mismatch, and missing lead-event QA alerts.",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    hint: "Recommended before paid report reconciliation is considered production-ready.",
  },
  {
    name: "HUBSPOT_ACCESS_TOKEN",
    hint: "Recommended if private beta intake should sync into HubSpot.",
  },
  {
    name: "OPENAI_API_KEY",
    hint: "Recommended for full ChatGPT report-card analysis.",
  },
  {
    name: "ANTHROPIC_API_KEY",
    hint: "Recommended for full Claude report-card analysis.",
  },
  {
    name: "GEMINI_API_KEY",
    hint: "Recommended for full Gemini report-card analysis.",
  },
];

const optional = [
  {
    name: "MAX_JSON_BODY_BYTES",
    test: (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) && parsed >= 100_000 && parsed <= 2_000_000;
    },
    hint: "Optional API JSON body cap should be between 100000 and 2000000 bytes for beta.",
  },
  {
    name: "ADMIN_ALLOWED_ORIGIN",
    test: (value) => /^https:\/\/[a-z0-9.-]+$/i.test(value) && !value.includes("*"),
    hint: "Optional admin CORS origin should be a single https origin, usually https://builderrank.io.",
  },
];

const failures = [];
const warnings = [];

required.forEach((item) => {
  const value = clean(process.env[item.name]);
  if (!value || !item.test(value)) {
    failures.push(`${item.name}: ${item.hint}`);
  }
});

recommended.forEach((item) => {
  if (!clean(process.env[item.name])) warnings.push(`${item.name}: ${item.hint}`);
});

optional.forEach((item) => {
  const value = clean(process.env[item.name]);
  if (value && !item.test(value)) warnings.push(`${item.name}: ${item.hint}`);
});

if (warnings.length) {
  console.log("Production readiness recommended follow-ups:");
  warnings.forEach((warning) => console.log(`WARN ${warning}`));
  console.log("");
}

if (failures.length) {
  console.log("Production readiness required blockers:");
  failures.forEach((failure) => console.log(`FAIL ${failure}`));
  console.log("");
  console.log("Next step: set the required Vercel env vars, run supabase-setup.sql, run npm run supabase:schema-check and confirm no missing rows, then rerun npm run production:readiness before onboarding the first beta customer.");
  process.exit(1);
}

console.log("Production readiness passed for required Builder Rank beta env vars. Confirm npm run supabase:schema-check is clean, then run npm run smoke:production against the deployed URL before inviting the first customer.");

function strongSecret(value) {
  const text = clean(value);
  return text.length >= 24 && !/^(your_|change_me|placeholder|test|demo|local|builderrank-local)/i.test(text);
}

function clean(value) {
  return String(value || "").trim();
}
