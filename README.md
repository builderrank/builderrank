# Builder Rank Local MVP

Builder Rank audits general contractor websites for LLM readability and local AI search visibility.

## Run locally

```bash
npm start
```

Then open:

```text
http://localhost:4174
```

If port `4174` is already busy:

```bash
PORT=4175 npm start
```

Then open:

```text
http://localhost:4175
```

## Enable real ChatGPT, Claude, and Gemini analysis

The MVP works without API keys using local scoring heuristics. To call the real model APIs, set any or all of
these environment variables before starting the server:

```bash
export OPENAI_API_KEY="your_openai_key"
export ANTHROPIC_API_KEY="your_anthropic_key"
export GEMINI_API_KEY="your_gemini_key"
npm start
```

Or create a private `.env` file:

```bash
cp .env.example .env
```

Then paste your real keys into `.env` and restart the server.

You can also override the default models:

```bash
export OPENAI_MODEL="gpt-5.2"
export ANTHROPIC_MODEL="claude-sonnet-4-6"
export GEMINI_MODEL="gemini-2.5-flash"
```

API keys stay server-side. The browser only receives the model's score, status, summary, and recommendations.

## What the MVP checks

- Crawls the homepage plus up to five useful internal pages.
- Looks for phone, address, service-area, license, bonded, and insured signals.
- Checks for contractor or LocalBusiness JSON-LD schema.
- Checks for `/llms.txt`.
- Looks for specific remodel/construction service language.
- Looks for localized cost, permit, timeline, FAQ, review, and project proof language.
- Produces a Builder Rank score, category scores, prioritized fixes, and crawl evidence.
- When keys are configured, sends the crawled evidence to ChatGPT, Claude, and Gemini for model-specific scoring.

## AI visibility dashboard

The HotelRank-inspired dashboard concept is available at:

```text
http://localhost:4174/marketing-platform
http://localhost:4174/dashboard
```

`/marketing-platform` is the public product page for the report-card plus all-in-one marketing platform
story. `/dashboard` is the working dashboard for the connected customer experience, with a demo mode for
public preview and live Supabase hydration for signed-in beta customers.

They preview the next subscription product layer:

- Job-type optimizer for profitable services such as bathroom remodeling, roofing, HVAC, and restoration.
- AI visibility score, mention rate, average rank, and AI-sourced leads.
- Prompt library by job type and market.
- Platform visibility for ChatGPT, Gemini, Claude, and Perplexity.
- Meta AI visibility across repeatable Model API benchmarks and separately verified Instagram/Facebook consumer results.
- Customer-controlled AI Target Terms with ChatGPT, Gemini, and Claude measurement and approval-based optimization workflows.
- Competitor ranking gap.
- Direct website vs directory vs Google Business Profile link share.
- AI perception attributes and prioritized implementation path.

The product blueprint lives at:

```text
docs/builderrank-ai-dashboard-blueprint.md
docs/hotelrank-source-notes.md
docs/private-beta-implementation-plan.md
docs/ai-dashboard-schema.sql
docs/meta-ai-visibility-runbook.md
```

## Website tracking

Contractor websites can install the Builder Rank Site Signal tracker with:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_12345" async></script>
```

For local testing, override the endpoint:

```html
<script
  src="http://localhost:4174/tracker.js"
  data-site-id="br_demo"
  data-endpoint="http://localhost:4174/api/track"
  async
></script>
```

The tracker captures page views, AI referrers, AI-tagged UTM/ref parameters, landing path, session ID, phone clicks,
email clicks, quote/estimate/schedule clicks, and form submissions. Click and form events include CTA/form
metadata such as button text, href, CTA type, form label, form action, and form method. `/api/track`
validates, filters likely bot traffic, hashes visitor IP context, and stores accepted events in Supabase when
service-role credentials are configured. When the Site Signal ID belongs to a known workspace, the first
stored non-bot event marks that workspace tracking status active. Unknown but valid-looking Site Signal IDs
are accepted without storage so random or mistyped IDs cannot pollute beta customer reporting.

## Private beta intake

`/marketing-platform#private-beta` includes the first beta onboarding form for the subscription product.
It collects the business, website, target job type, market, competitors, and tracker install status. The
local API endpoint is:

```text
POST /api/beta-intake
```

The endpoint validates, normalizes, and stores accepted requests in Supabase when service-role credentials
are configured. HubSpot sync can be added as a follow-up for sales operations.

## Connected dashboard beta

