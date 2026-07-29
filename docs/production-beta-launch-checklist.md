# Builder Rank Production Beta Launch Checklist

Use this checklist to connect the first real GC or service-business website to Builder Rank.

## 1. Required Environment Variables

Set these in Vercel before using the connected dashboard in production:

```bash
npm run production:secrets
npm run production:env-handoff
```

`production:secrets` prints strong local values for `ADMIN_API_TOKEN` and `TRACKING_HASH_SALT`; it does not write them to disk. `production:env-handoff` prints the required and recommended env vars plus the launch-night command sequence.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
REPORT_EMAIL_FROM=Builder Rank <Support@builderrank.io>
REPORT_EMAIL_REPLY_TO=Support@builderrank.io
TRACKING_HASH_SALT
ADMIN_API_TOKEN
```

`TRACKING_HASH_SALT` must be a standalone random secret, not the Supabase service role key. Site Signal stores a stable visitor IP hash only when this salt is configured in production; local/demo mode uses a local fallback, and production readiness blocks launch if the explicit salt is missing.

Optional:

```text
REPORT_EMAIL_BCC
TRACKING_ALERT_EMAIL_TO
ADMIN_ALLOWED_ORIGIN=https://builderrank.io
MAX_JSON_BODY_BYTES=1000000
STRIPE_WEBHOOK_SECRET
STRIPE_ADDITIONAL_REPORT_PAYMENT_URL
HUBSPOT_ACCESS_TOKEN
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
```

Keep `MAX_JSON_BODY_BYTES` between `100000` and `2000000` during beta. The default is `1000000`; raising it should be deliberate because public endpoints like Site Signal and beta intake share the same JSON body reader. Keep `ADMIN_ALLOWED_ORIGIN` as one exact `https://` origin; protected admin APIs default to `https://builderrank.io` and should not use wildcard CORS.

`npm run production:readiness` separates required blockers from recommended follow-ups. Treat required blockers as no-go for the first beta customer; recommended follow-ups can be scheduled unless they are part of the specific customer workflow.

The Free Supabase project can pause after inactivity. The repo includes a daily Vercel Cron job,
configured in `vercel.json`, that calls `/api/supabase-keepalive` so the database receives regular
traffic and fails visibly if the project is paused or unreachable. Upgrading Supabase to Pro is still
the only provider-backed guarantee against automatic pausing.

## 2. Supabase Setup

Run `supabase-setup.sql` in the Supabase SQL editor. It now includes:

- `reports`
- `purchases`
- `br_businesses`
- `br_job_types`
- `br_competitors`
- `br_prompts`
- `br_prompt_runs`
- `br_ai_mentions`
- `br_ai_sources`
- `br_website_events`
- `br_recommendations`

The connected-dashboard schema is safe to rerun during beta. It uses `create table if not exists`, `alter table ... add column if not exists`, and `create index if not exists` so an older partial dashboard schema can pick up newer tracker, AI import, and Punch List columns.

After running the setup SQL, generate the verification query:

```bash
npm run supabase:schema-check
```

Paste that output into the production Supabase SQL editor. Any row with `status = missing` is a launch blocker before connecting a real customer website. The query checks the connected-dashboard tables, required columns, indexes, and customer-facing RLS policies used by reports and the dashboard.

## 3. First Customer Onboarding Flow

1. Customer creates a Builder Rank account.
2. Customer or Builder Rank fills out `/marketing-platform#private-beta`.
3. `/api/beta-intake` creates a `br_businesses` row when Supabase is configured.
4. Builder Rank gives the customer their Site Signal snippet:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_customer_site_id" async></script>
```

5. Customer installs the script through WordPress, GTM, Squarespace, Wix, Webflow, or direct code injection.
6. `/api/track` stores website events in `br_website_events`.
7. Signed-in customer dashboard calls `/api/dashboard-data` and reads live tracking data.
8. The dashboard shows Next Best Moves from live Site Signal, job-intent, CTA, AI visibility, and Punch List data so the customer sees the highest-priority marketing actions first.

For a copy/paste-ready customer profile, bootstrap payload, and first manual AI visibility import, use:

```text
docs/first-beta-customer-template.md
```

### Demo Customer Test Site

Use `/demo-remodeler` as the free fake GC/service-business site before a real customer gives us access:

- Business name: Front Range Remodels
- Website: `https://builderrank.io/demo-remodeler`
- Site Signal ID: `br_demo_front_range_remodels`
- Priority service: Bathroom remodeling
- Test events: page view, phone click, email click, quote/estimate CTA clicks, and estimate form submit

