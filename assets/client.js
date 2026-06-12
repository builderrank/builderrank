const BUILDER_RANK_LOGO_SRC = "/assets/builder-rank-logo.png";

const BUILDER_RANK_PAYMENT_URL = "https://buy.stripe.com/5kQeVd0Gdb1UaRu7AQ8bS00";
const SUPABASE_URL = "https://hosepwwflfpqgemfcafj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tq-L9aiYVbdtij2JL3oW3Q_FBDNokzQ";
const PENDING_REPORT_KEY = "builderRankPendingReport";
const REPORT_HISTORY_KEY = "builderRankReportHistory";
const ACCOUNT_EMAIL_KEY = "builderRankAccountEmail";
const ACCOUNT_PROFILE_KEY = "builderRankAccountProfile";
const PROMO_CODE_KEY = "builderRankPromoCode";
const AUTO_RUN_CHECKOUT_KEY = "builderRankAutoRunCheckout";
const CHECKOUT_SUCCESS_VALUES = new Set(["1", "true", "paid", "success", "complete", "completed"]);
const MARKET_ALIASES = {
  denver: "Denver, CO",
  "denver co": "Denver, CO",
  "denver colorado": "Denver, CO",
  "colorado springs": "Colorado Springs, CO",
  "colorado springs co": "Colorado Springs, CO",
  "colorado springs colorado": "Colorado Springs, CO",
  "colorado sprgs": "Colorado Springs, CO",
  "colorado spgs": "Colorado Springs, CO",
  "co springs": "Colorado Springs, CO",
  "colo springs": "Colorado Springs, CO",
  cos: "Colorado Springs, CO",
  boulder: "Boulder, CO",
  "boulder co": "Boulder, CO",
  "fort collins": "Fort Collins, CO",
  "fort collins co": "Fort Collins, CO",
  "castle rock": "Castle Rock, CO",
  "castle rock co": "Castle Rock, CO",
  parker: "Parker, CO",
  "parker co": "Parker, CO",
  aurora: "Aurora, CO",
  "aurora co": "Aurora, CO",
  lakewood: "Lakewood, CO",
  "lakewood co": "Lakewood, CO",
  arvada: "Arvada, CO",
  "arvada co": "Arvada, CO",
  littleton: "Littleton, CO",
  "littleton co": "Littleton, CO",
};
const STATE_ABBREVIATIONS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
]);
const STATE_NAME_TO_ABBREVIATION = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  dc: "DC",
  "district of columbia": "DC",
};
const builderRankSupabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

const baseAudit = {
  company: "Front Range Remodels",
  website: "https://front-range-remodels.com",
  market: "Denver, CO",
  categories: [
    {
      key: "entity",
      label: "Entity Check",
      score: 78,
      description: "Can an LLM verify who this contractor is, where they work, and whether they are real?",
      checks: [
        { label: "Name, address, phone consistency", status: "pass" },
        { label: "Contractor license visible and labeled", status: "warn" },
        { label: "HomeAndConstructionBusiness schema", status: "fail" },
      ],
    },
    {
      key: "semantic",
      label: "Semantic Authority",
      score: 66,
      description: "Does the site answer the specific remodel questions homeowners ask AI tools?",
      checks: [
        { label: "Kitchen and bath service pages", status: "pass" },
        { label: "Localized cost and permit answers", status: "warn" },
        { label: "Project proof tied to service areas", status: "warn" },
      ],
    },
    {
      key: "technical",
      label: "AI-Friendliness",
      score: 58,
      description: "Can AI crawlers read the site cleanly without guessing through messy HTML?",
      checks: [
        { label: "/llms.txt AI summary file", status: "fail" },
        { label: "Clean headings and text hierarchy", status: "pass" },
        { label: "Markdown or text-only crawl path", status: "fail" },
      ],
    },
    {
      key: "reputation",
      label: "Review Sentiment",
      score: 85,
      description: "Do reviews contain useful service, location, and quality language for AI citations?",
      checks: [
        { label: "Reviews mention remodel outcomes", status: "pass" },
        { label: "Reviews mention cities and neighborhoods", status: "pass" },
        { label: "Review prompts guide customers", status: "warn" },
      ],
    },
  ],
  fixes: [
    {
      priority: "Critical",
      title: "Add contractor schema to every core page",
      body: "Generate JSON-LD that names the business, service area, license, rating, phone, and core remodel services.",
    },
    {
      priority: "High",
      title: "Publish /llms.txt as an AI cheat sheet",
      body: "Summarize who the company serves, what jobs it performs, proof points, license details, and preferred citation URLs.",
    },
    {
      priority: "High",
      title: "Create localized answer blocks",
      body: "Add direct answers for kitchen remodel cost, bathroom remodel timelines, permits, and neighborhoods served.",
    },
    {
      priority: "Medium",
      title: "Upgrade review capture prompts",
      body: "Ask customers to mention the service performed, city, materials, timeline, and outcome in natural language.",
    },
  ],
  intents: [
    '"bathroom remodel contractor near me"',
    '"redo my kitchen in Denver"',
    '"licensed general contractor for basement finish"',
    '"how much does a kitchen remodel cost in Denver"',
  ],
};

let audit = structuredClone(baseAudit);
let checkoutConfirmed = false;

