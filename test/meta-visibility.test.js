import test from "node:test";
import assert from "node:assert/strict";
import { isMetaPlatform, summarizeMetaVisibility } from "../api/_meta-visibility.js";

test("recognizes supported Meta platform labels", () => {
  assert.equal(isMetaPlatform("Meta AI"), true);
  assert.equal(isMetaPlatform("instagram_meta_ai"), true);
  assert.equal(isMetaPlatform("ChatGPT"), false);
});

test("separates API benchmarks from verified consumer results and scores visibility", () => {
  const summary = summarizeMetaVisibility({
    prompts: [{ id: "p1", prompt_text: "best bathroom remodeler in Denver", intent: "discovery" }],
    runs: [
      { id: "r1", prompt_id: "p1", platform: "Meta AI", run_status: "complete", measurement_mode: "api_benchmark", answer_text: "Acme Remodeling", run_at: "2026-08-10T00:00:00Z" },
      { id: "r2", prompt_id: "p1", platform: "instagram_meta_ai", run_status: "complete", measurement_mode: "consumer_verified", consumer_surface: "Instagram", answer_text: "Acme Remodeling", verified_at: "2026-08-11T00:00:00Z" },
    ],
    mentions: [
      { prompt_run_id: "r1", mentioned: true, rank_position: 2, sentiment: "positive", service_accuracy: 90, geo_accuracy: 100 },
      { prompt_run_id: "r2", mentioned: true, rank_position: 1, sentiment: "positive", service_accuracy: 100, geo_accuracy: 100 },
    ],
    sources: [{ prompt_run_id: "r1", domain: "acme.com", source_type: "direct_site", cited: true }],
    competitors: [],
    recommendations: [],
  });

  assert.equal(summary.benchmarkRuns, 1);
  assert.equal(summary.verifiedRuns, 1);
  assert.equal(summary.promptCoverage, 100);
  assert.equal(summary.averagePosition, 1.5);
  assert.ok(summary.score >= 85);
});

test("does not treat missing rank or accuracy as zero", () => {
  const summary = summarizeMetaVisibility({
    prompts: [{ id: "p1", prompt_text: "best remodeler", intent: "discovery" }],
    runs: [{ id: "r1", prompt_id: "p1", platform: "Meta AI", run_status: "complete", answer_text: "Acme", run_at: "2026-08-12T00:00:00Z" }],
    mentions: [{ prompt_run_id: "r1", mentioned: true, rank_position: null, service_accuracy: null, geo_accuracy: null }],
  });

  assert.equal(summary.averagePosition, null);
  assert.equal(summary.promptResults[0].serviceAccuracy, null);
  assert.equal(summary.promptResults[0].geoAccuracy, null);
  assert.equal(summary.evidenceGaps.some((gap) => gap.key === "entity_accuracy"), false);
});
