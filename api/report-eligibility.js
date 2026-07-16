import {
  extractBearerToken,
  getSupabaseUser,
  requireSupabaseServiceRole,
  safeString,
  selectSupabaseRows,
  sendJson,
} from "./_shared.js";

const ADDITIONAL_REPORT_PRICE_CENTS = 1000;

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before checking report eligibility." });
      return;
    }

    const usage = await getReportUsage(user.email);
    sendJson(response, 200, {
      ok: true,
      email: safeString(user.email).toLowerCase(),
      eligible: usage.count === 0,
      requiresPayment: usage.count > 0,
      used: usage.count,
      limit: 1,
      additionalReportPrice: 10,
      additionalReportPriceCents: ADDITIONAL_REPORT_PRICE_CENTS,
      latestReportAt: usage.latestReportAt,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Could not check report eligibility",
      detail: error.message,
    });
  }
}

export async function assertFreeReportEligible(email) {
  const usage = await getReportUsage(email);
  if (usage.count > 0) {
    throw Object.assign(new Error("This email has already generated its free Builder Rank report. Contact Support@builderrank.io if you need another report for a different location or business."), {
      statusCode: 409,
      usage,
    });
  }
  return usage;
}

export async function assertReportRunAllowed({ email, checkoutReference = "" } = {}) {
  const usage = await getReportUsage(email);
  if (usage.count === 0) {
    return {
      allowed: true,
      mode: "free",
      usage,
    };
  }

  const purchase = await getPaidReportCredit({ checkoutReference, email });
  return {
    allowed: true,
    mode: "paid",
    usage,
    purchase,
  };
}

export async function getReportUsage(email) {
  const normalizedEmail = safeString(email).toLowerCase();
  if (!normalizedEmail) {
    throw Object.assign(new Error("A valid account email is required."), { statusCode: 400 });
  }

  const reports = await selectSupabaseRows("reports", {
    select: "id,created_at",
    email: `ilike.${normalizedEmail}`,
    order: "created_at.desc",
    limit: "5",
  });

  return {
    count: reports.length,
    latestReportAt: reports[0]?.created_at || "",
  };
}

async function getPaidReportCredit({ checkoutReference, email }) {
  const normalizedReference = safeString(checkoutReference);
  const normalizedEmail = safeString(email).toLowerCase();
  if (!normalizedReference) {
    throw Object.assign(new Error("You have already used your free report. Additional reports are $10 each."), {
      statusCode: 402,
      requiresPayment: true,
    });
  }

  const purchases = await selectSupabaseRows("purchases", {
    select: "id,customer_email,amount_total,payment_status,created_at",
    checkout_reference: `eq.${normalizedReference}`,
    limit: "1",
  });
  const purchase = purchases[0];

  if (!purchase) {
    throw Object.assign(new Error("Your $10 report credit is still processing. Wait a few seconds, then try again."), {
      statusCode: 402,
      pending: true,
      requiresPayment: true,
    });
  }

  const purchaseEmail = safeString(purchase.customer_email).toLowerCase();
  if (purchaseEmail && purchaseEmail !== normalizedEmail) {
    throw Object.assign(new Error("This report credit is tied to a different email address."), { statusCode: 403 });
  }

  const status = String(purchase.payment_status || "").toLowerCase();
  if (status !== "paid") {
    throw Object.assign(new Error("Stripe has not marked this $10 report credit as paid yet."), {
      statusCode: 402,
      requiresPayment: true,
    });
  }

  const amountTotal = Number(purchase.amount_total || 0);
  if (amountTotal < ADDITIONAL_REPORT_PRICE_CENTS) {
    throw Object.assign(new Error("This payment is below the $10 additional report credit amount."), {
      statusCode: 402,
      requiresPayment: true,
    });
  }

  return purchase;
}
