import { createHmac, timingSafeEqual } from "node:crypto";
import { insertSupabaseRow, readRawBody, safeString, sendJson } from "./_shared.js";
import { syncHubSpotPurchase } from "./_hubspot.js";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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
    const rawBody = await readRawBody(request);
    if (STRIPE_WEBHOOK_SECRET) {
      const signature = request.headers["stripe-signature"];
      await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    }

    const event = JSON.parse(rawBody);
    if (event.type !== "checkout.session.completed") {
      sendJson(response, 200, { received: true, ignored: true });
      return;
    }

    const session = event.data?.object || {};
    const purchase = {
      stripe_event_id: event.id,
      stripe_session_id: session.id,
      checkout_reference: safeString(session.client_reference_id),
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

    let hubSpot = null;
    try {
      hubSpot = await syncHubSpotPurchase(purchase);
    } catch (error) {
      hubSpot = {
        skipped: true,
        reason: "HubSpot sync failed after Stripe purchase receipt was accepted.",
        detail: error.message,
      };
    }

    sendJson(response, 200, { received: true, duplicate, hubSpot });
  } catch (error) {
    sendJson(response, error.statusCode || 400, {
      error: "Stripe webhook failed",
      detail: error.message,
    });
  }
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
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

  const payload = `${timestamp}.${rawBody}`;
  const computed = createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  if (!constantTimeEqual(computed, expectedSignature)) {
    throw new Error("Invalid Stripe signature.");
  }
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