const auditForm = document.querySelector("#auditForm");
const emailInput = document.querySelector("#emailInput");
const websiteInput = document.querySelector("#websiteInput");
const marketInput = document.querySelector("#marketInput");
const phoneInput = document.querySelector("#phoneInput");
const overallScore = document.querySelector("#overallScore");
const scoreArc = document.querySelector("#scoreArc");
const reportTitle = document.querySelector("#reportTitle");
const gradeBadge = document.querySelector("#gradeBadge");
const auditCategories = document.querySelector("#auditCategories");
const fixList = document.querySelector("#fixList");
const intentList = document.querySelector("#intentList");
const scoreSummary = document.querySelector("#scoreSummary");
const chatgptScore = document.querySelector("#chatgptScore");
const claudeScore = document.querySelector("#claudeScore");
const geminiScore = document.querySelector("#geminiScore");
const auditStatus = document.querySelector("#auditStatus");
const evidenceList = document.querySelector("#evidenceList");
const modelAnalysisList = document.querySelector("#modelAnalysisList");
const auditSubmitButton = document.querySelector("#auditSubmitButton");
const pdfButton = document.querySelector("#pdfButton");
const jsonButton = document.querySelector("#jsonButton");
const emailReportButton = document.querySelector("#emailReportButton");
const paymentButtons = document.querySelectorAll("[data-payment-link]");
const promoCodeInputs = document.querySelectorAll("[data-promo-code-input]");
const checkoutNotice = document.querySelector("#checkoutNotice");
const returnedReportButton = document.querySelector("#returnedReportButton");
const accountLoginEmailInput = document.querySelector("#accountLoginEmailInput");
const accountLoginPasswordInput = document.querySelector("#accountLoginPasswordInput");
const accountLoginForm = document.querySelector("#accountLoginForm");
const accountLoginButton = document.querySelector("#accountLoginButton");
const accountResetOpenButton = document.querySelector("#accountResetOpenButton");
const accountCreateOpenButton = document.querySelector("#accountCreateOpenButton");
const accountSignOutButton = document.querySelector("#accountSignOutButton");
const accountProfileSummary = document.querySelector("#accountProfileSummary");
const accountStatus = document.querySelector("#accountStatus");
const reportHistoryList = document.querySelector("#reportHistoryList");
const reportCountBadge = document.querySelector("#reportCountBadge");
const reportAuthPanel = document.querySelector("#reportAuthPanel");
const reportAuthTitle = document.querySelector("#reportAuthTitle");
const reportAuthSummary = document.querySelector("#reportAuthSummary");
const reportLoginForm = document.querySelector("#reportLoginForm");
const reportLoginEmailInput = document.querySelector("#reportLoginEmailInput");
const reportLoginPasswordInput = document.querySelector("#reportLoginPasswordInput");
const reportLoginButton = document.querySelector("#reportLoginButton");
const reportResetOpenButton = document.querySelector("#reportResetOpenButton");
const reportCreateOpenButton = document.querySelector("#reportCreateOpenButton");
const createAccountModal = document.querySelector("#createAccountModal");
const createAccountForm = document.querySelector("#createAccountForm");
const createAccountCloseButton = document.querySelector("#createAccountCloseButton");
const createAccountStatus = document.querySelector("#createAccountStatus");
const createEmailInput = document.querySelector("#createEmailInput");
const createPasswordInput = document.querySelector("#createPasswordInput");
const createPasswordConfirmInput = document.querySelector("#createPasswordConfirmInput");
const createFirstNameInput = document.querySelector("#createFirstNameInput");
const createLastNameInput = document.querySelector("#createLastNameInput");
const createPhoneInput = document.querySelector("#createPhoneInput");
const createCompanyInput = document.querySelector("#createCompanyInput");
const createCompanySizeInput = document.querySelector("#createCompanySizeInput");
const createTradeInput = document.querySelector("#createTradeInput");
const resetPasswordModal = document.querySelector("#resetPasswordModal");
const resetPasswordForm = document.querySelector("#resetPasswordForm");
const resetPasswordCloseButton = document.querySelector("#resetPasswordCloseButton");
const resetPasswordStatus = document.querySelector("#resetPasswordStatus");
const resetEmailInput = document.querySelector("#resetEmailInput");
const updatePasswordModal = document.querySelector("#updatePasswordModal");
const updatePasswordForm = document.querySelector("#updatePasswordForm");
const updatePasswordStatus = document.querySelector("#updatePasswordStatus");
const newPasswordInput = document.querySelector("#newPasswordInput");
const newPasswordConfirmInput = document.querySelector("#newPasswordConfirmInput");
const marketSuggestions = document.querySelector("#marketSuggestions");

let usMarkets = [];
let usMarketByKey = new Map();
let usMarketCityCounts = new Map();

document.querySelectorAll("[data-builder-logo]").forEach((image) => {
  image.src = BUILDER_RANK_LOGO_SRC;
});

paymentButtons.forEach((button) => {
  button.addEventListener("click", handlePaymentClick);
});

promoCodeInputs.forEach((input) => {
  input.value = getStoredPromoCode();
  input.addEventListener("input", () => {
    input.value = normalizePromoCode(input.value);
    persistPromoCode(input.value);
    syncPromoCodeInputs(input.value);
    savePendingReportDraft();
  });
});

[websiteInput, marketInput, phoneInput].filter(Boolean).forEach((input) => {
  input.addEventListener("input", savePendingReportDraft);
});

marketInput?.addEventListener("input", () => {
  updateMarketSuggestions(marketInput.value);
});

marketInput?.addEventListener("focus", () => {
  updateMarketSuggestions(marketInput.value);
});

marketInput?.addEventListener("blur", () => {
  validateMarketField(marketInput, { report: false });
  savePendingReportDraft();
});

if (auditForm) {
  auditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!checkoutConfirmed) {
      await beginCheckout();
      return;
    }

    if (!validateMarketField(marketInput) || !validatePhoneField(phoneInput, "Use a valid 10-digit phone number before running the report.")) {
      resetCheckoutNotice();
      return;
    }

    savePendingReportDraft();
    setLoading(true);

    try {
      const session = await getCurrentSession();
      if (!session?.access_token) {
        throw new Error("Log in before running a paid report.");
      }

      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          website: websiteInput.value,
          market: normalizeMarket(marketInput.value),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || payload.error || "Audit failed");
      }

      audit = payload;
      const saveResult = await saveCompletedReport(payload);
      auditStatus.textContent = saveResult?.cloudSaved
        ? `Real audit complete for ${payload.website}. Saved to your account.`
        : `Real audit complete for ${payload.website}. Saved in this browser.`;
      render();
      resetCheckoutNotice();
      if (checkoutNotice) checkoutNotice.hidden = true;
      await emailCurrentReport({ automatic: true, report: payload });
    } catch (error) {
      auditStatus.textContent = `Could not complete the audit: ${error.message}`;
      resetCheckoutNotice();
    } finally {
      setLoading(false);
    }
  });

  pdfButton?.addEventListener("click", () => {
    const originalTitle = document.title;
    document.title = reportFilename("pdf").replace(/\.pdf$/, "");
    window.print();
    document.title = originalTitle;
  });

  jsonButton?.addEventListener("click", () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      report: audit,
    };
    downloadFile(reportFilename("json"), JSON.stringify(payload, null, 2), "application/json");
  });

  emailReportButton?.addEventListener("click", () => {
    void emailCurrentReport({ automatic: false });
  });

  returnedReportButton?.addEventListener("click", () => {
    auditForm.requestSubmit();
  });

  render();
}

void loadUSMarkets();
hydrateCheckoutReturn();
hydrateAuthFlows();
hydrateAccountPage();
void refreshAuthState();

function handlePaymentClick() {
  if (!auditForm) {
    const promoCode = getEnteredPromoCode();
    window.location.href = promoCode ? `/run-report?promo=${encodeURIComponent(promoCode)}` : "/run-report";
    return;
  }

  void beginCheckout();
}

async function beginCheckout() {
  if (!auditForm) {
    window.location.href = "/run-report";
    return;
  }

  if (!(await validateReportIntake())) return;

  if (BUILDER_RANK_PAYMENT_URL) {
    const pendingReport = savePendingReport({ checkoutReference: createCheckoutReference() });
    window.location.href = buildCheckoutUrl(pendingReport);
    return;
  }

  alert("Payment link is not connected yet. Create a Stripe Payment Link, then replace BUILDER_RANK_PAYMENT_URL in assets/client.js.");
}