This page intentionally runs the public Site Signal script with `data-skip-logged-in="false"` because it lives on the Builder Rank domain. That lets us test tracking while signed into Builder Rank during QA. A real customer's website should use the normal customer snippet unless they explicitly want logged-in site admins tracked.

Run the full no-network customer handoff rehearsal with:

```bash
npm run customer:demo-dry-run
```

## 4. Site Connection

The authenticated endpoint is:

```text
POST /api/connect-site
```

Body:

```json
{
  "siteId": "br_customer_site_id"
}
```

This links an existing `br_businesses.site_id` to the signed-in Supabase user. This should eventually become
a small UI step in `/account` or `/dashboard`. The Account page passes known Site Signal IDs into `/dashboard?siteId=...` so the dashboard setup form is prefilled for the signed-in customer.
If Site Signal events were already received before the customer connects the account, `/api/connect-site` preserves `tracking_status = active` instead of downgrading it to `connected`.
When the signed-in customer connects a Site Signal ID, `/api/connect-site` also attempts to link that user’s older saved report-card rows to the claimed workspace when the report website matches the business website. The response includes `reportBackfill.linked` so the operator can see whether existing report history was attached.
After a customer already owns a connected workspace, newly saved report-card rows also attempt to store `reports.business_id` from the signed-in user's matching `br_businesses.website_url`. This keeps the standalone report card and connected marketing dashboard tied together without requiring the customer to reconnect Site Signal each time.
The response includes `claimStatus`, `message`, `nextStep`, `trackingStatus`, `dashboardUrl`, and `reportBackfill` so the setup UI can tell the customer whether the site was newly claimed, already connected, already active, and whether older saved report history was linked.
If a signed-in customer has saved report history but no connected workspace yet, `/account` uses the newest report website as a workspace candidate and tells the customer to have Builder Rank bootstrap that website before connecting the provided Site Signal ID.

## 4.1 Punch List Updates

The live dashboard can update customer-owned Punch List tasks through:

```text
PATCH /api/update-recommendation
```

Body:

```json
{
  "recommendationId": "recommendation_uuid",
  "status": "in_progress"
}
```

Allowed statuses are `open`, `in_progress`, and `complete`. The endpoint verifies the signed-in Supabase user owns the related `br_businesses` workspace before changing `br_recommendations.status`.

## 4.2 Admin Workspace Bootstrap

Use the protected bootstrap endpoint when Builder Rank is setting up a real beta customer:

```bash
npm run customer:validate -- docs/first-beta-customer.sample.json
```

Run this before bootstrapping a customer so the intake JSON has a website, market, primary trade, job types, competitors, contact name, contact email, phone, install method, operator notes, and a valid Site Signal ID format. Add `--write /tmp/builderrank-first-beta.json` when you want a normalized payload file to paste into `/admin-beta` or send to the bootstrap endpoint. Then run `npm run customer:handoff -- /tmp/builderrank-first-beta.json` to print the reviewed bootstrap curl, Site Signal snippet, starter AI visibility import curl across up to three job types, page-view QA payload, lead-event QA payload, tracking-health command, customer account claim instructions, and review URLs. Before touching production, run `npm run customer:dry-run -- docs/first-beta-customer.sample.json` or the real customer JSON to verify the validator and handoff outputs end to end without making network calls. The validator also warns when the first review would be thin, such as only one job type, fewer than three competitors, a generic/social website host, or a competitor list that includes the customer.

```text
POST /api/bootstrap-workspace
```

Header:

```text
x-builderrank-admin-token: ADMIN_API_TOKEN
```

Example body:

