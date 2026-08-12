const dashboardScenarios = {
  bathroom: {
    label: "Bathroom remodeling",
    score: 84,
    mentions: 68,
    rank: "#2.4",
    markets: 4,
    direct: 54,
    directory: 28,
    gbp: 18,
    sessions: "1,284",
    aiReferrals: 96,
    quoteEvents: 41,
    landingPage: "/bathroom-remodeling-denver",
    bestPrompt: "walk-in shower conversion",
    topSource: "ChatGPT",
    attributes: [
      ["Walk-in showers", "76%", "74%", "69%", "82%"],
      ["Luxury bathrooms", "72%", "78%", "64%", "73%"],
      ["Aging-in-place", "61%", "58%", "60%", "67%"],
      ["Tile and vanity work", "83%", "85%", "78%", "86%"],
      ["Project proof", "91%", "88%", "87%", "92%"],
      ["Warranty clarity", "64%", "62%", "59%", "70%"],
    ],
    competitors: [
      ["#1", "Mile High Bath Co.", "72%", "78%", "70%", "69%", "#1.8"],
      ["#2", "Front Range Remodels", "68%", "72%", "64%", "58%", "#2.4"],
      ["#3", "Summit Remodel Group", "61%", "66%", "58%", "55%", "#3.1"],
      ["#4", "Urban Tile & Bath", "56%", "62%", "51%", "50%", "#3.8"],
      ["#5", "Denver Design Build", "49%", "55%", "47%", "42%", "#4.5"],
    ],
    sources: [
      ["front-range-remodels.com", "Direct website", "54%", "18"],
      ["google.com/maps", "Google Business Profile", "18%", "9"],
      ["houzz.com", "Directory / review", "9%", "6"],
      ["angi.com", "Directory / review", "8%", "4"],
      ["reddit.com", "UGC / social", "6%", "3"],
      ["bbb.org", "Trust source", "5%", "2"],
    ],
    citations: [
      ["best bathroom remodeler in {market}", "Yes", "#2", "front-range-remodels.com/bathroom-remodeling", "Add more neighborhood project proof"],
      ["contractor for walk-in shower conversion in {market}", "Yes", "#2", "Google Business Profile", "Publish walk-in shower FAQ"],
      ["luxury bathroom renovation company near me", "Partial", "#4", "Houzz", "Add luxury bathroom case study"],
      ["aging-in-place bathroom remodel contractor in {market}", "No", "-", "Angi", "Create aging-in-place service page"],
    ],
    actions: [
      ["Publish bathroom remodel schema", "+4 visibility", "Add service-specific JSON-LD with service area, license, reviews, and preferred bathroom remodel URL."],
      ["Generate walk-in shower FAQ", "+6 content depth", "Create crawlable answers for cost, timeline, materials, permits, and aging-in-place questions."],
      ["Add bathroom project proof block", "+5 trust proof", "Place before/after photos, neighborhoods, scope, budget range, and testimonial language on the service page."],
      ["Update GBP bathroom services", "+3 local source", "Add walk-in showers, tile, vanities, accessibility, and luxury remodel services to the Google Business Profile."],
    ],
    segments: [
      ["High-budget remodelers", "Looking for design help, project proof, and premium finishes.", "39%"],
      ["Aging-in-place planners", "Ask about safety, accessibility, timelines, and warranty clarity.", "27%"],
      ["Fast estimate shoppers", "Compare cost ranges, reviews, and availability before calling.", "22%"],
    ],
    levers: [
      ["Service page CTA", "Move estimate button above proof blocks", "+9 leads"],
      ["Project proof", "Add before/after bathroom cards by neighborhood", "+6 mentions"],
      ["Follow-up context", "Tag walk-in shower leads for sales review", "+4 consults"],
    ],
  },
  kitchen: {
    label: "Kitchen remodeling",
    score: 78,
    mentions: 61,
    rank: "#3.1",
    markets: 3,
    direct: 47,
    directory: 35,
    gbp: 18,
    sessions: "1,036",
    aiReferrals: 74,
    quoteEvents: 33,
    landingPage: "/kitchen-remodeling-denver",
    bestPrompt: "kitchen renovation cost",
    topSource: "Gemini",
    attributes: [
      ["Design-build kitchens", "66%", "70%", "63%", "65%"],
      ["Cabinets", "72%", "74%", "67%", "75%"],
      ["Countertops", "69%", "71%", "66%", "70%"],
      ["Budget clarity", "54%", "58%", "49%", "55%"],
      ["Layout planning", "62%", "64%", "58%", "65%"],
      ["Project proof", "79%", "82%", "75%", "80%"],
    ],
    competitors: [
      ["#1", "Cabinet & Stone Studio", "74%", "79%", "72%", "71%", "#1.7"],
      ["#2", "Metro Kitchen Works", "68%", "72%", "66%", "65%", "#2.4"],
      ["#3", "Front Range Remodels", "61%", "66%", "62%", "54%", "#3.1"],
      ["#4", "HomeCraft Design", "57%", "61%", "55%", "51%", "#3.9"],
    ],
    sources: [
      ["front-range-remodels.com", "Direct website", "47%", "14"],
      ["houzz.com", "Directory / review", "15%", "8"],
      ["google.com/maps", "Google Business Profile", "18%", "6"],
      ["angi.com", "Directory / review", "12%", "5"],
      ["youtube.com", "Video source", "8%", "3"],
    ],
    citations: [
      ["best kitchen remodeler in {market}", "Yes", "#3", "front-range-remodels.com/kitchen-remodeling", "Add cabinet/countertop proof"],
      ["kitchen renovation cost in {market}", "Partial", "#4", "Houzz", "Publish kitchen cost guide"],
      ["design-build kitchen contractor near me", "Yes", "#3", "Google Business Profile", "Clarify design-build process"],
    ],
    actions: [
      ["Publish kitchen remodel schema", "+4 visibility", "Add structured data for design-build kitchen services, local service area, reviews, and estimate CTA."],
      ["Generate kitchen cost guide", "+7 content depth", "Add cost ranges for cabinets, countertops, layout changes, permits, and timeline expectations."],
      ["Add cabinet and countertop proof", "+4 trust proof", "Create project examples with materials, neighborhoods, before/after photos, and testimonial snippets."],
      ["Create layout planning FAQ", "+3 prompt coverage", "Answer island, galley, open-concept, storage, and appliance-placement questions in crawlable text."],
    ],
    segments: [
      ["Design-build buyers", "Need planning, layout guidance, scope confidence, and process clarity.", "34%"],
      ["Cabinet shoppers", "Compare materials, cabinet styles, timelines, and install proof.", "29%"],
      ["Cost researchers", "Ask AI for renovation budgets and what drives price changes.", "25%"],
    ],
    levers: [
      ["Cost guide CTA", "Pair pricing ranges with a consultation form", "+7 leads"],
      ["Design proof", "Add layout examples and cabinet/countertop galleries", "+5 mentions"],
      ["Sales routing", "Flag kitchen-cost inquiries as consultation-ready", "+3 consults"],
    ],
  },
  roofing: {
    label: "Roof replacement",
    score: 73,
    mentions: 55,
    rank: "#3.8",
    markets: 5,
    direct: 42,
    directory: 31,
    gbp: 27,
    sessions: "1,711",
    aiReferrals: 88,
    quoteEvents: 57,
    landingPage: "/roof-replacement-denver",
    bestPrompt: "hail damage roofer",
    topSource: "Perplexity",
    attributes: [
      ["Hail damage", "67%", "72%", "62%", "66%"],
      ["Insurance claims", "74%", "78%", "70%", "73%"],
      ["Material clarity", "56%", "61%", "52%", "55%"],
      ["Warranty proof", "58%", "60%", "55%", "61%"],
      ["Emergency tarp", "63%", "65%", "60%", "64%"],
    ],
    competitors: [
      ["#1", "Peak Shield Roofing", "76%", "80%", "74%", "72%", "#1.6"],
      ["#2", "StormPro Exteriors", "68%", "72%", "66%", "65%", "#2.2"],
      ["#3", "Frontline Roof Co.", "59%", "63%", "57%", "56%", "#3.1"],
      ["#4", "Front Range Remodels", "55%", "59%", "57%", "48%", "#3.8"],
    ],
    sources: [
      ["front-range-remodels.com", "Direct website", "42%", "12"],
      ["google.com/maps", "Google Business Profile", "27%", "10"],
      ["bbb.org", "Trust source", "11%", "4"],
      ["angi.com", "Directory / review", "10%", "4"],
      ["youtube.com", "Video source", "10%", "2"],
    ],
    citations: [
      ["best roof replacement company in {market}", "Yes", "#4", "Google Business Profile", "Add roof replacement page proof"],
      ["licensed roofer for hail damage near me", "Partial", "#5", "BBB", "Create hail damage claim guide"],
      ["roofing contractor that works with insurance in {market}", "Yes", "#3", "front-range-remodels.com/roofing", "Add adjuster/documentation steps"],
    ],
    actions: [
      ["Publish roof replacement schema", "+4 visibility", "Add roofing service schema with materials, warranty, insurance support, service area, and review proof."],
      ["Generate hail damage claim page", "+7 content depth", "Explain inspection, documentation, adjusters, timelines, and emergency tarp options."],
      ["Add warranty and material proof", "+5 trust proof", "Make asphalt, metal, tile, workmanship warranty, and manufacturer certification language easy to cite."],
      ["Update storm-response GBP services", "+3 local source", "Add roof inspection, hail damage, emergency tarp, and insurance claim support services."],
    ],
    segments: [
      ["Storm-damage homeowners", "Need emergency inspection, claim support, and trust proof quickly.", "41%"],
      ["Insurance claim researchers", "Ask about documentation, adjusters, timelines, and coverage.", "31%"],
      ["Warranty comparers", "Evaluate materials, workmanship promises, and certifications.", "18%"],
    ],
    levers: [
      ["Emergency phone CTA", "Prioritize call buttons on storm and roof pages", "+12 leads"],
      ["Claim guide", "Publish adjuster and documentation steps", "+7 mentions"],
      ["GBP service update", "Add hail inspection and emergency tarp language", "+5 calls"],
    ],
  },
  hvac: {
    label: "Emergency HVAC",
    score: 69,
    mentions: 49,
    rank: "#4.2",
    markets: 6,
    direct: 39,
    directory: 24,
    gbp: 37,
    sessions: "2,248",
    aiReferrals: 121,
    quoteEvents: 69,
    landingPage: "/emergency-ac-repair-denver",
    bestPrompt: "AC not cooling near me",
    topSource: "Gemini",
    attributes: [
      ["Open-now availability", "48%", "51%", "56%", "43%"],
      ["Same-day repair", "56%", "60%", "58%", "50%"],
      ["Technician proof", "62%", "65%", "59%", "62%"],
      ["Phone-first conversion", "81%", "82%", "78%", "83%"],
      ["Service-area confidence", "69%", "72%", "70%", "65%"],
    ],
    competitors: [
      ["#1", "Rapid Air Pros", "82%", "86%", "84%", "76%", "#1.4"],
      ["#2", "ComfortNow HVAC", "73%", "77%", "75%", "67%", "#2.1"],
      ["#3", "Metro Heating & Air", "62%", "67%", "63%", "56%", "#3.2"],
      ["#4", "Front Range Remodels", "49%", "53%", "61%", "43%", "#4.2"],
    ],
    sources: [
      ["google.com/maps", "Google Business Profile", "37%", "16"],
      ["front-range-remodels.com", "Direct website", "39%", "13"],
      ["angi.com", "Directory / review", "12%", "5"],
      ["yelp.com", "Directory / review", "7%", "3"],
      ["reddit.com", "UGC / social", "5%", "2"],
    ],
    citations: [
      ["emergency AC repair company in {market}", "Partial", "#4", "Google Business Profile", "Make 24/7 language explicit"],
      ["best HVAC company open now near me", "No", "-", "Yelp", "Create open-now page"],
      ["who should I call for AC not cooling", "Yes", "#4", "front-range-remodels.com/hvac", "Add no-cooling troubleshooting answers"],
    ],
    actions: [
      ["Publish emergency HVAC schema", "+5 visibility", "Add emergency service, hours, phone CTA, technician proof, and service area schema."],
      ["Generate open-now service page", "+7 content depth", "Create crawlable same-day AC repair, furnace repair, and no-cooling troubleshooting answers."],
      ["Add technician certification proof", "+4 trust proof", "Surface licenses, background checks, credentials, warranties, and response-time promises."],
      ["Update GBP emergency categories", "+3 local source", "Add emergency AC repair, same-day furnace repair, maintenance, and open-now service language."],
    ],
    segments: [
      ["Open-now emergencies", "Search for immediate phone help and same-day availability.", "46%"],
      ["Repair troubleshooters", "Ask why AC is not cooling and who to call next.", "28%"],
      ["Trust checkers", "Look for technician proof, reviews, warranties, and service areas.", "17%"],
    ],
    levers: [
      ["Phone-first layout", "Put open-now call action above the fold", "+15 calls"],
      ["Troubleshooting FAQ", "Answer no-cooling and furnace failure prompts", "+8 mentions"],
      ["Technician proof", "Surface license, badges, and response promises", "+5 leads"],
    ],
  },
  restoration: {
    label: "Water damage restoration",
    score: 76,
    mentions: 57,
    rank: "#3.3",
    markets: 4,
    direct: 44,
    directory: 26,
    gbp: 30,
    sessions: "1,892",
    aiReferrals: 117,
    quoteEvents: 76,
    landingPage: "/water-damage-restoration-denver",
    bestPrompt: "emergency flood cleanup",
    topSource: "ChatGPT",
    attributes: [
      ["Emergency cleanup", "74%", "78%", "71%", "73%"],
      ["Insurance support", "64%", "67%", "61%", "65%"],
      ["Mold after leak", "58%", "61%", "55%", "58%"],
      ["Response speed", "82%", "84%", "78%", "83%"],
      ["Documentation proof", "63%", "65%", "60%", "64%"],
    ],
    competitors: [
      ["#1", "DryRight Restoration", "78%", "82%", "76%", "75%", "#1.6"],
      ["#2", "Flood Response Team", "68%", "72%", "66%", "65%", "#2.2"],
      ["#3", "Front Range Remodels", "57%", "63%", "55%", "51%", "#3.3"],
      ["#4", "ClaimReady Repairs", "51%", "56%", "50%", "47%", "#4.0"],
    ],
    sources: [
      ["front-range-remodels.com", "Direct website", "44%", "15"],
      ["google.com/maps", "Google Business Profile", "30%", "12"],
      ["angi.com", "Directory / review", "11%", "5"],
      ["bbb.org", "Trust source", "8%", "3"],
      ["reddit.com", "UGC / social", "7%", "2"],
    ],
    citations: [
      ["water damage restoration company in {market}", "Yes", "#3", "front-range-remodels.com/restoration", "Add insurance documentation steps"],
      ["emergency flood cleanup near me", "Yes", "#2", "Google Business Profile", "Add response-time proof"],
      ["mold remediation after water leak", "Partial", "#4", "Angi", "Create mold-after-leak page"],
    ],
    actions: [
      ["Publish restoration schema", "+4 visibility", "Add emergency restoration, insurance support, service area, phone CTA, and review proof schema."],
      ["Generate insurance claim guide", "+7 content depth", "Explain documentation, adjuster coordination, mitigation, drying, and rebuild steps."],
      ["Add mold-after-leak content", "+5 prompt coverage", "Create crawlable answers for mold risk, drying timelines, testing, and remediation handoffs."],
      ["Update emergency GBP services", "+3 local source", "Add flood cleanup, water extraction, drying, mold remediation, and emergency response services."],
    ],
    segments: [
      ["Emergency cleanup callers", "Need urgent help, response time, and phone confidence.", "43%"],
      ["Insurance documentation planners", "Ask how to document damage and coordinate adjusters.", "30%"],
      ["Mold-risk researchers", "Look for drying timelines, testing, and remediation guidance.", "19%"],
    ],
    levers: [
      ["Emergency CTA", "Keep phone and dispatch language visible on every restoration page", "+14 calls"],
      ["Claim workflow", "Add mitigation, photos, and adjuster coordination content", "+7 mentions"],
      ["Mold content", "Create leak-to-mold FAQ and internal links", "+5 leads"],
    ],
  },
};

