import { insertSupabaseRow, updateSupabaseRows } from "./_shared.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const OPERATOR_EMAIL_TO = process.env.OPERATOR_EMAIL_TO || "kaleb@builderrank.io";
const REPORT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || "Builder Rank <support@builderrank.io>";
const REPORT_EMAIL_REPLY_TO = process.env.REPORT_EMAIL_REPLY_TO || "support@builderrank.io";

export async function sendOperatorNotification({ type, dedupeKey, subject, heading, fields = [], businessId = null, userId = null }) {
  if (!RESEND_API_KEY || !OPERATOR_EMAIL_TO) return { sent: false, reason: "Operator email is not configured." };
  let event;
  try {
    event = (await insertSupabaseRow("br_activity_events", {
      business_id: businessId,
      user_id: userId,
      event_type: `operator_email_${type}`,
      event_label: subject,
      entity_type: "operator_notification",
      entity_id: dedupeKey,
      dedupe_key: `operator-email:${dedupeKey}`,
      metadata: { status: "sending", recipient: OPERATOR_EMAIL_TO },
    }))[0];
  } catch (error) {
    if (String(error.message).toLowerCase().includes("duplicate")) return { sent: false, duplicate: true };
    throw error;
  }

  const rows = fields.filter((row) => row?.label && row?.value != null && String(row.value).trim());
  const htmlRows = rows.map((row) => `<tr><td style="padding:7px 12px 7px 0;color:#667085;vertical-align:top">${escapeHtml(row.label)}</td><td style="padding:7px 0;font-weight:600">${escapeHtml(row.value)}</td></tr>`).join("");
  const textRows = rows.map((row) => `${row.label}: ${row.value}`).join("\n");
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: REPORT_EMAIL_FROM,
      to: [OPERATOR_EMAIL_TO],
      reply_to: REPORT_EMAIL_REPLY_TO,
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:680px"><div style="height:5px;background:#ff6a1a"></div><h1>${escapeHtml(heading)}</h1><table style="border-collapse:collapse">${htmlRows}</table><p style="margin-top:24px"><a href="https://builderrank.io/admin-beta">Open private Builder Rank admin</a></p></div>`,
      text: `${heading}\n\n${textRows}\n\nPrivate admin: https://builderrank.io/admin-beta`,
    }),
  });
  const data = await resendResponse.json().catch(() => ({}));
  const sent = resendResponse.ok;
  if (event?.id) await updateSupabaseRows("br_activity_events", { id: `eq.${event.id}` }, { metadata: { status: sent ? "sent" : "failed", recipient: OPERATOR_EMAIL_TO, resendId: data.id || null, error: sent ? null : data.message || "Resend request failed" } });
  if (!sent) throw new Error(data.message || "Could not send operator notification.");
  return { sent: true, id: data.id };
}

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
