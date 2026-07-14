const required = [
  ["SUPABASE_URL", "Production Supabase project URL."],
  ["SUPABASE_SERVICE_ROLE_KEY", "Server-side dashboard, tracker, reports, and account APIs."],
  ["ADMIN_API_TOKEN", "/admin-beta, workspace bootstrap, imports, and tracking health."],
  ["TRACKING_HASH_SALT", "Stable Site Signal IP hashes."],
  ["RESEND_API_KEY", "Report delivery and tracking-health alerts."],
  ["REPORT_EMAIL_FROM", "Builder Rank <Support@builderrank.io> after Resend domain verification."],
  ["REPORT_EMAIL_REPLY_TO", "Support@builderrank.io."],
];

const recommended = [
  ["TRACKING_ALERT_EMAIL_TO", "Stale Site Signal, domain mismatch, and missing lead-event QA alerts."],
  ["ADMIN_ALLOWED_ORIGIN", "https://builderrank.io"],
  ["MAX_JSON_BODY_BYTES", "1000000"],
  ["STRIPE_WEBHOOK_SECRET", "Paid report reconciliation."],
  ["HUBSPOT_ACCESS_TOKEN", "Private beta intake/report sync."],
  ["OPENAI_API_KEY", "Full ChatGPT report-card analysis."],
  ["ANTHROPIC_API_KEY", "Full Claude report-card analysis."],
  ["GEMINI_API_KEY", "Full Gemini report-card analysis."],
];

printSection("Required Vercel Env Vars", required);
printSection("Recommended Vercel Env Vars", recommended);
printVercelEnvCommands("Required Vercel Env Add Templates", required);
printVercelEnvCommands("Recommended Vercel Env Add Templates", recommended);

console.log("Launch commands:");
console.log("1. Run npm run production:secrets to generate ADMIN_API_TOKEN and TRACKING_HASH_SALT.");
console.log("2. Add required env vars in Vercel production.");
console.log("3. Run supabase-setup.sql in the production Supabase SQL editor.");
console.log("4. npm run supabase:schema-check, then paste the SQL into Supabase and confirm there are no missing rows.");
console.log("5. npm run production:readiness");
console.log("6. npm run customer:validate -- docs/first-beta-customer.sample.json --write /tmp/builderrank-first-beta.json");
console.log("7. npm run customer:dry-run -- docs/first-beta-customer.sample.json");
console.log("8. npm run customer:handoff -- /tmp/builderrank-first-beta.json");
console.log("9. BASE_URL=https://builderrank.io npm run smoke:production");
console.log("10. For local verification after code edits, restart the local server first so a stale Node process is not serving old API code.");
console.log("11. Run smoke tests against the same fresh local server or deployed URL being reviewed, for example BASE_URL=http://127.0.0.1:4174 npm run smoke:production.");
console.log("12. Open /admin-beta, bootstrap the workspace, install Site Signal, run page-view and lead-event QA, import AI visibility, then confirm /api/tracking-health?staleHours=24 is healthy.");

function printSection(title, rows) {
  console.log(`${title}:`);
  rows.forEach(([name, note]) => {
    console.log(`- ${name}: ${note}`);
  });
  console.log("");
}

function printVercelEnvCommands(title, rows) {
  console.log(`${title}:`);
  rows.forEach(([name]) => {
    console.log(`vercel env add ${name} production`);
  });
  console.log("");
}
