import { readFileSync, writeFileSync } from "node:fs";

const { inputPath, outputPath } = parseArgs(process.argv.slice(2));
const failures = [];
const warnings = [];

let raw = "";
try {
  raw = readFileSync(inputPath, "utf8");
} catch (error) {
  console.error(`Could not read ${inputPath}: ${error.message}`);
  process.exit(1);
}

let input = null;
try {
  input = JSON.parse(raw);
} catch (error) {
  console.error(`Invalid JSON in ${inputPath}: ${error.message}`);
  process.exit(1);
}

const customer = normalizeCustomer(input);

required("company", customer.company);
required("website", customer.website);
required("market", customer.market);
required("primaryTrade", customer.primaryTrade);

if (customer.website && !isHttpUrl(customer.website)) {
  failures.push("website must be a valid http or https URL.");
}

if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
  failures.push("email must be a valid email address when provided.");
}

if (!customer.email) {
  warnings.push("Add the customer owner or marketing contact email before inviting them to the account dashboard.");
}

if (!customer.ownerName) {
  warnings.push("Add the owner or marketing contact name so launch-night handoff has a clear customer point person.");
}

if (customer.phone && customer.phone.replace(/\D/g, "").length < 7) {
  warnings.push("Phone number looks short; include a real customer or marketing contact number when available.");
}

if (!customer.installMethod) {
  warnings.push("Add installMethod such as WordPress plugin, GTM, Squarespace, Wix, Webflow, or direct code injection.");
}

if (!customer.jobTypes.length) {
  failures.push("jobTypes must include at least the primary trade.");
}

if (customer.jobTypes.length < 2) {
  warnings.push("Add at least one secondary job type so the dashboard has more than one profit center to compare.");
}

if (hasNormalizedDuplicates(customer.jobTypes)) {
  warnings.push("jobTypes contains duplicates after normalization; keep each profit center unique for cleaner dashboard reporting.");
}

if (customer.jobTypes.some(isGenericJobType)) {
  warnings.push("One or more job types look generic. Use buyer-facing services like bathroom remodeling, roof replacement, or emergency HVAC.");
}

if (customer.jobTypes.length > 8) {
  warnings.push("jobTypes has more than 8 entries; bootstrap will keep the first 8.");
}

if (customer.competitors.length < 3) {
  warnings.push("Add 3 to 5 local competitors before the first customer review.");
}

if (customer.competitors.some((competitor) => normalizeComparableName(competitor) === normalizeComparableName(customer.company))) {
  warnings.push("Remove the customer company from competitors; competitor rows should be other local businesses.");
}

if (hasNormalizedDuplicates(customer.competitors)) {
  warnings.push("competitors contains duplicate-looking names; remove duplicates so rank comparisons are not inflated.");
}

if (customer.competitors.some((competitor) => competitor.length < 4)) {
  warnings.push("One or more competitor names look too short; use recognizable local business names.");
}

if (customer.competitors.length > 12) {
  warnings.push("competitors has more than 12 entries; bootstrap will keep the first 12.");
}

if (customer.website && isGenericWebsiteHost(customer.website)) {
  warnings.push("Website looks like a social, directory, or generic host. Use the customer's primary website when possible.");
}

if (customer.website && isNonProductionWebsiteHost(customer.website)) {
  warnings.push("Website looks like localhost, staging, preview, or a temporary builder domain. Use the customer's production domain before customer review.");
}

if (!customer.siteId) {
  customer.siteId = suggestedSiteId(customer.company);
  warnings.push(`siteId was not provided; suggested value is ${customer.siteId}.`);
} else if (!/^br_[a-z0-9_/-]{3,80}$/i.test(customer.siteId)) {
  failures.push("siteId must start with br_ and contain only letters, numbers, dashes, underscores, or slashes.");
}

if (failures.length) {
  console.error("Beta customer validation failed:");
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  if (warnings.length) {
    console.error("");
    warnings.forEach((warning) => console.error(`WARN ${warning}`));
  }
  process.exit(1);
}

