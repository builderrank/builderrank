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

- Buy buttons save the entered website and market in browser storage before sending customers to Stripe.
- Returning from Stripe with `?checkout=success#report-workspace` restores the saved website and market.
- The report workspace shows a `Payment received` notice and `Run Paid Report` button.
- The paid report button disables while an audit is already running.
- README documents the Stripe redirect URL.

## Verification

- Local checkout return state was tested at `http://localhost:4174/?checkout=success#report-workspace`.
- A paid-return simulation restored the saved report details.
- `Run Paid Report` successfully submitted a real audit against `http://localhost:4174/sample-contractor.html`.
- Stripe edit screen was reopened and showed the redirect URL above in the after-payment redirect field.

## Next steps

- Deploy the committed local changes to GitHub/Vercel.
- Run a real low-risk payment test and confirm the customer lands back on the Builder Rank report workspace.
- Add a more intentional pre-payment workflow for website, market, and customer email.
- Add report delivery/history so reports are not only browser-local.