async function validateReportIntake() {
  const session = await getCurrentSession();
  if (phoneInput && !phoneInput.value) phoneInput.value = getProfilePhone(session?.user?.user_metadata) || "";

  if (!auditForm.checkValidity()) {
    auditForm.reportValidity();
    if (auditStatus) {
      auditStatus.textContent = "Enter the contractor website and market before checkout.";
    }
    return false;
  }

  if (!session?.user) {
    if (auditStatus) auditStatus.textContent = "Log in or create an account before buying a report.";
    reportLoginEmailInput?.focus();
    return false;
  }

  if (emailInput) emailInput.value = session.user.email || "";
  if (!validateEmailField(emailInput, "Use a valid email address before checkout.")) {
    return false;
  }
  if (!validatePhoneField(phoneInput, "Use a valid 10-digit phone number before checkout.")) {
    return false;
  }
  if (!validateMarketField(marketInput)) {
    return false;
  }
  try {
    localStorage.setItem(ACCOUNT_EMAIL_KEY, session.user.email || "");
    saveAccountProfile(session.user.email, session.user.user_metadata);
  } catch {
    // Continue to checkout even if browser storage is unavailable.
  }

  if (auditStatus) auditStatus.textContent = "Account ready. Sending you to secure Stripe checkout for the one-time $49 report...";
  return true;
}

async function getCurrentSession() {
  if (!builderRankSupabase) return null;

  const { data } = await builderRankSupabase.auth.getSession();
  return data?.session || null;
}

async function signInSupabaseAccount(email, password, statusElement) {
  if (!builderRankSupabase) {
    throw new Error("Account login is unavailable because Supabase did not load.");
  }

  if (statusElement) statusElement.textContent = "Signing you in...";
  const { data, error } = await builderRankSupabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  saveAccountProfile(data.user.email, data.user.user_metadata);
  void syncHubSpotAccount(data.user.user_metadata);
  return data.user;
}

async function createSupabaseAccount(profile, password, statusElement) {
  if (!builderRankSupabase) {
    saveAccountProfile(profile.email, profile);
    return { mode: "local" };
  }

  if (statusElement) statusElement.textContent = "Creating your account...";

  const signUpResult = await builderRankSupabase.auth.signUp({
    email: profile.email,
    password,
    options: {
      data: profile,
    },
  });

  if (signUpResult.error) {
    const message = signUpResult.error.message || "";
    if (/already|registered|exists/i.test(message)) {
      const signInResult = await builderRankSupabase.auth.signInWithPassword({ email: profile.email, password });
      if (signInResult.error) throw signInResult.error;
      saveAccountProfile(signInResult.data.user.email, signInResult.data.user.user_metadata);
      return { mode: "signed-in", user: signInResult.data.user };
    }

    throw signUpResult.error;
  }

  if (signUpResult.data?.session) {
    saveAccountProfile(signUpResult.data.user.email, signUpResult.data.user.user_metadata);
    return { mode: "signed-in", user: signUpResult.data.user };
  }

  throw new Error("Account created. Check your email to confirm it, then sign in before checkout.");
}

function setCheckoutPreparing(isPreparing) {
  if (!auditSubmitButton) return;

  auditSubmitButton.disabled = isPreparing;
  auditSubmitButton.textContent = isPreparing
    ? "Creating Account..."
    : checkoutConfirmed
      ? "Generate Paid Report"
      : "Continue to Checkout";
}

function savePendingReport({ checkoutReference = readPendingReport()?.checkoutReference || "" } = {}) {
  if (!emailInput && !websiteInput && !marketInput && !phoneInput) return null;

  const phone = normalizePhone(phoneInput?.value || getProfilePhone(readAccountProfile()));

  const pendingReport = {
    email: emailInput?.value || readAccountEmail() || "",
    accountCreated: Boolean(readAccountProfile()?.accountCreated),
    website: websiteInput?.value || "",
    market: normalizeMarket(marketInput?.value || ""),
    phone,
    promoCode: getEnteredPromoCode(),
    checkoutReference,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PENDING_REPORT_KEY, JSON.stringify(pendingReport));
    if (pendingReport.email) localStorage.setItem(ACCOUNT_EMAIL_KEY, pendingReport.email);
  } catch {
    // Checkout should still continue if storage is unavailable.
  }

  return pendingReport;
}

