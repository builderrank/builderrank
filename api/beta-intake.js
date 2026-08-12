import { insertSupabaseRow, readJsonBody, selectSupabaseRows, supabaseServiceConfigured, updateSupabaseRows } from "./_shared.js";

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
      const businessRows = await upsertIntakeBusiness(lead);
      const business = businessRows?.[0];
      stored = Boolean(business?.id);

      if (business?.id) {
        await ensureIntakeJobTypes(business.id, lead.jobTypes);
        await ensureIntakeCompetitors(business.id, parseCompetitors(lead.competitors));
        await ensureIntakeTargetTerms(business, lead.targetTerms);
      }
    }

    response.status(202).json({
      ok: true,
      lead,
      stored,
      message: lead.intakeType === "signed_client" ? "Signed client onboarding intake received." : "Private beta request received.",
    });
  } catch (error) {
    response.status(error.statusCode || 400).json({ error: "Invalid beta request", detail: error.message });
  }
}

async function upsertIntakeBusiness(lead) {
  const existingRows = await selectSupabaseRows("br_businesses", {
    select: "id,site_id,name,website_url,market,primary_trade,phone,beta_intake,tracking_status,beta_status,owner_user_id",
    website_url: `eq.${lead.website}`,
    limit: "1",
  });
  const existing = existingRows[0];
  const existingIntake = existing?.beta_intake && typeof existing.beta_intake === "object" ? existing.beta_intake : {};
  const payload = {
    name: lead.company,
    website_url: lead.website,
    market: lead.market,
    site_id: existing?.site_id || lead.siteId,
    primary_trade: lead.primaryTrade,
    phone: lead.phone || existing?.phone || null,
    beta_status: lead.intakeType === "signed_client" ? "onboarding_intake" : "requested",
    tracking_status: existing?.tracking_status || lead.trackingStatus,
    beta_intake: {
      ...existingIntake,
      intakeType: lead.intakeType,
      onboardingSource: lead.onboardingSource,
      contractStatus: lead.contractStatus,
      contractTerm: lead.contractTerm,
      agreementDate: lead.agreementDate,
      plan: lead.plan,
      email: lead.email,
      ownerName: lead.ownerName,
      phone: lead.phone,
      billingEmail: lead.billingEmail,
      dashboardUsers: lead.dashboardUsers,
      primaryGoal: lead.primaryGoal,
      targetTerms: lead.targetTerms,
      jobTypes: lead.jobTypes,
      competitors: lead.competitors,
      installMethod: lead.installMethod,
      trackingStatus: lead.trackingStatus,
      websiteAccess: lead.websiteAccess,
      crmAccess: lead.crmAccess,
      googleBusinessAccess: lead.googleBusinessAccess,
      notes: lead.notes,
      requestedAt: lead.requestedAt,
    },
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    return updateSupabaseRows("br_businesses", { id: `eq.${existing.id}` }, payload);
  }

  return insertSupabaseRow("br_businesses", payload);
}

async function ensureIntakeJobTypes(businessId, jobTypes) {
  const existingRows = await selectSupabaseRows("br_job_types", {
    select: "id,label,slug,priority,profit_weight,active",
    business_id: `eq.${businessId}`,
    limit: "100",
  });
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));

  for (let index = 0; index < jobTypes.length; index += 1) {
    const label = jobTypes[index];
    const slug = slugify(label);
    const existing = existingBySlug.get(slug);
    const payload = {
      label,
      priority: index + 1,
      profit_weight: index === 0 ? 1.25 : 1,
      active: true,
    };

    if (existing?.id) {
      await updateSupabaseRows("br_job_types", { id: `eq.${existing.id}` }, payload);
      continue;
    }

    await insertSupabaseRow("br_job_types", {
      business_id: businessId,
      slug,
      ...payload,
    });
  }
}

async function ensureIntakeCompetitors(businessId, competitors) {
  const existingRows = await selectSupabaseRows("br_competitors", {
    select: "id,name,website_url,active",
    business_id: `eq.${businessId}`,
    limit: "100",
  });
  const existingByName = new Map(existingRows.map((row) => [normalizeKey(row.name), row]));

  for (const competitor of competitors) {
    const existing = existingByName.get(normalizeKey(competitor.name));
    const payload = {
      name: competitor.name,
      website_url: competitor.website || existing?.website_url || null,
      active: true,
    };

    if (existing?.id) {
      await updateSupabaseRows("br_competitors", { id: `eq.${existing.id}` }, payload);
      continue;
    }

    await insertSupabaseRow("br_competitors", {
      business_id: businessId,
      ...payload,
    });
  }
}