const DASHBOARD_SUPABASE_URL = "https://hosepwwflfpqgemfcafj.supabase.co";
const DASHBOARD_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tq-L9aiYVbdtij2JL3oW3Q_FBDNokzQ";

const pageCopy = {
  visibility: ["Visibility Blueprint", "How often this contractor or service business appears in AI-generated answers across platforms."],
  meta: ["Meta AI", "How this business appears when homeowners ask Meta AI for contractors and service providers across Instagram and Facebook."],
  competition: ["Competition", "See how this business ranks against local competitors based on mention rate and average AI position."],
  sources: ["Sources", "Websites, directories, GBP profiles, and review pages that AI uses when recommending local service businesses."],
  citations: ["Citations", "Prompt-level evidence showing when the direct website, GBP, or directories were cited."],
  pixel: ["Site Signal", "Connected website tracking from the installed Builder Rank script."],
  leads: ["Leads & Events", "Calls, forms, quote clicks, and probable AI-assisted website sessions."],
  pages: ["Landing Pages", "Pages receiving AI-assisted traffic and where conversion or content gaps appear."],
  actions: ["Punch List", "Approved changes that improve how LLMs read and recommend the business."],
  reviews: ["Reviews & GBP", "Reputation and local profile tasks that influence AI trust."],
  reports: ["Reports", "Saved inspections, exports, and connected tracking reports."],
};

const metricHelp = {
  "Site Signal": "The Builder Rank tracking connection installed on the customer website. Healthy means recent page and lead events are reaching the dashboard.",
  "Visibility Score": "A blended AI search health score based on mention rate, rank, platform coverage, sources, and whether AI can understand the business clearly.",
  "AI Referrals": "Website sessions that came from, or appear assisted by, AI tools such as ChatGPT, Gemini, Claude, Perplexity, and AI-tagged search experiences.",
  "AI Lead Rate": "The share of AI-assisted sessions that turn into calls, forms, quote clicks, email clicks, or other lead actions.",
  "Quote Events": "Tracked high-intent actions such as estimate clicks, quote buttons, phone calls, forms, and email clicks.",
  "Punch List": "The prioritized Builder Rank work queue: content, schema, GBP, review, and source fixes that should improve visibility and lead quality.",
  "Mention Rate": "How often the business appears when monitored homeowner prompts are checked across AI platforms.",
  "Avg. Position": "The average rank position when the business is mentioned. Lower is better, just like search results.",
  "Mention Rate by Job-Type Attribute": "Which service terms and proof points AI understands for the selected profit center.",
  "AI Job Journey": "A funnel view from AI discovery to qualified service interest, tracked lead actions, and booked consults.",
  "Homeowner Segments": "The types of buyers AI prompts appear to represent, based on monitored questions, page intent, and lead behavior.",
  "Profit Center Visibility": "How each service line performs across AI platforms, such as bathrooms, kitchens, roofing, HVAC, or restoration.",
  "Platform Visibility": "How often each AI platform mentions the business when we run the monitored prompt set.",
  "Overall Mention Rank": "Where this business ranks against the selected local competitor set in AI-generated answers.",
  "Rankings": "Competitor-by-competitor view of who AI recommends, how often, and across which platforms.",
  "Sources Share": "The mix of websites and profiles AI relies on when forming recommendations for this business and market.",
  "All Sources": "Specific domains that are being cited, used as trust signals, or sending tracked lead behavior.",
  "Prompt Citations": "Prompt-level evidence showing whether the business was mentioned, what source was cited, and what fix should improve that prompt.",
  "Connect this website": "The setup area for tying a customer website to Builder Rank using the Site Signal ID.",
  "Tracked Sessions": "Website sessions captured by Site Signal during the selected date range.",
  "Tracked Website Events": "Raw activity captured from the installed tracking script: views, calls, forms, quote clicks, email clicks, and source details.",
  "Top AI Landing Page": "The page receiving the strongest AI-assisted traffic or lead behavior.",
  "Top CTA / Form": "The call-to-action, phone link, or form with the most useful tracked intent.",
  "Highest Intent Source": "The source producing the strongest mix of sessions and lead events.",
  "Next Best Moves": "Prioritized actions generated from live website behavior, AI visibility gaps, and Punch List data.",
  "Direct lead conversion": "How Builder Rank turns AI-assisted discovery into measurable calls, forms, quote clicks, and sales-ready consults.",
  "Lead Events by Source": "Which traffic sources are producing sessions, calls, forms, quote clicks, and lead rate.",
  "Job Pipeline by Intent": "Lead and traffic activity grouped by the job type or homeowner intent Builder Rank inferred.",
  "Top CTAs & Forms": "The forms, buttons, phone links, and quote actions customers are using most often.",
  "Landing Pages": "Service and market pages receiving traffic, AI-assisted sessions, and conversion activity.",
  "Builder Rank Punch List": "Approved website and profile changes that Builder Rank can help execute for the customer.",
  "Live Change Log": "Completed Punch List work that has been marked live for this customer.",
  "Reviews & Google Business Profile Tasks": "Local trust work: reviews, GBP services, GBP posts, profile updates, and citation improvements.",
  "Reports": "Saved inspections, report history, exports, and connected tracking reviews.",
  "All platforms": "Combined performance across the monitored AI platforms.",
  "ChatGPT": "Visibility and ranking performance inside ChatGPT checks.",
  "Gemini": "Visibility and ranking performance inside Gemini checks.",
  "Claude": "Visibility and ranking performance inside Claude checks.",
  "Lead Signal": "Whether this source is connected to tracked visits, lead actions, or citation evidence.",
  "Content Gap": "The page improvement most likely to help AI understand and recommend this service.",
  "Top Intent": "The job type or buying intent inferred from page URL, CTA text, source, or event metadata.",
  "Lead Rate": "Lead events divided by sessions for this row.",
  "Meta Visibility Score": "A 0–100 score weighted across prompt coverage, recommendation prominence, service and location accuracy, competitive share of voice, and sentiment accuracy.",
  "Prompt Coverage": "The percentage of monitored Meta AI prompts in which the customer business is mentioned.",
  "Average Position": "The average order in which Meta AI recommends the business when it appears. A position closer to #1 is better.",
  "Share of Voice": "The customer's portion of observed recommendations compared with tracked local competitors in the same Meta answers.",
  "Verified Instagram": "The number of consumer Meta AI answers manually or operationally verified inside Instagram, kept separate from API benchmark runs.",
  "Measurement Health": "Whether Builder Rank has enough fresh API benchmark and verified consumer observations to make the Meta report dependable.",
  "API benchmark runs": "Repeatable prompts run through Meta's developer model API. These are useful for trends but are not claimed as exact Instagram answers.",
  "Consumer verifications": "Answers observed on an identified consumer surface such as Instagram or Facebook, with timestamp and context recorded.",
  "Service/location accuracy": "How correctly Meta AI associates the business with its actual services and service area.",
  "Source strength": "A diagnostic based on cited sources and the proportion of direct business evidence such as the company website and profiles.",
  "Prompt Category Coverage": "Mention performance grouped by discovery, comparison, reputation, service, location, high-intent, branded, and unbranded questions.",
  "Meta Prompt Results": "The individual Meta prompts, measurement mode, mention result, position, description, and captured evidence.",
  "Evidence Gaps": "Specific missing or inconsistent signals that may prevent Meta AI from understanding and recommending the business.",
  "Meta Optimization Center": "Prioritized profile, website, schema, content, review, and citation recommendations designed to strengthen Meta evidence.",
  "Make Changes": "A controlled workflow for reviewing, approving, implementing, and rechecking Meta visibility recommendations. Nothing is auto-published.",
  "AI Target Terms": "One or two customer-selected service or job phrases that Builder Rank monitors across ChatGPT, Gemini, and Claude and turns into an optimization plan.",
  "Make Changes Across AI": "A customer-approved workflow for turning ChatGPT, Gemini, and Claude visibility gaps into website, schema, content, profile, and citation work.",
};

