# Builder Rank Link Glossary

Use this as the saved map for public pages, customer pages, admin pages, demo targets, APIs, and launch docs.

## Public Website

- Home: `https://builderrank.io/`
- Marketing Platform: `https://builderrank.io/marketing-platform`
- Pricing: `https://builderrank.io/pricing`
- Run AI Report Card: `https://builderrank.io/run-report`
- Why GEO: `https://builderrank.io/why-geo`
- Support: `https://builderrank.io/support`
- Legal: `https://builderrank.io/legal`
- Privacy: `https://builderrank.io/privacy`
- Terms: `https://builderrank.io/terms`

## Customer Portal

- Account and report history: `https://builderrank.io/account`
- Marketing dashboard: `https://builderrank.io/dashboard`
- Dashboard with a known Site Signal ID: `https://builderrank.io/dashboard?siteId=br_customer_site_id`
- Client onboarding intake: `https://builderrank.io/onboarding-intake`
- First customer runbook page: `https://builderrank.io/first-customer-runbook`
- Downloadable onboarding doc: `https://builderrank.io/docs/first-customer-runbook.md`

## Admin And Launch Ops

- Admin beta control panel: `https://builderrank.io/admin-beta`
- Launch readiness API: `https://builderrank.io/api/launch-readiness`
- Workspace bootstrap API: `https://builderrank.io/api/bootstrap-workspace`
- AI visibility import API: `https://builderrank.io/api/import-ai-visibility`
- Tracking health API: `https://builderrank.io/api/tracking-health?staleHours=24`
- Site Signal test/ingest API: `https://builderrank.io/api/track`
- Customer dashboard data API: `https://builderrank.io/api/dashboard-data`
- Customer site claim API: `https://builderrank.io/api/connect-site`

## Fake Demo Customer

- Demo contractor website: `https://builderrank.io/demo-remodeler`
- Local demo contractor website: `http://localhost:4174/demo-remodeler`
- Demo business: `Front Range Remodels`
- Demo Site Signal ID: `br_demo_front_range_remodels`
- Demo priority service: `Bathroom remodeling`
- Demo payload: `docs/demo-remodeler-customer.json`

## Local Development

- Local app: `http://localhost:4174`
- Local Marketing Platform: `http://localhost:4174/marketing-platform`
- Local Dashboard: `http://localhost:4174/dashboard`
- Local Admin Beta: `http://localhost:4174/admin-beta`
- Local Onboarding Intake: `http://localhost:4174/onboarding-intake`
- Local fake customer site: `http://localhost:4174/demo-remodeler`

Run locally with:

```bash
PORT=4174 /Users/kalebgamez/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

## Repo Docs And Scripts

- Production beta launch checklist: `docs/production-beta-launch-checklist.md`
- First beta customer template: `docs/first-beta-customer-template.md`
- First beta sample payload: `docs/first-beta-customer.sample.json`
- Demo remodeler payload: `docs/demo-remodeler-customer.json`
- WordPress plugin: `integrations/wordpress/builder-rank-site-signal.php`
- WordPress install docs: `integrations/wordpress/README.md`

Useful checks:

```bash
npm run preflight:beta
npm run smoke:production
npm run production:readiness
npm run supabase:schema-check
npm run customer:dry-run -- docs/demo-remodeler-customer.json
```