```json
{
  "company": "Front Range Remodels",
  "website": "https://front-range-remodels.com",
  "market": "Denver, CO",
  "primaryTrade": "Bathroom remodeling",
  "jobTypes": ["Bathroom remodeling", "Kitchen remodeling"],
  "competitors": ["Mile High Bath Co.", "Summit Remodel Group", "Urban Tile & Bath"],
  "ownerName": "Jordan Smith",
  "email": "owner@example.com",
  "phone": "(303) 555-0147",
  "installMethod": "WordPress plugin",
  "notes": "Wants more bathroom remodel leads before kitchen and basement jobs."
}
```

The endpoint creates or updates the `br_businesses` workspace, stores phone in `br_businesses.phone`, preserves contact name, email, phone, install method, and operator notes in `beta_intake`, adds job types, competitors, starter prompts across up to three profit centers, first Punch List recommendations across those services, and returns the Site Signal snippet plus a `handoff` block with the Site ID, dashboard URL, account URL, tracking-health URL, WordPress plugin path, and next setup steps. The `/admin-beta` bootstrap form summarizes the Site ID, setup counts, dashboard URL, account URL, health-check URL, WordPress plugin path, Site Signal snippet, and numbered next steps before showing the raw JSON, then refreshes the workspace summary table. The workspace table also shows the stored contact, phone, install method, and operator notes so launch-night setup can be managed without opening raw JSON.
It is safe to rerun for the same `siteId`: existing job types, competitors, prompts, and recommendations are reused or updated instead of duplicated.

## 5. Site Signal Data Now Tracked

`tracker.js` captures:

- Page views
- Referrer and source classification
- AI assistant referrals
- AI-tagged UTM/ref fallback for stripped referrers, such as `utm_source=chatgpt` or `ref=perplexity`
- UTM parameters
- Landing path
- Session ID
- Viewport, page path, and timezone context
- Job intent inferred from page path, title, CTA, and form context, such as Bathroom, Kitchen, Roofing, HVAC, Restoration, or General
- Phone clicks
- Email clicks
- Quote / estimate / schedule / contact clicks
- Form submits
- CTA/form metadata for beta reviews: button text, href, CTA type, job intent, form label, form action, and form method

`/api/track` now also:

- Normalizes allowed event names and common aliases. Unknown event names fall back to `page_view` and preserve the submitted name in `metadata.originalEvent` instead of inflating lead counts.
- Filters likely bot/monitor traffic before storage.
- Hashes visitor IPs into event metadata using `TRACKING_HASH_SALT`.
- Accepts safe aliases like `page` / `url` for smoke tests and future integrations.
- Preserves simple string, number, and boolean metadata/UTM values while dropping nested objects and oversized key sets.
- Accepts unknown but valid-looking Site Signal IDs without storage, which keeps random or mistyped IDs out of `br_website_events`.
- Marks a known `br_businesses` workspace as `tracking_status = active` after the first stored non-bot event.
- Returns `qaStatus`, `qaDomain`, and `installHint` so `/admin-beta` install testing can distinguish stored events, wrong-domain test URLs, unknown Site IDs, filtered bot traffic, demo/no-storage mode, and storage errors. If a known Site ID stores an event from a page URL that does not match the workspace website, the response returns `qaStatus: "stored_domain_mismatch"` plus `qaDomain.expectedHost`, `qaDomain.receivedHost`, and `qaDomain.matches`; the `/admin-beta` test panel summarizes those hosts before the raw JSON.

## 6. Manual AI Visibility Beta

Before full prompt automation, enter weekly AI checks manually into:

- `br_prompts`
- `br_prompt_runs`
- `br_ai_mentions`
- `br_ai_sources`
- `br_recommendations`

Track:

- Prompt text
- Platform/model
- Mentioned yes/no
- Rank position
- Competitors mentioned
- Direct website vs GBP/directory citation
- Source domains
- Perception notes
- Recommended fix

Use the protected importer instead of hand-editing tables:

```text
POST /api/import-ai-visibility
```

Header:

```text
x-builderrank-admin-token: ADMIN_API_TOKEN
```

Example body:

