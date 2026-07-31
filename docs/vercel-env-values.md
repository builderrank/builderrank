# Builder Rank Vercel Env Values

Use this when fixing `/api/launch-readiness` before onboarding the demo customer or a real GC/service-business customer.

## Production Required Values

Set these in Vercel for the `builderrank` project, Production environment.

```text
SUPABASE_URL=https://hosepwwflfpqgemfcafj.supabase.co
REPORT_EMAIL_FROM=Builder Rank <Support@builderrank.io>
REPORT_EMAIL_REPLY_TO=Support@builderrank.io
```

Generate these locally with `npm run production:secrets`, then add the generated values to Vercel. Do not save the generated values in this repo.

```text
ADMIN_API_TOKEN=<generated with npm run production:secrets>
TRACKING_HASH_SALT=<generated with npm run production:secrets>
```

## Production Recommended Values

```text
TRACKING_ALERT_EMAIL_TO=Support@builderrank.io
ADMIN_ALLOWED_ORIGIN=https://builderrank.io
MAX_JSON_BODY_BYTES=1000000
```

## Already Detected As Ready

As of the production readiness check on July 31, 2026, these were already ready in Vercel:

```text
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
STRIPE_WEBHOOK_SECRET
HUBSPOT_ACCESS_TOKEN
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
```

## Verification After Saving

Vercel needs a fresh production deployment after env changes. After redeploy:

```bash
curl -sS https://builderrank.io/api/launch-readiness
BASE_URL=https://builderrank.io npm run smoke:production
```

Expected launch-readiness result:

```text
required blockers: 0
```