if (warnings.length) {
  console.log("Beta customer validation warnings:");
  warnings.forEach((warning) => console.log(`WARN ${warning}`));
  console.log("");
}

console.log("Beta customer bootstrap payload:");
console.log(JSON.stringify(customer, null, 2));
if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(customer, null, 2)}\n`);
  console.log("");
  console.log(`Normalized bootstrap payload written to ${outputPath}`);
}
console.log("");
console.log("Install snippet after bootstrap returns the final Site Signal ID:");
console.log(`<script src="https://builderrank.io/tracker.js" data-site-id="${customer.siteId}" async></script>`);
console.log("");
console.log("Post-bootstrap handoff URLs:");
console.log(`Dashboard: https://builderrank.io/dashboard?siteId=${encodeURIComponent(customer.siteId)}`);
console.log("Account: https://builderrank.io/account");
console.log("Tracking health: https://builderrank.io/api/tracking-health?staleHours=24");
console.log("WordPress plugin: integrations/wordpress/builder-rank-site-signal.php");

function parseArgs(args) {
  let input = "docs/first-beta-customer.sample.json";
  let output = "";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--write" || arg === "--out") {
      output = args[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg.startsWith("--write=")) {
      output = arg.slice("--write=".length);
      continue;
    }
    if (arg.startsWith("--out=")) {
      output = arg.slice("--out=".length);
      continue;
    }
    if (!arg.startsWith("--")) input = arg;
  }

  return { inputPath: input, outputPath: output };
}

function normalizeCustomer(value) {
  const primaryTrade = safeTrim(value.primaryTrade || value.trade || value.jobType);
  return {
    company: safeTrim(value.company || value.name).slice(0, 160),
    website: normalizeWebsite(value.website || value.websiteUrl),
    market: safeTrim(value.market).slice(0, 120),
    primaryTrade: primaryTrade.slice(0, 120),
    jobTypes: uniqueList([primaryTrade, ...normalizeList(value.jobTypes)]).slice(0, 12),
    competitors: normalizeList(value.competitors).slice(0, 20),
    ownerName: safeTrim(value.ownerName || value.contactName).slice(0, 160),
    email: safeTrim(value.email).toLowerCase(),
    phone: safeTrim(value.phone).slice(0, 60),
    installMethod: safeTrim(value.installMethod).slice(0, 80),
    notes: safeTrim(value.notes).slice(0, 1000),
    siteId: safeTrim(value.siteId),
  };
}

function required(name, value) {
  if (!value) failures.push(`${name} is required.`);
}

function normalizeWebsite(value) {
  const text = safeTrim(value);
  if (!text) return "";
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(safeTrim).filter(Boolean);
  return safeTrim(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values) {
  return [...new Set(values.map(safeTrim).filter(Boolean))];
}

function suggestedSiteId(company) {
  return `br_${slugify(company).slice(0, 42) || "customer_site"}`;
}

function normalizeComparableName(value) {
  return slugify(value)
    .replace(/\b(llc|inc|co|company|contractors?|builders?|remodels?|remodeling|construction)\b/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isGenericWebsiteHost(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
    return /^(facebook|instagram|linkedin|yelp|angi|angieslist|homeadvisor|thumbtack|houzz|google)\./.test(host);
  } catch {
    return false;
  }
}

function isNonProductionWebsiteHost(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
    return host === "localhost"
      || host.endsWith(".local")
      || host.endsWith(".test")
      || /(^|\.)staging\.|(^|\.)dev\.|(^|\.)preview\.|vercel\.app$|netlify\.app$|webflow\.io$|squarespace\.com$|wixsite\.com$/.test(host);
  } catch {
    return false;
  }
}

function hasNormalizedDuplicates(values) {
  const normalized = values.map(normalizeComparableName).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

function isGenericJobType(value) {
  const normalized = normalizeComparableName(value);
  return /^(general|general_contractor|contractor|construction|remodeling|services?|home_services?|home_improvement)$/.test(normalized);
}

function slugify(value) {
  return safeTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}
