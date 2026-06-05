# Builder Rank Handoff

Last saved: 2026-06-05

## Current state

- Live site: https://builderrank.io
- Fallback Vercel URL: https://builderrank.vercel.app
- GitHub repo: https://github.com/builderrank/builderrank
- Stripe Payment Link: https://buy.stripe.com/5kQeVd0Gdb1UaRu7AQ8bS00
- Stripe after-payment setting is configured to skip the Stripe confirmation page and redirect customers to:

```text
https://builderrank.io/run-report?checkout=success#report-workspace
```
- Supabase Auth is connected for customer accounts.
- Supabase `reports` table saves completed reports for authenticated users.
- Google Workspace Gmail is active for `kaleb@builderrank.io`.
- HubSpot portal ID: `246390543`.
- HubSpot personal email connection is enabled for `kaleb@builderrank.io`.
- HubSpot tracking is installed on the live Builder Rank pages.
- Stripe webhook destination is active:
  - Destination ID: `we_1Tee1zGxlRL6ZAPVGqCYBEWg`
  - Endpoint URL: `https://builderrank.io/api/stripe-webhook`
  - Event: `checkout.session.completed`
- `STRIPE_WEBHOOK_SECRET` is configured in Vercel Production and Preview.

## Latest local changes

- The one-page site was split into separate public pages:
  - `/`
  - `/why-geo`
  - `/pricing`
  - `/run-report`
  - `/account`
- Vercel routing now maps those clean paths to their HTML pages.
- The report workspace moved to `/run-report`.
- The account page includes customer login, account creation, password reset, profile summary, sign out, and purchased report history.
- `assets/client.js` is now safe to load on non-report pages.
- If Stripe still redirects to `/?checkout=success#report-workspace`, the home page sends the customer forward to `/run-report?checkout=success#report-workspace`.
- Run Report requires login before checkout.
- Phone number is collected and validated during account creation and again before checkout/report purchase for existing accounts without a saved phone.
- Buy buttons send customers to the report workspace unless the report form is ready for checkout.
- Report checkout saves the entered website and market in browser storage before sending customers to Stripe.
- Pending checkout and saved report history include the captured phone number when available.
- Returning from Stripe with `?checkout=success#report-workspace` restores the saved website and market.
- The report workspace shows a `Payment received` notice and `Run Paid Report` button.
- The paid report button disables while an audit is already running.
- Completed reports save to Supabase when the user is authenticated, with browser history as a fallback.
- Stripe checkout URLs include `prefilled_email`, `client_reference_id`, and checkout UTM parameters for reconciliation.
- `/api/stripe-webhook` records `checkout.session.completed` events to the private Supabase `purchases` table when Stripe and Supabase service-role environment variables are configured.
- The report workspace includes an `Email Report` action that sends a summary email with JSON attachment when Resend and Supabase service-role environment variables are configured.
- Report email defaults now use `Builder Rank <kaleb@builderrank.io>` with replies routed to `kaleb@builderrank.io`.
- Pricing and checkout copy now describe the one-time $49 Stripe purchase, report return flow, and support email.
- `/api/hubspot-account` syncs authenticated account profiles into HubSpot contacts/companies when `HUBSPOT_ACCESS_TOKEN` is configured.
- `/api/stripe-webhook` also creates HubSpot purchase deals when `HUBSPOT_ACCESS_TOKEN` is configured.
- HubSpot tracking script `https://js-na2.hs-scripts.com/246390543.js` is included on the public HTML pages.
- `supabase-setup.sql` documents the production `reports` RLS policies, `checkout_reference` column, and private `purchases` table.
- `supabase-setup.sql` includes `phone` on `reports` and `customer_phone` on `purchases` for HubSpot/customer follow-up sync.
- README documents the current Stripe redirect URL, Supabase environment variables, Stripe webhook, and report email setup.

## Verification

- Local clean pages returned 200 at `/`, `/why-geo`, `/pricing`, `/run-report`, and `/account`.
- Local checkout return state was tested at `http://localhost:4174/run-report?checkout=success#report-workspace`.
- The old Stripe return URL `/?checkout=success#report-workspace` redirects locally to `/run-report?checkout=success#report-workspace`.
- A paid-return simulation restored the saved report details.
- `Run Paid Report` successfully submitted a real audit against `http://localhost:4174/sample-contractor.html`.
- On 2026-06-04, local route checks passed at `http://localhost:4176` for `/`, `/pricing`, `/run-report`, and `/account`.
- On 2026-06-04, local `Email Report` returned the expected not-configured response when Resend env vars were absent.
- On 2026-06-04, local Stripe webhook ignored a non-checkout event successfully.
- On 2026-06-04, local sample audit returned `89` / `A-` and all three model analyses completed.
- On 2026-06-04, an unauthenticated Supabase REST select against `reports` returned no report rows.
- Stripe edit screen was updated to show the `/run-report` redirect URL above in the after-payment redirect field.
- On 2026-06-04, `builderrank.io` served the HubSpot tracking script.
- On 2026-06-04, live `/api/hubspot-account` returned the expected unauthenticated API response.
- On 2026-06-04, live `/api/stripe-webhook` responded as a deployed API route.
- On 2026-06-05, live `/api/stripe-webhook` rejected unsigned requests with the expected missing Stripe signature response after `STRIPE_WEBHOOK_SECRET` was added.
- On 2026-06-04, authoritative Vercel DNS showed Google Workspace MX, SPF, DKIM, and DMARC records.
- On 2026-06-04, Google Workspace showed Gmail activated for `builderrank.io`.
- On 2026-06-04, HubSpot showed `kaleb@builderrank.io` enabled as a G Suite inbox.

## Next steps

- Verify a complete production purchase with a real Stripe checkout return.
- Verify `builderrank.io` in Resend, then add `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, and `REPORT_EMAIL_REPLY_TO` in Vercel when report email delivery is ready.
- Send a real production checkout through Stripe and confirm the matching `client_reference_id` appears in Supabase `purchases`.
- Send a report email in production after Resend is configured.
