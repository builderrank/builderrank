import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import emailReportHandler from "./api/email-report.js";
import hubSpotAccountHandler from "./api/hubspot-account.js";
import stripeWebhookHandler from "./api/stripe-webhook.js";

loadEnvFile();

const PORT = Number(process.env.PORT || 4174);
const ROOT = process.cwd();
const MAX_PAGES = 6;
const FETCH_TIMEOUT_MS = 12000;
const MODEL_TIMEOUT_MS = 30000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/audit") {
      const body = await readJsonBody(request);
      const audit = await runAudit(body.website, body.market);
      sendJson(response, 200, audit);
      return;
    }

    if (url.pathname === "/api/email-report") {
      await callApiHandler(emailReportHandler, request, response);
      return;
    }

    if (url.pathname === "/api/hubspot-account") {
      await callApiHandler(hubSpotAccountHandler, request, response);
      return;
    }

    if (url.pathname === "/api/stripe-webhook") {
      await callApiHandler(stripeWebhookHandler, request, response);
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, service: "builder-rank", checkedAt: new Date().toISOString() });
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "API route not found" });
      return;
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, {
      error: "Audit failed",
      detail: error.message,
    });
  }
});

if (isDirectRun()) {
  server.listen(PORT, () => {
    console.log(`Builder Rank running at http://localhost:${PORT}`);
  });
}

export async function runAudit(website, market = "") {
  const startUrl = normalizeWebsiteUrl(website);
  const origin = new URL(startUrl).origin;
  let crawlError = "";
  let homepage;

  try {
    homepage = await fetchPage(startUrl);
  } catch (error) {
    crawlError = error.message;
    homepage = buildUnavailablePage(startUrl, crawlError);
  }

  const candidateLinks = crawlError ? [] : discoverInternalLinks(homepage.html, startUrl);
  const selectedLinks = selectUsefulLinks(candidateLinks);
  const pages = [homepage];

  for (const link of selectedLinks) {
    if (pages.length >= MAX_PAGES) break;

    try {
      pages.push(await fetchPage(link));
    } catch {
      // Some contractor sites block a page or two. Keep the audit moving.
    }
  }

  const llms = await fetchOptionalText(`${origin}/llms.txt`);
  const combinedHtml = pages.map((page) => page.html).join("\n");
  const combinedText = pages.map((page) => page.text).join("\n");
  const title = extractTitle(homepage.html);
  const company = inferCompanyName(title, startUrl);
  const signals = collectSignals({ combinedHtml, combinedText, homepage, llms, market, pages });
  const categories = buildCategories(signals);
  const heuristicScore = scoreAudit(categories);
  const fixes = buildFixes(signals);
  const modelAnalyses = await analyzeWithModels({
    company,
    website: startUrl,
    market,
    categories,
    fixes,
    evidence: {
      pagesCrawled: pages.map((page) => page.url),
      llmsTxtFound: Boolean(llms),
      wordsRead: wordCount(combinedText),
      title,
      crawlError,
    },
    text: combinedText,
  });
  const successfulModelAnalyses = modelAnalyses.filter((analysis) => analysis.status === "complete");
  const score = blendModelScore(heuristicScore, successfulModelAnalyses);

  return {
    company,
    website: startUrl,
    market,
    score,
    grade: gradeForScore(score),
    modelScores: buildModelScores(score, signals, modelAnalyses),
    modelAnalyses,
    categories,
    fixes,
    intents: buildIntents(market),
    summary: summaryForScore(score, market),
    evidence: {
      pagesCrawled: pages.map((page) => page.url),
      llmsTxtFound: Boolean(llms),
      wordsRead: wordCount(combinedText),
      title,
      crawlError,
    },
  };
}