function savePendingReportDraft() {
  if (!auditForm) return;

  try {
    const existing = readPendingReport();
    const draft = {
      ...existing,
      email: emailInput?.value || readAccountEmail() || existing?.email || "",
      accountCreated: Boolean(readAccountProfile()?.accountCreated || existing?.accountCreated),
      website: websiteInput?.value || "",
      market: marketInput?.value || "",
      phone: phoneInput?.value || existing?.phone || "",
      promoCode: getEnteredPromoCode(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(PENDING_REPORT_KEY, JSON.stringify(draft));
  } catch {
    // Checkout can still proceed if browser storage is unavailable.
  }
}

function buildCheckoutUrl(pendingReport) {
  const checkoutUrl = new URL(BUILDER_RANK_PAYMENT_URL);
  const email = pendingReport?.email || readAccountEmail();

  if (email) checkoutUrl.searchParams.set("prefilled_email", email);
  if (pendingReport?.checkoutReference) {
    checkoutUrl.searchParams.set("client_reference_id", pendingReport.checkoutReference);
  }
  if (pendingReport?.promoCode) {
    checkoutUrl.searchParams.set("prefilled_promo_code", pendingReport.promoCode);
    checkoutUrl.searchParams.set("utm_campaign", `promo_${pendingReport.promoCode.toLowerCase()}`);
  }
  checkoutUrl.searchParams.set("utm_source", "builder_rank_app");
  checkoutUrl.searchParams.set("utm_medium", "checkout");

  return checkoutUrl.toString();
}

function createCheckoutReference() {
  const randomValue = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `br_${randomValue}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

function hydrateCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const checkoutValue = params.get("checkout") || params.get("paid") || params.get("payment");
  const promoCode = normalizePromoCode(params.get("promo") || params.get("promo_code") || "");
  const isCheckoutReturn = checkoutValue && CHECKOUT_SUCCESS_VALUES.has(checkoutValue.toLowerCase());
  const pendingReport = readPendingReport();
  checkoutConfirmed = Boolean(isCheckoutReturn);

  if (promoCode) {
    persistPromoCode(promoCode);
    syncPromoCodeInputs(promoCode);
  }

  if (isCheckoutReturn && !auditForm) {
    window.location.href = "/run-report?checkout=success#report-workspace";
    return;
  }

  if (emailInput) emailInput.value = readAccountEmail() || emailInput.value;

  if (pendingReport && isCheckoutReturn) {
    if (emailInput) emailInput.value = pendingReport.email || emailInput.value;
    if (websiteInput) websiteInput.value = pendingReport.website || websiteInput.value;
    if (marketInput) marketInput.value = normalizeMarket(pendingReport.market) || marketInput.value;
    if (phoneInput) phoneInput.value = normalizePhone(pendingReport.phone) || phoneInput.value;
    if (pendingReport.promoCode) syncPromoCodeInputs(pendingReport.promoCode);
  }

  if (!isCheckoutReturn) {
    if (auditSubmitButton) auditSubmitButton.textContent = "Continue to Checkout";
    if (auditStatus) {
      auditStatus.textContent = "Log in or create an account, then complete the report fields before checkout.";
    }
    return;
  }

  if (auditSubmitButton) auditSubmitButton.textContent = "Generate Paid Report";
  if (checkoutNotice) checkoutNotice.hidden = false;
  document.querySelector("#report-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (shouldAutoRunCheckoutReport(pendingReport)) {
    markCheckoutAutoRun(pendingReport);
    if (checkoutNotice) {
      checkoutNotice.classList.add("is-generating");
      checkoutNotice.querySelector("strong").textContent = "Payment received";
      checkoutNotice.querySelector("p").textContent = "Hang tight. We are generating your Builder Rank report now.";
    }
    if (auditStatus) {
      auditStatus.textContent = `Payment confirmed. Generating the paid Builder Rank report for ${pendingReport.website}...`;
    }
    window.setTimeout(() => auditForm?.requestSubmit(), 250);
    return;
  }

  if (auditStatus) {
    auditStatus.textContent = pendingReport?.website
      ? `Payment confirmed. Ready to run the paid Builder Rank report for ${pendingReport.website}.`
      : "Payment confirmed. Enter the contractor details to run the paid Builder Rank report.";
  }
}

function shouldAutoRunCheckoutReport(pendingReport) {
  if (!checkoutConfirmed || !auditForm || !pendingReport?.website || !pendingReport?.market) return false;

  try {
    const autoRunKey = pendingReport.checkoutReference || `${pendingReport.website}|${pendingReport.market}`;
    return sessionStorage.getItem(AUTO_RUN_CHECKOUT_KEY) !== autoRunKey;
  } catch {
    return true;
  }
}

function markCheckoutAutoRun(pendingReport) {
  try {
    const autoRunKey = pendingReport.checkoutReference || `${pendingReport.website}|${pendingReport.market}`;
    sessionStorage.setItem(AUTO_RUN_CHECKOUT_KEY, autoRunKey);
  } catch {
    // Auto-run still works if session storage is unavailable.
  }
}

function resetCheckoutNotice() {
  if (!checkoutNotice) return;

  checkoutNotice.classList.remove("is-generating");
  checkoutNotice.querySelector("strong").textContent = "Payment received";
  checkoutNotice.querySelector("p").textContent = "Run the paid report now. When it finishes, we will email a thank-you note and PDF copy.";
}

async function loadUSMarkets() {
  if (!marketInput) return;

  try {
    const response = await fetch("/assets/us-markets.json");
    if (!response.ok) throw new Error("Could not load US markets.");
    const markets = await response.json();
    if (!Array.isArray(markets)) throw new Error("US markets file is invalid.");

    usMarkets = markets;
    usMarketByKey = new Map(markets.map((market) => [market.key, market]));
    usMarketCityCounts = markets.reduce((counts, market) => {
      const cityKey = searchKey(market.city);
      counts.set(cityKey, (counts.get(cityKey) || 0) + 1);
      return counts;
    }, new Map());
    updateMarketSuggestions(marketInput.value);
  } catch (error) {
    console.warn("Could not load US markets", error);
  }
}

function updateMarketSuggestions(value) {
  if (!marketSuggestions || !usMarkets.length) return;

  const query = searchKey(value);
  const suggestions = suggestUSMarkets(query).slice(0, 10);
  marketSuggestions.innerHTML = suggestions
    .map((market) => `<option value="${escapeHtml(market.label)}"></option>`)
    .join("");
}

function suggestUSMarkets(query) {
  if (!query) return preferredUSMarkets();

  const words = query.split(" ").filter(Boolean);
  return usMarkets
    .map((market) => {
      const cityKey = searchKey(market.city);
      let score = 0;

      if (market.key === query || cityKey === query) score += 100;
      if (market.key.startsWith(query) || cityKey.startsWith(query)) score += 80;
      if (words.every((word) => market.key.includes(word))) score += 45;
      if (market.key.includes(query)) score += 20;
      if (MARKET_ALIASES[query] === market.label) score += 120;

      return { market, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.market.label.localeCompare(b.market.label))
    .map((result) => result.market);
}

function preferredUSMarkets() {
  const preferredLabels = [
    "Denver, CO",
    "Colorado Springs, CO",
    "Phoenix, AZ",
    "Dallas, TX",
    "Houston, TX",
    "Austin, TX",
    "Atlanta, GA",
    "Charlotte, NC",
    "Nashville, TN",
    "Tampa, FL",
  ];
  return preferredLabels
    .map((label) => usMarketByKey.get(searchKey(label)))
    .filter(Boolean);
}

function hydrateAccountPage() {
  if (!reportHistoryList) return;

  const savedEmail = readAccountEmail();
  if (accountLoginEmailInput && savedEmail) accountLoginEmailInput.value = savedEmail;

  void renderReportHistory();
}

function hydrateAuthFlows() {
  accountLoginButton?.addEventListener("click", async () => {
    await handleLogin(accountLoginEmailInput, accountLoginPasswordInput, accountStatus, accountLoginButton);
  });

  reportLoginButton?.addEventListener("click", async () => {
    await handleLogin(reportLoginEmailInput, reportLoginPasswordInput, auditStatus, reportLoginButton);
  });

  accountResetOpenButton?.addEventListener("click", () => openResetPasswordModal(accountLoginEmailInput?.value));
  reportResetOpenButton?.addEventListener("click", () => openResetPasswordModal(reportLoginEmailInput?.value));
  resetPasswordCloseButton?.addEventListener("click", closeResetPasswordModal);
  resetPasswordModal?.addEventListener("click", (event) => {
    if (event.target === resetPasswordModal) closeResetPasswordModal();
  });

  resetPasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handlePasswordResetRequest();
  });

  updatePasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handlePasswordUpdate();
  });

  accountCreateOpenButton?.addEventListener("click", () => openCreateAccountModal(accountLoginEmailInput?.value));
  reportCreateOpenButton?.addEventListener("click", () => openCreateAccountModal(reportLoginEmailInput?.value));
  createAccountCloseButton?.addEventListener("click", closeCreateAccountModal);
  createAccountModal?.addEventListener("click", (event) => {
    if (event.target === createAccountModal) closeCreateAccountModal();
  });

  createAccountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearFieldValidity(createEmailInput, createPhoneInput);

    if (!createAccountForm.checkValidity()) {
      createAccountForm.reportValidity();
      return;
    }

    if (!validateEmailField(createEmailInput, "Use a valid email address to create your account.")) {
      return;
    }

    if (!validatePhoneField(createPhoneInput, "Use a valid 10-digit phone number to create your account.")) {
      return;
    }

    if (createPasswordInput.value !== createPasswordConfirmInput.value) {
      createPasswordConfirmInput.setCustomValidity("Passwords must match.");
      createPasswordConfirmInput.reportValidity();
      createPasswordConfirmInput.setCustomValidity("");
      if (createAccountStatus) createAccountStatus.textContent = "Passwords must match.";
      return;
    }

    const profile = {
      product: "Builder Rank",
      email: normalizeEmail(createEmailInput.value),
      first_name: createFirstNameInput.value.trim(),
      last_name: createLastNameInput.value.trim(),
      phone: normalizePhone(createPhoneInput.value),
      company_name: createCompanyInput.value.trim(),
      company_size: createCompanySizeInput.value,
      trade: createTradeInput.value.trim(),
    };
    const submitButton = createAccountForm.querySelector("button[type='submit']");

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Creating...";
      await createSupabaseAccount(profile, createPasswordInput.value, createAccountStatus);
      closeCreateAccountModal();
      if (accountStatus) accountStatus.textContent = `Signed in as ${profile.email}.`;
      if (auditStatus) auditStatus.textContent = "Account ready. Complete the report fields before checkout.";
      await refreshAuthState();
      void syncHubSpotAccount(profile);
    } catch (error) {
      if (createAccountStatus) createAccountStatus.textContent = error.message || "Could not create the account.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create Account";
    }
  });

  accountSignOutButton?.addEventListener("click", async () => {
    await builderRankSupabase?.auth.signOut();
    localStorage.removeItem(ACCOUNT_EMAIL_KEY);
    if (accountStatus) accountStatus.textContent = "Logged out.";
    await refreshAuthState();
  });

  maybeOpenPasswordRecovery();
}

async function handleLogin(emailElement, passwordElement, statusElement, buttonElement) {
  const email = emailElement?.value.trim();
  const password = passwordElement?.value;

  if (!validateEmailField(emailElement, "Enter a valid email to log in.")) {
    if (statusElement) statusElement.textContent = "Enter a valid email to log in.";
    return;
  }

  if (!password || password.length < 8) {
    statusElement.textContent = "Enter your password.";
    passwordElement?.reportValidity();
    return;
  }

  try {
    buttonElement.disabled = true;
    buttonElement.textContent = "Logging In...";
    const user = await signInSupabaseAccount(email, password, statusElement);
    passwordElement.value = "";
    statusElement.textContent = `Signed in as ${user.email}.`;
    await refreshAuthState();
  } catch (error) {
    statusElement.textContent = error.message || "Could not log in with that email and password.";
  } finally {
    buttonElement.disabled = false;
    buttonElement.textContent = "Log In";
  }
}

function openCreateAccountModal(prefillEmail = "") {
  if (!createAccountModal) return;
  createAccountModal.hidden = false;
  if (createEmailInput && prefillEmail) createEmailInput.value = prefillEmail;
  if (createAccountStatus) createAccountStatus.textContent = "";
  createEmailInput?.focus();
}

function closeCreateAccountModal() {
  if (!createAccountModal) return;
  createAccountModal.hidden = true;
  createAccountForm?.reset();
}

function openResetPasswordModal(prefillEmail = "") {
  if (!resetPasswordModal) return;
  resetPasswordModal.hidden = false;
  if (resetEmailInput && prefillEmail) resetEmailInput.value = prefillEmail;
  if (resetPasswordStatus) resetPasswordStatus.textContent = "";
  resetEmailInput?.focus();
}

function closeResetPasswordModal() {
  if (!resetPasswordModal) return;
  resetPasswordModal.hidden = true;
  resetPasswordForm?.reset();
}

async function handlePasswordResetRequest() {
  if (!builderRankSupabase) {
    if (resetPasswordStatus) resetPasswordStatus.textContent = "Password reset is unavailable because Supabase did not load.";
    return;
  }

  if (!resetPasswordForm.checkValidity()) {
    resetPasswordForm.reportValidity();
    return;
  }

  if (!validateEmailField(resetEmailInput, "Use a valid email address for the reset link.")) {
    return;
  }

  const submitButton = resetPasswordForm.querySelector("button[type='submit']");
  const email = normalizeEmail(resetEmailInput.value);

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    const { error } = await builderRankSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account?reset=password`,
    });
    if (error) throw error;
    if (resetPasswordStatus) {
      resetPasswordStatus.textContent = "Reset link sent. Check your email and follow the link to create a new password.";
    }
  } catch (error) {
    if (resetPasswordStatus) resetPasswordStatus.textContent = error.message || "Could not send the reset email.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Reset Link";
  }
}