```json
{
  "siteId": "br_customer_site_id",
  "runs": [
    {
      "prompt": "best bathroom remodeler in Denver",
      "platform": "ChatGPT",
      "model": "gpt-5.2",
      "runAt": "2026-07-06",
      "mentioned": true,
      "rankPosition": 2,
      "confidence": 85,
      "sentiment": "positive",
      "persona": "Homeowner ready to hire",
      "intent": "hire_local_contractor",
      "mentionText": "Front Range Remodels was recommended for bathroom remodels.",
      "answerText": "The AI response text or summary goes here.",
      "sources": [
        {
          "domain": "front-range-remodels.com",
          "url": "https://front-range-remodels.com/bathroom-remodeling",
          "type": "direct_site",
          "cited": true
        }
      ]
    }
  ]
}
```

The importer upserts prompt runs by prompt, platform, and run time, then upserts the customer mention and cited sources. This keeps weekly import retries from creating duplicate visibility rows. The `/admin-beta` import form summarizes imported run count, captured source count, and the next freshness check before showing the raw JSON, then refreshes the workspace summary table.

## 7. Internal Beta Admin UI

Use `/admin-beta` for first-customer setup and monitoring. The page is not linked from the public nav and does not store the admin token.

It can:

- Show launch readiness before the admin token is configured through `/api/launch-readiness`.
- List recent beta workspaces through `/api/admin-workspaces`.
- Bootstrap a customer workspace through `/api/bootstrap-workspace`.
- Import one weekly AI visibility run through `/api/import-ai-visibility`.
- Send a test Site Signal page view through `/api/track` for install QA.
- Check Site Signal health through `/api/tracking-health`.

Paste `ADMIN_API_TOKEN` into the page for the current browser session before running an action.

The launch-readiness panel is safe to load before the admin token exists. It reports required env vars as
`ready`, `missing`, or `weak` without exposing secret values, then shows the next commands to run:

```text
npm run production:secrets
npm run production:env-handoff
npm run production:readiness
npm run customer:dry-run -- docs/first-beta-customer.sample.json
```

Do not bootstrap a real customer while `/admin-beta` shows required launch-readiness blockers.

The protected workspace summary endpoint is:

```text
GET /api/admin-workspaces
```

It returns workspace name, Site Signal ID, ownership status, tracking status, recent event count, last event, last event age, tracking health status, domain mismatch status, recent lead events, AI import freshness, last AI run, prompt run count, job type count, competitor count, prompt count, linked report-card count, latest report-card time, open Punch List count, readiness score, readiness checks, all readiness blockers, and a beta readiness/next-step label for the operator. Readiness blocks customer review when Site Signal is stale, when tracked page URLs do not match the expected customer website, when only page-view events have been tested without a quote, form, phone, or email lead event, when prompts/competitors/Punch List tasks are missing, when AI imports are unassigned to job types, or when the customer has not signed in and claimed the Site ID yet. The `/admin-beta` table shows the score, first blocker, and how many additional blockers remain so setup can be handled in one pass.

## 8. WordPress Site Signal Install

For WordPress customers, use:

```text
integrations/wordpress/builder-rank-site-signal.php
```

Install steps are documented in `integrations/wordpress/README.md`. The plugin adds a WordPress settings page for the customer Site Signal ID and injects the Builder Rank tracker on public pages. Keep logged-in WordPress user tracking off during beta QA, then test from a logged-out/incognito browser so admin visits do not pollute the customer's Site Signal data.

## 9. Site Signal Health Monitor

Use the protected tracking-health endpoint to find connected sites that have stopped sending events:

```text
GET /api/tracking-health?staleHours=24
```

Header:

```text
x-builderrank-admin-token: ADMIN_API_TOKEN
```

To send an email alert to `TRACKING_ALERT_EMAIL_TO` when stale sites, domain mismatches, or sites needing lead-event QA exist:

```text
POST /api/tracking-health
```

Body:

```json
{
  "staleHours": 24,
  "notify": true
}
```

