# Builder Rank New Chat Handoff

## Correct Project Folder

Use this folder:

```text
/Users/kalebgamez/Documents/Marketing and sales/builderrank-app
```

The old chat workspace path under `/Users/kwgamez/...` no longer exists and causes the app warning:

```text
Current working directory missing
```

## Current Local App

Run locally with:

```bash
PORT=4174 /Users/kalebgamez/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

Open:

```text
http://localhost:4174
```

Important routes:

- `/` public home page
- `/marketing-platform` public marketing product page
- `/dashboard` connected dashboard prototype
- `/account` customer login/report dashboard
- `/run-report` paid report workspace
- `/pricing` report pricing page

## Product Direction

Builder Rank should become the contractor/service-business version of HotelRank.ai.

Public product ladder:

1. AI Report Card
2. Customer Dashboard
3. All-in-one Marketing Platform

The public site should explain what Builder Rank does now:

- $49 AI/GEO report card
- ChatGPT, Claude, and Gemini analysis
- AI Health Score
- website trust, schema, content, crawlability, reviews, and local service clarity
- saved report history after account login

And what Builder Rank is becoming:

- ongoing AI visibility dashboard
- job-type prompt tracking
- competitor ranking
- direct website vs GBP/directory/review link tracking
- website event tracking
- lead attribution
- reviews/GBP/content/directory marketing tasks

## HotelRank-Style Metrics To Track

Translated for general contractors and service businesses:

- Business Mentions
- Mention Trend
- Ranking vs Competitors
- Multi-Location Tracking
- Visibility Index
- Direct vs Directory / GBP / Review Site Links
- Average Ranking
- Platform Performance
- Competitor Comparison
- Monthly Trend
- Perception Score
- Strengths & Weaknesses
- Custom Attributes
- Attributes Over Time
- AI-Sourced Leads

## Job-Type Optimizer

Key idea from the user:

Customers should select the type of job they want most.

Example:

> I am a bathroom contractor and make the most money on bathroom jobs, so I want Builder Rank to optimize my website and AI presence so LLMs recommend me as the best bathroom contractor in my market.

Current prototype supports:

- Bathroom remodeling
- Kitchen remodeling
- Roof replacement
- Emergency HVAC
- Water damage restoration

## Website Tracking

Prototype files added:

- `/tracker.js`
- `/api/track`

Install snippet:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_12345" async></script>
```

The tracker currently captures:

- page views
- AI referrers
- UTM parameters
- landing path
- session ID
- phone clicks
- email clicks
- quote/estimate/schedule/contact clicks
- form submits

Target install paths:

- WordPress plugin
- Shopify custom pixel
- Squarespace code injection
- Wix custom code
- Webflow project code
- Google Tag Manager

## Important Files Added / Changed

New or major files:

- `marketing-platform.html`
- `dashboard.html`
- `assets/dashboard.js`
- `tracker.js`
- `api/track.js`
- `docs/builderrank-ai-dashboard-blueprint.md`
- `docs/hotelrank-source-notes.md`
- `docs/private-beta-implementation-plan.md`
- `docs/ai-dashboard-schema.sql`
- `docs/new-chat-handoff.md`

Updated:

- `index.html`
- `account.html`
- `styles.css`
- `server.js`
- `vercel.json`
- `sitemap.xml`
- `README.md`
- nav links across public pages

Note: `api/email-report.js`, `support.html`, and parts of `legal.html` had pre-existing support-email changes before the dashboard work. Do not overwrite them casually.

## Verification Already Run

Checks passed:

```bash
/Users/kalebgamez/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check assets/client.js
/Users/kalebgamez/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check assets/dashboard.js
/Users/kalebgamez/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check server.js
git diff --check
```

Routes verified locally:

- `/` 200
- `/marketing-platform` 200
- `/dashboard` 200
- `/account` 200
- `/run-report` 200
- `/pricing` 200
- `/tracker.js` 200
- `/api/track` accepts sample events

## Suggested Next Work

1. Open the new chat in `/Users/kalebgamez/Documents/Marketing and sales/builderrank-app`.
2. Review visual design of `/marketing-platform`, `/dashboard`, and `/account`.
3. Make the public pages more polished and closer to HotelRank's clean SaaS dashboard style.
4. Decide whether `/dashboard` should remain public preview or become an authenticated-only page.
5. Build actual Supabase tables from `docs/ai-dashboard-schema.sql`.
6. Store `/api/track` events instead of only acknowledging them.
7. Add a beta onboarding form for business, website, job type, market, competitors, and tracking install status.