async function analyzeWithModels(auditContext) {
  const providers = [
    {
      key: "chatgpt",
      label: "ChatGPT",
      model: OPENAI_MODEL,
      apiKey: usableApiKey(process.env.OPENAI_API_KEY),
      call: callOpenAI,
    },
    {
      key: "claude",
      label: "Claude",
      model: ANTHROPIC_MODEL,
      apiKey: usableApiKey(process.env.ANTHROPIC_API_KEY),
      call: callAnthropic,
    },
    {
      key: "gemini",
      label: "Gemini",
      model: GEMINI_MODEL,
      apiKey: usableApiKey(process.env.GEMINI_API_KEY),
      call: callGemini,
    },
  ];

  return Promise.all(
    providers.map(async (provider) => {
      if (!provider.apiKey) {
        return {
          provider: provider.key,
          label: provider.label,
          model: provider.model,
          status: "skipped",
          score: null,
          summary: `${provider.label} did not report on this run. Builder Rank will review the missing model response and follow up with the customer if additional context is needed.`,
          recommendations: [],
        };
      }

      try {
        const result = normalizeModelResult(await provider.call(provider, auditContext), provider.label);

        return {
          provider: provider.key,
          label: provider.label,
          model: provider.model,
          status: "complete",
          score: extractScore(result.score),
          summary: modelSummaryText(result, provider.label),
          recommendations: Array.isArray(result.recommendations)
            ? result.recommendations.map((item) => stringifyModelText(item).slice(0, 260)).slice(0, 4)
            : [],
        };
      } catch (error) {
        return {
          provider: provider.key,
          label: provider.label,
          model: provider.model,
          status: "error",
          score: null,
          summary: `${provider.label} did not report on this run. Builder Rank will review the model issue and follow up with the customer if additional context is needed.`,
          recommendations: [],
        };
      }
    }),
  );
}

async function callOpenAI(provider, auditContext) {
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${provider.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      instructions: modelSystemPrompt("ChatGPT"),
      input: modelUserPrompt(auditContext),
      max_output_tokens: 1000,
      text: {
        format: {
          type: "json_schema",
          name: "builder_rank_model_audit",
          strict: true,
          schema: modelJsonSchema(),
        },
      },
    }),
  });
  const data = await parseProviderResponse(response, "OpenAI");
  return parseJsonFromText(data.output_text || extractOpenAIText(data));
}

async function callAnthropic(provider, auditContext) {
  const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 900,
      system: modelSystemPrompt("Claude"),
      tools: [
        {
          name: "record_builder_rank_audit",
          description: "Record the Builder Rank model-specific website audit.",
          input_schema: modelJsonSchema(),
        },
      ],
      tool_choice: {
        type: "tool",
        name: "record_builder_rank_audit",
      },
      messages: [
        {
          role: "user",
          content: modelUserPrompt(auditContext),
        },
      ],
    }),
  });
  const data = await parseProviderResponse(response, "Anthropic");
  const toolUse = data.content?.find((item) => item.type === "tool_use" && item.name === "record_builder_rank_audit");

  if (toolUse?.input) {
    return toolUse.input;
  }

  return parseJsonFromText(data.content?.map((item) => item.text || "").join("\n") || "");
}

async function callGemini(provider, auditContext) {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": provider.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: modelSystemPrompt("Gemini") }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: modelUserPrompt(auditContext) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiResponseSchema(),
          maxOutputTokens: 900,
        },
      }),
    },
  );
  const data = await parseProviderResponse(response, "Gemini");
  return parseJsonFromText(data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "");
}

function modelSystemPrompt(providerName) {
  return `You are ${providerName} acting as Builder Rank, an LLM visibility auditor for general contractor websites. Grade whether an AI assistant could confidently understand, trust, cite, and recommend the contractor for local remodel and construction searches. Return only valid JSON matching the requested schema. Be specific, evidence-backed, and useful to a contractor owner.`;
}

