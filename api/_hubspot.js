import { safeString } from "./_shared.js";

const HUBSPOT_TOKEN = process.env.HUBSPOT_SERVICE_KEY || process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_BASE_URL = "https://api.hubapi.com";

const customProperties = {
  contacts: [
    {
      name: "builder_rank_trade",
      label: "Builder Rank Trade",
      type: "string",
      fieldType: "text",
      groupName: "contactinformation",
    },
    {
      name: "builder_rank_company_size",
      label: "Builder Rank Company Size",
      type: "string",
      fieldType: "text",
      groupName: "contactinformation",
    },
  ],
  deals: [
    {
      name: "builder_rank_website",
      label: "Builder Rank Website",
      type: "string",
      fieldType: "text",
      groupName: "dealinformation",
    },
    {
      name: "builder_rank_market",
      label: "Builder Rank Market",
      type: "string",
      fieldType: "text",
      groupName: "dealinformation",
    },
    {
      name: "builder_rank_checkout_reference",
      label: "Builder Rank Checkout Reference",
      type: "string",
      fieldType: "text",
      groupName: "dealinformation",
    },
    {
      name: "builder_rank_score",
      label: "Builder Rank Score",
      type: "number",
      fieldType: "number",
      groupName: "dealinformation",
    },
  ],
};

export function hubSpotConfigured() {
  return Boolean(HUBSPOT_TOKEN);
}

export async function syncHubSpotAccount(profile = {}) {
  if (!hubSpotConfigured()) return { skipped: true, reason: "HubSpot is not configured." };

  await ensureHubSpotProperties();

  const contact = await upsertContact({
    email: profile.email,
    firstName: profile.first_name || profile.firstName,
    lastName: profile.last_name || profile.lastName,
    phone: profile.phone,
    companyName: profile.company_name || profile.companyName,
    companySize: profile.company_size || profile.companySize,
    trade: profile.trade,
  });

  let company = null;
  if (profile.company_name || profile.companyName) {
    company = await upsertCompany({
      name: profile.company_name || profile.companyName,
      phone: profile.phone,
    });
  }

  return {
    contactId: contact?.id || null,
    companyId: company?.id || null,
  };
}

export async function syncHubSpotPurchase(purchase = {}) {
  if (!hubSpotConfigured()) return { skipped: true, reason: "HubSpot is not configured." };

  await ensureHubSpotProperties();

  const email = safeString(purchase.customer_email || purchase.email);
  const phone = safeString(purchase.customer_phone || purchase.phone);
  const contact = email ? await upsertContact({ email, phone }) : null;
  const amount = typeof purchase.amount_total === "number" ? String(purchase.amount_total / 100) : "49";
  const deal = await createDeal({
    email,
    phone,
    amount,
    website: purchase.website,
    market: purchase.market,
    checkoutReference: purchase.checkout_reference || purchase.checkoutReference,
    score: purchase.score,
    paymentStatus: purchase.payment_status,
  });

  return {
    contactId: contact?.id || null,
    dealId: deal?.id || null,
  };
}

export async function syncHubSpotReport(report = {}) {
  if (!hubSpotConfigured()) return { skipped: true, reason: "HubSpot is not configured." };

  await ensureHubSpotProperties();

  const email = safeString(report.email);
  const phone = safeString(report.phone);
  const contact = email ? await upsertContact({ email, phone, companyName: report.company }) : null;
  const deal = await createDeal({
    email,
    phone,
    amount: report.amount,
    website: report.website,
    market: report.market,
    checkoutReference: report.checkout_reference || report.checkoutReference,
    score: report.score,
    paymentStatus: report.payment_status || report.paymentStatus,
  });

  return {
    contactId: contact?.id || null,
    dealId: deal?.id || null,
  };
}

async function ensureHubSpotProperties() {
  for (const [objectType, properties] of Object.entries(customProperties)) {
    for (const property of properties) {
      await ensureHubSpotProperty(objectType, property);
    }
  }
}

