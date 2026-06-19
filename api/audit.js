import { runAudit } from "../server.js";
import {
  extractBearerToken,
  getSupabaseUser,
  requireSupabaseServiceRole,
  safeString,
  selectSupabaseRows,
  sendJson,
} from "./_shared.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before running a report." });
      return;
    }

    const checkoutReference = safeString(request.body?.checkoutReference || request.body?.checkout_reference);
    await requirePaidCheckout(checkoutReference, user.email);

    const audit = await runAudit(request.body?.website, request.body?.market);
    sendJson(response, 200, audit);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Audit failed",
      detail: error.message,
    });
  }
}

async function requirePaidCheckout(checkoutReference, email) {
  if (!checkoutReference) {
    throw Object.assign(new Error("Payment confirmation is missing. Return from Stripe checkout before running the report."), {
      statusCode: 402,
    });
  }

  const purchases = await selectSupabaseRows("purchases", {
    select: "id,customer_email,payment_status",
    checkout_reference: `eq.${checkoutReference}`,
    limit: "1",
  });
  const purchase = purchases[0];

  if (!purchase) {
    throw Object.assign(new Error("Payment confirmation is still processing. Wait a few seconds, then try Generate Paid Report again."), {
      statusCode: 402,
    });
  }

  const paidStatuses = new Set(["paid", "no_payment_required"]);
  if (!paidStatuses.has(String(purchase.payment_status || "").toLowerCase())) {
    throw Object.assign(new Error("Stripe has not marked this checkout as paid yet."), { statusCode: 402 });
  }

  const purchaseEmail = safeString(purchase.customer_email).toLowerCase();
  if (purchaseEmail && purchaseEmail !== safeString(email).toLowerCase()) {
    throw Object.assign(new Error("This payment is tied to a different email address. Sign in with the checkout email."), {
      statusCode: 403,
    });
  }
}
