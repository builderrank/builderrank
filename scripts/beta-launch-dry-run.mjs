import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const inputPath = process.argv[2] || "docs/first-beta-customer.sample.json";
const workspace = mkdtempSync(join(tmpdir(), "builderrank-beta-dry-run-"));
const normalizedPath = join(workspace, "customer.json");

try {
  runNode("scripts/validate-beta-customer.mjs", [inputPath, "--write", normalizedPath]);
  const customer = JSON.parse(readFileSync(normalizedPath, "utf8"));
  const handoff = runNode("scripts/beta-customer-handoff.mjs", [normalizedPath], { RUN_AT: "2026-07-10" });
  const importedJobTypes = [customer.primaryTrade, ...(Array.isArray(customer.jobTypes) ? customer.jobTypes : [])]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 3);
  const checks = [
    ["normalized customer has siteId", customer.siteId],
    ["handoff has production go/no-go checklist", handoff.includes("Production go/no-go before bootstrap") && handoff.includes("npm run supabase:schema-check") && handoff.includes("npm run production:readiness")],
    ["handoff has Site Signal snippet", handoff.includes("/tracker.js") && handoff.includes(`data-site-id="${customer.siteId}"`)],
    ["handoff has bootstrap curl", handoff.includes("/api/bootstrap-workspace") && handoff.includes("x-builderrank-admin-token: $ADMIN_API_TOKEN")],
    ["handoff has starter AI import", handoff.includes("/api/import-ai-visibility") && handoff.includes('"platform": "ChatGPT"') && handoff.includes('"platform": "Gemini"') && handoff.includes('"platform": "Claude"')],
    ["handoff has jobType on AI import", handoff.includes(`"jobType": "${customer.primaryTrade}"`)],
    ["handoff has multi-service AI import", importedJobTypes.every((jobType) => handoff.includes(`"jobType": "${jobType}"`))],
    ["handoff has Site Signal page-view QA", handoff.includes('"event": "page_view"') && handoff.includes("/api/track")],
    ["handoff has Site Signal lead-event QA", handoff.includes('"event": "lead_click"') && handoff.includes('"jobIntent"')],
    ["handoff has tracking health command", handoff.includes("/api/tracking-health?staleHours=24")],
    ["handoff has account claim step", handoff.includes("Customer account claim") && handoff.includes("connect Site Signal ID") && handoff.includes("Connect account")],
    ["handoff has dashboard review URL", handoff.includes(`/dashboard?siteId=${encodeURIComponent(customer.siteId)}`)],
  ];
  const failures = checks.filter(([, ok]) => !ok);

  checks.forEach(([name, ok]) => console.log(`${ok ? "PASS" : "FAIL"} ${name}`));
  if (failures.length) {
    console.error(`\n${failures.length} beta launch dry-run check${failures.length === 1 ? "" : "s"} failed.`);
    process.exit(1);
  }

  console.log(`\nBeta launch dry run passed for ${customer.company}.`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

function runNode(script, args, env = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${script} failed with exit code ${result.status}`);
  }

  return result.stdout || "";
}
