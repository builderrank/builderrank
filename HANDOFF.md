# Builder Rank Handoff

Last saved: 2026-05-29

## Current state

- Live site: https://builderrank.vercel.app
- GitHub repo: https://github.com/builderrank/builderrank
- Stripe Payment Link: https://buy.stripe.com/5kQeVd0Gdb1UaRu7AQ8bS00
- Stripe after-payment setting is configured to skip the Stripe confirmation page and redirect customers to:

```text
https://builderrank.vercel.app/?checkout=success#report-workspace
```

## Latest local changes

- The one-page site was split into separate public pages:
  - `/`
  - `/why-geo`
  - `/pricing`
  - `/run-report`
  - `/account`
- Vercel routing now maps those clean paths to their HTML pages.
- The report workspace moved to `/run-report`.
- The account page is a placeholder customer portal for the next phase: login, purchased report history, and saved exports.
- `assets/client.js` is now safe to load on non-report pages.
- If Stripe still redirects to `/?checkout=success#report-workspace`, the home page sends the customer forward to `/run-report?checkout=success#report-workspace`.
- Buy buttons save the entered website and market in browser storage before sending customers to Stripe.
- Returning from Stripe with `?checkout=success#report-workspace` restores the saved website and market.
- The report workspace shows a `Payment received` notice and `Run Paid Report` button.
- The paid report button disables while an audit is already running.
- README documents the Stripe redirect URL.

## Verification

- Local clean pages returned 200 at `/`, `/why-geo`, `/pricing`, `/run-report`, and `/account`.
- Local checkout return state was tested at `http://localhost:4174/run-report?checkout=success#report-workspace`.
- The old Stripe return URL `/?checkout=success#report-workspace` redirects locally to `/run-report?checkout=success#report-workspace`.
- A paid-return simulation restored the saved report details.
- `Run Paid Report` successfully submitted a real audit against `http://localhost:4174/sample-contractor.html`.
- Stripe edit screen was reopened and showed the redirect URL above in the after-payment redirect field.

## Next steps

- Deploy the multi-page customer journey to GitHub/Vercel.
- Update Stripe after-payment redirect to:

```text
https://builderrank.vercel.app/run-report?checkout=success#report-workspace
```

- Choose auth/database stack for real accounts and saved reports.
- Add a pre-payment or post-payment intake step for website, market, and customer email.
- Store completed reports server-side and show them on `/account`.
