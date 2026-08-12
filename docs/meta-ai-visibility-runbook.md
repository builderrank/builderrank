# Meta AI Visibility Runbook

## What ships

- A customer-facing **Meta AI** dashboard tab for Facebook and Instagram discovery.
- Separate measurement labels for repeatable Meta Model API benchmarks and verified consumer results.
- Prompt coverage, recommendation position, share of voice, service/location accuracy, sentiment, and the blended Meta Visibility Score.
- Prompt-category coverage for discovery, comparison, reputation, service, location, high-intent, branded, and unbranded questions.
- Prompt-level answers, sources, evidence gaps, and Meta-specific optimization recommendations.
- Admin import fields for consumer surface, location, verification time, and service/geographic accuracy.
- An admin-only `/api/run-meta-benchmark` endpoint for live Meta Model API runs.

## Measurement integrity

Never describe an API benchmark as an observed Instagram result. The dashboard uses:

- `api_benchmark`: a repeatable result from the configured Meta Model API.
- `consumer_verified`: an answer observed and recorded from Instagram, Facebook, or another named consumer surface.

Consumer verifications must include the surface, location/profile context, timestamp, complete answer, business position, and visible sources when available.

## Initial production setup

1. Apply `docs/meta-ai-visibility-migration.sql` in the Builder Rank Supabase SQL Editor.
2. Run `npm run supabase:schema-check` and confirm all required fields are present.
3. In the Vercel Builder Rank project, add the production and preview values supplied by the Meta developer account:
   - `META_MODEL_API_KEY`
   - `META_MODEL_API_BASE_URL`
   - `META_MODEL`
   - `META_MODEL_TIMEOUT_MS` (recommended: `45000`)
   - `META_BENCHMARK_MAX_RUNS` (recommended: `5`)
   - `META_MODEL_WEB_SEARCH_ENABLED` (leave `false` unless the provider supports the configured tool type)
4. Deploy the application branch to a Vercel preview.
5. Bootstrap or refresh the first customer workspace so it receives Meta prompt categories and Meta optimization tasks.
6. Run up to five benchmark prompts through `POST /api/run-meta-benchmark`.
7. Record at least one controlled Instagram consumer verification through the admin import form.
8. Compare the API benchmark with the verified consumer result before presenting the feature to the customer.

## Benchmark request

```json
{
  "siteId": "br_customer_site_id",
  "limit": 5
}
```

Send the request to `POST /api/run-meta-benchmark` with the existing `x-builderrank-admin-token` header.

## First-customer acceptance checks

- The customer sees the Meta AI tab only after opening their owned Builder Rank workspace.
- Demo mode is clearly sample data.
- Live mode never retains sample Meta values when no runs exist.
- Benchmark and verified consumer rows are visually distinct.
- The prompt library covers at least five prompt categories.
- Each missed prompt produces an understandable evidence gap.
- Meta recommendations remain customer-approved Punch List actions.
- No Meta credential reaches browser JavaScript or API responses.
- The production migration is applied before application deployment.

## Known platform limitation

Meta's developer model and the consumer Meta AI experience can differ by account, location, conversation context, product surface, and model version. Builder Rank therefore reports them as separate measurements and does not claim direct control over Meta AI rankings.
