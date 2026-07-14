# Builder Rank AI Visibility Dashboard Blueprint

## HotelRank Parameters To Translate

HotelRank's public site positions the product around AI visibility for hotels. Publicly visible features include:

- AI Visibility Score
- Mention Trend
- Ranking vs competitors
- Platform performance across ChatGPT, Gemini, Perplexity, and other models
- Hotel mentions
- Multi-hotel tracking
- Visibility Index
- Direct website vs OTA link analysis
- Average ranking
- Competitor comparison
- Monthly trend
- AI perception scoring
- Strengths and weaknesses
- Attribute scoring over time
- Custom attributes
- Persona/topic prompt libraries
- Category benchmarking
- Source and citation analysis
- Optimization modules such as FAQ, social, Reddit/Wikipedia-style source optimization, schema, and website structure

## Builder Rank Translation

Builder Rank should apply the same operating model to general contractors and service businesses:

- AI Visibility Score becomes Contractor Visibility Score.
- Hotel mentions become Business Mentions.
- OTA vs direct links becomes Direct Website vs Directory/GBP/Review Site links.
- Traveler personas become homeowner, investor, property manager, luxury buyer, emergency repair, insurance claim, and budget-conscious personas.
- Hotel types become job types, such as bathroom remodeling, kitchen remodeling, roofing, HVAC, restoration, siding, windows, plumbing, electrical, decks, and additions.
- Hotel perception becomes AI perception of trust, quality, speed, specialty, local proof, licensing, warranty, price/value, communication, and project proof.
- Competitor hotels become local service competitors in the same trade and market.

## Core Builder Rank Modules

### 0. HotelRank-Style Analytics Layer

The contractor dashboard should track the same metric families HotelRank exposes, translated into the
service-business world:

- Business Mentions: whether the contractor is recommended by AI assistants.
- Mention Trend: week/month movement in AI recommendation frequency.
- Ranking vs Competitors: position against tracked local competitors.
- Multi-Location Tracking: multiple markets, branches, or service areas.
- Visibility Index: combined score across mentions, rank, platforms, links, and perception.
- Direct vs Directory: direct website links vs Google Business Profile, directory, review, and social links.
- Average Ranking: average position across stable prompts.
- Platform Performance: ChatGPT, Gemini, Claude, Perplexity, Copilot, and Google AI where measurable.
- Competitor Comparison: score, mention rate, link share, source coverage, and perception gaps.
- Monthly Trend: directional visibility and lead movement.
- Perception Score: how AI describes trust, quality, price/value, availability, and specialty.
- Strengths & Weaknesses: AI-generated pros/cons vs competitors.
- Custom Attributes: user-defined scoring dimensions like luxury bathrooms, insurance claims, or emergency availability.
- Attributes Over Time: trend lines for each perception attribute.

### 1. Client Workspace

Each customer needs a private workspace with:

- Business name
- Website URL
- Primary trade
- Selected job types
- Service areas
- Competitors
- Tracking script status
- Connected analytics status

### 2. Job Type Optimizer

This should be a first-class setup step:

> What job do you make the most money on and want AI to recommend you for?

Examples:

- Bathroom remodeling
- Kitchen remodeling
- Home additions
- Roof replacement
- Emergency HVAC
- Water damage restoration
- Electrical panel upgrades
- Plumbing repair

The selected job type controls the prompt library, dashboard filters, recommendations, and reporting.

### 3. Prompt Library

Prompt formula:

> [intent] + [job type] + [market] + [persona or constraint]

Examples:

- best bathroom remodeler in Denver
- luxury bathroom renovation company near me
- contractor for walk-in shower conversion in Denver
- aging-in-place bathroom remodel contractor
- roof replacement company that works with insurance in Phoenix

Prompt runs should be stable over time so month-over-month trends mean something.

### 4. AI Prompt Monitoring

For each prompt run, store:

- Prompt text
- Job type
- Market
- Platform/model
- Run date
- Business mentioned yes/no
- Mention exactness
- Ranking position
- Competitors mentioned
- Links included
- Source/citation domains
- Direct website link yes/no
- Directory/GBP/review link yes/no
- Sentiment/perception
- Recommended next action

### 5. Link Destination Analysis

Contractor equivalent of HotelRank's direct-vs-OTA analysis:

- Direct contractor website
- Google Business Profile
- Yelp
- Angi
- HomeAdvisor
- Houzz
- Thumbtack
- BBB
- BuildZoom
- Porch
- Facebook
- Reddit
- YouTube
- Local publications
- Competitor website
- No link

### 6. AI Perception Analysis

Score each contractor by job type across attributes:

- Specialty authority
- Project proof
- Local proof
- Review quality
- Licensing and insurance clarity
- Warranty clarity
- Speed and availability
- Price/value clarity
- Communication reputation
- Service-area confidence

### 7. Website Tracking

Install a universal script:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_12345"></script>
```

Captured events:

- Page view
- Landing page
- Referrer
- UTM parameters
- AI source classification
- Phone click
- Form start
- Form submit
- Quote request
- Chat click
- Session ID
- Probable AI-assisted session

### 8. CMS Install Paths

WordPress:

- Builder Rank plugin
- Header/footer script injection
- Form plugin listeners for Contact Form 7, Gravity Forms, WPForms, Elementor

Shopify:

- Customer events custom pixel
- Theme app extension where needed
- Lead/product inquiry events for service businesses

Squarespace:

- Settings > Advanced > Code Injection
- Header script
- DOM listeners for Squarespace forms and phone links

Wix:

- Custom Code injection
- Velo integration later

Webflow:

- Project custom code
- Form submission listener

Google Tag Manager:

- Builder Rank tag
- All-pages trigger
- Phone/form/quote triggers

## MVP Build Order

1. Add dashboard preview to existing Builder Rank app.
2. Add private beta setup form for business, website, job type, market, competitors.
3. Store workspace data in Supabase.
4. Add prompt run tables.
5. Add scheduled prompt runner for ChatGPT, Gemini, Claude, Perplexity.
6. Add response parser for mentions, ranks, links, sources, competitors, and perception.
7. Add tracker ingestion endpoint.
8. Add WordPress install path first.
9. Add Squarespace/GTM instructions next.
10. Add Shopify custom pixel later if ecommerce/service stores need it.

## Positioning

Builder Rank is not generic SEO.

Builder Rank should be sold as:

> Choose the jobs you want most. Builder Rank shows whether AI assistants recommend you for them, who is beating you, and what to fix.
