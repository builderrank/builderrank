import { insertSupabaseRow, readJsonBody, supabaseServiceConfigured } from "./_shared.js";

const allowedMethods = new Set(["POST", "OPTIONS"]);

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

  try {
    const body = await readJsonBody(request);
    const lead = normalizeBetaLead(body);
    let stored = false;

    if (supabaseServiceConfigured()) {
      const businessRows = await insertSupabaseRow("br_businesses", {
        name: lead.company,
        website_url: lead.website,
        market: lead.market,
        site_id: lead.siteId,
        primary_trade: lead.jobType,
        beta_status: "requested",
        tracking_status: lead.trackingStatus,
        beta_intake: {
          email: lead.email,
          competitors: lead.competitors,
          requestedAt: lead.requestedAt,
        },
      });
      const business = businessRows?.[0];
      stored = Boolean(business?.id);

      if (business?.id) {
        await insertSupabaseRow("br_job_types", {
          business_id: business.id,
          label: lead.jobType,
          slug: slugify(lead.jobType),
          priority: 1,
        });

        for (const competitor of parseCompetitors(lead.competitors)) {
          await insertSupabaseRow("br_competitors", {
            business_id: business.id,
            name: competitor,
          });
        }
      }
    }

    response.status(202).json({
      ok: true,
      lead,
      stored,
      message: "Private beta request received.",
    });
  } catch (error) {
    response.status(error.statusCode || 400).json({ error: "Invalid beta request", detail: error.message });
  }
}

function normalizeBetaLead(body) {
  const email = safeTrim(body.email).toLowerCase();
  const company = safeTrim(body.company);
  const website = safeTrim(body.website);
  const jobType = safeTrim(body.jobType);
  const market = safeTrim(body.market);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email is required.");
  }

  if (!company) {
    throw new Error("Company name is required.");
  }

  if (!website) {
    throw new Error("Website is required.");
  }

  if (!jobType) {
    throw new Error("Primary job type is required.");
  }

  if (!market) {
    throw new Error("Market is required.");
  }

  return {
    email,
    company: company.slice(0, 160),
    website: normalizeWebsite(website),
    jobType: jobType.slice(0, 120),
    market: market.slice(0, 120),
    competitors: safeTrim(body.competitors).slice(0, 700),
    trackingStatus: safeTrim(body.trackingStatus).slice(0, 80),
    siteId: `br_${slugify(company).slice(0, 32)}_${Math.random().toString(36).slice(2, 8)}`,
    requestedAt: new Date().toISOString(),
  };
}

function normalizeWebsite(value) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Website must use http or https.");
  }

  return url.href;
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return safeTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "site";
}

function parseCompetitors(value) {
  return safeTrim(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Max-Age", "86400");
}