This checks all `br_businesses` rows with a `site_id`, reports recent event counts, recent lead-event counts, last event timestamps, tracked page URLs, domain match status, and a per-site `healthStatus`. Sites with no recent events are `stale`; sites with recent events from a page URL that does not match the workspace website are `domain_mismatch`; sites with recent events but no quote, form, phone, or email lead event are `needs_lead_qa`; sites with recent tracking, matching domain, and lead-event proof are `healthy`. The `/admin-beta` health form summarizes healthy/stale/domain-mismatch/lead-QA counts before the raw JSON. The endpoint optionally sends a Resend alert with separate action sections for stale Site Signal installs, wrong-domain installs, and sites that still need lead-event QA.

For one-off install QA, use `/admin-beta` -> `Test Site Signal`. Enter the bootstrapped customer Site ID and the customer production page URL, then send a test page view, quote, phone, email, or form test event. Do not use the Builder Rank admin URL for this field. The result panel shows a `Site Signal QA` summary before the raw JSON. It should show `qaStatus: "stored"` and `stored: true` when Supabase is configured, `/api/tracking-health?staleHours=24` should show `healthStatus: "healthy"`, and the workspace summary should show Healthy tracking plus at least one recent lead event. If the Site ID has not been bootstrapped yet, `/api/track` accepts the request but returns `qaStatus: "unknown_site_id"` with `stored: false`.

## 10. Live Dashboard Data Contract

`/api/dashboard-data` now hydrates the connected dashboard from these production tables when a signed-in user owns a `br_businesses` workspace. If `/dashboard?siteId=...` is used, the dashboard passes that `siteId` to `/api/dashboard-data?siteId=...` and the API only returns the matching owned workspace.

- `br_businesses` for account, website, market, trade, Site Signal status, and live Site Signal snippet display.
- `br_job_types` for the profit centers Builder Rank should optimize.
- `br_competitors` plus imported `br_prompt_runs.answer_text` for the Competition tab.
- `br_prompts`, `br_prompt_runs`, `br_ai_mentions`, and `br_ai_sources` for Visibility, platform breakdowns, Sources, and Citations.
- `br_website_events` for Site Signal, Leads & Events, Top CTAs & Forms, Landing Pages, job-intent attribution, source attribution, source-level lead signals, live source-mix bars, source-level lead-rate rollups, and the AI-assisted lead-rate KPI.
- `br_recommendations` for the Punch List and Reviews & GBP task view, including the linked service/profit-center label when `job_type_id` is present.
- `reports` for the connected dashboard Reports tab and customer inspection history.

The response also includes `workspace.readiness`, a customer-review checklist with a readiness score, `ready` boolean, label, required blockers, optional follow-ups, and per-check status for Site Signal health, lead-event QA, AI imports, competitor count, prompt count, Punch List seeding, and report history. The dashboard notice uses this object to say whether the workspace is ready for beta review or which setup step should happen next.

New production installs can link saved report-card rows to `br_businesses` through `reports.business_id`. The customer dashboard and `/admin-beta` workspace summary first load workspace-linked report rows, then fall back to normalized website matches for older saved reports so `www` and trailing-slash differences do not hide report history. During first beta setup, confirm `/api/connect-site` reports the expected `reportBackfill.linked` count for any already-purchased report that should appear in the connected customer dashboard.

For the first real beta customer, the minimum useful data set is:

1. One `br_businesses` row with `site_id`, `website_url`, `market`, and `owner_user_id`.
2. One to three `br_job_types` rows.
3. Three to five `br_competitors` rows.
4. Ten to twenty starter `br_prompts` rows across the customer’s preferred jobs.
5. At least one weekly batch of `br_prompt_runs`, `br_ai_mentions`, and `br_ai_sources`.
6. Installed `tracker.js` generating `br_website_events`.
7. Five to ten `br_recommendations` rows that Builder Rank can turn into the customer’s first Punch List.

The Visibility tab surfaces AI data freshness from the most recent completed prompt run. Before reviewing a customer dashboard, confirm it says `Fresh this week` or intentionally note that the weekly AI check is stale.
If the customer has Site Signal events but no AI import yet, the dashboard should show live Site Signal metrics while AI Visibility fields show `0`, `0%`, or `Waiting` instead of sample/demo values. The Site Signal KPI also uses the same health states as admin monitoring: `Healthy`, `Domain mismatch`, `Needs lead test`, or `Stale`.