function modelUserPrompt({ company, website, market, categories, fixes, evidence, text }) {
  const compactCategories = categories.map((category) => ({
    key: category.key,
    label: category.label,
    heuristicScore: category.score,
    checks: category.checks,
  }));

  return JSON.stringify(
    {
      task: "Score this contractor website for LLM readability and local AI-search visibility.",
      company,
      website,
      market,
      crawlerEvidence: evidence,
      heuristicCategoryScores: compactCategories,
      currentFixes: fixes,
      readableWebsiteText: text.slice(0, 16000),
      scoringInstructions:
        "Return a score from 0-100. Write a 2-3 sentence summary that names the strongest signal, the biggest gap, and how likely an AI assistant is to recommend this contractor. Each recommendation should be concrete and mention the exact page/content/signal to improve when possible. Reward clear entity details, contractor-specific services, service-area language, license/trust proof, answerable FAQ/cost/timeline content, reviews, project proof, schema, and llms.txt. Penalize vague, thin, unverified, or hard-to-crawl content.",
    },
    null,
    2,
  );
}

function modelJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      score: {
        type: "number",
        minimum: 0,
        maximum: 100,
      },
      summary: {
        type: "string",
        minLength: 140,
        maxLength: 700,
      },
      evidence: {
        type: "string",
        description: "One sentence naming the strongest website evidence used in the score.",
      },
      gap: {
        type: "string",
        description: "One sentence naming the biggest missing or weak signal.",
      },
      recommendations: {
        type: "array",
        items: {
          type: "string",
          minLength: 45,
          maxLength: 280,
        },
        minItems: 3,
        maxItems: 4,
      },
    },
    required: ["score", "summary", "evidence", "gap", "recommendations"],
  };
}

