import { sendJson } from "./_shared.js";

const DEFAULT_ADDITIONAL_REPORT_PAYMENT_URL = "https://buy.stripe.com/7sYbJ10Gd8TM9NqcVa8bS01";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  sendJson(response, 200, {
    ok: true,
    additionalReportPaymentUrl: process.env.STRIPE_ADDITIONAL_REPORT_PAYMENT_URL || DEFAULT_ADDITIONAL_REPORT_PAYMENT_URL,
    additionalReportPrice: 10,
    additionalReportPriceCents: 1000,
  });
}
