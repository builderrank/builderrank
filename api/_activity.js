import { insertSupabaseRow } from "./_shared.js";

export async function recordActivity({ businessId = null, userId = null, eventType, eventLabel = "", entityType = "", entityId = "", metadata = {}, dedupeKey = null }) {
  try {
    await insertSupabaseRow("br_activity_events", {
      business_id: businessId,
      user_id: userId,
      event_type: eventType,
      event_label: eventLabel || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata,
      dedupe_key: dedupeKey,
    });
  } catch (error) {
    if (!dedupeKey || !String(error.message).toLowerCase().includes("duplicate")) console.warn("Activity event could not be recorded", error.message);
  }
}

export function dashboardSessionKey(businessId, userId, date = new Date()) {
  const bucket = Math.floor(date.getTime() / (15 * 60 * 1000));
  return `dashboard:${businessId}:${userId}:${bucket}`;
}
