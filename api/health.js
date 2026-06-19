export default function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  response.status(200).json({
    ok: true,
    service: "builder-rank",
    checkedAt: new Date().toISOString(),
  });
}