function geminiResponseSchema() {
  return {
    type: "object",
    properties: {
      score: {
        type: "number",
      },
      summary: {
        type: "string",
      },
      evidence: {
        type: "string",
      },
      gap: {
        type: "string",
      },
      recommendations: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["score", "summary", "evidence", "gap", "recommendations"],
  };
}

function blendModelScore(heuristicScore, modelAnalyses) {
  if (!modelAnalyses.length) return heuristicScore;

  const modelAverage = Math.round(
    modelAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / modelAnalyses.length,
  );

  return Math.round(heuristicScore * 0.55 + modelAverage * 0.45);
}

function buildModelScores(score, signals, modelAnalyses) {
  const fallback = {
    chatgpt: clamp(score + signals.directAnswersBonus - 1, 0, 100),
    claude: clamp(score + signals.cleanStructureBonus - 2, 0, 100),
    gemini: clamp(score + signals.localEntityBonus - 3, 0, 100),
  };

  for (const analysis of modelAnalyses) {
    if (analysis.status === "complete") {
      fallback[analysis.provider] = analysis.score;
    }
  }

  return fallback;
}

function collectSignals({ combinedHtml, combinedText, homepage, llms, market, pages }) {
  const lowerText = combinedText.toLowerCase();
  const lowerHtml = combinedHtml.toLowerCase();
  const jsonLdBlocks = [...combinedHtml.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const schemaText = jsonLdBlocks.map((match) => stripTags(match[1]).toLowerCase()).join("\n");
  const contractorSchema = /homeandconstructionbusiness|generalcontractor|localbusiness|roofingcontractor|plumber|electrician/.test(
    schemaText,
  );
  const phoneCount = (combinedText.match(/\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || []).length;
  const addressTerms = /\b(street|st\.|avenue|ave\.|road|rd\.|drive|dr\.|suite|ste\.|blvd|boulevard|co|tx|ca|fl|ny|az|wa)\b/i.test(
    combinedText,
  );
  const licenseVisible = /\b(license|licensed|lic\.?|registration|bonded|insured)\b/i.test(combinedText);
  const serviceTerms = countMatches(lowerText, [
    "kitchen remodel",
    "bathroom remodel",
    "basement",
    "home addition",
    "deck",
    "roof",
    "siding",
    "countertop",
    "cabinet",
    "permit",
    "design build",
    "general contractor",
    "renovation",
    "remodeling",
  ]);
  const localizedTerms = countLocalSignals(lowerText, market);
  const answerTerms = countMatches(lowerText, ["how much", "cost", "timeline", "permit", "faq", "process", "estimate"]);
  const projectProof = countMatches(lowerText, ["project", "portfolio", "gallery", "before", "after", "case study"]);
  const reviews = countMatches(lowerText, ["review", "testimonial", "customer", "client", "stars", "rating"]);
  const headings = (combinedHtml.match(/<h[1-3][^>]*>/gi) || []).length;
  const titlePresent = /<title[^>]*>[\s\S]{8,}<\/title>/i.test(homepage.html);
  const metaDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}["']/i.test(homepage.html);
  const crawlableText = wordCount(combinedText);
  const markdownLinks = /\.md\b|text\/markdown|markdown/i.test(combinedHtml);
  const robotsHints = /robots\.txt|sitemap\.xml|rel=["']canonical/i.test(lowerHtml);

  return {
    contractorSchema,
    jsonLdCount: jsonLdBlocks.length,
    phoneCount,
    addressTerms,
    licenseVisible,
    serviceTerms,
    localizedTerms,
    answerTerms,
    projectProof,
    reviews,
    headings,
    titlePresent,
    metaDescription,
    crawlableText,
    markdownLinks,
    robotsHints,
    llmsFound: Boolean(llms),
    pagesCrawled: pages.length,
    localEntityBonus: localizedTerms > 2 ? 3 : 0,
    directAnswersBonus: answerTerms > 3 ? 3 : 0,
    cleanStructureBonus: headings > 4 && crawlableText > 500 ? 3 : 0,
  };
}

function buildCategories(signals) {
  const entityScore =
    20 +
    points(signals.phoneCount > 0, 18) +
    points(signals.addressTerms, 15) +
    points(signals.licenseVisible, 17) +
    points(signals.contractorSchema, 22) +
    points(signals.localizedTerms > 1, 8);

  const semanticScore =
    18 +
    Math.min(signals.serviceTerms * 6, 30) +
    Math.min(signals.answerTerms * 5, 20) +
    Math.min(signals.localizedTerms * 5, 18) +
    points(signals.projectProof > 1, 14);

  const technicalScore =
    18 +
    points(signals.llmsFound, 24) +
    points(signals.titlePresent, 10) +
    points(signals.metaDescription, 12) +
    points(signals.headings > 4, 12) +
    points(signals.crawlableText > 500, 12) +
    points(signals.markdownLinks, 6) +
    points(signals.robotsHints, 6);

  const reputationScore =
    28 +
    Math.min(signals.reviews * 10, 24) +
    points(signals.projectProof > 1, 18) +
    points(signals.localizedTerms > 2, 14) +
    points(signals.serviceTerms > 4, 12);

  return [
    {
      key: "entity",
      label: "Entity Check",
      score: clamp(entityScore, 0, 100),
      description: "Can an LLM verify who this contractor is, where they work, and whether they are real?",
      checks: [
        check("Phone number found on crawled pages", signals.phoneCount > 0),
        check("Address or service-area signals found", signals.addressTerms || signals.localizedTerms > 1),
        check("Contractor license, bonded, or insured language found", signals.licenseVisible),
        check("LocalBusiness or contractor JSON-LD schema found", signals.contractorSchema),
      ],
    },
    {
      key: "semantic",
      label: "Semantic Authority",
      score: clamp(semanticScore, 0, 100),
      description: "Does the site answer the specific remodel questions homeowners ask AI tools?",
      checks: [
        check("Specific construction services are named", signals.serviceTerms >= 3),
        check("Localized market and service-area language appears", signals.localizedTerms >= 2),
        check("Cost, permit, timeline, or FAQ answers appear", signals.answerTerms >= 3),
        check("Project, gallery, or case-study proof appears", signals.projectProof >= 2),
      ],
    },
    {
      key: "technical",
      label: "AI-Friendliness",
      score: clamp(technicalScore, 0, 100),
      description: "Can AI crawlers read the site cleanly without guessing through messy HTML?",
      checks: [
        check("/llms.txt AI summary file exists", signals.llmsFound),
        check("Useful page title and meta description found", signals.titlePresent && signals.metaDescription),
        check("Clean heading hierarchy and crawlable text found", signals.headings > 4 && signals.crawlableText > 500),
        check("Sitemap, canonical, robots, or markdown crawl hints found", signals.robotsHints || signals.markdownLinks),
      ],
    },
    {
      key: "reputation",
      label: "Review Sentiment",
      score: clamp(reputationScore, 0, 100),
      description: "Do reviews contain useful service, location, and quality language for AI citations?",
      checks: [
        check("Reviews or testimonials are visible", signals.reviews > 0),
        check("Reviews/project copy mention services", signals.serviceTerms > 4),
        check("Review or project copy is tied to location", signals.localizedTerms > 2),
        check("Portfolio proof supports trust claims", signals.projectProof > 1),
      ],
    },
  ];
}

function buildFixes(signals) {
  const fixes = [];

  if (!signals.contractorSchema) {
    fixes.push({
      priority: "Critical",
      title: "Add contractor schema to every core page",
      body: "Generate JSON-LD that names the business, service area, license, rating, phone, and core remodel services.",
    });
  }

  if (!signals.llmsFound) {
    fixes.push({
      priority: "Critical",
      title: "Publish /llms.txt as an AI cheat sheet",
      body: "Summarize who the company serves, what jobs it performs, proof points, license details, and preferred citation URLs.",
    });
  }

  if (signals.answerTerms < 3 || signals.localizedTerms < 2) {
    fixes.push({
      priority: "High",
      title: "Create localized answer blocks",
      body: "Add direct answers for remodel cost, project timelines, permits, materials, and neighborhoods served.",
    });
  }

  if (!signals.licenseVisible) {
    fixes.push({
      priority: "High",
      title: "Make licensing and trust signals machine-readable",
      body: "Place license, bonded, insured, years in business, and service-area proof in visible text, not just images.",
    });
  }

  if (signals.reviews < 1) {
    fixes.push({
      priority: "Medium",
      title: "Add service-specific testimonials",
      body: "Show review text that mentions the service performed, city, materials, timeline, and outcome in natural language.",
    });
  }

  if (fixes.length === 0) {
    fixes.push({
      priority: "Next",
      title: "Build conversion and attribution tracking",
      body: "This site has strong readability basics. The next win is tracking AI referrals, quoted services, and contact conversions.",
    });
  }

  return fixes.slice(0, 5);
}

function buildIntents(market = "") {
  const place = market || "my area";

  return [
    `"bathroom remodel contractor near me"`,
    `"redo my kitchen in ${place}"`,
    `"licensed general contractor for home addition"`,
    `"how much does a kitchen remodel cost in ${place}"`,
  ];
}

function scoreAudit(categories) {
  const weights = {
    entity: 0.3,
    semantic: 0.3,
    technical: 0.25,
    reputation: 0.15,
  };

  return Math.round(categories.reduce((sum, category) => sum + category.score * weights[category.key], 0));
}

function summaryForScore(score, market) {
  if (score >= 85) {
    return `AI can confidently identify this contractor and cite them for localized remodel searches in ${market || "their market"}. The next opportunity is deeper project proof and conversion tracking.`;
  }

  if (score >= 70) {
    return `AI can identify the business, but it needs stronger license, service-area, and project proof before it confidently recommends this contractor in ${market || "their market"}.`;
  }

  return `AI tools may struggle to verify this contractor as a trusted local entity in ${market || "their market"}. The biggest wins are schema, service specificity, and crawl-friendly content.`;
}

async function fetchPage(url) {
  const html = await fetchText(url);

  return {
    url,
    html,
    text: normalizeWhitespace(stripNoise(stripTags(html))),
  };
}

function buildUnavailablePage(url, reason) {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const escapedReason = escapeHtml(reason);

  return {
    url,
    html: `<html><head><title>${hostname}</title></head><body><h1>${hostname}</h1><p>Builder Rank could not fetch this website. Reason: ${escapedReason}</p></body></html>`,
    text: `${hostname}. Builder Rank could not fetch this website. Reason: ${reason}`,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fetchOptionalText(url) {
  try {
    return await fetchText(url);
  } catch {
    return "";
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "text/html, text/plain, application/xhtml+xml, */*;q=0.8",
        "user-agent": "BuilderRankLocalAuditor/0.1 (+https://builderrank.local)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`${url} returned ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseProviderResponse(response, providerName) {
  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${providerName} returned non-JSON response`);
  }

  if (!response.ok) {
    const message = data.error?.message || data.error || `${providerName} returned ${response.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

function extractOpenAIText(data) {
  if (!Array.isArray(data.output)) return "";

  return data.output
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("\n");
}

function parseJsonFromText(text) {
  const trimmed = String(text || "").trim();

  if (!trimmed) {
    throw new Error("Model returned an empty response");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);

    if (match) {
      return JSON.parse(match[0]);
    }

    return parseFallbackModelText(trimmed);
  }
}

function parseFallbackModelText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const scoreMatch = text.match(/(?:score|rating|grade)[^0-9]{0,30}(\d+(\.\d+)?)/i) || text.match(/\b(\d{1,3})\s*\/\s*100\b/);
  const recommendations = lines
    .filter((line) => /^[-*•]|\d+\./.test(line))
    .map((line) => line.replace(/^[-*•]\s*|\d+\.\s*/, ""))
    .filter((line) => line.length > 20)
    .slice(0, 4);
  const summary = lines
    .find((line) => line.length > 40 && !/^[-*•]|\d+\./.test(line))
    || text.slice(0, 420);

  return {
    score: scoreMatch ? Number(scoreMatch[1]) : 0,
    summary,
    recommendations,
  };
}

function extractScore(value) {
  if (typeof value === "number") {
    return clamp(Math.round(value), 0, 100);
  }

  const match = String(value ?? "").match(/\d+(\.\d+)?/);

  if (!match) {
    return 0;
  }

  return clamp(Math.round(Number(match[0])), 0, 100);
}

function normalizeModelResult(result, providerLabel) {
  const repairedResult = repairNestedModelResult(result);
  const score =
    repairedResult.score ??
    repairedResult.llm_score ??
    repairedResult.llmVisibilityScore ??
    repairedResult.ai_visibility_score ??
    repairedResult.aiVisibilityScore ??
    repairedResult.visibility_score ??
    repairedResult.rating;
  const summary =
    repairedResult.summary ??
    repairedResult.assessment ??
    repairedResult.analysis ??
    repairedResult.explanation ??
    repairedResult.rationale ??
    `${providerLabel} completed the audit.`;
  const recommendations =
    repairedResult.recommendations ??
    repairedResult.fixes ??
    repairedResult.suggestions ??
    repairedResult.action_items ??
    repairedResult.actionItems ??
    [];

  return {
    score: score ?? JSON.stringify(repairedResult).match(/(?:score|rating)[^0-9]{0,20}(\d+(\.\d+)?)/i)?.[1] ?? 0,
    summary: stringifyModelText(summary),
    recommendations: Array.isArray(recommendations) ? recommendations : [recommendations].filter(Boolean),
  };
}

function modelSummaryText(result, providerLabel) {
  const parts = [
    result.summary || `${providerLabel} completed the audit.`,
    result.evidence ? `Strongest signal: ${result.evidence}` : "",
    result.gap ? `Biggest gap: ${result.gap}` : "",
  ]
    .map(stringifyModelText)
    .filter(Boolean);

  return parts.join(" ").slice(0, 700);
}

function repairNestedModelResult(result) {
  const summary = result?.summary;

  if (typeof summary !== "string" || !summary.includes('"summary"')) {
    return result || {};
  }

  try {
    const nested = parseJsonFromText(`{${summary.replace(/^\s*\{?|\}?\s*$/g, "")}}`);
    return {
      ...result,
      ...nested,
    };
  } catch {
    return result;
  }
}

function stringifyModelText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return value
      .replace(/^\s*"?(summary|recommendation|description|text)"?\s*:\s*"?/i, "")
      .replace(/",?\s*"?recommendations"?\s*:\s*\[.*$/is, "")
      .trim();
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyModelText).filter(Boolean).join("; ");

  const preferredFields = ["title", "recommendation", "body", "description", "action", "fix", "text", "summary"];
  const parts = preferredFields
    .map((field) => value[field])
    .filter((part) => part !== null && part !== undefined)
    .map(stringifyModelText)
    .filter(Boolean);

  return parts.length ? parts.join(": ") : JSON.stringify(value);
}

function providerEnvName(provider) {
  const names = {
    chatgpt: "OPENAI_API_KEY",
    claude: "ANTHROPIC_API_KEY",
    gemini: "GEMINI_API_KEY",
  };

  return names[provider];
}

function usableApiKey(value) {
  if (!value) return "";

  const trimmed = value.trim();

  if (!trimmed || trimmed.includes("paste_") || trimmed.includes("your_")) {
    return "";
  }

  return trimmed;
}

function discoverInternalLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const links = new Set();

  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = new URL(match[1], baseUrl);

      if (url.origin !== base.origin) continue;
      if (!["http:", "https:"].includes(url.protocol)) continue;
      if (/\.(jpg|jpeg|png|gif|webp|pdf|zip|mp4|mov)$/i.test(url.pathname)) continue;

      url.hash = "";
      links.add(url.href);
    } catch {
      // Ignore invalid href values.
    }
  }

  return [...links].filter((link) => link !== baseUrl);
}

function selectUsefulLinks(links) {
  const priority = [
    "service",
    "kitchen",
    "bath",
    "remodel",
    "renovation",
    "project",
    "portfolio",
    "gallery",
    "about",
    "review",
    "testimonial",
    "contact",
  ];

  return links
    .map((link) => ({
      link,
      score: priority.reduce((sum, term) => sum + (link.toLowerCase().includes(term) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.link)
    .slice(0, MAX_PAGES - 1);
}

async function serveStatic(pathname, response) {
  const routeFiles = {
    "/": "/index.html",
    "/why-geo": "/why-geo.html",
    "/about": "/about.html",
    "/pricing": "/pricing.html",
    "/run-report": "/run-report.html",
    "/account": "/account.html",
    "/support": "/support.html",
    "/legal": "/legal.html",
    "/privacy": "/privacy.html",
    "/terms": "/terms.html",
    "/robots.txt": "/robots.txt",
    "/sitemap.xml": "/sitemap.xml",
  };
  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const cleanPath = routeFiles[normalizedPath] || pathname;
  const filePath = normalize(join(ROOT, cleanPath));

  if (!filePath.startsWith(ROOT)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  const file = await readFile(filePath);
  response.writeHead(200, {
    "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  response.end(file);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function callApiHandler(handler, request, response) {
  response.status = (statusCode) => ({
    json: (payload) => sendJson(response, statusCode, payload),
  });
  response.json = (payload) => sendJson(response, 200, payload);

  await handler(request, response);
}

function normalizeWebsiteUrl(value) {
  if (!value || typeof value !== "string") {
    throw new Error("Website URL is required");
  }

  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs can be audited");
  }

  return url.href;
}

function inferCompanyName(title, website) {
  const hostname = new URL(website).hostname.replace(/^www\./, "");
  const titleCandidate = title.split(/[|–-]/)[0].trim();

  if (titleCandidate.length > 2 && titleCandidate.length < 48) {
    return titleCandidate;
  }

  return hostname
    .split(".")[0]
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractTitle(html) {
  return normalizeWhitespace((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/&amp;/g, "&"));
}

function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function countMatches(text, terms) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function countLocalSignals(text, market) {
  const parts = market
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((part) => part.length > 2);
  const marketHits = parts.reduce((sum, part) => sum + (text.includes(part) ? 1 : 0), 0);
  const genericLocalHits = countMatches(text, ["near me", "service area", "serving", "locally owned", "neighborhood"]);

  return marketHits + genericLocalHits;
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function check(label, passed) {
  return {
    label,
    status: passed ? "pass" : "fail",
  };
}

function points(condition, value) {
  return condition ? value : 0;
}

function gradeForScore(score) {
  if (score >= 92) return "A";
  if (score >= 86) return "A-";
  if (score >= 80) return "B+";
  if (score >= 73) return "B";
  if (score >= 67) return "B-";
  if (score >= 60) return "C";
  return "Needs Work";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function isDirectRun() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