function maybeOpenPasswordRecovery() {
  if (!updatePasswordModal) return;

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const isRecovery = params.get("reset") === "password" || hashParams.get("type") === "recovery";

  if (isRecovery) {
    updatePasswordModal.hidden = false;
    if (updatePasswordStatus) updatePasswordStatus.textContent = "Enter a new password for your Builder Rank account.";
    newPasswordInput?.focus();
  }
}

async function handlePasswordUpdate() {
  if (!builderRankSupabase) {
    if (updatePasswordStatus) updatePasswordStatus.textContent = "Password update is unavailable because Supabase did not load.";
    return;
  }

  if (!updatePasswordForm.checkValidity()) {
    updatePasswordForm.reportValidity();
    return;
  }

  if (newPasswordInput.value !== newPasswordConfirmInput.value) {
    newPasswordConfirmInput.setCustomValidity("Passwords must match.");
    newPasswordConfirmInput.reportValidity();
    newPasswordConfirmInput.setCustomValidity("");
    if (updatePasswordStatus) updatePasswordStatus.textContent = "Passwords must match.";
    return;
  }

  const submitButton = updatePasswordForm.querySelector("button[type='submit']");

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Updating...";
    const { error } = await builderRankSupabase.auth.updateUser({ password: newPasswordInput.value });
    if (error) throw error;
    updatePasswordForm.reset();
    updatePasswordModal.hidden = true;
    window.history.replaceState({}, document.title, "/account");
    if (accountStatus) accountStatus.textContent = "Password updated. You are signed in.";
    await refreshAuthState();
  } catch (error) {
    if (updatePasswordStatus) updatePasswordStatus.textContent = error.message || "Could not update the password.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Update Password";
  }
}

async function refreshAuthState() {
  const session = await getCurrentSession();
  const user = session?.user;
  const profile = user?.user_metadata || {};
  const savedEmail = user?.email || readAccountEmail();

  if (emailInput && user?.email) emailInput.value = user.email;
  if (phoneInput && !phoneInput.value) phoneInput.value = getProfilePhone(profile) || readPendingReport()?.phone || "";
  if (accountLoginEmailInput && savedEmail) accountLoginEmailInput.value = savedEmail;
  if (reportLoginEmailInput && savedEmail) reportLoginEmailInput.value = savedEmail;

  if (user) {
    saveAccountProfile(user.email, profile);
    if (reportAuthPanel) reportAuthPanel.classList.add("signed-in");
    if (reportLoginForm) reportLoginForm.hidden = true;
    if (accountLoginForm) accountLoginForm.hidden = true;
    if (reportAuthTitle) reportAuthTitle.textContent = `Signed in as ${user.email}`;
    if (reportAuthSummary) {
      reportAuthSummary.textContent = profile.company_name
        ? `${profile.company_name}${profile.trade ? ` · ${profile.trade}` : ""}`
        : "Your reports will save to this account.";
    }
    if (accountLoginButton) accountLoginButton.disabled = true;
    if (accountResetOpenButton) accountResetOpenButton.hidden = true;
    if (reportResetOpenButton) reportResetOpenButton.hidden = true;
    if (accountCreateOpenButton) accountCreateOpenButton.hidden = true;
    if (reportCreateOpenButton) reportCreateOpenButton.hidden = true;
    if (accountSignOutButton) accountSignOutButton.hidden = false;
    renderProfileSummary(user, profile);
  } else {
    if (reportAuthPanel) reportAuthPanel.classList.remove("signed-in");
    if (reportLoginForm) reportLoginForm.hidden = false;
    if (accountLoginForm) accountLoginForm.hidden = false;
    if (reportAuthTitle) reportAuthTitle.textContent = "Log in before buying a report";
    if (reportAuthSummary) reportAuthSummary.textContent = "Use the same login any time you come back to view purchased reports.";
    if (accountLoginButton) accountLoginButton.disabled = false;
    if (accountResetOpenButton) accountResetOpenButton.hidden = false;
    if (reportResetOpenButton) reportResetOpenButton.hidden = false;
    if (accountCreateOpenButton) accountCreateOpenButton.hidden = false;
    if (reportCreateOpenButton) reportCreateOpenButton.hidden = false;
    if (accountSignOutButton) accountSignOutButton.hidden = true;
    if (accountProfileSummary) {
      accountProfileSummary.hidden = true;
      accountProfileSummary.innerHTML = "";
    }
  }

  await renderReportHistory();
}

