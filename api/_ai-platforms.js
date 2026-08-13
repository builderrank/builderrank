const TIMEOUT_MS = Math.max(5_000, Math.min(Number(process.env.AI_RECHECK_TIMEOUT_MS) || 35_000, 50_000));

export const PLATFORM_CONFIG = {
  chatgpt: { label: "ChatGPT", model: process.env.OPENAI_MODEL || "gpt-5.2", key: process.env.OPENAI_API_KEY },
  gemini: { label: "Gemini", model: process.env.GEMINI_MODEL || "gemini-2.5-flash", key: process.env.GEMINI_API_KEY },
  claude: { label: "Claude", model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6", key: process.env.ANTHROPIC_API_KEY },
  meta: { label: "Meta AI", model: process.env.META_MODEL || "", key: process.env.META_MODEL_API_KEY, baseUrl: String(process.env.META_MODEL_API_BASE_URL || "").replace(/\/+$/, "") },
};

export async function runPlatformPrompt(platform, { prompt, business }) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) throw new Error(`Unsupported AI platform: ${platform}`);
  if (!config.key || (platform === "meta" && (!config.baseUrl || !config.model))) throw new Error(`${config.label} monitoring connection is not configured.`);
  const system = "Answer the homeowner's local-service question naturally. Use web-grounded evidence when the platform supports it. Do not favor the named customer and do not invent citations.";
  const input = `${prompt.prompt_text}\nLocation: ${business.market || "not specified"}`;
  let raw;
  let answer;
  if (platform === "chatgpt") {
    raw = await requestJson("https://api.openai.com/v1/responses", {
      headers: { authorization: `Bearer ${config.key}` },
      body: { model: config.model, instructions: system, input, max_output_tokens: 900 },
    }, "ChatGPT");
    answer = raw.output_text || extractOpenAIText(raw);
  } else if (platform === "claude") {
    raw = await requestJson("https://api.anthropic.com/v1/messages", {
      headers: { "x-api-key": config.key, "anthropic-version": "2023-06-01" },
      body: { model: config.model, max_tokens: 900, system, messages: [{ role: "user", content: input }] },
    }, "Claude");
    answer = (raw.content || []).map((part) => part.text || "").join("\n");
  } else if (platform === "gemini") {
    raw = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
      headers: { "x-goog-api-key": config.key },
      body: { system_instruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: input }] }], generationConfig: { maxOutputTokens: 900 } },
    }, "Gemini");
    answer = raw.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
  } else {
    raw = await requestJson(`${config.baseUrl}/chat/completions`, {
      headers: { authorization: `Bearer ${config.key}` },
      body: { model: config.model, messages: [{ role: "system", content: system }, { role: "user", content: input }], temperature: 0.2, ...(String(process.env.META_MODEL_WEB_SEARCH_ENABLED || "false").toLowerCase() === "true" ? { tools: [{ type: "web_search" }] } : {}) },
    }, "Meta AI");
    answer = raw.choices?.[0]?.message?.content || raw.output_text || "";
  }
  if (!String(answer || "").trim()) throw new Error(`${config.label} returned an empty response.`);
  return analyzeAnswer(String(answer), business, config, raw);
}

async function requestJson(url, { headers = {}, body }, label) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`${label} returned an unreadable response.`); }
  if (!response.ok) throw new Error(data?.error?.message || `${label} returned ${response.status}.`);
  return data;
}

function analyzeAnswer(answer, business, config, raw) {
  const normalizedAnswer = normalize(answer);
  const candidates = [business.name, new URL(business.website_url || "https://invalid.local").hostname.replace(/^www\./, "")].filter(Boolean);
  const mentioned = candidates.some((candidate) => normalizedAnswer.includes(normalize(candidate)));
  const urls = [...new Set(answer.match(/https?:\/\/[^\s)\]}>"']+/gi) || [])].slice(0, 12);
  return {
    model: config.model,
    answerText: answer,
    mentioned,
    rankPosition: mentioned ? estimateRank(answer, business.name) : null,
    confidence: 80,
    sentiment: mentioned ? "neutral" : null,
    mentionText: mentioned ? `${business.name} appeared in this API benchmark response.` : `${business.name} did not appear in this API benchmark response.`,
    sources: urls.map((url) => ({ domain: safeDomain(url), url, type: "model_citation", cited: true })).filter((row) => row.domain),
    rawResponse: raw,
  };
}
function estimateRank(answer, name) { const before = answer.slice(0, Math.max(0, normalize(answer).indexOf(normalize(name)))); const numbered = before.match(/(?:^|\n)\s*\d+[.)]/g); return numbered?.length ? numbered.length + 1 : 1; }
function extractOpenAIText(data) { return (data.output || []).flatMap((item) => item.content || []).map((item) => item.text || "").join("\n"); }
function safeDomain(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } }
function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
