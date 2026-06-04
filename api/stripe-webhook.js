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

    await insertSupabaseRow("purchases", purchase);
    const hubSpot = await syncHubSpotPurchase(purchase);
    sendJson(response, 200, { received: true, hubSpot });
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
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  if (!constantTimeEqual(computed, expectedSignature)) {
    throw new Error("Invalid Stripe signature.");
  }
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