The production beta path now has working local/Vercel routes for:

- `/dashboard` - signed-in customer dashboard with live Supabase hydration and demo fallback.
- `/account` - customer account/report history plus Site Signal setup state.
- `/admin-beta` - internal setup page for bootstrapping a customer, importing AI visibility runs, testing Site Signal ingestion, and checking tracking health.
- `/api/admin-workspaces` - protected admin endpoint for listing beta workspaces, Site Signal status, and setup counts.
- `/api/bootstrap-workspace` - protected admin endpoint that creates a customer workspace, job types, competitors, prompts, and Punch List recommendations.
- `/api/connect-site` - authenticated endpoint that links a signed-in user to an existing Site Signal ID.
- `/api/dashboard-data` - dashboard data API backed by Builder Rank Supabase tables.
- `/api/import-ai-visibility` - protected importer for weekly/manual AI visibility checks.
- `/api/tracking-health` - protected monitor for stale Site Signal installs, domain mismatches, and missing lead-event QA.
- `/api/update-recommendation` - authenticated Punch List status updates for customer-owned workspaces.

Live dashboard data includes AI visibility, platform visibility breakdowns, competitor mention rankings from
imported AI answer text, citations, live source mix, Site Signal events, landing page conversion, source-level
lead attribution from tracked calls, forms, and quote clicks, saved report history from the customer account,
AI-assisted lead rate, and Reviews/GBP task rows derived from the Punch List.
Tracked Site Signal events include CTA/form details such as button text, link target, CTA type, form label,
form action, and form method so a beta customer can see which website elements are driving calls and quote requests.
The Leads tab also rolls those into a Top CTAs & Forms table for quick marketing-team review and CSV export.

When a signed-in account already has a Site Signal ID, `/account` links into `/dashboard?siteId=...` so the customer setup form is prefilled.
The dashboard Site Signal tab also swaps demo snippets/status text for the live workspace Site ID, tracking status, and last event time.
Customer-facing dashboard tables for visibility, sources, events, leads, and reports can export CSV for beta reviews.

Before onboarding a real GC or service business, run:

```bash
npm run preflight:beta
npm run smoke:production
```

For local verification after code edits, restart the local server first, then run smoke tests against the same fresh local URL you are reviewing. This avoids a stale `4174` process serving old API code.

Then follow:

```text
docs/production-beta-launch-checklist.md
docs/first-beta-customer-template.md
```

## Local sample

Use this test URL after starting the server:

```text
http://localhost:4174/sample-contractor.html
```

If you started on another port, replace `4174` with that port.

## Deploy to Vercel

This project is Vercel-ready:

- Static files are served from the project root.
- The production audit endpoint lives at `/api/audit`.
- API keys must be configured in Vercel Project Settings, not committed to GitHub.
- Set `STRIPE_ADDITIONAL_REPORT_PAYMENT_URL` to the live Stripe Payment Link for $10 additional report credits.
- Stripe should redirect successful payments to `https://builderrank.io/run-report?checkout=success#report-workspace`
  so the site restores the saved website and market inputs after checkout.

Add these Vercel Environment Variables for Production and Preview:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
OPENAI_MODEL
ANTHROPIC_MODEL
GEMINI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
REPORT_EMAIL_FROM
REPORT_EMAIL_REPLY_TO
REPORT_EMAIL_BCC
HUBSPOT_ACCESS_TOKEN
TRACKING_HASH_SALT
ADMIN_API_TOKEN
ADMIN_ALLOWED_ORIGIN
TRACKING_ALERT_EMAIL_TO
MAX_JSON_BODY_BYTES
```

Before onboarding a real beta customer, run:

```bash
npm run production:secrets
npm run supabase:schema-check
npm run production:readiness
```

Use `production:secrets` to generate strong local values for `ADMIN_API_TOKEN` and `TRACKING_HASH_SALT` before adding them to Vercel. Paste the schema-check SQL into production Supabase after `supabase-setup.sql`; any `status = missing` row is a launch blocker. Production readiness validates the required connected-dashboard secrets and warns about optional integrations that are useful before a full launch. `MAX_JSON_BODY_BYTES` is optional, defaults to 1 MB for shared API JSON payloads, and should stay between `100000` and `2000000` during beta. `ADMIN_ALLOWED_ORIGIN` is optional and defaults to `https://builderrank.io` for protected admin API CORS.

Supabase Auth and saved report history are configured in the browser client. The current production project is:

