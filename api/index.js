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
import runMetaBenchmarkHandler from "./run-meta-benchmark.js";
import launchReadinessHandler from "./launch-readiness.js";
import notFoundHandler from "./not-found.js";
import paymentConfigHandler from "./payment-config.js";
import paymentStatusHandler from "./payment-status.js";
import reportEligibilityHandler from "./report-eligibility.js";
import stripeWebhookHandler from "./stripe-webhook.js";
import supabaseKeepaliveHandler from "./supabase-keepalive.js";
import trackHandler from "./track.js";
import trackingHealthHandler from "./tracking-health.js";
import updateRecommendationHandler from "./update-recommendation.js";
import targetTermsHandler from "./target-terms.js";

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
  ["/api/run-meta-benchmark", runMetaBenchmarkHandler],
  ["/api/launch-readiness", launchReadinessHandler],
  ["/api/payment-config", paymentConfigHandler],
  ["/api/payment-status", paymentStatusHandler],
  ["/api/report-eligibility", reportEligibilityHandler],
  ["/api/stripe-webhook", stripeWebhookHandler],
  ["/api/supabase-keepalive", supabaseKeepaliveHandler],
  ["/api/track", trackHandler],
  ["/api/tracking-health", trackingHealthHandler],
  ["/api/update-recommendation", updateRecommendationHandler],
  ["/api/target-terms", targetTermsHandler],
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