function renderProfileSummary(user, profile) {
  if (!accountProfileSummary) return;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  accountProfileSummary.hidden = false;
  accountProfileSummary.innerHTML = `
    <strong>${escapeHtml(name || user.email)}</strong>
    <span>${escapeHtml(user.email || "")}</span>
    ${getProfilePhone(profile) ? `<span>${escapeHtml(getProfilePhone(profile))}</span>` : ""}
    ${profile.company_name ? `<span>${escapeHtml(profile.company_name)}</span>` : ""}
    ${profile.company_size || profile.trade ? `<span>${escapeHtml([profile.company_size, profile.trade].filter(Boolean).join(" · "))}</span>` : ""}
  `;
}

function readAccountEmail() {
  try {
    return localStorage.getItem(ACCOUNT_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

function readAccountProfile() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveAccountProfile(email, metadata = {}) {
  if (!email) return;

  const existing = readAccountProfile();
  const profile = {
    ...existing,
    ...metadata,
    email,
    accountCreated: true,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(ACCOUNT_PROFILE_KEY, JSON.stringify(profile));
}

function readReportHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || "[]");
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

async function saveCompletedReport(report) {
  const pendingReport = readPendingReport();
  const score = typeof report.score === "number" ? report.score : scoreAudit();
  const completedReport = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: emailInput?.value || pendingReport?.email || readAccountEmail() || "",
    phone: normalizePhone(phoneInput?.value || pendingReport?.phone || getProfilePhone(readAccountProfile())),
    company: report.company || getHostname(report.website),
    website: report.website,
    market: report.market,
    score,
    grade: report.grade || gradeForScore(score),
    checkoutReference: pendingReport?.checkoutReference || "",
    createdAt: new Date().toISOString(),
  };

  try {
    if (completedReport.email) localStorage.setItem(ACCOUNT_EMAIL_KEY, completedReport.email);
    const history = readReportHistory().filter((item) => item.website !== completedReport.website);
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify([completedReport, ...history].slice(0, 12)));
  } catch {
    // The generated report still works if browser storage is unavailable.
  }

  let cloudSaved = false;
  if (builderRankSupabase) {
    const { data: sessionData } = await builderRankSupabase.auth.getSession();
    if (sessionData?.session) {
      const reportRow = {
        email: completedReport.email,
        phone: completedReport.phone,
        company: completedReport.company,
        website: completedReport.website,
        market: completedReport.market,
        score: completedReport.score,
        grade: completedReport.grade,
        checkout_reference: completedReport.checkoutReference,
        report,
      };
      let { error } = await builderRankSupabase.from("reports").insert(reportRow);

      if (error && /phone|checkout_reference|schema cache|column/i.test(error.message || "")) {
        delete reportRow.phone;
        delete reportRow.checkout_reference;
        const retry = await builderRankSupabase.from("reports").insert(reportRow);
        error = retry.error;
      }

      if (error) {
        console.warn("Could not save Supabase report", error);
      } else {
        cloudSaved = true;
        void syncHubSpotReport(completedReport);
      }
    }
  }

  return { cloudSaved };
}

async function renderReportHistory() {
  if (!reportHistoryList) return;

  let history = [];
  let source = "local";

  if (builderRankSupabase) {
    const { data: sessionData } = await builderRankSupabase.auth.getSession();
    if (sessionData?.session) {
      let { data, error } = await builderRankSupabase
        .from("reports")
        .select("id,email,phone,company,website,market,score,grade,checkout_reference,created_at")
        .order("created_at", { ascending: false });

      if (error && /checkout_reference|schema cache|column/i.test(error.message || "")) {
        const retry = await builderRankSupabase
          .from("reports")
          .select("id,email,company,website,market,score,grade,created_at")
          .order("created_at", { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn("Could not load Supabase reports", error);
      } else {
        history = data.map((item) => ({
          id: item.id,
          email: item.email,
          phone: item.phone,
          company: item.company,
          website: item.website,
          market: item.market,
          score: item.score,
          grade: item.grade,
          checkoutReference: item.checkout_reference,
          createdAt: item.created_at,
        }));
        source = "cloud";
      }
    }
  }

  if (!history.length) history = readReportHistory();
  if (reportCountBadge) reportCountBadge.textContent = `${history.length} saved`;

  if (!history.length) {
    reportHistoryList.innerHTML = `
      <div class="history-card">
        <strong>No saved reports yet</strong>
        <p>Run a report from the workspace and it will appear here in your account.</p>
        <a href="/run-report">Run first report</a>
      </div>
    `;
    if (accountStatus) {
      accountStatus.textContent = source === "cloud"
        ? "Signed in. No saved reports yet."
        : "Create or sign in to an account to load saved reports.";
    }
    return;
  }

  reportHistoryList.innerHTML = history.map(renderHistoryCard).join("");
  if (accountStatus) {
    accountStatus.textContent = source === "cloud"
      ? "Loaded from your Builder Rank account."
      : "Showing reports saved in this browser.";
  }
}

async function emailCurrentReport({ automatic = false, report = audit } = {}) {
  if (!emailReportButton) return { ok: false, error: "Email controls are unavailable." };

  const session = await getCurrentSession();
  if (!session?.access_token) {
    const message = "Log in before emailing a report.";
    if (auditStatus) auditStatus.textContent = automatic
      ? `Report complete, but the email was not sent. ${message}`
      : message;
    return { ok: false, error: message };
  }

  try {
    emailReportButton.disabled = true;
    emailReportButton.textContent = automatic ? "Sending..." : "Emailing...";
    if (auditStatus) {
      auditStatus.textContent = automatic
        ? `Report complete. Emailing the PDF report to ${session.user.email}...`
        : `Emailing the report to ${session.user.email}...`;
    }
    const response = await fetch("/api/email-report", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: session.user?.email || readAccountEmail(),
        report,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.detail || payload.error || "Could not email the report.");
    }

    auditStatus.textContent = automatic
      ? `Report complete and emailed to ${session.user.email}.`
      : `Report emailed to ${session.user.email}.`;
    return { ok: true, id: payload.id };
  } catch (error) {
    const message = `${error.message} You can still save the PDF or export JSON, then click Email Report to try again.`;
    if (auditStatus) auditStatus.textContent = automatic
      ? `Report complete, but the automatic email was not sent. ${message}`
      : message;
    console.warn("Could not email report", error);
    return { ok: false, error: error.message };
  } finally {
    emailReportButton.disabled = false;
    emailReportButton.textContent = "Email Report";
  }
}

async function syncHubSpotAccount(profile = {}) {
  const session = await getCurrentSession();
  if (!session?.access_token) return;

  try {
    await fetch("/api/hubspot-account", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ profile }),
    });
  } catch (error) {
    console.warn("Could not sync HubSpot account", error);
  }
}