## 11. Preflight And Smoke Tests

Before deploy, run:

```bash
npm run preflight:beta
```

This checks that the dashboard, admin UI, beta APIs, tracker, Supabase schema, WordPress integration, and launch docs are still wired together.

Before onboarding the first real customer, run this with production env vars loaded:

```bash
npm run customer:validate -- docs/first-beta-customer.sample.json
npm run production:readiness
```

This fails if required beta secrets are missing or placeholder-shaped, and warns for optional but recommended integrations.

After deploy, run:

```bash
npm run smoke:production
```

To test a preview or local server:

```bash
BASE_URL=http://localhost:4174 npm run smoke:production
```

When testing local edits, restart the local server before running the smoke test. A stale Node process on `4174` can keep serving old API code even when the files on disk are fixed. Run smoke tests against the same fresh local server, preview deployment, or production URL that you are reviewing in the browser.

The script checks the public routes, tracker asset, dashboard data endpoint, protected admin routes, tracker ingestion, unknown tracker-event fallback, and the expected unauthenticated `connect-site` guard.

## 12. First Beta Go/No-Go Runbook

Use this sequence before asking the first GC or service-business customer to review their real dashboard.

1. Run `npm run production:secrets` and add the generated `ADMIN_API_TOKEN` and `TRACKING_HASH_SALT` to Vercel production.
2. Load the rest of the production env vars and run `npm run production:readiness`. Go only when required blockers are `0`.
3. Run `supabase-setup.sql` in the production Supabase project, then run `npm run supabase:schema-check`, paste the generated SQL into Supabase, and go only when there are no `status = missing` rows.
4. Run `BASE_URL=https://builderrank.io npm run smoke:production` against the deployed URL. For preview or local review, use the exact preview/local URL and restart the local server first.
5. Fill the customer intake file, then run `npm run customer:validate -- docs/first-beta-customer.sample.json`.
6. Run `npm run customer:dry-run -- docs/first-beta-customer.sample.json` and confirm the production go/no-go checklist appears.
7. Bootstrap the workspace in `/admin-beta`, then copy the generated handoff with the Site ID, snippet, `/dashboard?siteId=...`, account URL, and tracking-health URL.
8. Install Site Signal on the customer website using the WordPress plugin or direct `tracker.js` snippet.
9. QA Site Signal while logged out or incognito: send one `page_view` and one lead event such as `phone_click`, `form_submit`, `quote_click`, or `email_click`. The test response should include `qaStatus: "stored"`.
10. Import the first AI visibility run. The customer dashboard should show AI data freshness as `Fresh this week`.
11. Run `/api/tracking-health?staleHours=24`. The customer should return `healthStatus: "healthy"` and at least one recent lead event.
12. Have the customer sign in, connect their Site ID, and open `/dashboard?siteId=...`. Confirm `/admin-beta` no longer shows `Connect account`, the Site Signal KPI says `Healthy`, live leads/events are visible, and AI widgets are not showing demo leakage.

No-go conditions: any required readiness blocker, missing Site ID, stale tracking, domain mismatch, no lead-event QA, unclaimed customer account, no fresh AI import, unauthenticated dashboard access to customer data, or visible sample/demo AI values after live data is connected.

## 13. Customer Export Checks

The connected dashboard has CSV exports for the first beta customer’s visibility breakdown, Sources, tracked events, Leads & Events, and report history tables. Use these when reviewing the first customer’s data with their marketing team.
The tracked events export now includes event detail, so calls, quote clicks, email clicks, and form submits should show the CTA text/link or form label/action rather than only the generic event type. The Leads tab also includes a Top CTAs & Forms export for reviewing which customer website elements are producing measurable lead intent.
The Punch List and Reviews & GBP views show the service/profit center for each recommendation so the customer can choose whether to prioritize bathrooms, kitchens, basements, roofing, HVAC, or all-service profile work first.
