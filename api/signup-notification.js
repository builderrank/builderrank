import { readJsonBody, safeString, supabaseServiceConfigured } from "./_shared.js";
import { sendOperatorNotification } from "./_operator-notifications.js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hosepwwflfpqgemfcafj.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  if (!supabaseServiceConfigured()) return response.status(503).json({ error: "Signup notifications are not configured." });
  try {
    const body = await readJsonBody(request);
    const userId = safeString(body.userId);
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return response.status(400).json({ error: "A valid signup user is required." });
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` } });
    const user = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || !user?.id || user.id !== userId) return response.status(404).json({ error: "Verified signup was not found." });
    const profile = user.user_metadata || {};
    const notification = await sendOperatorNotification({
      type: "signup",
      dedupeKey: `signup:${user.id}`,
      subject: `New Builder Rank signup: ${user.email || "customer"}`,
      heading: "A new customer created a Builder Rank account",
      userId: user.id,
      fields: [
        { label: "Email", value: user.email },
        { label: "Name", value: [profile.first_name, profile.last_name].filter(Boolean).join(" ") },
        { label: "Company", value: profile.company || profile.company_name },
        { label: "Trade", value: profile.trade || profile.primary_trade },
        { label: "Phone", value: profile.phone },
        { label: "Signed up", value: user.created_at },
      ],
    });
    return response.status(200).json({ ok: true, notification: { sent: notification.sent, duplicate: notification.duplicate || false } });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ error: "Could not process signup notification.", detail: error.message });
  }
}