const jobTypeSelect = document.querySelector("#jobTypeSelect");
const marketSelect = document.querySelector("#marketSelect");
const dateRangeSelect = document.querySelector("#dateRangeSelect");
const navButtons = document.querySelectorAll("[data-dashboard-tab]");
const pageTitle = document.querySelector("#dashboardPageTitle");
const pageSummary = document.querySelector("#dashboardPageSummary");
const visibilityScore = document.querySelector("#visibilityScore");
const mentionRate = document.querySelector("#mentionRate");
const mentionRateDelta = document.querySelector("#mentionRateDelta");
const averageRank = document.querySelector("#averageRank");
const overallRankMetric = document.querySelector("#overallRankMetric");
const competitorBadge = document.querySelector("#competitorBadge");
const directShareBar = document.querySelector("#directShareBar");
const directoryShareBar = document.querySelector("#directoryShareBar");
const gbpShareBar = document.querySelector("#gbpShareBar");
const sourceMixList = document.querySelector("#sourceMixList");
const visibilityBreakdownTitle = document.querySelector("#visibilityBreakdownTitle");
const visibilityBreakdownFirstColumn = document.querySelector("#visibilityBreakdownFirstColumn");
const trackedSessionsMetric = document.querySelector("#trackedSessionsMetric");
const aiReferralMetric = document.querySelector("#aiReferralMetric");
const aiLeadRateMetric = document.querySelector("#aiLeadRateMetric");
const quoteEventMetric = document.querySelector("#quoteEventMetric");
const topLandingPageMetric = document.querySelector("#topLandingPageMetric");
const bestPromptMetric = document.querySelector("#bestPromptMetric");
const topSourceMetric = document.querySelector("#topSourceMetric");
const changesLiveMetric = document.querySelector("#changesLiveMetric");
const workspaceReadinessMetric = document.querySelector("#workspaceReadinessMetric");
const workspaceReadinessDetail = document.querySelector("#workspaceReadinessDetail");
const nextOperatorActionMetric = document.querySelector("#nextOperatorActionMetric");
const nextOperatorActionDetail = document.querySelector("#nextOperatorActionDetail");
const bestOpportunityMetric = document.querySelector("#bestOpportunityMetric");
const bestOpportunityDetail = document.querySelector("#bestOpportunityDetail");
const changeControlMetric = document.querySelector("#changeControlMetric");
const changeControlDetail = document.querySelector("#changeControlDetail");
const changeLogBadge = document.querySelector("#changeLogBadge");
const builderActionList = document.querySelector("#builderActionList");
const deployedChangeList = document.querySelector("#deployedChangeList");
const reviewTaskRows = document.querySelector("#reviewTaskRows");
const reportRows = document.querySelector("#reportRows");
const accountSelector = document.querySelector(".connected-selectors button:nth-child(1) strong");
const websiteSelector = document.querySelector(".connected-selectors button:nth-child(2) strong");
const summaryConnectionMetric = document.querySelector("#summaryConnectionMetric");
const summaryConnectionDetail = document.querySelector("#summaryConnectionDetail");
const summaryVisibilityMetric = document.querySelector("#summaryVisibilityMetric");
const summaryAiReferralMetric = document.querySelector("#summaryAiReferralMetric");
const summaryAiReferralWindow = document.querySelector("#summaryAiReferralWindow");
const summaryAiLeadRateMetric = document.querySelector("#summaryAiLeadRateMetric");
const summaryQuoteMetric = document.querySelector("#summaryQuoteMetric");
const summaryActionMetric = document.querySelector("#summaryActionMetric");
const summaryActionDetail = document.querySelector("#summaryActionDetail");
const connectSiteForm = document.querySelector("#connectSiteForm");
const connectSiteIdInput = document.querySelector("#connectSiteIdInput");
const connectSiteStatus = document.querySelector("#connectSiteStatus");
const connectSiteSnippet = document.querySelector("#connectSiteSnippet");
const trackedEventsSnippet = document.querySelector("#trackedEventsSnippet");
const siteSignalStatusMetric = document.querySelector("#siteSignalStatusMetric");
const siteSignalLastEventMetric = document.querySelector("#siteSignalLastEventMetric");
const liveDashboardNotice = document.querySelector("#liveDashboardNotice");
const nextBestMoveList = document.querySelector("#nextBestMoveList");
const buyerSegmentList = document.querySelector("#buyerSegmentList");
const conversionLeverList = document.querySelector("#conversionLeverList");
const directLeadSummary = document.querySelector("#directLeadSummary");
const journeyDiscoveryMetric = document.querySelector("#journeyDiscoveryMetric");
const journeyQualifiedMetric = document.querySelector("#journeyQualifiedMetric");
const journeyLeadMetric = document.querySelector("#journeyLeadMetric");
const journeyBookedMetric = document.querySelector("#journeyBookedMetric");
const targetTermForm = document.querySelector("#targetTermForm");
const targetTermStatus = document.querySelector("#targetTermStatus");
const targetTermJobType = document.querySelector("#targetTermJobType");

let activeScenarioKey = jobTypeSelect?.value || "bathroom";
let appliedActions = [];
let dashboardSupabaseClient = null;
let currentDashboardPayload = null;
let activeAiChangePlatform = "chatgpt";
let currentAiChangeState = { platforms: [], recommendations: [], demo: true };

function renderDashboardScenario() {
  const scenario = dashboardScenarios[activeScenarioKey] || dashboardScenarios.bathroom;
  const market = marketSelect?.value || "Denver, CO";
  const actionBoost = appliedActions.length;
  const boostedScore = clamp(scenario.score + actionBoost * 2, 0, 99);
  const boostedMentions = clamp(scenario.mentions + actionBoost * 2, 0, 99);
  const boostedDirect = clamp(scenario.direct + actionBoost * 3, 0, 99);

  visibilityScore.textContent = boostedScore;
  summaryVisibilityMetric.textContent = boostedScore;
  mentionRate.textContent = `${boostedMentions}%`;
  if (mentionRateDelta) mentionRateDelta.textContent = "+12% vs last month";
  averageRank.textContent = scenario.rank;
  competitorBadge.textContent = `${Math.max(scenario.competitors.length - 1, 0)} competitors tracked`;
  trackedSessionsMetric.textContent = scenario.sessions;
  aiReferralMetric.textContent = scenario.aiReferrals + actionBoost * 5;
  summaryAiReferralMetric.textContent = scenario.aiReferrals + actionBoost * 5;
  if (summaryAiReferralWindow) summaryAiReferralWindow.textContent = `${selectedDateRangeDays()}-day assisted sessions`;
  const demoAiLeadRate = `${Math.round(((scenario.quoteEvents + actionBoost * 2) / Math.max(scenario.aiReferrals + actionBoost * 5, 1)) * 100)}%`;
  if (aiLeadRateMetric) aiLeadRateMetric.textContent = demoAiLeadRate;
  if (summaryAiLeadRateMetric) summaryAiLeadRateMetric.textContent = demoAiLeadRate;
  quoteEventMetric.textContent = scenario.quoteEvents + actionBoost * 2;
  summaryQuoteMetric.textContent = scenario.quoteEvents + actionBoost * 2;
  if (summaryConnectionDetail) summaryConnectionDetail.textContent = "Last event: demo mode";
  if (siteSignalStatusMetric) siteSignalStatusMetric.textContent = "Active";
  if (siteSignalLastEventMetric) siteSignalLastEventMetric.textContent = "Last event 2 min ago";
  topLandingPageMetric.textContent = scenario.landingPage;
  bestPromptMetric.textContent = scenario.bestPrompt;
  topSourceMetric.textContent = scenario.topSource;
  changesLiveMetric.textContent = appliedActions.length;
  summaryActionMetric.textContent = appliedActions.length;
  if (summaryActionDetail) summaryActionDetail.textContent = "Approved changes live";

  directShareBar.style.width = `${boostedDirect}%`;
  directoryShareBar.style.width = `${scenario.directory}%`;
  gbpShareBar.style.width = `${scenario.gbp}%`;
  sourceMixList.innerHTML = [
    ["Direct website", boostedDirect, "teal"],
    ["Directories & reviews", scenario.directory, "amber"],
    ["Google Business Profile", scenario.gbp, "blue"],
    ["UGC & social", 7, "purple"],
    ["Local media", 5, "pink"],
  ].map(([label, value, tone]) => `<span><i class="${tone}"></i>${label} ${value}%</span>`).join("");
  if (visibilityBreakdownTitle) visibilityBreakdownTitle.textContent = "Mention Rate by Job-Type Attribute";
  if (visibilityBreakdownFirstColumn) visibilityBreakdownFirstColumn.textContent = "Attribute";

  renderRows("#attributeMetricRows", scenario.attributes.map(([name, all, chatgpt, gemini, claude]) => [
    escapeHtml(name),
    metricWithDot(all),
    escapeHtml(chatgpt),
    escapeHtml(gemini),
    escapeHtml(claude),
  ]), { raw: true });

  renderRows("#competitorRows", scenario.competitors.map((row) => {
    const isClient = row[1] === "Front Range Remodels";
    return row.map((cell, index) => index === 2 ? metricBar(cell, isClient) : escapeHtml(cell));
  }), { raw: true, highlightText: "Front Range Remodels" });

  renderRows("#sourceRows", scenario.sources.map(([domain, type, share, pages]) => [
    `<a href="#">${escapeHtml(domain)}</a>`,
    `<span class="pill ${typeTone(type)}">${escapeHtml(type)}</span>`,
    metricBar(share, type === "Direct website"),
    `${pages} pages`,
  ]), { raw: true });

  renderRows("#citationRows", scenario.citations.map(([prompt, mentioned, rank, source, fix]) => [
    escapeHtml(prompt.replaceAll("{market}", market)),
    `<span class="pill ${mentioned === "Yes" ? "teal" : mentioned === "Partial" ? "amber" : "pink"}">${escapeHtml(mentioned)}</span>`,
    escapeHtml(rank),
    escapeHtml(source),
    escapeHtml(fix),
  ]), { raw: true });

  renderRows("#eventRows", eventRowsFor(scenario), { raw: true });
  renderRows("#leadRows", leadRowsFor(scenario), { raw: true });
  renderRows("#jobIntentRows", jobIntentRowsFor(scenario), { raw: true });
  renderRows("#ctaRows", ctaRowsFor(scenario), { raw: true });
  renderRows("#pageRows", pageRowsFor(scenario), { raw: true });
  renderAiJourney(scenario, actionBoost);
  renderBuyerSegments(scenario);
  renderConversionLevers(scenario);
  renderNextBestMoves(nextBestMovesForScenario(scenario));
  renderBuilderActions(scenario);
  renderDeployedChanges();
  renderMetaVisibility(demoMetaVisibility(scenario));
  renderTargetTerms(demoTargetTerms(scenario), [], true);
  renderAiChangeCenter([
    { platform: "ChatGPT", mentionRate: scenario.mentions - 2, runs: 8 },
    { platform: "Gemini", mentionRate: scenario.mentions + 3, runs: 8 },
    { platform: "Claude", mentionRate: scenario.mentions + 1, runs: 8 },
  ], scenario.actions.slice(0, 3).map((row) => ({ priority: "high", status: "open", title: row[0], body: row[2] })), true);
}

