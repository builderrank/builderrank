import test from "node:test";
import assert from "node:assert/strict";
import { summarizeTargetTerms } from "../api/dashboard-data.js";

test("summarizes a target phrase across ChatGPT Gemini and Claude", () => {
  const summary = summarizeTargetTerms({
    targetTerms: [{ id: "t1", job_type_id: "j1", phrase: "walk-in shower contractor", target_market: "Denver, CO", priority: 1, status: "active" }],
    jobTypes: [{ id: "j1", label: "Bathroom remodeling" }],
    prompts: [{ id: "p1", target_term_id: "t1", prompt_text: "best walk-in shower contractor in Denver" }],
    promptRuns: [
      { id: "r1", prompt_id: "p1", platform: "ChatGPT", run_status: "complete" },
      { id: "r2", prompt_id: "p1", platform: "Gemini", run_status: "complete" },
      { id: "r3", prompt_id: "p1", platform: "Claude", run_status: "complete" },
    ],
    mentions: [
      { prompt_run_id: "r1", mentioned: true, rank_position: 2 },
      { prompt_run_id: "r2", mentioned: false, rank_position: null },
      { prompt_run_id: "r3", mentioned: true, rank_position: 1 },
    ],
    recommendations: [{ target_term_id: "t1", status: "open" }],
  });

  assert.equal(summary.length, 1);
  assert.equal(summary[0].mentionRate, 67);
  assert.equal(summary[0].averagePosition, 1.5);
  assert.equal(summary[0].jobTypeLabel, "Bathroom remodeling");
  assert.equal(summary[0].openChanges, 1);
  assert.deepEqual(summary[0].platforms.map((row) => row.mentionRate), [100, 0, 100]);
});
