const META_PLATFORM_KEYS = new Set(["meta", "meta_ai", "meta ai", "instagram_meta_ai", "facebook_meta_ai"]);

export function isMetaPlatform(value) {
  return META_PLATFORM_KEYS.has(String(value || "").trim().toLowerCase());
}

export function summarizeMetaVisibility({ prompts = [], runs = [], mentions = [], sources = [], competitors = [], recommendations = [] }) {
  const metaRuns = runs.filter((run) => isMetaPlatform(run.platform));
  const runIds = new Set(metaRuns.map((run) => run.id));
  const metaMentions = mentions.filter((mention) => runIds.has(mention.prompt_run_id));
  const metaSources = sources.filter((source) => runIds.has(source.prompt_run_id));
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const mentionByRunId = new Map(metaMentions.map((mention) => [mention.prompt_run_id, mention]));
  const sourceByRunId = new Map();

  metaSources.forEach((source) => {
    const list = sourceByRunId.get(source.prompt_run_id) || [];
    list.push(source);
    sourceByRunId.set(source.prompt_run_id, list);
  });

  const completed = metaRuns.filter((run) => run.run_status === "complete" || run.completed_at || run.answer_text);
  const benchmarkRuns = completed.filter((run) => measurementMode(run) === "api_benchmark");
  const verifiedRuns = completed.filter((run) => measurementMode(run) === "consumer_verified");
  const mentioned = completed.filter((run) => mentionByRunId.get(run.id)?.mentioned);
  const ranked = mentioned
    .map((run) => numericOrNull(mentionByRunId.get(run.id)?.rank_position))
    .filter((value) => value != null && value > 0);
  const promptCoverage = completed.length ? percentage(mentioned.length, completed.length) : null;
  const averagePosition = ranked.length ? round1(ranked.reduce((sum, value) => sum + value, 0) / ranked.length) : null;
  const prominence = averagePosition == null ? 0 : Math.max(0, Math.round(100 - (averagePosition - 1) * 18));
  const accuracyRows = metaMentions.filter((mention) => mention.service_accuracy != null || mention.geo_accuracy != null);
  const accuracy = accuracyRows.length
    ? Math.round(accuracyRows.reduce((sum, row) => sum + averageNullable(row.service_accuracy, row.geo_accuracy), 0) / accuracyRows.length)
    : promptCoverage;
  const sentiment = sentimentScore(metaMentions);
  const shareOfVoice = competitorShareOfVoice({ completed, mentions: metaMentions, competitors });
  const score = promptCoverage == null ? null : Math.round(
    promptCoverage * 0.35 + prominence * 0.25 + (accuracy ?? 0) * 0.15 + shareOfVoice * 0.15 + sentiment * 0.1,
  );

  const promptResults = completed.slice(0, 75).map((run) => {
    const prompt = promptById.get(run.prompt_id);
    const mention = mentionByRunId.get(run.id);
    const runSources = sourceByRunId.get(run.id) || [];
    return {
      id: run.id,
      prompt: prompt?.prompt_text || "Meta AI prompt",
      category: prompt?.intent || "discovery",
      persona: prompt?.persona || "",
      mode: measurementMode(run),
      surface: run.consumer_surface || (measurementMode(run) === "consumer_verified" ? "Instagram" : "Meta Model API"),
      mentioned: Boolean(mention?.mentioned),
      rankPosition: mention?.rank_position || null,
      sentiment: mention?.sentiment || "unknown",
      description: mention?.mention_text || "",
      serviceAccuracy: numericOrNull(mention?.service_accuracy),
      geoAccuracy: numericOrNull(mention?.geo_accuracy),
      verifiedAt: run.verified_at || null,
      verifiedLocation: run.verified_location || "",
      sources: runSources.map((source) => ({ domain: source.domain, url: source.url || "", cited: Boolean(source.cited), type: source.source_type || "unknown" })),
      runAt: run.completed_at || run.run_at,
    };
  });

  return {
    status: completed.length ? "active" : "waiting_for_first_run",
    score,
    promptCoverage,
    averagePosition,
    shareOfVoice,
    serviceGeoAccuracy: accuracy,
    sentimentAccuracy: sentiment,
    promptsTracked: new Set(metaRuns.map((run) => run.prompt_id)).size,
    completedRuns: completed.length,
    benchmarkRuns: benchmarkRuns.length,
    verifiedRuns: verifiedRuns.length,
    lastBenchmarkAt: latestTimestamp(benchmarkRuns),
    lastVerifiedAt: latestTimestamp(verifiedRuns),
    sourceStrength: sourceStrength(metaSources),
    promptResults,
    categories: categoryRollup(promptResults),
    evidenceGaps: buildEvidenceGaps(promptResults),
    recommendations: recommendations
      .filter((item) => String(item.source || "").toLowerCase().includes("meta"))
      .map((item) => ({ id: item.id, title: item.title, body: item.body, priority: item.priority, status: item.status })),
  };
}