function initializeMetricHelp() {
  const selector = [
    ".connected-summary-strip span",
    ".connected-card h2",
    ".connected-table-card h2",
    ".connected-kpi span",
    ".connected-table-card th",
    ".connected-controls button",
    ".meta-score-grid span",
    ".meta-health-list span",
    ".meta-change-center h2",
    ".target-term-cockpit h2",
  ].join(",");

  document.querySelectorAll(selector).forEach((element) => {
    const label = normalizeHelpLabel(element.textContent);
    const help = metricHelp[label];
    if (!help || element.querySelector(".metric-help")) return;
    element.classList.add("has-metric-help");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "metric-help";
    button.setAttribute("aria-label", `${label}: ${help}`);
    button.dataset.help = help;
    button.textContent = "i";
    element.append(" ", button);
  });
}

function normalizeHelpLabel(value) {
  return String(value || "")
    .replace(/\?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function hydrateLiveDashboardData() {
  if (!window.supabase?.createClient) return;

  try {
    const token = await getDashboardAccessToken();
    if (!token) return;

    const selectedSiteId = selectedSiteIdFromUrl();
    const dashboardDataUrl = dashboardDataEndpoint(selectedSiteId);
    const response = await fetch(dashboardDataUrl, {
      headers: { authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) return;
    if (payload.mode === "empty") {
      applyEmptyDashboardState(payload);
      return;
    }
    if (payload.mode !== "live") return;
    applyLiveDashboardData(payload);
  } catch (error) {
    console.warn("Could not hydrate live dashboard data", error);
  }
}

function applyLiveDashboardData(payload) {
  currentDashboardPayload = payload;
  const business = payload.business || {};
  const summary = payload.summary || {};
  const workspace = payload.workspace || {};
  const aiVisibility = payload.aiVisibility || {};
  renderMetaVisibility(payload.metaVisibility || {});
  renderTargetTerms(payload.targetTerms || [], payload.jobTypes || [], false);
  renderAiChangeCenter(aiVisibility.platforms || [], payload.recommendations || [], false);
  const readiness = workspace.readiness || {};

  showDashboardNotice(
    readiness.ready ? "Workspace ready for beta review" : "Live workspace needs setup",
    buildLiveNoticeMessage(payload),
    readiness.ready ? "live" : "attention",
  );

  if (accountSelector && business.name) accountSelector.textContent = business.name;
  if (websiteSelector && business.website_url) {
    websiteSelector.textContent = new URL(business.website_url).hostname.replace(/^www\./, "");
  }

  if (workspace.competitorsTracked != null) {
    competitorBadge.textContent = `${workspace.competitorsTracked} competitors tracked`;
  }

  updateCommandStrip(payload);

  if (aiVisibility.visibilityScore != null) {
    visibilityScore.textContent = aiVisibility.visibilityScore;
    summaryVisibilityMetric.textContent = aiVisibility.visibilityScore;
  } else {
    visibilityScore.textContent = "0";
    summaryVisibilityMetric.textContent = "0";
  }

  if (aiVisibility.mentionRate != null) {
    mentionRate.textContent = `${aiVisibility.mentionRate}%`;
  } else {
    mentionRate.textContent = "0%";
  }
  if (mentionRateDelta) {
    const runCount = aiVisibility.completedRuns || 0;
    const freshness = aiVisibility.dataFreshness || "Waiting for first import";
    mentionRateDelta.textContent = `${freshness} · ${runCount} run${runCount === 1 ? "" : "s"}`;
  }

  if (aiVisibility.averageRank != null) {
    averageRank.textContent = `#${aiVisibility.averageRank}`;
  } else {
    averageRank.textContent = "Waiting";
  }

  renderLiveVisibilityBreakdown(aiVisibility);

  trackedSessionsMetric.textContent = summary.trackedSessions || "0";
  aiReferralMetric.textContent = summary.aiReferrals || "0";
  summaryAiReferralMetric.textContent = summary.aiReferrals || "0";
  if (summaryAiReferralWindow) summaryAiReferralWindow.textContent = `${payload.dateRange?.days || selectedDateRangeDays()}-day assisted sessions`;
  if (aiLeadRateMetric) aiLeadRateMetric.textContent = summary.aiLeadRate || "0%";
  if (summaryAiLeadRateMetric) summaryAiLeadRateMetric.textContent = summary.aiLeadRate || "0%";
  quoteEventMetric.textContent = summary.quoteEvents || "0";
  summaryQuoteMetric.textContent = summary.quoteEvents || "0";
  summaryConnectionMetric.textContent = "Live";
  updateSiteSignalUi(business, summary);
  updateLiveSourceMix(payload.sourceMix || []);
  topLandingPageMetric.textContent = summary.topLandingPage || "/";
  topSourceMetric.textContent = summary.topSource || "Direct";
  bestPromptMetric.textContent = payload.ctas?.[0]?.detail || "Waiting for CTA data";

  renderRowsOrEmpty("#eventRows", payload.events, (row) => [
    row.event,
    row.page,
    row.source,
    row.detail || "-",
    row.count,
    relativeTime(row.lastSeen),
  ], "No Site Signal events yet. Install the snippet and load the customer website once.", 6);

  renderRowsOrEmpty("#pageRows", payload.pages, (row) => [
    row.page,
    row.aiSessions,
    row.phoneClicks,
    row.forms,
    row.conversion,
    row.topJobIntent || "General",
    row.quoteClicks ? "Quote CTAs active" : "Add stronger CTA",
  ], "No landing page attribution yet. Builder Rank will populate this after tracking events arrive.", 7);

  renderRowsOrEmpty("#leadRows", payload.leads, (row) => [
    row.source,
    row.sessions,
    row.calls,
    row.forms,
    row.quoteClicks,
    row.topJobIntent || "General",
    row.leadRate,
  ], "Lead attribution will populate once Site Signal captures calls, forms, and quote clicks.", 7);

  renderRowsOrEmpty("#jobIntentRows", payload.jobIntents, (row) => [
    row.intent || "General",
    row.sessions,
    row.aiSessions,
    row.leadEvents,
    row.phoneClicks,
    row.forms,
    row.quoteClicks,
    row.leadRate,
    row.topPage || "/",
  ], "Job-intent pipeline will populate once Site Signal captures service pages, calls, forms, and quote clicks.", 9);

  renderRowsOrEmpty("#ctaRows", payload.ctas, (row) => [
    row.detail || "-",
    row.type,
    row.page,
    row.source,
    row.jobIntent || "General",
    row.count,
    relativeTime(row.lastSeen),
  ], "CTA and form performance will populate once calls, forms, and quote clicks are tracked.", 7);
  renderNextBestMoves(payload.opportunities || []);

  if (payload.sources?.length) {
    renderRows("#sourceRows", payload.sources.map((row) => [
      `<a href="#">${escapeHtml(row.source)}</a>`,
      `<span class="pill ${typeTone(row.type)}">${escapeHtml(row.type)}</span>`,
      metricBar(row.share, row.type === "ai_assistant"),
      escapeHtml(row.signal || sourceSignalFallback(row)),
    ]), { raw: true });
  } else {
    renderEmptyRow("#sourceRows", "No sources have been captured yet. Import AI visibility checks or wait for tracked website referrals.", 4);
  }

  if (payload.competitors?.length) {
    const customerRow = payload.competitors.find((row) => row.isCustomer);
    if (customerRow && overallRankMetric) overallRankMetric.textContent = `#${customerRow.rank}`;
    renderRows("#competitorRows", payload.competitors.map((row) => [
      `#${row.rank}`,
      row.website ? `<a href="${escapeHtml(row.website)}">${escapeHtml(row.name)}</a>` : escapeHtml(row.name),
      metricBar(formatRate(row.mentionRate), row.isCustomer),
      formatRate(row.chatgpt),
      formatRate(row.gemini),
      formatRate(row.claude),
      row.mentionRate == null ? "Waiting for imports" : row.isCustomer ? "Customer" : "Competitor",
    ]), { raw: true });
  } else {
    renderEmptyRow("#competitorRows", "No competitors are configured yet. Run the admin workspace bootstrap or add competitors in Supabase.", 7);
  }

  if (payload.citations?.length) {
    renderRows("#citationRows", payload.citations.map((row) => [
      escapeHtml(row.prompt),
      `<span class="pill ${row.mentioned === "Yes" ? "teal" : "pink"}">${escapeHtml(row.mentioned)}</span>`,
      escapeHtml(row.rank),
      escapeHtml(`${row.platform}: ${row.source}`),
      escapeHtml(row.fix),
    ]), { raw: true });
  } else {
    renderEmptyRow("#citationRows", "No prompt citations have been imported yet. Use the weekly AI visibility import after the first manual checks.", 5);
  }

  const recommendations = payload.recommendations || [];
  if (recommendations.length) {
    renderLiveRecommendations(recommendations);
  } else {
    renderLiveRecommendations([]);
  }
  renderLivePunchListState(recommendations, workspace);

  renderLiveReviewTasks(recommendations);
  renderLiveReports(payload.reports || []);
  initializeMetricHelp();
}

function demoMetaVisibility(scenario) {
  return {
    status: "active",
    score: Math.max(45, scenario.score - 8),
    promptCoverage: Math.max(35, scenario.mentions - 4),
    averagePosition: Number(String(scenario.rank).replace(/[^0-9.]/g, "")) || 2.8,
    shareOfVoice: 41,
    serviceGeoAccuracy: 82,
    benchmarkRuns: 12,
    verifiedRuns: 2,
    lastVerifiedAt: new Date().toISOString(),
    sourceStrength: { score: 68 },
    categories: [
      { category: "discovery", runs: 5, mentionRate: 60 },
      { category: "comparison", runs: 3, mentionRate: 67 },
      { category: "reputation", runs: 2, mentionRate: 50 },
      { category: "service", runs: 4, mentionRate: 75 },
      { category: "location", runs: 3, mentionRate: 67 },
    ],
    promptResults: (scenario.citations || []).map((row, index) => ({
      prompt: row[0],
      mode: index === 0 ? "consumer_verified" : "api_benchmark",
      surface: index === 0 ? "Instagram" : "Meta Model API",
      mentioned: row[1] === "Yes",
      rankPosition: row[2] === "-" ? null : Number(String(row[2]).replace("#", "")),
      description: index === 0 ? "Recommended as a local option with relevant project experience." : row[4],
      sources: row[3] ? [{ domain: row[3], cited: true }] : [],
    })),
    evidenceGaps: [
      { priority: "high", title: "Instagram and website service language is inconsistent", detail: "Align the professional profile, service pages, schema, and project proof around the selected profit center and market." },
      { priority: "medium", title: "Consumer verification coverage is limited", detail: "Verify discovery, comparison, reputation, service, and location prompts inside Instagram Meta AI." },
    ],
    recommendations: [
      { priority: "high", status: "open", title: "Align Instagram and Facebook business identity", body: "Use the same business name, category, services, market, phone, and website identity across both profiles." },
      { priority: "high", status: "open", title: "Publish Meta-readable project proof", body: "Add service and neighborhood context to website projects and corresponding social posts." },
    ],
  };
}

function renderMetaVisibility(meta = {}) {
  setText("#metaVisibilityScore", meta.score ?? "-");
  setText("#metaPromptCoverage", formatRate(meta.promptCoverage));
  setText("#metaAveragePosition", meta.averagePosition ? `#${meta.averagePosition}` : "-");
  setText("#metaShareOfVoice", formatRate(meta.shareOfVoice));
  setText("#metaVerifiedRuns", meta.verifiedRuns ?? 0);
  setText("#metaVerifiedAt", meta.lastVerifiedAt ? `Last verified ${formatMetaDate(meta.lastVerifiedAt)}` : "No consumer verification yet");
  setText("#metaBenchmarkRuns", meta.benchmarkRuns ?? 0);
  setText("#metaConsumerRuns", meta.verifiedRuns ?? 0);
  setText("#metaAccuracyMetric", formatRate(meta.serviceGeoAccuracy));
  setText("#metaSourceStrength", formatRate(meta.sourceStrength?.score));
  setText("#metaMeasurementStatus", meta.status === "active" ? "Meta monitoring active" : "Waiting for first Meta run");

  const categoryRoot = document.querySelector("#metaCategoryRows");
  if (categoryRoot) categoryRoot.innerHTML = (meta.categories || []).length
    ? meta.categories.map((row) => `<div><span>${escapeHtml(metaTitleCase(row.category))}</span><strong>${formatRate(row.mentionRate)}</strong><small>${row.runs} run${row.runs === 1 ? "" : "s"}</small></div>`).join("")
    : '<p class="connected-empty-copy">Import Meta AI results to populate category coverage.</p>';

  renderRowsOrEmpty("#metaPromptRows", meta.promptResults || [], (row) => [
    escapeHtml(row.prompt),
    `<span class="meta-mode-pill ${row.mode === "consumer_verified" ? "verified" : "benchmark"}">${row.mode === "consumer_verified" ? "Verified" : "Benchmark"}</span><br><small>${escapeHtml(row.surface || "Meta AI")}</small>`,
    row.mentioned ? '<span class="pill teal">Yes</span>' : '<span class="pill pink">No</span>',
    row.rankPosition ? `#${row.rankPosition}` : "-",
    escapeHtml(row.description || "No description captured"),
    escapeHtml((row.sources || []).map((source) => source.domain).filter(Boolean).join(", ") || "No source captured"),
  ], "No Meta results yet. Run an API benchmark or add a verified Instagram result.", 6, { raw: true });

  renderMetaActions("#metaEvidenceGaps", meta.evidenceGaps || [], "No Meta evidence gaps detected yet.");
  renderMetaActions("#metaRecommendationRows", meta.recommendations || [], "Meta recommendations will appear after the first run.");
  renderMetaChangeCenter(meta.recommendations || []);
  initializeMetricHelp();
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderMetaActions(selector, rows, emptyMessage) {
  const root = document.querySelector(selector);
  if (!root) return;
  root.innerHTML = rows.length
    ? rows.map((row) => `<article><span>${escapeHtml(metaTitleCase(row.priority || "medium"))}</span><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.detail || row.body || "")}</p></article>`).join("")
    : `<p class="connected-empty-copy">${escapeHtml(emptyMessage)}</p>`;
}

function renderMetaChangeCenter(recommendations) {
  const root = document.querySelector("#metaChangeRows");
  if (!root) return;
  const rows = recommendations || [];
  const completed = rows.filter((row) => row.status === "complete").length;
  setText("#metaChangesCompleted", completed);
  if (!rows.length) {
    root.innerHTML = '<div class="meta-change-empty"><strong>No customer-specific changes yet</strong><p>Run the first Meta benchmark or import a verified Instagram result. Builder Rank will turn the resulting evidence gaps into reviewable recommendations here.</p></div>';
    return;
  }
  root.innerHTML = rows.map((row, index) => {
    const state = row.status === "complete" ? "complete" : row.status === "in_progress" ? "in_progress" : "open";
    const buttonLabel = state === "complete" ? "Live" : state === "in_progress" ? "Mark Live" : "Approve & Start";
    const nextStatus = state === "in_progress" ? "complete" : "in_progress";
    const liveControl = row.id
      ? `data-recommendation-id="${escapeHtml(row.id)}" data-next-status="${nextStatus}"`
      : `data-meta-demo-change="${index}"`;
    return `<article class="meta-change-item is-${state}"><div class="meta-change-status"><span>${escapeHtml(metaTitleCase(row.priority || "medium"))}</span><i></i></div><div><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.body || row.detail || "")}</p><small>${state === "complete" ? "Completed and ready for a Meta recheck." : state === "in_progress" ? "Your team is working on this recommendation." : "Recommended from current Meta evidence gaps."}</small></div><button type="button" ${liveControl} ${state === "complete" ? "disabled" : ""}>${buttonLabel}</button></article>`;
  }).join("");
}

function metaTitleCase(value) {
  return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMetaDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function demoTargetTerms(scenario) {
  return [
    { id: "demo-1", phrase: scenario.label, market: marketSelect?.value || "Denver, CO", status: "active", jobTypeLabel: scenario.label, prompts: 3, runs: 12, mentionRate: scenario.mentions, averagePosition: Number(String(scenario.rank).replace(/[^0-9.]/g, "")), openChanges: 2, platforms: [{ platform: "chatgpt", mentionRate: scenario.mentions - 2 }, { platform: "gemini", mentionRate: scenario.mentions + 3 }, { platform: "claude", mentionRate: scenario.mentions + 1 }] },
    { id: "demo-2", phrase: scenario.attributes?.[0]?.[0] || "high-value service", market: marketSelect?.value || "Denver, CO", status: "active", jobTypeLabel: scenario.label, prompts: 3, runs: 9, mentionRate: Math.max(0, scenario.mentions - 9), averagePosition: 3.1, openChanges: 1, platforms: [{ platform: "chatgpt", mentionRate: scenario.mentions - 12 }, { platform: "gemini", mentionRate: scenario.mentions - 7 }, { platform: "claude", mentionRate: scenario.mentions - 8 }] },
  ];
}

function renderTargetTerms(terms, jobTypes = [], demo = false) {
  const root = document.querySelector("#targetTermRows");
  if (!root) return;
  const activeCount = terms.filter((term) => term.status === "active").length;
  setText("#targetTermActiveCount", `${activeCount} / 2`);
  if (targetTermJobType) targetTermJobType.innerHTML = '<option value="">All services</option>' + jobTypes.map((jobType) => `<option value="${escapeHtml(jobType.id)}">${escapeHtml(jobType.label)}</option>`).join("");
  const submit = targetTermForm?.querySelector("button[type='submit']");
  if (submit) submit.disabled = activeCount >= 2;
  root.innerHTML = terms.length ? terms.map((term) => {
    const platformByKey = new Map((term.platforms || []).map((row) => [String(row.platform).toLowerCase(), row]));
    const platformCells = ["chatgpt", "gemini", "claude"].map((platform) => `<div><span>${metaTitleCase(platform)}</span><strong>${formatRate(platformByKey.get(platform)?.mentionRate)}</strong></div>`).join("");
    const action = demo ? "" : `<button type="button" data-target-term-id="${escapeHtml(term.id)}" data-target-term-status="${term.status === "active" ? "paused" : "active"}">${term.status === "active" ? "Pause target" : "Resume target"}</button>`;
    return `<article class="target-term-card ${term.status === "paused" ? "is-paused" : ""}"><div class="target-term-card-head"><span>${escapeHtml(term.status)} · ${escapeHtml(term.jobTypeLabel || "All services")}</span><strong>${term.openChanges || 0} open changes</strong></div><h3>${escapeHtml(term.phrase)}</h3><p>${escapeHtml(term.market || "Customer market")} · ${term.prompts || 0} prompts · ${term.runs || 0} measured runs · Avg. ${term.averagePosition ? `#${term.averagePosition}` : "waiting"}</p><div class="target-term-platforms">${platformCells}</div>${action}</article>`;
  }).join("") : '<div class="meta-change-empty"><strong>Choose the first AI Target Term</strong><p>Start with the service and market phrase most closely tied to the jobs this customer wants to win.</p></div>';
}

function renderAiChangeCenter(platforms, recommendations, demo = false) {
  currentAiChangeState = { platforms, recommendations, demo };
  document.querySelectorAll("[data-ai-platform]").forEach((button) => button.classList.toggle("is-active", button.dataset.aiPlatform === activeAiChangePlatform));
  const platform = platforms.find((row) => normalizePlatformKey(row.platform) === activeAiChangePlatform) || {};
  const label = activeAiChangePlatform === "chatgpt" ? "ChatGPT" : metaTitleCase(activeAiChangePlatform);
  setText("#aiChangePlatformTitle", `${label} improvement plan`);
  setText("#aiChangePlatformMetric", platform.mentionRate == null ? "Waiting for live checks" : `${formatRate(platform.mentionRate)} mention rate · ${platform.runs || 0} runs`);
  const rows = recommendations.filter((row) => !String(row.source || "").toLowerCase().includes("meta")).slice(0, 4);
  const root = document.querySelector("#aiChangeRows");
  if (!root) return;
  if (!rows.length) {
    root.innerHTML = '<div class="meta-change-empty"><strong>No platform recommendations yet</strong><p>Add a Target Term or import the first ChatGPT, Gemini, and Claude checks to generate customer-specific work.</p></div>';
    return;
  }
  root.innerHTML = rows.map((row, index) => {
    const state = row.status === "complete" ? "complete" : row.status === "in_progress" ? "in_progress" : "open";
    const buttonLabel = state === "complete" ? "Live" : state === "in_progress" ? "Mark Live" : "Approve & Start";
    const control = row.id ? `data-recommendation-id="${escapeHtml(row.id)}" data-next-status="${state === "in_progress" ? "complete" : "in_progress"}"` : `data-ai-demo-change="${index}"`;
    return `<article class="meta-change-item is-${state}"><div class="meta-change-status"><span>${escapeHtml(metaTitleCase(row.priority || "medium"))}</span><i></i></div><div><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.body || row.detail || "")}</p><small>Designed to improve evidence used by ${label}; recheck after the approved work is live.</small></div><button type="button" ${control} ${state === "complete" ? "disabled" : ""}>${buttonLabel}</button></article>`;
  }).join("");
}

function normalizePlatformKey(value) {
  const platform = String(value || "").toLowerCase();
  if (platform.includes("gemini")) return "gemini";
  if (platform.includes("claude")) return "claude";
  return "chatgpt";
}

function updateCommandStrip(payload) {
  const readiness = payload.workspace?.readiness || {};
  const summary = payload.summary || {};
  const opportunities = payload.opportunities || [];
  const topOpportunity = opportunities[0];

  if (workspaceReadinessMetric) workspaceReadinessMetric.textContent = readiness.ready ? "Beta ready" : "Needs setup";
  if (workspaceReadinessDetail) {
    const blockers = readiness.blockers || [];
    workspaceReadinessDetail.textContent = readiness.ready
      ? "Customer workspace has tracking, AI data, and required QA evidence."
      : blockers.length
        ? blockers.slice(0, 2).join(" · ")
        : "Finish tracking QA, account claim, and first AI import.";
  }

  if (nextOperatorActionMetric) {
    nextOperatorActionMetric.textContent = readiness.ready ? "Review dashboard" : "Finish QA";
  }
  if (nextOperatorActionDetail) {
    nextOperatorActionDetail.textContent = readiness.ready
      ? "Walk through visibility, sources, leads, and Punch List with the customer."
      : "Send a page-view QA test, a lead-event QA test, then refresh tracking health.";
  }

  if (bestOpportunityMetric) {
    bestOpportunityMetric.textContent = topOpportunity?.title || summary.topLandingPage || "First service page";
  }
  if (bestOpportunityDetail) {
    bestOpportunityDetail.textContent = topOpportunity?.nextStep || "Prioritize the profit center the customer wants more of first.";
  }

  if (changeControlMetric) {
    const open = (payload.recommendations || []).filter((item) => item.status !== "complete").length;
    changeControlMetric.textContent = open ? `${open} pending tasks` : "Approval queue clear";
  }
  if (changeControlDetail) {
    changeControlDetail.textContent = "Customer-owned Punch List tasks can move from open to in progress to live.";
  }
}

function renderLiveRecommendations(recommendations) {
  if (!recommendations.length) {
    builderActionList.innerHTML = `
      <article>
        <div>
          <span>Setup</span>
          <strong>No Punch List tasks yet</strong>
          <p>Run the workspace bootstrap or import AI visibility checks to generate the first recommendations.</p>
        </div>
        <button type="button" disabled>Waiting</button>
      </article>
    `;
    return;
  }

  builderActionList.innerHTML = recommendations.map((recommendation) => `
    <article class="${recommendation.status === "complete" ? "is-applied" : ""}">
      <div>
        <span>${escapeHtml(recommendation.priority)} priority · ${escapeHtml(recommendationJobTypeLabel(recommendation))} · ${escapeHtml(statusLabel(recommendation.status))}</span>
        <strong>${escapeHtml(recommendation.title)}</strong>
        <p>${escapeHtml(recommendation.body)}</p>
      </div>
      <button
        type="button"
        data-recommendation-id="${escapeHtml(recommendation.id)}"
        data-next-status="${recommendation.status === "complete" ? "complete" : recommendation.status === "in_progress" ? "complete" : "in_progress"}"
        ${recommendation.status === "complete" ? "disabled" : ""}
      >${recommendation.status === "complete" ? "Live" : recommendation.status === "in_progress" ? "Mark Live" : "Start"}</button>
    </article>
  `).join("");
}

function renderLivePunchListState(recommendations, workspace = {}) {
  const completed = recommendations.filter((item) => item.status === "complete").length;
  const inProgress = recommendations.filter((item) => item.status === "in_progress").length;
  const open = workspace.openRecommendations ?? recommendations.filter((item) => item.status !== "complete").length;

  if (summaryActionMetric) summaryActionMetric.textContent = open;
  if (summaryActionDetail) {
    summaryActionDetail.textContent = completed
      ? `${completed} live · ${inProgress} in progress`
      : `${inProgress} in progress · ready to start`;
  }
  if (changesLiveMetric) changesLiveMetric.textContent = completed;
  if (changeLogBadge) changeLogBadge.textContent = `${completed} live`;

  const completedItems = recommendations.filter((item) => item.status === "complete");
  if (!deployedChangeList) return;
  if (!completedItems.length) {
    deployedChangeList.innerHTML = "<article>No live Builder Rank changes yet. Start a Punch List task, then mark it live after implementation.</article>";
    return;
  }

  deployedChangeList.innerHTML = completedItems.map((item) => `
    <article><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(recommendationJobTypeLabel(item))} · ${escapeHtml(item.source || "Builder Rank")} · ${escapeHtml(formatShortDate(item.createdAt))}</span></article>
  `).join("");
}

function renderLiveVisibilityBreakdown(aiVisibility) {
  const jobTypes = Array.isArray(aiVisibility.jobTypes) ? aiVisibility.jobTypes : [];
  if (jobTypes.length) {
    if (visibilityBreakdownTitle) visibilityBreakdownTitle.textContent = "Profit Center Visibility";
    if (visibilityBreakdownFirstColumn) visibilityBreakdownFirstColumn.textContent = "Profit Center";
    renderRows("#attributeMetricRows", jobTypes.map((jobType) => [
      jobType.needsJobType ? `${escapeHtml(jobType.label || "Unassigned prompts")} <span class="pill amber">Assign job type</span>` : escapeHtml(jobType.label || "Unassigned prompts"),
      metricWithDot(formatRate(jobType.mentionRate)),
      formatRate(jobType.chatgpt),
      formatRate(jobType.gemini),
      formatRate(jobType.claude),
    ]), { raw: true });
    return;
  }

  const platforms = Array.isArray(aiVisibility.platforms) ? aiVisibility.platforms : [];
  if (visibilityBreakdownTitle) visibilityBreakdownTitle.textContent = "Platform Visibility";
  if (visibilityBreakdownFirstColumn) visibilityBreakdownFirstColumn.textContent = "Platform";
  if (!platforms.length) {
    renderEmptyRow("#attributeMetricRows", "Import AI visibility checks to populate profit-center mention rates.", 5);
    return;
  }

  renderRows("#attributeMetricRows", platforms.map((platform) => [
    escapeHtml(platform.platform || "Unknown"),
    metricWithDot(formatRate(platform.mentionRate)),
    platformNameMatches(platform.platform, "chatgpt") ? formatRate(platform.mentionRate) : "-",
    platformNameMatches(platform.platform, "gemini") ? formatRate(platform.mentionRate) : "-",
    platformNameMatches(platform.platform, "claude") ? formatRate(platform.mentionRate) : "-",
  ]), { raw: true });
}

function sourceSignalFallback(row) {
  if (row.leadEvents) return `${row.leadEvents} lead${row.leadEvents === 1 ? "" : "s"} · ${row.leadRate || "0%"} rate`;
  if (row.citationSignals) return `${row.citationSignals} AI citation signal${row.citationSignals === 1 ? "" : "s"}`;
  return `${row.count || 0} event${row.count === 1 ? "" : "s"}`;
}

function updateLiveSourceMix(sourceMix) {
  if (!sourceMixList || !directShareBar || !directoryShareBar || !gbpShareBar) return;

  if (!sourceMix.length) {
    directShareBar.style.width = "0%";
    directoryShareBar.style.width = "0%";
    gbpShareBar.style.width = "0%";
    sourceMixList.innerHTML = "<span>No live source mix yet</span>";
    return;
  }

  const byKey = new Map(sourceMix.map((row) => [row.key, row]));
  directShareBar.style.width = `${byKey.get("direct")?.share || 0}%`;
  directoryShareBar.style.width = `${byKey.get("directory")?.share || 0}%`;
  gbpShareBar.style.width = `${byKey.get("gbp")?.share || 0}%`;
  sourceMixList.innerHTML = sourceMix
    .filter((row) => row.count > 0 || ["direct", "directory", "gbp"].includes(row.key))
    .map((row) => `<span><i class="${escapeHtml(row.tone || "gray")}"></i>${escapeHtml(row.label)} ${Number(row.share || 0)}%</span>`)
    .join("");
}

function platformNameMatches(value, target) {
  return String(value || "").toLowerCase().includes(target);
}

function renderLiveReports(reports) {
  if (!reportRows) return;

  if (!reports.length) {
    reportRows.innerHTML = `
      <tr><td class="connected-empty-row" colspan="5">No saved report history yet. Run a paid Builder Rank inspection and it will appear here.</td></tr>
    `;
    return;
  }

  reportRows.innerHTML = reports.map((report) => `
    <tr>
      <td>${escapeHtml(report.company || websiteLabel(report.website) || "AI Inspection")}</td>
      <td>${escapeHtml(report.market || "Market not set")}</td>
      <td>${escapeHtml(report.score || report.grade || "-")}</td>
      <td>${escapeHtml(formatShortDate(report.createdAt))}</td>
      <td><span class="pill teal">${escapeHtml(report.checkoutReference ? "Paid" : "Saved")}</span></td>
    </tr>
  `).join("");
}

function renderLiveReviewTasks(recommendations) {
  if (!reviewTaskRows) return;

  const localProfileTasks = recommendations
    .filter((recommendation) => /review|google|gbp|business profile|local profile|citation/i.test(`${recommendation.title} ${recommendation.body} ${recommendation.source}`))
    .slice(0, 8);
  const rows = localProfileTasks.length ? localProfileTasks : recommendations.slice(0, 5);

  if (!rows.length) {
    reviewTaskRows.innerHTML = `
      <tr><td class="connected-empty-row" colspan="5">No Reviews or GBP tasks yet. Run workspace bootstrap to seed local profile recommendations.</td></tr>
    `;
    return;
  }

  reviewTaskRows.innerHTML = rows.map((task) => `
    <tr>
      <td>${escapeHtml(task.title)}</td>
      <td>${escapeHtml(recommendationJobTypeLabel(task))}</td>
      <td>${escapeHtml(localProfileChannel(task))}</td>
      <td><span class="pill ${priorityTone(task.priority)}">${escapeHtml(priorityLabel(task.priority))}</span></td>
      <td>${escapeHtml(statusLabel(task.status))}</td>
    </tr>
  `).join("");
}

function applyEmptyDashboardState(payload) {
  const business = payload.business || {};

  showDashboardNotice(
    "Workspace found, Site Signal not connected",
    "Install the Site Signal snippet, then connect the site ID so Builder Rank can start collecting website events.",
    "setup",
  );

  if (accountSelector && business.name) accountSelector.textContent = business.name;
  if (websiteSelector && business.website_url) {
    websiteSelector.textContent = new URL(business.website_url).hostname.replace(/^www\./, "");
  }

  summaryConnectionMetric.textContent = "Setup";
  updateSiteSignalUi(business, { lastEvent: null });
  visibilityScore.textContent = "0";
  mentionRate.textContent = "0%";
  averageRank.textContent = "Waiting";
  if (mentionRateDelta) mentionRateDelta.textContent = "Waiting for first import · 0 runs";
  summaryVisibilityMetric.textContent = "0";
  summaryAiReferralMetric.textContent = "0";
  if (summaryAiReferralWindow) summaryAiReferralWindow.textContent = `${selectedDateRangeDays()}-day assisted sessions`;
  if (summaryAiLeadRateMetric) summaryAiLeadRateMetric.textContent = "0%";
  summaryQuoteMetric.textContent = "0";
  summaryActionMetric.textContent = "0";
  if (summaryActionDetail) summaryActionDetail.textContent = "Waiting for Punch List";
  trackedSessionsMetric.textContent = "0";
  aiReferralMetric.textContent = "0";
  if (aiLeadRateMetric) aiLeadRateMetric.textContent = "0%";
  quoteEventMetric.textContent = "0";
  topLandingPageMetric.textContent = "Waiting for snippet";
  bestPromptMetric.textContent = "Waiting for import";
  topSourceMetric.textContent = "Waiting for data";
  connectSiteStatus.textContent = business.site_id ? `Use Site ID ${business.site_id} after the snippet is installed.` : "No Site Signal ID has been assigned yet.";

  renderEmptyRow("#eventRows", "No Site Signal events yet. Install the snippet and load the customer website once.", 6);
  renderEmptyRow("#leadRows", "No lead events yet. Calls, forms, quote clicks, and AI-assisted sessions will appear here.", 7);
  renderEmptyRow("#jobIntentRows", "No job-intent pipeline yet. Service-specific visits and lead events will appear after Site Signal is installed.", 9);
  renderEmptyRow("#ctaRows", "No CTA or form events yet. Customer buttons and forms will appear here after Site Signal is installed.", 7);
  renderEmptyRow("#pageRows", "No landing pages have tracked traffic yet.", 7);
  renderNextBestMoves([]);
  renderEmptyRow("#competitorRows", "No live competitors loaded yet. Run workspace bootstrap to seed the competitive set.", 7);
  renderEmptyRow("#sourceRows", "No sources captured yet. Import AI visibility checks or wait for website referrals.", 4);
  renderEmptyRow("#citationRows", "No prompt citations imported yet.", 5);
  renderLiveRecommendations([]);
  renderLivePunchListState([], {});
  renderLiveReviewTasks([]);
  renderLiveReports([]);
  initializeMetricHelp();
}

function renderBuilderActions(scenario) {
  builderActionList.innerHTML = scenario.actions.map(([title, impact, summary], index) => {
    const applied = appliedActions.some((action) => action.title === title);
    return `
      <article class="${applied ? "is-applied" : ""}">
        <div>
          <span>${escapeHtml(impact)}</span>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(summary)}</p>
        </div>
        <button type="button" data-builder-action="${index}" ${applied ? "disabled" : ""}>${applied ? "Live" : "Apply"}</button>
      </article>
    `;
  }).join("");
}

function renderNextBestMoves(moves = []) {
  if (!nextBestMoveList) return;

  if (!moves.length) {
    nextBestMoveList.innerHTML = `
      <article>
        <span>Setup</span>
        <strong>Waiting for live opportunity signals</strong>
        <p>Install Site Signal, send a lead-event QA test, and import the first AI visibility run.</p>
        <small>Next: finish setup</small>
      </article>
    `;
    return;
  }

  nextBestMoveList.innerHTML = moves.map((move) => `
    <article>
      <span>${escapeHtml(move.priority || "Medium")} · ${escapeHtml(move.type || "Opportunity")}</span>
      <strong>${escapeHtml(move.title || "Review opportunity")}</strong>
      <p>${escapeHtml(move.detail || "")}</p>
      <small>${escapeHtml(move.nextStep || "Review this opportunity in the dashboard.")}</small>
    </article>
  `).join("");
}

function renderAiJourney(scenario, actionBoost = 0) {
  if (!journeyDiscoveryMetric) return;

  const sessions = numberFromFormatted(scenario.sessions);
  const qualified = Math.round(sessions * 0.24) + actionBoost * 12;
  const leads = scenario.quoteEvents + actionBoost * 2;
  const booked = Math.max(3, Math.round(leads * 0.29));

  journeyDiscoveryMetric.textContent = formatNumber(sessions);
  journeyQualifiedMetric.textContent = formatNumber(qualified);
  journeyLeadMetric.textContent = formatNumber(leads);
  journeyBookedMetric.textContent = formatNumber(booked);
}

function renderBuyerSegments(scenario) {
  if (!buyerSegmentList) return;

  const segments = scenario.segments?.length ? scenario.segments : [
    ["High-intent homeowners", "Ask AI for contractor recommendations, pricing, proof, and timing.", "38%"],
    ["Comparison shoppers", "Compare competitors, reviews, sources, and project examples.", "31%"],
    ["Ready-to-book leads", "Move from AI discovery into calls, forms, and quote clicks.", "21%"],
  ];

  buyerSegmentList.innerHTML = segments.map(([name, detail, share]) => `
    <article>
      <strong>${escapeHtml(name)}</strong>
      <p>${escapeHtml(detail)}</p>
      <span>${escapeHtml(share)} of monitored intent</span>
    </article>
  `).join("");
}

function renderConversionLevers(scenario) {
  if (!conversionLeverList) return;

  const levers = scenario.levers?.length ? scenario.levers : [
    ["CTA clarity", "Move quote action closer to service proof", "+6 leads"],
    ["Proof depth", "Add project, review, and warranty language AI can cite", "+5 mentions"],
    ["Sales routing", "Tag AI-assisted leads by service intent", "+3 consults"],
  ];

  if (directLeadSummary) {
    directLeadSummary.textContent = `${scenario.label} has ${scenario.aiReferrals} AI-assisted sessions and ${scenario.quoteEvents} tracked lead actions in this demo. Builder Rank shows the exact levers to turn visibility into booked estimates.`;
  }

  conversionLeverList.innerHTML = levers.map(([label, detail, impact]) => `
    <article>
      <span>${escapeHtml(impact)}</span>
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `).join("");
}

function renderDeployedChanges() {
  changeLogBadge.textContent = `${appliedActions.length} live`;

  if (!appliedActions.length) {
    deployedChangeList.innerHTML = "<article>No Builder Rank changes have been applied in this demo yet.</article>";
    return;
  }

  deployedChangeList.innerHTML = appliedActions.map((action) => `
    <article><strong>${escapeHtml(action.title)}</strong><span>${escapeHtml(action.time)} · ${escapeHtml(action.jobType)}</span></article>
  `).join("");
}

function eventRowsFor(scenario) {
  return [
    ["page_view", scenario.landingPage, scenario.topSource, "Bathroom remodeling page", "428", "2 min ago"],
    ["phone_click", scenario.landingPage, "Confirmed AI referral", "Call now header CTA", "18", "14 min ago"],
    ["quote_click", scenario.landingPage, scenario.topSource, "Get bathroom estimate", "23", "36 min ago"],
    ["form_submit", "/contact", "Probable AI-assisted", "Project consultation form", "11", "1 hr ago"],
    ["email_click", "/service-areas", "Organic search", "Service-area email link", "7", "2 hrs ago"],
  ].map(([event, page, source, detail, count, seen]) => [event, page, source, detail, count, seen]);
}

function leadRowsFor(scenario) {
  return [
    [scenario.topSource, scenario.aiReferrals, 16, 12, 14, "Bathroom", "14.8%"],
    ["Perplexity", 37, 7, 5, 8, "Kitchen", "13.5%"],
    ["Google AI / organic", 286, 22, 18, 24, "Bathroom", "9.4%"],
    ["Directories", 142, 11, 9, 10, "Roofing", "8.1%"],
    ["Direct", 518, 18, 15, 20, "General", "6.2%"],
  ];
}

function jobIntentRowsFor(scenario) {
  return [
    [scenario.label, scenario.aiReferrals + 84, scenario.aiReferrals, Math.round(scenario.quoteEvents * 0.68), 16, 12, 14, "14.8%", scenario.landingPage],
    ["Kitchen remodeling", 74, 28, 13, 5, 4, 4, "17.5%", "/kitchen-remodeling-denver"],
    ["Basement finishing", 51, 12, 7, 3, 2, 2, "13.7%", "/basement-finishing-denver"],
    ["General", 118, 9, 9, 2, 5, 2, "7.6%", "/contact"],
  ];
}

function ctaRowsFor(scenario) {
  return [
    ["Get bathroom estimate", "Quote CTA", scenario.landingPage, scenario.topSource, "Bathroom", 23, "36 min ago"],
    ["Call now header CTA", "Call", scenario.landingPage, "Confirmed AI referral", "Bathroom", 18, "14 min ago"],
    ["Project consultation form", "Form", "/contact", "Probable AI-assisted", "General", 11, "1 hr ago"],
    ["Schedule consultation", "Lead CTA", "/bathroom-remodeling-denver", "Perplexity", "Bathroom", 8, "1 hr ago"],
    ["Service-area email link", "Email", "/service-areas", "Organic search", "General", 7, "2 hrs ago"],
  ];
}

function nextBestMovesForScenario(scenario) {
  return [
    {
      priority: "High",
      type: "Profit center",
      title: `Push more ${scenario.label} leads`,
      detail: `${scenario.aiReferrals} AI-assisted sessions are landing on ${scenario.landingPage}.`,
      nextStep: "Add a stronger estimate CTA, project proof, and FAQ block to the top service page.",
    },
    {
      priority: "High",
      type: "Punch List",
      title: scenario.actions[0]?.[0] || "Start the top Builder Rank task",
      detail: scenario.actions[0]?.[2] || "Use the top open recommendation to improve AI readability.",
      nextStep: "Open Punch List and mark the task in progress.",
    },
    {
      priority: "Medium",
      type: "CTA",
      title: `Scale ${scenario.bestPrompt}`,
      detail: `${scenario.quoteEvents} quote events are tied to this intent cluster.`,
      nextStep: "Reuse this CTA language on related market and proof pages.",
    },
  ];
}

function pageRowsFor(scenario) {
  return [
    [scenario.landingPage, scenario.aiReferrals, 18, 12, "14.8%", "Bathroom", "Add more project proof"],
    ["/contact", 46, 9, 11, "21.7%", "General", "Reduce form friction"],
    ["/service-areas/denver", 31, 5, 4, "9.7%", "Bathroom", "Add neighborhood FAQs"],
    ["/reviews", 18, 2, 1, "5.5%", "Bathroom", "Add job-type review snippets"],
    ["/about", 14, 1, 0, "2.1%", "General", "Surface license and warranty"],
  ];
}

function renderRows(selector, rows, options = {}) {
  const body = document.querySelector(selector);
  if (!body) return;

  body.innerHTML = rows.map((cells) => {
    const rowClass = options.highlightText && cells.some((cell) => String(cell).includes(options.highlightText)) ? " class=\"is-client-row\"" : "";
    const html = cells.map((cell) => `<td>${options.raw ? cell : escapeHtml(cell)}</td>`).join("");
    return `<tr${rowClass}>${html}</tr>`;
  }).join("");
}

function renderRowsOrEmpty(selector, rows, mapRow, message, columnCount, options = {}) {
  if (!rows?.length) {
    renderEmptyRow(selector, message, columnCount);
    return;
  }

  renderRows(selector, rows.map(mapRow), { raw: Boolean(options.raw) });
}

function renderEmptyRow(selector, message, columnCount) {
  const body = document.querySelector(selector);
  if (!body) return;

  body.innerHTML = `<tr><td class="connected-empty-row" colspan="${columnCount}">${escapeHtml(message)}</td></tr>`;
}

function numberFromFormatted(value) {
  return Number.parseInt(String(value || "0").replace(/[^0-9]/g, ""), 10) || 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function showDashboardNotice(title, message, tone = "setup") {
  if (!liveDashboardNotice) return;

  liveDashboardNotice.hidden = false;
  liveDashboardNotice.classList.toggle("is-live", tone === "live");
  liveDashboardNotice.classList.toggle("is-attention", tone === "attention");
  liveDashboardNotice.classList.toggle("is-setup", tone !== "live" && tone !== "attention");
  liveDashboardNotice.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(message)}</p>
  `;
}

function updateSiteSignalUi(business = {}, summary = {}) {
  const siteId = business.site_id || connectSiteIdInput?.value || "br_customer_site_id";
  const snippet = `<script src="https://builderrank.io/tracker.js" data-site-id="${siteId}" async></script>`;
  const health = siteSignalHealthCopy(business, summary);
  const lastEventText = summary.lastEvent ? `${health.detail} · Last event ${relativeTime(summary.lastEvent)}` : health.detail;

  if (connectSiteIdInput && business.site_id) connectSiteIdInput.value = business.site_id;
  if (connectSiteSnippet) connectSiteSnippet.textContent = snippet;
  if (trackedEventsSnippet) trackedEventsSnippet.textContent = snippet;
  if (siteSignalStatusMetric) siteSignalStatusMetric.textContent = health.status;
  if (siteSignalLastEventMetric) siteSignalLastEventMetric.textContent = lastEventText;
  if (summaryConnectionMetric) summaryConnectionMetric.textContent = health.status;
  if (summaryConnectionDetail) summaryConnectionDetail.textContent = summary.lastEvent ? lastEventText : health.detail;
}

function siteSignalHealthCopy(business = {}, summary = {}) {
  if (summary.healthStatus === "healthy") {
    return { status: "Healthy", detail: `${summary.recentLeadEvents || summary.quoteEvents || 0} lead events verified` };
  }
  if (summary.healthStatus === "needs_lead_qa") {
    return { status: "Needs lead test", detail: "Tracking live; send one lead event" };
  }
  if (summary.healthStatus === "domain_mismatch") {
    return { status: "Domain mismatch", detail: "Events are from a different website" };
  }
  if (summary.healthStatus === "stale") {
    return { status: "Stale", detail: "No recent Site Signal event" };
  }
  if (business.tracking_status === "active") return { status: "Active", detail: "Waiting for health check" };
  if (business.tracking_status === "connected") return { status: "Connected", detail: "Install snippet and test events" };
  return { status: "Setup", detail: "Waiting for Site Signal" };
}

function buildLiveNoticeMessage(payload) {
  const workspace = payload.workspace || {};
  const summary = payload.summary || {};
  const aiVisibility = payload.aiVisibility || {};
  const readiness = workspace.readiness || {};
  const parts = [
    readiness.label || "",
    `${workspace.promptsTracked || 0} prompts tracked`,
    `${workspace.competitorsTracked || 0} competitors`,
    `${summary.trackedSessions || 0} website sessions in ${payload.dateRange?.days || selectedDateRangeDays()} days`,
    aiVisibility.dataFreshness || "waiting for first AI import",
  ].filter(Boolean);

  if (!summary.lastEvent) {
    parts.push("waiting for first Site Signal event");
  }
  if (Array.isArray(readiness.blockers) && readiness.blockers.length) {
    parts.push(`Next: ${readiness.blockers.slice(0, 2).join(" / ")}`);
  }
  if (readiness.ready && Array.isArray(readiness.optional) && readiness.optional.length) {
    parts.push(`Optional: ${readiness.optional[0]}`);
  }

  return parts.join(" · ");
}

function websiteLabel(value) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, "") : "";
  } catch {
    return value || "";
  }
}

function metricWithDot(value) {
  return `<span class="metric-dot"></span>${escapeHtml(value)}`;
}

function metricBar(value, active = false) {
  const number = Number.parseInt(value, 10) || 0;
  return `<span class="table-metric ${active ? "is-active" : ""}"><b>${escapeHtml(value)}</b><i><em style="width:${number}%"></em></i></span>`;
}

function formatRate(value) {
  return value == null ? "-" : `${value}%`;
}

function typeTone(type) {
  if (/Direct/i.test(type)) return "teal";
  if (/Google/i.test(type)) return "blue";
  if (/Directory/i.test(type)) return "amber";
  if (/UGC/i.test(type)) return "purple";
  return "gray";
}

function priorityTone(priority) {
  if (/high|urgent/i.test(priority)) return "teal";
  if (/medium/i.test(priority)) return "amber";
  return "gray";
}

function priorityLabel(priority) {
  const value = String(priority || "medium").trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Medium";
}

function localProfileChannel(task) {
  const text = `${task.title} ${task.body}`;
  if (/review/i.test(text)) return "Reviews";
  if (/post/i.test(text)) return "GBP Posts";
  if (/google|gbp|business profile/i.test(text)) return "Google Business Profile";
  if (/citation|directory/i.test(text)) return "Directory citations";
  return "Local profile";
}

function recommendationJobTypeLabel(recommendation) {
  return recommendation.jobTypeLabel || recommendation.jobType || "All services";
}

function setActiveTab(tabName) {
  document.querySelectorAll("[data-dashboard-page]").forEach((page) => {
    page.classList.toggle("is-active", page.dataset.dashboardPage === tabName);
  });
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.dashboardTab === tabName);
  });

  const [title, summary] = pageCopy[tabName] || pageCopy.visibility;
  pageTitle.textContent = title;
  pageSummary.textContent = summary;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.dashboardTab));
});

jobTypeSelect?.addEventListener("change", () => {
  activeScenarioKey = jobTypeSelect.value;
  appliedActions = [];
  renderDashboardScenario();
});

marketSelect?.addEventListener("change", renderDashboardScenario);

dateRangeSelect?.addEventListener("change", () => {
  renderDashboardScenario();
  void hydrateLiveDashboardData();
});

targetTermForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(targetTermForm);
  const phrase = String(form.get("phrase") || "").trim();
  if (!phrase) return;
  const token = await getDashboardAccessToken();
  if (!token) {
    if (targetTermStatus) targetTermStatus.textContent = "Sign in to add customer Target Terms.";
    return;
  }
  const button = targetTermForm.querySelector("button[type='submit']");
  button.disabled = true;
  if (targetTermStatus) targetTermStatus.textContent = `Creating monitored prompts and an optimization plan for “${phrase}”...`;
  try {
    const response = await fetch("/api/target-terms", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ siteId: selectedSiteIdFromUrl() || currentDashboardPayload?.business?.site_id, phrase, jobTypeId: form.get("jobTypeId"), market: currentDashboardPayload?.business?.market || marketSelect?.value }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || payload.error || "Could not add this Target Term.");
    targetTermForm.reset();
    if (targetTermStatus) targetTermStatus.textContent = `Target added. Builder Rank created ${payload.generated?.prompts || 0} monitored prompts and ${payload.generated?.recommendations || 0} optimization task.`;
    await hydrateLiveDashboardData();
  } catch (error) {
    if (targetTermStatus) targetTermStatus.textContent = error.message;
  } finally {
    button.disabled = (currentDashboardPayload?.targetTerms || []).filter((term) => term.status === "active").length >= 2;
  }
});

document.addEventListener("click", (event) => {
  const aiPlatformButton = event.target.closest("[data-ai-platform]");
  if (aiPlatformButton) {
    activeAiChangePlatform = aiPlatformButton.dataset.aiPlatform;
    renderAiChangeCenter(currentAiChangeState.platforms, currentAiChangeState.recommendations, currentAiChangeState.demo);
    return;
  }
  const targetTermButton = event.target.closest("[data-target-term-id]");
  if (targetTermButton) {
    void updateTargetTermStatus(targetTermButton);
    return;
  }
  const jumpButton = event.target.closest("[data-dashboard-jump]");
  if (jumpButton) {
    setActiveTab(jumpButton.dataset.dashboardJump);
    return;
  }
  const metaRecommendationButton = event.target.closest("#metaChangeRows [data-recommendation-id]");
  if (metaRecommendationButton) {
    void updateLiveRecommendation(metaRecommendationButton);
    return;
  }
  const aiRecommendationButton = event.target.closest("#aiChangeRows [data-recommendation-id]");
  if (aiRecommendationButton) {
    void updateLiveRecommendation(aiRecommendationButton);
    return;
  }
  const demoChangeButton = event.target.closest("[data-meta-demo-change], [data-ai-demo-change]");
  if (demoChangeButton) {
    const article = demoChangeButton.closest("article");
    if (demoChangeButton.dataset.demoState === "in_progress") {
      demoChangeButton.textContent = "Live";
      demoChangeButton.disabled = true;
      article?.classList.remove("is-in_progress");
      article?.classList.add("is-complete");
      const detail = article?.querySelector("small");
      if (detail) detail.textContent = "Completed and ready for a Meta recheck.";
      const completedMetric = document.querySelector("#metaChangesCompleted");
      if (completedMetric) completedMetric.textContent = String(numberFromFormatted(completedMetric.textContent) + 1);
    } else {
      demoChangeButton.dataset.demoState = "in_progress";
      demoChangeButton.textContent = "Mark Live";
      article?.classList.add("is-in_progress");
      const detail = article?.querySelector("small");
      if (detail) detail.textContent = "Approved. Your team is working on this recommendation.";
    }
    return;
  }
  const button = event.target.closest("[data-export-table]");
  if (!button) return;
  exportTableToCsv(button.dataset.exportTable, button.dataset.exportName || "builder-rank-export");
});

async function updateTargetTermStatus(button) {
  const token = await getDashboardAccessToken();
  if (!token) return;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    const response = await fetch("/api/target-terms", { method: "PATCH", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ siteId: selectedSiteIdFromUrl() || currentDashboardPayload?.business?.site_id, targetTermId: button.dataset.targetTermId, status: button.dataset.targetTermStatus }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || payload.error || "Could not update this Target Term.");
    if (targetTermStatus) targetTermStatus.textContent = `“${payload.targetTerm?.phrase || "Target term"}” is now ${payload.targetTerm?.status || "updated"}.`;
    await hydrateLiveDashboardData();
  } catch (error) {
    if (targetTermStatus) targetTermStatus.textContent = error.message;
    button.disabled = false;
    button.textContent = original;
  }
}

builderActionList?.addEventListener("click", (event) => {
  const recommendationButton = event.target.closest("[data-recommendation-id]");
  if (recommendationButton) {
    void updateLiveRecommendation(recommendationButton);
    return;
  }

  const button = event.target.closest("[data-builder-action]");
  if (!button) return;

  const scenario = dashboardScenarios[activeScenarioKey] || dashboardScenarios.bathroom;
  const action = scenario.actions[Number(button.dataset.builderAction)];
  if (!action || appliedActions.some((item) => item.title === action[0])) return;

  appliedActions = [{ title: action[0], jobType: scenario.label, time: "Just now" }, ...appliedActions];
  renderDashboardScenario();
});

function exportTableToCsv(tbodyId, fileName) {
  const body = document.getElementById(tbodyId);
  const table = body?.closest("table");
  if (!table) return;

  const headerCells = [...table.querySelectorAll("thead th")].map((cell) => cell.textContent.trim());
  const rows = [...body.querySelectorAll("tr")]
    .filter((row) => !row.querySelector(".connected-empty-row"))
    .map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim().replace(/\s+/g, " ")));

  if (!rows.length) return;

  const csv = [headerCells, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function selectedDateRangeDays() {
  const days = Number.parseInt(dateRangeSelect?.value || "30", 10);
  return [7, 30, 90].includes(days) ? days : 30;
}

function dashboardDataEndpoint(siteId) {
  const params = new URLSearchParams({ days: String(selectedDateRangeDays()) });
  if (siteId) params.set("siteId", siteId);
  return `/api/dashboard-data?${params.toString()}`;
}

async function updateLiveRecommendation(button) {
  const recommendationId = button.dataset.recommendationId;
  const status = button.dataset.nextStatus;
  if (!recommendationId || !status || status === "complete" && button.disabled) return;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Updating...";

  try {
    const token = await getDashboardAccessToken();
    if (!token) throw new Error("Sign in from the Account page before updating the Punch List.");

    const response = await fetch("/api/update-recommendation", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ recommendationId, status }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.detail || payload.error || "Could not update the Punch List item.");
    }

    await hydrateLiveDashboardData();
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    showDashboardNotice("Punch List update failed", error.message, "setup");
  }
}

connectSiteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!window.supabase?.createClient) {
    connectSiteStatus.textContent = "Supabase is not loaded on this page.";
    return;
  }

  const siteId = connectSiteIdInput.value.trim();
  if (!siteId) {
    connectSiteStatus.textContent = "Enter the Site Signal ID from the installed snippet.";
    return;
  }

  const submitButton = connectSiteForm.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Connecting...";
  connectSiteStatus.textContent = "Checking the signed-in account...";

  try {
    const token = await getDashboardAccessToken();

    if (!token) {
      throw new Error("Sign in from the Account page first, then return to the dashboard.");
    }

    const response = await fetch("/api/connect-site", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ siteId }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.detail || payload.error || "Could not connect this site.");
    }

    updateDashboardSiteIdUrl(payload.siteId || siteId);
    connectSiteStatus.textContent = connectSiteSummary(payload);
    await hydrateLiveDashboardData();
  } catch (error) {
    connectSiteStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Connect Site";
  }
});

function connectSiteSummary(payload = {}) {
  const pieces = [payload.message || "Site connected."];
  if (payload.trackingStatus) pieces.push(`Tracking: ${payload.trackingStatus}.`);
  if (payload.reportBackfill?.attempted) {
    const linked = Number(payload.reportBackfill.linked || 0);
    pieces.push(linked ? `${linked} saved report${linked === 1 ? "" : "s"} linked.` : "No saved reports needed linking.");
  }
  if (payload.nextStep) pieces.push(payload.nextStep);
  return pieces.join(" ");
}

setActiveTab("visibility");
renderDashboardScenario();
initializeMetricHelp();
prefillSiteIdFromUrl();
void hydrateLiveDashboardData();

function prefillSiteIdFromUrl() {
  if (!connectSiteIdInput) return;
  const params = new URLSearchParams(window.location.search);
  const siteId = params.get("siteId") || "";
  if (!siteId) return;
  connectSiteIdInput.value = siteId;
  setActiveTab("pixel");
  connectSiteStatus.textContent = "Site ID loaded from your account. Install the snippet, then connect this site.";
}

function selectedSiteIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("siteId") || "";
}

function updateDashboardSiteIdUrl(siteId) {
  if (!siteId || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("siteId", siteId);
  window.history.replaceState({}, "", url);
}

function getDashboardClient() {
  if (!window.supabase?.createClient) return null;
  if (!dashboardSupabaseClient) {
    dashboardSupabaseClient = window.supabase.createClient(DASHBOARD_SUPABASE_URL, DASHBOARD_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return dashboardSupabaseClient;
}

async function getDashboardAccessToken() {
  const client = getDashboardClient();
  if (!client) return "";
  const { data } = await client.auth.getSession();
  return data?.session?.access_token || "";
}

function statusLabel(status) {
  if (status === "complete") return "live";
  if (status === "in_progress") return "in progress";
  return "open";
}

function formatShortDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return "-";
  }
}

function relativeTime(value) {
  if (!value) return "Unknown";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}
