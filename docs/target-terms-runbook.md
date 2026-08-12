# AI Target Terms rollout

## What the feature does

- Lets each customer actively target up to two service or job phrases.
- Creates three monitored homeowner prompts for every target.
- Reports mention rate and average position across ChatGPT, Gemini, and Claude.
- Creates a linked Punch List recommendation covering service-page content, project proof, FAQs, schema, internal links, GBP services, and citations.
- Lets the customer pause or resume targets without deleting historical measurements.

Target Terms are an AI-visibility optimization control, not paid placement. Builder Rank cannot guarantee that an AI platform will mention or rank a business.

## Onboarding path

1. Collect the primary and optional secondary term in `/onboarding-intake`.
2. Apply `docs/target-terms-migration.sql` before deploying the application code.
3. Bootstrap the workspace. The admin form also accepts up to two Target Terms.
4. Import or run the initial ChatGPT, Gemini, and Claude checks.
5. Have the customer review the Target Terms and Make Changes sections in the Visibility Blueprint.
6. Only publish approved website/profile changes when Builder Rank has the required customer access and authorization.

## Customer workflow

1. Add or resume one or two terms.
2. Review measured platform coverage.
3. Select ChatGPT, Gemini, or Claude in Make Changes Across AI.
4. Approve a recommendation and start implementation.
5. Mark the work live after it has actually been published.
6. Recheck the platform and compare the new run with the previous baseline.
