# First Beta Customer Template

Use this as the one-page intake sheet before connecting a real GC or service-business site.

For a repeatable local handoff, start from:

```text
docs/first-beta-customer.sample.json
```

Then validate the customer payload before bootstrapping:

```bash
npm run customer:validate -- docs/first-beta-customer.sample.json
```

To save the normalized bootstrap payload for the admin handoff:

```bash
npm run customer:validate -- docs/first-beta-customer.sample.json --write /tmp/builderrank-first-beta.json
```

Then generate the launch-night commands, Site Signal snippet, QA payloads, and review URLs:

```bash
npm run customer:handoff -- /tmp/builderrank-first-beta.json
```

The handoff starts with a production go/no-go checklist: run `supabase-setup.sql`, verify it with `npm run supabase:schema-check`, pass `npm run production:readiness`, and smoke the deployed site before running the customer bootstrap command.

To verify the full no-network handoff flow before touching production:

```bash
npm run customer:dry-run -- docs/first-beta-customer.sample.json
```

The validator normalizes the website URL, checks required fields, warns when the competitor set or job-type set is light, flags duplicate competitors/job types, catches generic service labels, flags generic/social/staging/preview website hosts, keeps contact name, phone, install method, and operator notes in the handoff payload, suggests a Site Signal ID, prints the bootstrap payload, and can write the normalized JSON to a handoff file. The handoff script does not call production; it prints the exact `curl` commands and URLs for the operator to review before running them, including a starter AI visibility import for ChatGPT, Gemini, and Claude across up to three job types with `jobType` attached, plus customer account claim instructions for connecting the Site ID.

## Customer Profile

```json
{
  "company": "Front Range Remodels",
  "website": "https://front-range-remodels.com",
  "qaPage": "https://front-range-remodels.com/builder-rank-test",
  "market": "Denver, CO",
  "primaryTrade": "Bathroom remodeling",
  "jobTypes": [
    "Bathroom remodeling",
    "Kitchen remodeling",
    "Basement finishing"
  ],
  "competitors": [
    "Mile High Bath Co.",
    "Summit Remodel Group",
    "Urban Tile & Bath"
  ],
  "ownerName": "Jordan Smith",
  "email": "owner@example.com",
  "phone": "(303) 555-0147",
  "installMethod": "WordPress plugin",
  "notes": "Wants more bathroom remodel leads before kitchen and basement jobs."
}
```

Paste the normalized payload into `/admin-beta` after setting the admin token, or send it to:

```text
POST /api/bootstrap-workspace
```

with:

```text
x-builderrank-admin-token: ADMIN_API_TOKEN
```

## Site Signal Install

After the workspace is created, install the returned snippet on the customer site. The bootstrap response also includes a `handoff` block with the dashboard URL, account URL, tracking-health URL, WordPress plugin path, and next setup steps.

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_customer_site_id" async></script>
```

For WordPress, install `integrations/wordpress/builder-rank-site-signal.php` and paste the Site Signal ID into the plugin settings.

Use `/admin-beta` -> `Test Site Signal` with a real customer production page URL such as `https://front-range-remodels.com/builder-rank-test`. Do not use the Builder Rank admin URL. The test response should include `qaDomain.expectedHost`, `qaDomain.receivedHost`, and `qaDomain.matches`; if it returns `qaStatus: "stored_domain_mismatch"`, fix the installed domain or workspace website before the customer review.

For the Builder Rank hosted demo site, use `docs/demo-remodeler-customer.json`. Its QA page is `https://builderrank.io/demo-remodeler` and its Site Signal ID is `br_demo_front_range_remodels`.

## First AI Visibility Import

Run one manual check per platform and high-profit job type. Example:

Include `jobType` on each imported run so Builder Rank can place the AI visibility data under the correct profit center instead of leaving it unassigned.

```json
{
  "siteId": "br_customer_site_id",
  "runs": [
    {
      "prompt": "best bathroom remodeler in Denver",
      "jobType": "Bathroom remodeling",
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
      "answerText": "Summarize the AI answer here.",
      "sources": [
        {
          "domain": "front-range-remodels.com",
          "url": "https://front-range-remodels.com/bathroom-remodeling",
          "type": "direct_site",
          "cited": true
        },
        {
          "domain": "google.com",
          "url": "https://www.google.com/search?q=front+range+remodels",
          "type": "gbp",
          "cited": false
        }
      ]
    }
  ]
}
```

Send this through `/admin-beta` or:

```text
POST /api/import-ai-visibility
```

## Day-One Validation

Confirm these before calling the dashboard live:

- `/admin-beta` workspace summary shows the customer, Site Signal ID, setup counts, ownership status, and the beta readiness/next-step label.
- `/admin-beta` Test Site Signal uses the customer production page URL, then sends one page view and one quote/phone/form test event; both return `qaStatus: "stored"` and `stored: true`.
- `/admin-beta` Test Site Signal does not return `qaStatus: "stored_domain_mismatch"`; the Domain QA line shows the expected customer host and received customer host match.
- `/admin-beta` workspace summary shows Healthy tracking and at least one recent lead event after the conversion test.
- `/admin-beta` workspace summary shows `Fresh this week` after the first manual AI visibility import.
- `/api/tracking-health?staleHours=24` shows the site as `healthStatus: "healthy"` after install and lead-event QA.
- `/account` opens `/dashboard?siteId=br_customer_site_id` with the Site Signal form prefilled.
- `/account` labels the Site Signal action as `Connect in dashboard` before claim and `Open live dashboard` after tracking is live.
- `/dashboard` Connect Site returns `claimStatus`, `trackingStatus`, `dashboardUrl`, and a clear `nextStep` for install or live dashboard review.
- `/dashboard?siteId=br_customer_site_id` loads that owned workspace's live data, not another workspace on the same account.
- `/dashboard` shows live mode for the signed-in customer after they connect the site.
- `/dashboard` Visibility tab shows `Fresh this week` after the first manual AI visibility import.
- Site Signal events include at least one `page_view` and one test conversion click.
- The customer has job types, competitors, prompts, citations, and at least one open Punch List recommendation.
- The customer can click a Punch List task in `/dashboard` and move it from open to in progress, then to live.
- The customer can see the account Site Signal panel at `/account`.