async function ensureIntakeTargetTerms(business, targetTerms) {
  if (!targetTerms.length) return;
  const jobType = (await selectSupabaseRows("br_job_types", { select: "id", business_id: `eq.${business.id}`, active: "eq.true", order: "priority.asc", limit: "1" }))[0];
  const existing = await selectSupabaseRows("br_target_terms", { select: "id,phrase,status", business_id: `eq.${business.id}`, status: "neq.archived", limit: "10" });
  const known = new Set(existing.map((row) => normalizeKey(row.phrase)));
  for (let index = 0; index < targetTerms.length; index += 1) {
    const phrase = targetTerms[index];
    if (known.has(normalizeKey(phrase))) continue;
    await insertSupabaseRow("br_target_terms", { business_id: business.id, job_type_id: jobType?.id || null, phrase, target_market: business.market, priority: index + 1, status: "active" });
  }
}

function normalizeBetaLead(body) {
  const intakeType = safeTrim(body.intakeType) === "signed_client" ? "signed_client" : "beta_request";
  const email = safeTrim(body.email).toLowerCase();
  const company = safeTrim(body.company);
  const website = safeTrim(body.website);
  const jobType = safeTrim(body.jobType || body.primaryTrade);
  const market = safeTrim(body.market);
  const jobTypes = listFromUnknown(body.jobTypes || body.services || jobType).slice(0, 12);
  const contractStatus = safeTrim(body.contractStatus);
  const contractTerm = safeTrim(body.contractTerm);
  const targetTerms = listFromUnknown(body.targetTerms || [body.targetTerm1, body.targetTerm2]).map((item) => item.slice(0, 100)).filter((item) => item.length >= 3).slice(0, 2);

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

  if (intakeType === "signed_client") {
    if (!["agreement_signed", "signature_pending"].includes(contractStatus)) {
      throw new Error("Signed client intake requires an agreement status.");
    }

    if (!["6_months", "12_months"].includes(contractTerm)) {
      throw new Error("Signed client intake requires a 6-month or 12-month term.");
    }
  }

  return {
    intakeType,
    onboardingSource: safeTrim(body.onboardingSource) || (intakeType === "signed_client" ? "client_onboarding_intake" : "marketing_platform_beta"),
    email,
    ownerName: safeTrim(body.ownerName || body.contactName).slice(0, 160),
    phone: safeTrim(body.phone).slice(0, 80),
    billingEmail: safeTrim(body.billingEmail).toLowerCase().slice(0, 180),
    dashboardUsers: safeTrim(body.dashboardUsers).slice(0, 700),
    company: company.slice(0, 160),
    website: normalizeWebsite(website),
    primaryTrade: jobType.slice(0, 120),
    jobType: jobType.slice(0, 120),
    jobTypes: jobTypes.length ? jobTypes.map((item) => item.slice(0, 120)) : [jobType.slice(0, 120)],
    targetTerms,
    market: market.slice(0, 120),
    competitors: safeTrim(body.competitors).slice(0, 1000),
    primaryGoal: safeTrim(body.primaryGoal).slice(0, 700),
    contractStatus,
    contractTerm,
    agreementDate: safeTrim(body.agreementDate).slice(0, 40),
    plan: safeTrim(body.plan).slice(0, 120),
    installMethod: safeTrim(body.installMethod).slice(0, 120),
    trackingStatus: safeTrim(body.trackingStatus).slice(0, 80),
    websiteAccess: safeTrim(body.websiteAccess).slice(0, 500),
    crmAccess: safeTrim(body.crmAccess).slice(0, 500),
    googleBusinessAccess: safeTrim(body.googleBusinessAccess).slice(0, 500),
    notes: safeTrim(body.notes).slice(0, 1000),
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

function normalizeKey(value) {
  return safeTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCompetitors(value) {
  return safeTrim(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((item) => {
      const [name, website] = item.split("|").map((part) => part?.trim() || "");
      return { name: name || item, website: website ? normalizeOptionalWebsite(website) : "" };
    });
}

function normalizeOptionalWebsite(value) {
  try {
    return normalizeWebsite(value);
  } catch {
    return "";
  }
}

function listFromUnknown(value) {
  if (Array.isArray(value)) return value.map(safeTrim).filter(Boolean);
  return safeTrim(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Max-Age", "86400");
}
