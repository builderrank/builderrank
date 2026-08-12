# Meta AI Visibility for Builder Rank

## Product concept

Add Meta AI as another answer engine in Builder Rank's AI Visibility system.

The feature should answer questions such as:

> When someone asks Meta AI inside Instagram, "Who are the best bathroom remodelers in Denver?", does the customer appear, where do they appear, what does Meta say, and what can improve their visibility?

Meta AI should sit alongside ChatGPT, Gemini, and Claude in Builder Rank's monitoring experience.

## Core measurements

- Whether the customer is mentioned
- Position in the recommendation
- Share of voice across tracked prompts
- Competitors mentioned
- Description and sentiment
- Services associated with the business
- Geographic relevance
- Sources or evidence referenced
- Changes between monitoring periods
- Recommended optimization actions

Example:

| Prompt | Meta AI result |
| --- | --- |
| Best bathroom remodelers in Denver | Customer not mentioned |
| Denver design-build remodeling companies | Mentioned #4 |
| Contractor for a luxury bathroom renovation | Mentioned #2 |
| Reliable bathroom contractor near Lakewood | Not mentioned |
| Accessible bathroom renovation Denver | Mentioned #1 |

Builder Rank can calculate a Meta Visibility Score based on presence, prominence, accuracy, competitive share, and prompt coverage.

## Data collection strategy

Use two explicitly labeled measurement modes. Testing Meta's developer model is not necessarily identical to testing the consumer Meta AI experience inside Instagram.

### 1. Meta AI benchmark monitoring

Run the customer's prompt library through Meta's Model API with web-search grounding.

This provides scalable, repeatable monitoring:

- The same prompts can be tested every week.
- Location context can be controlled.
- Results can be compared consistently against competitors.
- Businesses, rankings, descriptions, and sources can be extracted into structured data.
- It creates less operational risk than automating consumer Instagram accounts.

This result should be labeled **Meta AI Benchmark**, because it does not prove that every Instagram user will receive the identical answer.

Meta Model API overview: <https://ai.meta.com/llama>

### 2. Instagram Meta AI spot checks

Add a smaller consumer-surface validation workflow for actual Meta AI results inside Instagram:

1. Builder Rank provides an internal analyst or authorized customer with a controlled set of prompts.
2. The prompts are tested in Meta AI inside Instagram.
3. The answers are captured or submitted through a verification workflow.
4. Builder Rank parses the answers and compares them with the API benchmark.

Avoid large-scale automated Instagram account scraping until Meta confirms that the method and access pattern are permitted. Consumer answers may also vary according to account history, location, conversation context, model version, and Meta product surface.

The dashboard should distinguish between:

- Meta API benchmark
- Verified Instagram result
- Last verification date
- Location and profile context used for verification

## Prompt monitoring system

Builder Rank should generate a prompt matrix from every customer's services and markets rather than monitoring only one phrase.

Example prompts:

- Best bathroom remodelers in Denver
- Who should I hire to renovate a bathroom in Denver?
- Luxury bathroom remodeling companies near Cherry Creek
- Affordable bathroom renovation contractor in Lakewood
- Design-build contractors for an aging-in-place bathroom
- Compare the customer with a named competitor
- Is the customer a reputable contractor?
- What services does the customer provide?

Track different prompt categories separately:

- Discovery
- Comparison
- Reputation
- Service
- Location
- High intent
- Branded
- Unbranded

A business can perform well for branded questions while being absent from unbranded discovery.

## Customer optimization tools

Builder Rank cannot guarantee or directly set Meta AI rankings. It can improve the evidence Meta is likely to find and understand.

Create a **Meta Optimization Center** covering:

- Instagram professional-account name, category, bio, and location
- Facebook Page category, services, description, and contact information
- Consistent business identity across Instagram, Facebook, the website, and directories
- Service-and-location content on the customer's website
- `LocalBusiness`, `Contractor`, and `Service` structured data
- Project posts that clearly identify the service and location
- Customer reviews containing genuine service and location context
- Third-party mentions from credible local sources
- Accurate licensing, service-area, and contact information
- Strong internal linking among service, location, and project pages

For every missed prompt, Builder Rank should identify the likely evidence gap. For example:

> Meta AI associates your business with general contracting but not bathroom remodeling. Your Instagram bio, Facebook services, and primary website headings do not consistently describe bathroom remodeling in Denver.

Builder Rank can then create controlled, customer-approved actions:

- Suggested Instagram bio
- Suggested Facebook Page description
- Service-page content brief
- Local project-post ideas
- Structured-data changes
- Citation-building opportunities
- Business-information corrections

Customers should approve changes. Builder Rank should not automatically rewrite business profiles during the initial release.

## Proposed scoring model

Suggested initial Meta Visibility Score:

- 35% prompt coverage
- 25% recommendation prominence
- 15% geographic and service accuracy
- 15% share of voice against competitors
- 10% answer sentiment and factual accuracy

Keep source strength as a separate diagnostic until Meta's citations are consistent enough to score reliably.

## Recommended rollout

1. Add Meta's grounded Model API as a clearly labeled benchmark.
2. Reuse Builder Rank's existing prompt, entity, competitor, and recommendation pipeline.
3. Add manual or authorized consumer-result verification.
4. Build Meta-specific optimization recommendations.
5. Compare benchmark results with verified Instagram answers.
6. Advertise Instagram Meta AI monitoring only after the consumer validation layer is operating.

## Suggested positioning

> See whether Meta AI recommends your business across Facebook and Instagram discovery questions—and improve the business signals influencing those answers.

This is more defensible than claiming Builder Rank can directly control Meta AI rankings.

## Key implementation principle

Keep benchmark measurements and verified consumer-surface observations distinct. That makes the feature scalable without overstating what the data proves.