async function syncHubSpotReport(report = {}) {
  const session = await getCurrentSession();
  if (!session?.access_token) return;

  try {
    await fetch("/api/hubspot-report", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ report }),
    });
  } catch (error) {
    console.warn("Could not sync HubSpot report", error);
  }
}

function renderHistoryCard(report) {
  const created = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Saved report";
  const scoreLabel = report.score === undefined ? "Score pending" : `${report.score} AI Health Score`;

  return `
    <article class="history-card">
      <strong>${escapeHtml(report.company || "Contractor report")}</strong>
      <p>${escapeHtml(report.market || "Market not set")} · ${escapeHtml(scoreLabel)} · ${escapeHtml(report.grade || "Ungraded")}</p>
      <span>${escapeHtml(report.website || "")}${report.email ? ` · ${escapeHtml(report.email)}` : ""}${report.phone ? ` · ${escapeHtml(report.phone)}` : ""} · ${escapeHtml(created)}</span>
      <a href="/run-report">Run another report</a>
    </article>
  `;
}

function getProfilePhone(profile = {}) {
  return normalizePhone(profile.phone || profile.phone_number || profile.mobile_phone || "");
}

function validateEmailField(field, message = "Use a valid email address.") {
  if (!field) return true;

  const email = normalizeEmail(field.value);
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  field.setCustomValidity(isValid ? "" : message);

  if (!isValid) {
    field.reportValidity();
    return false;
  }

  field.value = email;
  return true;
}

function validatePhoneField(field, message = "Use a valid 10-digit phone number.") {
  if (!field) return true;

  const phone = normalizePhone(field.value);
  const isValid = isValidPhone(phone);
  field.setCustomValidity(isValid ? "" : message);

  if (!isValid) {
    field.reportValidity();
    return false;
  }

  field.value = formatPhone(phone);
  return true;
}

function validateMarketField(field, { report = true } = {}) {
  if (!field) return true;

  const normalizedMarket = normalizeMarket(field.value);
  const isValid = isValidMarket(normalizedMarket);
  const message = "Use a real city and state, like Colorado Springs, CO.";
  field.setCustomValidity(isValid ? "" : message);

  if (!isValid) {
    if (report) field.reportValidity();
    if (auditStatus) auditStatus.textContent = message;
    return false;
  }

  field.value = normalizedMarket;
  return true;
}

function clearFieldValidity(...fields) {
  fields.filter(Boolean).forEach((field) => field.setCustomValidity(""));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePromoCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 40);
}

function normalizeMarket(value) {
  const rawMarket = String(value || "").trim().replace(/\s+/g, " ");
  if (!rawMarket) return "";

  const aliasKey = searchKey(rawMarket);
  if (MARKET_ALIASES[aliasKey]) return MARKET_ALIASES[aliasKey];
  const exactMarket = usMarketByKey.get(aliasKey);
  if (exactMarket) return exactMarket.label;

  const commaMatch = rawMarket.match(/^(.+?),\s*([A-Za-z .]+)$/);
  if (commaMatch) {
    const city = titleCaseMarketCity(commaMatch[1]);
    const state = normalizeState(commaMatch[2]);
    return state ? findUSMarket(city, state)?.label || `${city}, ${state}` : rawMarket;
  }

  const trailingStateMatch = rawMarket.match(/^(.+?)\s+([A-Za-z]{2}|[A-Za-z ]{4,})$/);
  if (trailingStateMatch) {
    const city = titleCaseMarketCity(trailingStateMatch[1]);
    const state = normalizeState(trailingStateMatch[2]);
    return state ? findUSMarket(city, state)?.label || `${city}, ${state}` : rawMarket;
  }

  const cityKey = searchKey(rawMarket);
  if (usMarkets.length && usMarketCityCounts.get(cityKey) === 1) {
    return usMarkets.find((market) => searchKey(market.city) === cityKey)?.label || rawMarket;
  }

  return rawMarket;
}

function isValidMarket(value) {
  const market = normalizeMarket(value);
  if (usMarketByKey.size) return usMarketByKey.has(searchKey(market));

  const match = market.match(/^([A-Za-z][A-Za-z .'-]{1,60}),\s*([A-Z]{2})$/);
  if (!match) return false;

  const city = match[1].trim();
  const state = match[2].trim();
  return city.length >= 2 && STATE_ABBREVIATIONS.has(state);
}

function findUSMarket(city, state) {
  if (!city || !state) return null;
  return usMarketByKey.get(searchKey(`${city}, ${state}`)) || null;
}

function normalizeState(value) {
  const cleaned = String(value || "").trim().replace(/\./g, "");
  const upper = cleaned.toUpperCase();
  if (STATE_ABBREVIATIONS.has(upper)) return upper;

  return STATE_NAME_TO_ABBREVIATION[cleaned.toLowerCase()] || "";
}

function titleCaseMarketCity(value) {
  const smallWords = new Set(["of", "the", "and"]);
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-");
    })
    .join(" ");
}

function searchKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getStoredPromoCode() {
  try {
    return normalizePromoCode(localStorage.getItem(PROMO_CODE_KEY) || readPendingReport()?.promoCode || "");
  } catch {
    return "";
  }
}

function getEnteredPromoCode() {
  const value = [...promoCodeInputs].map((input) => input.value).find(Boolean) || getStoredPromoCode();
  const promoCode = normalizePromoCode(value);
  persistPromoCode(promoCode);
  syncPromoCodeInputs(promoCode);
  return promoCode;
}

function persistPromoCode(value) {
  try {
    const promoCode = normalizePromoCode(value);
    if (promoCode) {
      localStorage.setItem(PROMO_CODE_KEY, promoCode);
    } else {
      localStorage.removeItem(PROMO_CODE_KEY);
    }
  } catch {
    // Promo codes are optional.
  }
}

function syncPromoCodeInputs(value) {
  const promoCode = normalizePromoCode(value);
  promoCodeInputs.forEach((input) => {
    if (input.value !== promoCode) input.value = promoCode;
  });
}

function normalizePhone(value) {
  return formatPhone(String(value || "").trim());
}

function isValidPhone(value) {
  const digits = digitsOnly(value);
  if (digits.length === 10) return !/^(\d)\1{9}$/.test(digits);
  if (digits.length === 11 && digits.startsWith("1")) return !/^1(\d)\1{9}$/.test(digits);
  return false;
}

function formatPhone(value) {
  const digits = digitsOnly(value);
  const nationalDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (nationalDigits.length !== 10) return String(value || "").trim();
  return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6)}`;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function readPendingReport() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_REPORT_KEY));
  } catch {
    return null;
  }
}

function createDemoAudit(website, market) {
  const hostname = getHostname(website);
  const company = hostname
    .replace(/^www\./, "")
    .split(".")[0]
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const seed = [...`${hostname}${market}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const drift = (index) => ((seed + index * 17) % 23) - 10;

  return {
    ...structuredClone(baseAudit),
    company: company || "Contractor Website",
    website,
    market,
    categories: baseAudit.categories.map((category, index) => ({
      ...structuredClone(category),
      score: clamp(category.score + drift(index), 38, 96),
    })),
  };
}

