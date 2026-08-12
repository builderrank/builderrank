import { isAdminRequestAuthorized, readJsonBody, selectSupabaseRows, supabaseServiceConfigured } from "./_shared.js";
import { importVisibilityBatch } from "./import-ai-visibility.js";

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";
const META_MODEL_API_KEY = process.env.META_MODEL_API_KEY || "";
const META_MODEL_API_BASE_URL = String(process.env.META_MODEL_API_BASE_URL || "").replace(/\/+$/, "");
const META_MODEL = process.env.META_MODEL || "";
const META_MODEL_TIMEOUT_MS = Math.max(5_000, Math.min(Number(process.env.META_MODEL_TIMEOUT_MS) || 45_000, 120_000));
const META_BENCHMARK_MAX_RUNS = Math.max(1, Math.min(Number(process.env.META_BENCHMARK_MAX_RUNS) || 5, 10));
const META_MODEL_WEB_SEARCH_ENABLED = String(process.env.META_MODEL_WEB_SEARCH_ENABLED || "false").toLowerCase() === "true";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  if (!ADMIN_API_TOKEN || !isAdminRequestAuthorized(request, ADMIN_API_TOKEN)) return response.status(401).json({ error: "Admin token required." });
  if (!supabaseServiceConfigured()) return response.status(503).json({ error: "Supabase service role is not configured." });
  if (!META_MODEL_API_KEY || !META_MODEL_API_BASE_URL || !META_MODEL) {
    return response.status(503).json({ error: "Meta Model API is not configured.", missing: [!META_MODEL_API_KEY && "META_MODEL_API_KEY", !META_MODEL_API_BASE_URL && "META_MODEL_API_BASE_URL", !META_MODEL && "META_MODEL"].filter(Boolean) });
  }

  try {
    const body = await readJsonBody(request);
    const siteId = String(body.siteId || "").trim();
    if (!/^br_[a-z0-9_/-]{3,80}$/i.test(siteId)) throw Object.assign(new Error("A valid siteId is required."), { statusCode: 400 });
    const business = (await selectSupabaseRows("br_businesses", { select: "id,name,website_url,market,primary_trade,site_id", site_id: `eq.${siteId}`, limit: "1" }))[0];
    if (!business) throw Object.assign(new Error("Builder Rank workspace not found."), { statusCode: 404 });
    const promptRows = Array.isArray(body.prompts) && body.prompts.length
      ? body.prompts.map((prompt) => ({ prompt_text: String(prompt.text || prompt), intent: String(prompt.intent || "discovery"), persona: String(prompt.persona || "Homeowner ready to hire"), jobType: String(prompt.jobType || business.primary_trade || "") }))
      : await selectSupabaseRows("br_prompts", { select: "prompt_text,intent,persona,job_type_id", business_id: `eq.${business.id}`, active: "eq.true", limit: "30" });
    if (!promptRows.length) throw Object.assign(new Error("No active prompts are configured for this workspace."), { statusCode: 400 });

    const selectedPrompts = promptRows.slice(0, Math.min(Number(body.limit) || META_BENCHMARK_MAX_RUNS, META_BENCHMARK_MAX_RUNS));
    const settled = await Promise.allSettled(selectedPrompts.map(async (prompt) => {
      const result = await runMetaPrompt({ business, prompt });
      return {
        prompt: prompt.prompt_text,
        jobType: prompt.jobType || business.primary_trade || "",
        persona: prompt.persona || "Homeowner ready to hire",
        intent: prompt.intent || "discovery",
        platform: "Meta AI",
        model: META_MODEL,
        measurementMode: "api_benchmark",
        consumerSurface: "Meta Model API",
        mentioned: result.mentioned,
        rankPosition: result.rankPosition,
        confidence: result.confidence,
        sentiment: result.sentiment,
        mentionText: result.description,
        serviceAccuracy: result.serviceAccuracy,
        geoAccuracy: result.geoAccuracy,
        answerText: result.answerText,
        rawResponse: result.rawResponse,
        sources: result.sources,
        runAt: new Date().toISOString(),
      };
    }));
    const runs = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const failures = settled.map((result, index) => result.status === "rejected" ? {
      prompt: selectedPrompts[index]?.prompt_text || "Meta AI prompt",
      error: result.reason?.message || "Meta benchmark request failed.",
    } : null).filter(Boolean);
    if (!runs.length) throw Object.assign(new Error(failures[0]?.error || "Every Meta benchmark request failed."), { statusCode: 502 });

    const imported = await importVisibilityBatch({ siteId, runs });
    return response.status(200).json({ ok: true, provider: "Meta Model API", model: META_MODEL, requestedRuns: selectedPrompts.length, failedRuns: failures.length, failures, ...imported });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ error: "Could not run Meta AI benchmark.", detail: error.message });
  }
}

async function runMetaPrompt({ business, prompt }) {
  const modelResponse = await fetch(`${META_MODEL_API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${META_MODEL_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: META_MODEL,
      messages: [
        { role: "system", content: "Act as Meta AI answering a local homeowner discovery question using web-grounded evidence when available. Return strict JSON with keys answer, businesses (ordered array of names), sentiment, description, service_accuracy, geo_accuracy, sources (array of {domain,url,type,cited}). Do not invent citations." },
        { role: "user", content: `${prompt.prompt_text}\nLocation context: ${business.market || "not specified"}` },
      ],
      ...(META_MODEL_WEB_SEARCH_ENABLED ? { tools: [{ type: "web_search" }] } : {}),
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(META_MODEL_TIMEOUT_MS),
  });
  const text = await modelResponse.text();
  let raw;
  try { raw = text ? JSON.parse(text) : {}; } catch { raw = { text }; }
  if (!modelResponse.ok) throw Object.assign(new Error(raw?.error?.message || `Meta Model API returned ${modelResponse.status}.`), { statusCode: 502 });
  const content = raw?.choices?.[0]?.message?.content || raw?.output_text || raw?.response || "";
  const parsed = parseJsonContent(content);
  const businesses = Array.isArray(parsed.businesses) ? parsed.businesses.map(String) : [];
  const businessIndex = businesses.findIndex((name) => normalize(name).includes(normalize(business.name)) || normalize(business.name).includes(normalize(name)));
  return {
    mentioned: businessIndex >= 0 || normalize(content).includes(normalize(business.name)),
    rankPosition: businessIndex >= 0 ? businessIndex + 1 : null,
    confidence: Number(parsed.confidence) || 80,
    sentiment: String(parsed.sentiment || "neutral"),
    description: String(parsed.description || ""),
    serviceAccuracy: bounded(parsed.service_accuracy),
    geoAccuracy: bounded(parsed.geo_accuracy),
    answerText: String(parsed.answer || content),
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    rawResponse: raw,
  };
}

function parseJsonContent(value) {
  if (value && typeof value === "object") return value;
  const text = String(value || "").replace(/^```json\s*|\s*```$/g, "");
  try { return JSON.parse(text); } catch { return { answer: String(value || ""), businesses: [] }; }
}
function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function bounded(value) { const number = Number(value); return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : null; }
