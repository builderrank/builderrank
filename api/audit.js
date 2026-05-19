import { runAudit } from "../server.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const audit = await runAudit(request.body?.website, request.body?.market);
    response.status(200).json(audit);
  } catch (error) {
    response.status(500).json({
      error: "Audit failed",
      detail: error.message,
    });
  }
}