function getHostname(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function scoreAudit() {
  if (typeof audit.score === "number") {
    return audit.score;
  }

  const weights = {
    entity: 0.3,
    semantic: 0.3,
    technical: 0.25,
    reputation: 0.15,
  };

  return Math.round(
    audit.categories.reduce((sum, category) => sum + category.score * weights[category.key], 0),
  );
}

function gradeForScore(score) {
  if (score >= 92) return "A";
  if (score >= 86) return "A-";
  if (score >= 80) return "B+";
  if (score >= 73) return "B";
  if (score >= 67) return "B-";
  if (score >= 60) return "C";
  return "Needs Work";
}

function render() {
  const score = scoreAudit();
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (score / 100) * circumference;
  const modelScores = audit.modelScores || {
    chatgpt: clamp(score + 2, 0, 100),
    claude: clamp(score - 1, 0, 100),
    gemini: clamp(score - 4, 0, 100),
  };

  overallScore.textContent = score;
  chatgptScore.textContent = modelScores.chatgpt;
  claudeScore.textContent = modelScores.claude;
  geminiScore.textContent = modelScores.gemini;
  reportTitle.textContent = audit.company;
  gradeBadge.textContent = audit.grade || gradeForScore(score);
  scoreArc.style.strokeDasharray = `${circumference}`;
  scoreArc.style.strokeDashoffset = `${offset}`;
  scoreSummary.textContent = audit.summary || summaryForScore(score, audit.market);

  auditCategories.innerHTML = audit.categories.map(renderCategory).join("");
  fixList.innerHTML = audit.fixes.map(renderFix).join("");
  intentList.innerHTML = audit.intents.map(renderIntent).join("");
  evidenceList.innerHTML = renderEvidence(audit.evidence);
  modelAnalysisList.innerHTML = renderModelAnalyses(audit.modelAnalyses);
}

function reportFilename(extension) {
  const company = audit.company || getHostname(audit.website || websiteInput.value) || "builder-rank-report";
  const date = new Date().toISOString().slice(0, 10);
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "builder-rank-report";

  return `${date}-${slug}-builder-rank.${extension}`;
}

function downloadFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function summaryForScore(score, market) {
  if (score >= 85) {
    return `AI can confidently identify this contractor and cite them for localized remodel searches in ${market}. The next opportunity is deeper project proof and conversion tracking.`;
  }

  if (score >= 70) {
    return `AI can identify the business, but it needs stronger license, service-area, and project proof before it confidently recommends this contractor in ${market}.`;
  }

  return `AI tools may struggle to verify this contractor as a trusted local entity in ${market}. The biggest wins are schema, service specificity, and crawl-friendly content.`;
}

function renderCategory(category) {
  return `
    <section class="category-card">
      <div class="category-topline">
        <div>
          <h3>${escapeHtml(category.label)}</h3>
          <p>${escapeHtml(category.description)}</p>
        </div>
        <strong>${category.score}</strong>
      </div>
      <div class="bar" aria-hidden="true"><span style="width: ${category.score}%"></span></div>
      <ul>
        ${category.checks.map(renderCheck).join("")}
      </ul>
    </section>
  `;
}

function renderCheck(check) {
  return `
    <li>
      <span class="status-dot ${check.status}"></span>
      ${escapeHtml(check.label)}
    </li>
  `;
}

function renderFix(fix) {
  return `
    <section class="fix-card">
      <span>${escapeHtml(fix.priority)}</span>
      <h3>${escapeHtml(fix.title)}</h3>
      <p>${escapeHtml(fix.body)}</p>
    </section>
  `;
}

function renderIntent(intent) {
  return `<span>${escapeHtml(intent)}</span>`;
}

function renderEvidence(evidence) {
  if (!evidence) {
    return `
      <div class="evidence-card">
        <strong>Demo mode</strong>
        <p>Run an audit to see crawler evidence from a real website.</p>
      </div>
    `;
  }

  return `
    <div class="evidence-card">
      <strong>${evidence.pagesCrawled.length} pages crawled</strong>
      <p>${escapeHtml(evidence.pagesCrawled.join(" · "))}</p>
    </div>
    <div class="evidence-card">
      <strong>${evidence.llmsTxtFound ? "llms.txt found" : "No llms.txt found"}</strong>
      <p>${evidence.wordsRead} readable words analyzed${evidence.title ? ` from "${escapeHtml(evidence.title)}"` : ""}.</p>
    </div>
  `;
}

function renderModelAnalyses(modelAnalyses) {
  if (!modelAnalyses?.length) {
    return `
      <div class="model-followup-notice">
        <strong>Model follow-up</strong>
        <p>If ChatGPT, Claude, or Gemini does not report on a paid customer report, Builder Rank will review the issue and follow up.</p>
      </div>
      <div class="model-analysis-card">
        <div class="model-analysis-topline">
          <strong>Local heuristic mode</strong>
          <span class="model-status skipped">No API keys</span>
        </div>
        <p>Add API keys and restart the server to compare the local score with ChatGPT, Claude, and Gemini.</p>
      </div>
    `;
  }

  const incompleteModels = modelAnalyses.filter((analysis) => analysis.status !== "complete");
  const followUpNotice = incompleteModels.length
    ? `
      <div class="model-followup-notice">
        <strong>Model follow-up</strong>
        <p>${escapeHtml(incompleteModels.map((analysis) => analysis.label).join(", "))} did not report on this run. Builder Rank will review the missing model response and follow up with the customer if additional context is needed.</p>
      </div>
    `
    : "";

  return `${followUpNotice}${modelAnalyses.map(renderModelAnalysis).join("")}`;
}

function renderModelAnalysis(analysis) {
  const score = analysis.score === null || analysis.score === undefined ? "--" : analysis.score;
  const recommendations = analysis.recommendations?.length
    ? `<ul>${analysis.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  return `
    <section class="model-analysis-card">
      <div class="model-analysis-topline">
        <div>
          <strong>${escapeHtml(analysis.label)}</strong>
          <small>${escapeHtml(analysis.model)}</small>
        </div>
        <span class="model-status ${analysis.status}">${escapeHtml(analysis.status)}</span>
      </div>
      <div class="model-score-line">
        <span>${score}</span>
        <p>${escapeHtml(analysis.summary)}</p>
      </div>
      ${recommendations}
    </section>
  `;
}

function setLoading(isLoading) {
  const button = auditForm.querySelector("button");
  button.disabled = isLoading;
  if (returnedReportButton) returnedReportButton.disabled = isLoading;
  button.textContent = isLoading ? "Running Audit..." : checkoutConfirmed ? "Generate Paid Report" : "Continue to Checkout";
  auditStatus.textContent = isLoading
    ? "Crawling the website, checking schema, reading text, and scoring LLM readability..."
    : auditStatus.textContent;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}