```text
SUPABASE_PROJECT_REF=hosepwwflfpqgemfcafj
SUPABASE_URL=https://hosepwwflfpqgemfcafj.supabase.co
```

Supabase Auth should use `https://builderrank.io` as the Site URL and allow password reset redirects to:

```text
https://builderrank.io/account?reset=password
```

Run `supabase-setup.sql` in the Supabase SQL Editor to confirm report row-level security, add
`checkout_reference` support, create the private `purchases` table used by Stripe webhooks, and create the connected-dashboard beta tables. Then run `npm run supabase:schema-check` and paste the generated SQL into Supabase before bootstrapping a real customer.

## Stripe reconciliation

Checkout links are generated with:

- `prefilled_email`: the signed-in Builder Rank account email.
- `prefilled_promo_code`: the optional customer-entered promo code, when present.
- `client_reference_id`: a generated `br_...` checkout reference saved with the pending report.
- `utm_source=builder_rank_app` and `utm_medium=checkout`.

The first report is credited only after the customer creates or completes a free account profile with
email, name, phone, company name, company size, and trade/service type. Additional report credits use
the Payment Link stored in `STRIPE_ADDITIONAL_REPORT_PAYMENT_URL`.

Promotion codes must be enabled on the Stripe Payment Link, and the actual customer-facing codes must
exist in Stripe, for the promo field to apply a discount.

Phone number is validated, normalized, collected in Builder Rank account creation, and required in the
report workspace before checkout. Stripe Payment Links do not use that local field as a URL prefill, but
the Stripe webhook stores `customer_details.phone` as `customer_phone` if phone collection is enabled in
Stripe.

`/api/audit` requires the signed-in user to submit a `checkoutReference` that matches a paid row in
the private Supabase `purchases` table. If Stripe's webhook is still processing, the customer should
wait a few seconds and click `Generate Paid Report` again. The report page also polls
`/api/payment-status` after Stripe redirects back so normal webhook delays do not feel like a broken
checkout.

Configure the Stripe webhook endpoint:

```text
https://builderrank.io/api/stripe-webhook
```

Listen for:

```text
checkout.session.completed
```

Then set `STRIPE_WEBHOOK_SECRET` in Vercel from Stripe's webhook signing secret.

## Report email delivery

After a paid report is generated, Builder Rank automatically sends the signed-in customer a thank-you
email with a basic PDF report attachment and the JSON export. The report workspace also keeps an
`Email Report` button for manual resend. Email delivery requires:

```text
RESEND_API_KEY
REPORT_EMAIL_FROM
REPORT_EMAIL_REPLY_TO
SUPABASE_SERVICE_ROLE_KEY
```

Use `REPORT_EMAIL_FROM=Builder Rank <Support@builderrank.io>` after `builderrank.io` is verified in
Resend. Use `REPORT_EMAIL_REPLY_TO=Support@builderrank.io` so customer replies land in the Google
Workspace inbox. `REPORT_EMAIL_BCC` is optional.

If ChatGPT, Claude, or Gemini does not return a completed analysis, the report and emailed copy tell
the customer that Builder Rank will review the model issue and follow up if additional context is needed.

## Support and legal

Customer support is available at:

```text
Support@builderrank.io
720-701-3156
```

Public pages:

```text
/support
/legal
/privacy
/terms
```

## HubSpot sync

Builder Rank can sync account creation/login to HubSpot contacts and Stripe purchases to HubSpot deals.
Create a HubSpot Service Key named `Builder Rank Integration`, add it to Vercel as:

```text
HUBSPOT_ACCESS_TOKEN
```

Recommended HubSpot Service Key scopes:

```text
crm.objects.contacts.read
crm.objects.contacts.write
crm.objects.companies.read
crm.objects.companies.write
crm.objects.deals.read
crm.objects.deals.write
crm.schemas.contacts.read
crm.schemas.contacts.write
crm.schemas.companies.read
crm.schemas.companies.write
crm.schemas.deals.read
crm.schemas.deals.write
```

The sync creates/updates contacts by email, creates/updates companies by company name, creates purchase deals,
and creates Builder Rank custom properties when the schema scopes are available.

Recommended model values:

```text
OPENAI_MODEL=gpt-5.2
ANTHROPIC_MODEL=claude-sonnet-4-6
GEMINI_MODEL=gemini-2.5-flash
```

After connecting the GitHub repo to Vercel, redeploy after adding or changing environment variables.
