# Builder Rank Private Beta Implementation Plan

## Product Ladder

Builder Rank should keep the current one-time paid report as the entry product and introduce the AI Visibility Dashboard as the private beta subscription.

Recommended ladder:

1. $49 one-time GEO report.
2. Private beta dashboard for selected contractors.
3. Monthly subscription once tracking, prompt history, and recommendations are reliable.

## Beta Promise

The private beta should promise one clear outcome:

> We will track whether AI assistants recommend you for the jobs you most want, show who is beating you, and tell you what to fix.

## Beta Setup Flow

1. Create customer account.
2. Add business name and website URL.
3. Select primary trade.
4. Select top profit job type.
5. Select service market.
6. Add 3-5 competitors.
7. Install tracking script.
8. Start weekly prompt tracking.
9. Review visibility, links, leads, and recommendations.

## Manual First, Automated Later

### Manual Beta Version

The first private beta can be partly manual:

- Customer enters business, job type, market, and competitors.
- Builder Rank creates prompt set.
- Internal team runs prompts weekly across ChatGPT, Gemini, Claude, and Perplexity.
- Results are entered into the dashboard tables.
- Tracking script collects website events.
- Recommendations are generated manually or semi-manually.

This keeps the product sellable before every automation is perfect.

### Automated Version

Automate once patterns are clear:

- Scheduled prompt runner.
- AI response parser.
- Source/link classifier.
- Competitor/entity matcher.
- Perception scorer.
- Recommendation generator.
- Weekly email summaries.

## Prompt Tracking Method

Each job type needs a stable prompt library so month-over-month changes mean something.

Example bathroom remodeling library:

- best bathroom remodeler in {market}
- luxury bathroom renovation company near me
- contractor for walk-in shower conversion in {market}
- aging-in-place bathroom remodel contractor in {market}
- bathroom remodel cost in {market}
- licensed contractor for tile shower remodel near me

Each prompt should run across:

- ChatGPT
- Gemini
- Claude
- Perplexity
- Copilot later
- Google AI Mode / AI Overviews where measurable later

## Tracking Script Install Priority

### First: Universal Script

Use:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_12345" async></script>
```

This works for almost every site builder and keeps support simple.

### Second: WordPress Plugin

Most contractors use WordPress. First plugin should:

- Store the `site_id`.
- Inject the script sitewide.
- Detect Contact Form 7, Gravity Forms, WPForms, Elementor forms.
- Track phone clicks and quote buttons.
- Show connection status.

### Third: Google Tag Manager

GTM is the easiest agency install path:

- Add Builder Rank custom HTML tag.
- Fire on all pages.
- Add click triggers for phone, quote, estimate, schedule.
- Add form submit triggers.

### Fourth: Squarespace / Wix / Webflow Guides

Use simple code injection instructions first.

### Fifth: Shopify Custom Pixel

Shopify is useful for service brands with ecommerce-style quote flows, but it is probably lower priority than WordPress/GTM/Squarespace for GCs.

## Data Needed For Dashboard

Minimum viable dashboard data:

- Business profile
- Job type
- Market
- Competitors
- Prompt runs
- Mention yes/no
- Ranking position
- Competitors mentioned
- Links and source domains
- Website events
- Lead events
- Recommendations

## First Subscription Dashboard Views

1. Overview
   - Visibility Score
   - Mention Rate
   - Average Rank
   - AI-Sourced Leads
   - Top job type
   - Top source

2. Job Type
   - Selected profit centers
   - Prompt performance by job type
   - Best and worst prompts
   - Recommendations by job type

3. Competitors
   - Who appears above the client
   - Competitor mention rate
   - Competitor source domains
   - Direct website vs directory wins

4. Sources
   - Direct website
   - Google Business Profile
   - Yelp
   - Angi
   - HomeAdvisor
   - Houzz
   - BBB
   - BuildZoom
   - YouTube
   - Reddit
   - Local blogs

5. Leads
   - AI-referred sessions
   - Phone clicks
   - Form submits
   - Quote clicks
   - Landing pages
   - Conversion by job type

6. Recommendations
   - Service page fixes
   - Schema fixes
   - FAQ additions
   - Review/reputation gaps
   - Directory/source gaps
   - Google Business Profile tasks

## Scoring Draft

AI Visibility Score can start as:

- 35% mention rate
- 25% average rank
- 15% direct website link share
- 10% source authority
- 10% perception score
- 5% lead conversion signal

This should be adjustable as real data comes in.

## Important Caveat

AI traffic attribution will never be perfect. Some AI tools do not pass referrers consistently. Builder Rank should label sessions clearly:

- Confirmed AI referral
- UTM-tagged AI campaign
- Probable AI-assisted session
- Ordinary referral/search/direct

That honesty will build trust.

