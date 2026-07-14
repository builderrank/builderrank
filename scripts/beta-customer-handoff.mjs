import { readFileSync } from "node:fs";

const inputPath = process.argv[2] || "/tmp/builderrank-first-beta.json";
const baseUrl = (process.env.BASE_URL || "https://builderrank.io").replace(/\/+$/, "");
const customer = readCustomer(inputPath);
const siteId = customer.siteId;
const productionPageUrl = productionTestUrl(customer.website);
const primaryDomain = hostnameFor(customer.website);
const bootstrapPayload = JSON.stringify(customer, null, 2);
const aiImportPayload = JSON.stringify(buildAiImportPayload(customer, primaryDomain), null, 2);
const pageViewPayload = JSON.stringify({
  siteId,
  event: "page_view",
  page: productionPageUrl,
  source: "admin_launch_qa",
  metadata: {
    launchQa: true,
    pageType: "site_signal_install",
  },
}, null, 2);
const leadPayload = JSON.stringify({
  siteId,
  event: "lead_click",
  page: productionPageUrl,
  source: "admin_launch_qa",
  metadata: {
    launchQa: true,
    targetText: "Builder Rank launch QA lead",
    ctaType: "quote",
    jobIntent: customer.primaryTrade,
  },
}, null, 2);

console.log("Builder Rank first beta handoff");
console.log(`Customer: ${customer.company}`);
console.log(`Website: ${customer.website}`);
if (customer.ownerName || customer.email || customer.phone) {
  console.log(`Contact: ${[customer.ownerName, customer.email, customer.phone].filter(Boolean).join(" | ")}`);
}
if (customer.installMethod) console.log(`Install method: ${customer.installMethod}`);
if (customer.notes) console.log(`Notes: ${customer.notes}`);
console.log(`Site Signal ID: ${siteId}`);
console.log("");
console.log("Production go/no-go before bootstrap:");
console.log("1. Run supabase-setup.sql in production Supabase.");
console.log("2. Run npm run supabase:schema-check, paste the SQL into Supabase, and confirm no status = missing rows.");
console.log("3. Run npm run production:readiness and continue only when required blockers are 0.");
console.log(`4. Run BASE_URL=${baseUrl} npm run smoke:production against the deployed site.`);
console.log("");
console.log("Install snippet:");
console.log(`<script src="${baseUrl}/tracker.js" data-site-id="${siteId}" async></script>`);
console.log("");
console.log("Bootstrap workspace:");
printCurl({
  method: "POST",
  url: `${baseUrl}/api/bootstrap-workspace`,
  headers: [
    "content-type: application/json",
    "x-builderrank-admin-token: $ADMIN_API_TOKEN",
  ],
  body: bootstrapPayload,
});
console.log("");
console.log("Starter AI visibility import:");
printCurl({
  method: "POST",
  url: `${baseUrl}/api/import-ai-visibility`,
  headers: [
    "content-type: application/json",
    "x-builderrank-admin-token: $ADMIN_API_TOKEN",
  ],
  body: aiImportPayload,
});
console.log("");
console.log("Site Signal page-view QA:");
printCurl({
  method: "POST",
  url: `${baseUrl}/api/track`,
  headers: ["content-type: application/json"],
  body: pageViewPayload,
});
console.log("");
console.log("Site Signal lead-event QA:");
printCurl({
  method: "POST",
  url: `${baseUrl}/api/track`,
  headers: ["content-type: application/json"],
  body: leadPayload,
});
console.log("");
console.log("Tracking health:");
console.log(`curl -sS "${baseUrl}/api/tracking-health?staleHours=24" -H "x-builderrank-admin-token: $ADMIN_API_TOKEN"`);
console.log("");
console.log("Customer account claim:");
console.log(`1. Ask the customer to sign in at ${baseUrl}/account.`);
console.log(`2. Have them open ${baseUrl}/dashboard?siteId=${encodeURIComponent(siteId)} and connect Site Signal ID ${siteId}.`);
console.log("3. Refresh /admin-beta and confirm readiness no longer shows Connect account before the customer review.");
console.log("");
console.log("Review URLs:");
console.log(`Dashboard: ${baseUrl}/dashboard?siteId=${encodeURIComponent(siteId)}`);
console.log(`${baseUrl}/account`);
console.log(`${baseUrl}/admin-beta`);

function readCustomer(path) {
  let parsed = null;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read normalized customer JSON from ${path}: ${error.message}`);
    process.exit(1);
  }

  const required = ["company", "website", "market", "primaryTrade", "siteId"];
  const missing = required.filter((key) => !String(parsed?.[key] || "").trim());
  if (missing.length) {
    console.error(`Customer handoff is missing required field(s): ${missing.join(", ")}`);
    console.error("Run: npm run customer:validate -- docs/first-beta-customer.sample.json --write /tmp/builderrank-first-beta.json");
    process.exit(1);
  }

  return parsed;
}

function productionTestUrl(website) {
  try {
    const url = new URL(website);
    url.pathname = "/builder-rank-test";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return website;
  }
}

function buildAiImportPayload(value, domain) {
  const jobTypes = jobTypesForImport(value);
  return {
    siteId: value.siteId,
    runs: jobTypes.flatMap((jobType) => {
      const prompt = `best ${jobType} contractor in ${value.market}`;
      const sourceUrl = serviceUrl(value.website, jobType);
      return ["ChatGPT", "Gemini", "Claude"].map((platform) => ({
        prompt,
        jobType,
        platform,
        model: "",
        runAt: process.env.RUN_AT || denverDateString(),
        mentioned: false,
        rankPosition: null,
        confidence: 50,
        sentiment: "unknown",
        persona: "Homeowner ready to hire",
        intent: "hire_local_contractor",
        mentionText: `Replace with the ${platform} mention text for ${value.company}, if present.`,
        answerText: `Paste or summarize the ${platform} answer for: ${prompt}`,
        sources: [
          {
            domain,
            url: sourceUrl,
            type: "direct_site",
            cited: false,
          },
        ],
      }));
    }),
  };
}

function jobTypesForImport(value) {
  return [...new Set([value.primaryTrade, ...(Array.isArray(value.jobTypes) ? value.jobTypes : [])]
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .slice(0, 3);
}

function serviceUrl(website, service) {
  try {
    const url = new URL(website);
    url.pathname = `/${slugify(service)}`;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return website;
  }
}

function hostnameFor(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function printCurl({ method, url, headers, body }) {
  const headerFlags = headers.map((header) => `  -H ${shellQuote(header)} \\`).join("\n");
  console.log(`curl -sS -X ${method} ${shellQuote(url)} \\`);
  console.log(headerFlags);
  console.log(`  --data ${shellQuote(body)}`);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function denverDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
