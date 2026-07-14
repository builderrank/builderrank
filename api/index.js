import adminWorkspacesHandler from "./admin-workspaces.js";
import auditHandler from "./audit.js";
import betaIntakeHandler from "./beta-intake.js";
import bootstrapWorkspaceHandler from "./bootstrap-workspace.js";
import connectSiteHandler from "./connect-site.js";
import dashboardDataHandler from "./dashboard-data.js";
import emailReportHandler from "./email-report.js";
import healthHandler from "./health.js";
import hubspotAccountHandler from "./hubspot-account.js";
import hubspotReportHandler from "./hubspot-report.js";
import importAiVisibilityHandler from "./import-ai-visibility.js";
import notFoundHandler from "./not-found.js";
import paymentStatusHandler from "./payment-status.js";
import stripeWebhookHandler from "./stripe-webhook.js";
import trackHandler from "./track.js";
import trackingHealthHandler from "./tracking-health.js";
import updateRecommendationHandler from "./update-recommendation.js";

const handlers = new Map([
  ["/api/admin-workspaces", adminWorkspacesHandler],
  ["/api/audit", auditHandler],
  ["/api/beta-intake", betaIntakeHandler],
  ["/api/bootstrap-workspace", bootstrapWorkspaceHandler],
  ["/api/connect-site", connectSiteHandler],
  ["/api/dashboard-data", dashboardDataHandler],
  ["/api/email-report", emailReportHandler],
  ["/api/health", healthHandler],
  ["/api/hubspot-account", hubspotAccountHandler],
  ["/api/hubspot-report", hubspotReportHandler],
  ["/api/import-ai-visibility", importAiVisibilityHandler],
  ["/api/payment-status", paymentStatusHandler],
  ["/api/stripe-webhook", stripeWebhookHandler],
  ["/api/track", trackHandler],
  ["/api/tracking-health", trackingHealthHandler],
  ["/api/update-recommendation", updateRecommendationHandler],
]);

export default async function handler(request, response) {
  const pathname = apiPathname(request);
  const routeHandler = handlers.get(pathname) || notFoundHandler;
  await routeHandler(request, response);
}

function apiPathname(request) {
  const url = new URL(request.url || "/", "https://builderrank.io");
  const routedPath = url.searchParams.get("path");
  if (routedPath) return `/api/${routedPath.replace(/^\/+/, "")}`.replace(/\/+$/, "");
  return url.pathname.replace(/\/+$/, "") || "/api";
}
