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
```

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
`checkout_reference` support, and create the private `purchases` table used by Stripe webhooks.

## Stripe reconciliation

Checkout links are generated with:

- `prefilled_email`: the signed-in Builder Rank account email.
- `client_reference_id`: a generated `br_...` checkout reference saved with the pending report.
- `utm_source=builder_rank_app` and `utm_medium=checkout`.

Phone number is validated, normalized, collected in Builder Rank account creation, and required in the
report workspace before checkout. Stripe Payment Links do not use that local field as a URL prefill, but
the Stripe webhook stores `customer_details.phone` as `customer_phone` if phone collection is enabled in
Stripe.

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

The report workspace includes an `Email Report` button. It requires:

```text
RESEND_API_KEY
REPORT_EMAIL_FROM
REPORT_EMAIL_REPLY_TO
SUPABASE_SERVICE_ROLE_KEY
```

Use `REPORT_EMAIL_FROM=Builder Rank <kaleb@builderrank.io>` after `builderrank.io` is verified in
Resend. Use `REPORT_EMAIL_REPLY_TO=kaleb@builderrank.io` so customer replies land in the Google
Workspace inbox. `REPORT_EMAIL_BCC` is optional. The email sends a report summary and attaches the
JSON export.

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
