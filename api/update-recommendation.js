import {
  extractBearerToken,
  getSupabaseUser,
  readJsonBody,
  selectSupabaseRows,
  supabaseServiceConfigured,
  updateSupabaseRows,
} from "./_shared.js";
import { recordActivity } from "./_activity.js";

const allowedStatuses = new Set(["open", "in_progress", "complete"]);

export default async function handler(request, response) {
  if (request.method !== "PATCH" && request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!supabaseServiceConfigured()) {
    response.status(503).json({ error: "Supabase service role is not configured." });
    return;
  }

  const user = await getSupabaseUser(extractBearerToken(request));
  if (!user?.id) {
    response.status(401).json({ error: "Sign in before updating the Punch List." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const recommendationId = safeTrim(body.recommendationId || body.id);
    const status = normalizeStatus(body.status);

    if (!recommendationId) {
      response.status(400).json({ error: "recommendationId is required." });
      return;
    }

    const recommendationRows = await selectSupabaseRows("br_recommendations", {
      select: "id,business_id,priority,title,body,status,source,created_at,completed_at",
      id: `eq.${recommendationId}`,
      limit: "1",
    });
    const recommendation = recommendationRows[0];

    if (!recommendation?.id) {
      response.status(404).json({ error: "Punch List recommendation was not found." });
      return;
    }

    const businessRows = await selectSupabaseRows("br_businesses", {
      select: "id,owner_user_id",
      id: `eq.${recommendation.business_id}`,
      limit: "1",
    });
    const business = businessRows[0];

    if (!business?.id || business.owner_user_id !== user.id) {
      response.status(403).json({ error: "This Punch List item does not belong to the signed-in account." });
      return;
    }

    const payload = {
      status,
      completed_at: status === "complete" ? new Date().toISOString() : null,
    };
    const rows = await updateSupabaseRows("br_recommendations", { id: `eq.${recommendation.id}` }, payload);
    await recordActivity({ businessId: business.id, userId: user.id, eventType: "recommendation_status_changed", eventLabel: `${recommendation.title}: ${recommendation.status} → ${status}`, entityType: "recommendation", entityId: recommendation.id, metadata: { previousStatus: recommendation.status, status, title: recommendation.title } });

    response.status(200).json({
      ok: true,
      recommendation: rows[0] || { ...recommendation, ...payload },
    });
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: "Could not update Punch List recommendation.",
      detail: error.message,
    });
  }
}

function normalizeStatus(value) {
  const status = safeTrim(value).toLowerCase().replace(/-/g, "_");
  if (allowedStatuses.has(status)) return status;
  throw Object.assign(new Error("status must be open, in_progress, or complete."), { statusCode: 400 });
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}
