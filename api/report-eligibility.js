import {
  extractBearerToken,
  getSupabaseUser,
  requireSupabaseServiceRole,
  safeString,
  selectSupabaseRows,
  sendJson,
} from "./_shared.js";

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    requireSupabaseServiceRole();
    const user = await getSupabaseUser(extractBearerToken(request));
    if (!user?.email) {
      sendJson(response, 401, { error: "Log in before checking report eligibility." });
      return;
    }

    const usage = await getFreeReportUsage(user.email);
    sendJson(response, 200, {
      ok: true,
      email: safeString(user.email).toLowerCase(),
      eligible: usage.count === 0,
      used: usage.count,
      limit: 1,
      latestReportAt: usage.latestReportAt,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: "Could not check report eligibility",
      detail: error.message,
    });
  }
}

export async function assertFreeReportEligible(email) {
  const usage = await getFreeReportUsage(email);
  if (usage.count > 0) {
    throw Object.assign(new Error("This email has already generated its free Builder Rank report. Contact Support@builderrank.io if you need another report for a different location or business."), {
      statusCode: 409,
      usage,
    });
  }
  return usage;
}

export async function getFreeReportUsage(email) {
  const normalizedEmail = safeString(email).toLowerCase();
  if (!normalizedEmail) {
    throw Object.assign(new Error("A valid account email is required."), { statusCode: 400 });
  }

  const reports = await selectSupabaseRows("reports", {
    select: "id,created_at",
    email: `ilike.${normalizedEmail}`,
    order: "created_at.desc",
    limit: "5",
  });

  return {
    count: reports.length,
    latestReportAt: reports[0]?.created_at || "",
  };
}
