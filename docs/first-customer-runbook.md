# Builder Rank First Customer Runbook

Use this checklist when manually onboarding a general contractor or service business into the Builder Rank Marketing Engine.

## Goal

Get the customer from "interested" to "reviewing live dashboard data" with as little friction as possible.

The first beta customer should see:

- A connected Builder Rank account.
- Site Signal installed on their website.
- At least one page-view test and one lead-event test.
- AI visibility checks imported for their highest-value services.
- Competitors and profit centers loaded.
- A Punch List of recommended actions.
- A customer dashboard link they can revisit.

## 1. Collect Intake

Required:

- Business name.
- Website URL.
- Market or service area.
- Main trade or business category.
- Contact name, email, and phone.
- Website platform or install method.
- Top services or profit centers.
- Top competitors.
- Customer goal.

For signed customers, send the customer to:

```text
https://builderrank.io/onboarding-intake
```

This page should be used after a 6-month or 12-month agreement is signed, or while signature is pending after a demo. The intake stores the contract term, contact details, dashboard users, website access notes, Google Business Profile access notes, CRM/form tracking notes, competitors, services, and customer goal for internal onboarding.

Good customer goal examples:

- More bathroom remodel leads.
- More roofing calls after storms.
- Better emergency HVAC visibility.
- More water damage restoration jobs.
- More kitchen remodel projects in a specific city.

## 2. Bootstrap Workspace

Open `/admin-beta`, enter the admin token, review the submitted client intake in the workspace summary, and fill out Bootstrap customer.

Confirm the response includes:

- Site Signal ID.
- Tracking snippet.
- Dashboard URL.
- Account URL.
- Tracking health URL.
- WordPress plugin path.
- Job type count.
- Competitor count.
- Starter prompt count.
- Punch List recommendation count.

Copy the Site Signal ID into the customer handoff notes.

## 3. Install Site Signal

Install either:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_customer_site_id" async></script>
```

Or the WordPress plugin:

```text
integrations/wordpress/builder-rank-site-signal.php
```

Install notes:

- Use the customer production domain, not a staging domain.
- Keep logged-in admin visits out of tracking when possible.
- Test from logged-out or incognito mode.
- Use the exact Site Signal ID returned by `/admin-beta`.

## 4. Run Site Signal QA

In `/admin-beta`, use Test Site Signal.

Send:

- One page view.
- One lead event: quote click, phone click, form submit, or email click.

The response should show:

- `stored: true`
- `qaStatus: "stored"`
- Matching expected and received domain.

Do not review the dashboard with a customer if:

- Events are not stored.
- The domain does not match.
- There is no lead-event QA.
- The workspace is still unclaimed.

## 5. Import AI Visibility Checks

For each priority service, run prompts in ChatGPT, Gemini, and Claude.

Example prompts:

- best bathroom remodeler in Denver
- who should I hire for a kitchen remodel near me
- licensed roofer for hail damage in Denver
- emergency AC repair company open now near me
- water damage restoration company near me

Capture:

- Platform.
- Model if visible.
- Prompt.
- Job type.
- Whether the customer was mentioned.
- Rank or position.
- Mention text.
- Answer summary.
- Sources or cited domains.
- Recommended fix.

Use `/admin-beta` -> Import weekly run to save each prompt result.

## 6. Customer Account Connection

Have the customer create or log into a free Builder Rank account.

Then:

- Open `/dashboard?siteId=br_customer_site_id`.
- Connect the Site Signal ID.
- Confirm the dashboard shows live workspace status.
- Confirm unrelated demo/customer data is not visible.
- Confirm report history appears if the customer has saved reports.

## 7. Customer Review Call

Recommended agenda:

1. Explain Site Signal and confirm the website is connected.
2. Show Visibility Blueprint.
3. Show Competition.
4. Show Sources and Citations.
5. Show Leads & Events.
6. Show Landing Pages.
7. Review the Punch List.
8. Pick the first 2-3 tasks to complete.
9. Ask what they wish they could see weekly.

Positioning:

Builder Rank shows how AI tools read, rank, and recommend the business, then turns those insights into a marketing Punch List.

## 8. Go / No-Go Checklist

Go when:

- Workspace is created.
- Site Signal ID exists.
- Tracking snippet or WordPress plugin is installed.
- Page-view QA is stored.
- Lead-event QA is stored.
- Domain QA matches the customer website.
- At least three competitors are loaded.
- At least one AI visibility run is imported.
- Punch List tasks are seeded.
- Customer account is connected.
- Dashboard is scoped to the customer workspace.

No-go when:

- Site Signal is stale.
- Events are not stored.
- Domain mismatch exists.
- Customer has not connected their account.
- No AI visibility checks have been imported.
- No lead-event QA has been captured.
- Demo data is still visible in a live customer workspace.

## 9. Follow-Up After Review

Within 24 hours:

- Send the dashboard link.
- Send the top Punch List tasks.
- Confirm which fixes Builder Rank should start.
- Schedule the next weekly AI visibility check.
- Record customer feedback in HubSpot.

## 10. Internal Notes

First beta customers should be white-glove. The goal is not perfect automation yet. The goal is to prove that real contractors and service businesses understand the dashboard, trust the data, and want the Punch List executed.
