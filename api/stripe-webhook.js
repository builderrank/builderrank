import { createHmac, timingSafeEqual } from "node:crypto";
import { insertSupabaseRow, readRawBody, safeString, sendJson } from "./_shared.js";
import { syncHubSpotPurchase } from "./_hubspot.js";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const ADDITIONAL_REPORT_PRICE_CENTS = 1000;
const CHECKOUT_REFERENCE_PATTERN = /^br_[A-Za-z0-9_-]{16,117}$/;
const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw Object.assign(new Error("Stripe webhook verification is not configured."), { statusCode: 503 });
    }
    const rawBody = await readRawBody(request);
    const signature = request.headers["stripe-signature"];
    await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET);

    const event = JSON.parse(rawBody);
    if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      sendJson(response, 200, { received: true, ignored: true });
      return;
    }

    const session = event.data?.object || {};
    const validation = validateAdditionalReportPurchase(session);
    if (!validation.accepted) {
      sendJson(response, validation.pending ? 200 : 400, {
        received: true,
        ignored: Boolean(validation.pending),
        reason: validation.reason,
      });
      return;
    }
    const purchase = {
      stripe_event_id: event.id,
      stripe_session_id: session.id,
      checkout_reference: validation.checkoutReference,
      customer_email: safeString(session.customer_details?.email || session.customer_email),
      customer_phone: safeString(session.customer_details?.phone),
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      raw_event: event,
    };

    let duplicate = false;
    try {
      await insertSupabaseRow("purchases", purchase);
    } catch (error) {
      if (!isDuplicatePurchaseError(error)) throw error;
      duplicate = true;
    }

    let hubSpot = { skipped: true, reason: "Duplicate Stripe purchase already accepted." };
    if (!duplicate) {
      try {
        hubSpot = await syncHubSpotPurchase(purchase);
      } catch (error) {
        hubSpot = {
          skipped: true,
          reason: "HubSpot sync failed after Stripe purchase receipt was accepted.",
          detail: error.message,
        };
      }
    }

    sendJson(response, 200, { received: true, duplicate, hubSpot });
  } catch (error) {
    sendJson(response, error.statusCode || 400, {
      error: "Stripe webhook failed",
      detail: error.message,
    });
  }
}

export async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) throw new Error("Missing Stripe signature.");

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const expectedSignature = parts.v1;
  if (!timestamp || !expectedSignature) throw new Error("Invalid Stripe signature header.");
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
    throw new Error("Expired Stripe signature.");
  }

  const payload = `${timestamp}.${rawBody}`;
  const computed = createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  if (!constantTimeEqual(computed, expectedSignature)) {
    throw new Error("Invalid Stripe signature.");
  }
}

export function validateAdditionalReportPurchase(session = {}) {
  const checkoutReference = safeString(session.client_reference_id);
  if (session.object !== "checkout.session") {
    return { accepted: false, reason: "Stripe event does not contain a Checkout Session." };
  }
  if (!CHECKOUT_REFERENCE_PATTERN.test(checkoutReference)) {
    return { accepted: false, reason: "Checkout Session is missing a valid Builder Rank report reference." };
  }
  if (String(session.mode || "").toLowerCase() !== "payment") {
    return { accepted: false, reason: "Checkout Session is not a one-time payment." };
  }
  const paymentStatus = String(session.payment_status || "").toLowerCase();
  if (!["paid", "no_payment_required"].includes(paymentStatus)) {
    return { accepted: false, pending: true, reason: "Stripe payment has not completed yet." };
  }
  if (String(session.currency || "").toLowerCase() !== "usd") {
    return { accepted: false, reason: "Additional report payments must be in USD." };
  }
  if (Number(session.amount_total || 0) < ADDITIONAL_REPORT_PRICE_CENTS) {
    return { accepted: false, reason: "Checkout total is below the $10 additional report price." };
  }
  const customerEmail = safeString(session.customer_details?.email || session.customer_email).toLowerCase();
  if (!customerEmail || !customerEmail.includes("@")) {
    return { accepted: false, reason: "Checkout Session is missing the customer email." };
  }
  return { accepted: true, checkoutReference };
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isDuplicatePurchaseError(error) {
  const details = error.details || {};
  const message = `${error.message || ""} ${details.message || ""} ${details.code || ""}`;
  return /duplicate key|already exists|23505/i.test(message);
}
