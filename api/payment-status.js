import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  requireSupabaseServiceRole,
  safeString,
  selectSupabaseRows,
  sendJson,
} from "./_shared.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before checking payment status." });
      return;
    }

    const body = await readJsonBody(request);
    const checkoutReference = safeString(body.checkoutReference || body.checkout_reference);
    if (!checkoutReference) {
      sendJson(response, 400, { ok: false, paid: false, error: "Payment confirmation is missing." });
      return;
    }

    const purchases = await selectSupabaseRows("purchases", {
      select: "id,customer_email,payment_status,created_at",
      checkout_reference: `eq.${checkoutReference}`,
      limit: "1",
    });
    const purchase = purchases[0];

    if (!purchase) {
      sendJson(response, 202, {
        ok: true,
        paid: false,
        pending: true,
        reason: "Stripe payment confirmation is still processing.",
      });
      return;
    }

    const purchaseEmail = safeString(purchase.customer_email).toLowerCase();
    if (purchaseEmail && purchaseEmail !== safeString(user.email).toLowerCase()) {
      sendJson(response, 403, {
        ok: false,
        paid: false,
        error: "This payment is tied to a different email address.",
      });
      return;
    }

    const status = String(purchase.payment_status || "").toLowerCase();
    const paid = ["paid", "no_payment_required"].includes(status);
    sendJson(response, 200, {
      ok: true,
      paid,
      pending: false,
      paymentStatus: status || "unknown",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      ok: false,
      paid: false,
      error: "Could not check payment status.",
      detail: error.message,
    });
  }
}