function measurementMode(run) {
  return run.measurement_mode === "consumer_verified" ? "consumer_verified" : "api_benchmark";
}

function percentage(numerator, denominator) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

function round1(value) {
  return Number(value.toFixed(1));
}

function numericOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function averageNullable(...values) {
  const numbers = values.map(numericOrNull).filter((value) => value != null);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0;
}

function sentimentScore(mentions) {
  if (!mentions.length) return 0;
  const weights = { positive: 100, favorable: 100, neutral: 70, mixed: 45, negative: 10, unknown: 50 };
  return Math.round(mentions.reduce((sum, row) => sum + (weights[String(row.sentiment || "unknown").toLowerCase()] ?? 50), 0) / mentions.length);
}

function competitorShareOfVoice({ completed, mentions, competitors }) {
  if (!completed.length) return 0;
  const customerMentions = mentions.filter((row) => row.mentioned).length;
  const competitorNames = competitors.map((row) => String(row.name || "").toLowerCase()).filter(Boolean);
  const competitorMentions = completed.reduce((total, run) => {
    const answer = String(run.answer_text || "").toLowerCase();
    return total + competitorNames.filter((name) => answer.includes(name)).length;
  }, 0);
  const denominator = customerMentions + competitorMentions;
  return denominator ? percentage(customerMentions, denominator) : 0;
}

function latestTimestamp(runs) {
  return runs.map((run) => run.verified_at || run.completed_at || run.run_at).filter(Boolean).sort().at(-1) || null;
}

function sourceStrength(sources) {
  if (!sources.length) return { score: null, cited: 0, direct: 0, total: 0 };
  const cited = sources.filter((source) => source.cited).length;
  const direct = sources.filter((source) => ["direct_site", "google_business_profile", "facebook", "instagram"].includes(source.source_type)).length;
  return { score: Math.round(percentage(cited, sources.length) * 0.6 + percentage(direct, sources.length) * 0.4), cited, direct, total: sources.length };
}

function categoryRollup(results) {
  const rows = new Map();
  results.forEach((result) => {
    const key = result.category || "discovery";
    const row = rows.get(key) || { category: key, runs: 0, mentions: 0 };
    row.runs += 1;
    if (result.mentioned) row.mentions += 1;
    rows.set(key, row);
  });
  return [...rows.values()].map((row) => ({ ...row, mentionRate: percentage(row.mentions, row.runs) }));
}

function buildEvidenceGaps(results) {
  const gaps = [];
  const missed = results.filter((result) => !result.mentioned);
  if (missed.length) gaps.push({ key: "prompt_coverage", priority: "high", title: `${missed.length} Meta prompts do not mention the business`, detail: "Strengthen matching service, location, project, and reputation evidence for the missed prompt categories." });
  if (!results.some((result) => result.sources.some((source) => source.type === "direct_site"))) gaps.push({ key: "direct_site", priority: "high", title: "Direct website evidence is not being cited", detail: "Improve service/location pages, LocalBusiness and Service schema, project proof, and crawlable FAQs." });
  if (!results.some((result) => /instagram/i.test(result.surface))) gaps.push({ key: "instagram_verification", priority: "medium", title: "No verified Instagram Meta AI result yet", detail: "Run the controlled consumer spot-check workflow and record profile, location, timestamp, and answer evidence." });
  if (results.some((result) => (result.serviceAccuracy ?? 100) < 70 || (result.geoAccuracy ?? 100) < 70)) gaps.push({ key: "entity_accuracy", priority: "high", title: "Meta has inconsistent service or location context", detail: "Align Instagram, Facebook, website, directory, licensing, and GBP business information." });
  return gaps;
}