async function ensureHubSpotProperty(objectType, property) {
  const existing = await hubSpotFetch(`/crm/v3/properties/${objectType}/${property.name}`, {
    method: "GET",
    allowNotFound: true,
  });
  if (existing) return existing;

  return hubSpotFetch(`/crm/v3/properties/${objectType}`, {
    method: "POST",
    body: {
      ...property,
      description: "Synced from Builder Rank.",
    },
  });
}

async function upsertContact(profile) {
  const email = safeString(profile.email).toLowerCase();
  if (!email) return null;

  const existing = await findObjectByProperty("contacts", "email", email, [
    "email",
    "firstname",
    "lastname",
    "phone",
  ]);
  const properties = stripEmpty({
    email,
    firstname: profile.firstName,
    lastname: profile.lastName,
    phone: profile.phone,
    company: profile.companyName,
    builder_rank_trade: profile.trade,
    builder_rank_company_size: profile.companySize,
  });

  if (existing?.id) {
    return hubSpotFetch(`/crm/v3/objects/contacts/${existing.id}`, {
      method: "PATCH",
      body: { properties },
    });
  }

  return hubSpotFetch("/crm/v3/objects/contacts", {
    method: "POST",
    body: { properties },
  });
}

async function upsertCompany(company) {
  const name = safeString(company.name);
  if (!name) return null;

  const existing = await findObjectByProperty("companies", "name", name, ["name", "phone"]);
  const properties = stripEmpty({
    name,
    phone: company.phone,
  });

  if (existing?.id) {
    return hubSpotFetch(`/crm/v3/objects/companies/${existing.id}`, {
      method: "PATCH",
      body: { properties },
    });
  }

  return hubSpotFetch("/crm/v3/objects/companies", {
    method: "POST",
    body: { properties },
  });
}

async function createDeal(purchase) {
  const checkoutReference = safeString(purchase.checkoutReference);
  const properties = stripEmpty({
    dealname: `Builder Rank Report${purchase.email ? ` - ${purchase.email}` : ""}`,
    amount: purchase.amount,
    pipeline: "default",
    dealstage: "appointmentscheduled",
    builder_rank_website: purchase.website,
    builder_rank_market: purchase.market,
    builder_rank_checkout_reference: checkoutReference,
    builder_rank_score: purchase.score,
    description: purchase.paymentStatus ? `Stripe payment status: ${purchase.paymentStatus}` : "",
  });

  if (checkoutReference) {
    const existing = await findObjectByProperty("deals", "builder_rank_checkout_reference", checkoutReference, [
      "dealname",
      "builder_rank_checkout_reference",
    ]);
    if (existing?.id) {
      return hubSpotFetch(`/crm/v3/objects/deals/${existing.id}`, {
        method: "PATCH",
        body: { properties },
      });
    }
  }

  return hubSpotFetch("/crm/v3/objects/deals", {
    method: "POST",
    body: { properties },
  });
}

async function findObjectByProperty(objectType, propertyName, value, properties = []) {
  if (!value) return null;

  const result = await hubSpotFetch(`/crm/v3/objects/${objectType}/search`, {
    method: "POST",
    body: {
      filterGroups: [
        {
          filters: [
            {
              propertyName,
              operator: "EQ",
              value,
            },
          ],
        },
      ],
      properties,
      limit: 1,
    },
  });

  return result?.results?.[0] || null;
}

async function hubSpotFetch(path, options = {}) {
  if (!HUBSPOT_TOKEN) {
    throw Object.assign(new Error("HubSpot access token is not configured."), { statusCode: 503 });
  }

  const response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "content-type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (response.status === 404 && options.allowNotFound) return null;

  if (!response.ok) {
    const message = data?.message || data?.error || `HubSpot request failed: ${response.status}`;
    throw Object.assign(new Error(message), { statusCode: response.status, details: data });
  }

  return data;
}

function stripEmpty(properties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ""),
  );
}
