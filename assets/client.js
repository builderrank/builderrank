const BUILDER_RANK_LOGO_SRC = "/assets/builder-rank-logo.png";

const BUILDER_RANK_PAYMENT_URL = "https://buy.stripe.com/5kQeVd0Gdb1UaRu7AQ8bS00";
const SUPABASE_URL = "https://hosepwwflfpqgemfcafj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tq-L9aiYVbdtij2JL3oW3Q_FBDNokzQ";
const PENDING_REPORT_KEY = "builderRankPendingReport";
const REPORT_HISTORY_KEY = "builderRankReportHistory";
const ACCOUNT_EMAIL_KEY = "builderRankAccountEmail";
const ACCOUNT_PROFILE_KEY = "builderRankAccountProfile";
const CHECKOUT_SUCCESS_VALUES = new Set(["1", "true", "paid", "success", "complete", "completed"]);
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
const paymentButtons = document.querySelectorAll("[data-payment-link]");
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

document.querySelectorAll("[data-builder-logo]").forEach((image) => {
  image.src = BUILDER_RANK_LOGO_SRC;
});

paymentButtons.forEach((button) => {
  button.addEventListener("click", handlePaymentClick);
});

if (auditForm) {
  auditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!checkoutConfirmed) {
      await beginCheckout();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          website: websiteInput.value,
          market: marketInput.value,
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
    } catch (error) {
      auditStatus.textContent = `Could not complete the audit: ${error.message}`;
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

  returnedReportButton?.addEventListener("click", () => {
    auditForm.requestSubmit();
  });

  render();
}

hydrateCheckoutReturn();
hydrateAuthFlows();
hydrateAccountPage();
void refreshAuthState();

function handlePaymentClick() {
  if (!auditForm) {
    window.location.href = "/run-report";
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
    savePendingReport();
    window.location.href = BUILDER_RANK_PAYMENT_URL;
    return;
  }

  alert("Payment link is not connected yet. Create a Stripe Payment Link, then replace BUILDER_RANK_PAYMENT_URL in assets/client.js.");
}

async function validateReportIntake() {
  if (!auditForm.checkValidity()) {
    auditForm.reportValidity();
    if (auditStatus) {
      auditStatus.textContent = "Enter the contractor website and market before checkout.";
    }
    return false;
  }

  const session = await getCurrentSession();
  if (!session?.user) {
    if (auditStatus) auditStatus.textContent = "Log in or create an account before buying a report.";
    reportLoginEmailInput?.focus();
    return false;
  }

  if (emailInput) emailInput.value = session.user.email || "";
  try {
    localStorage.setItem(ACCOUNT_EMAIL_KEY, session.user.email || "");
    saveAccountProfile(session.user.email, session.user.user_metadata);
  } catch {
    // Continue to checkout even if browser storage is unavailable.
  }

  if (auditStatus) auditStatus.textContent = "Account ready. Sending you to secure checkout...";
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
      ? "Generate Report Card"
      : "Continue to Checkout";
}

function savePendingReport() {
  if (!emailInput && !websiteInput && !marketInput) return;

  const pendingReport = {
    email: emailInput?.value || readAccountEmail() || "",
    accountCreated: Boolean(readAccountProfile()?.accountCreated),
    website: websiteInput?.value || "",
    market: marketInput?.value || "",
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PENDING_REPORT_KEY, JSON.stringify(pendingReport));
    if (pendingReport.email) localStorage.setItem(ACCOUNT_EMAIL_KEY, pendingReport.email);
  } catch {
    // Checkout should still continue if storage is unavailable.
  }
}

function hydrateCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const checkoutValue = params.get("checkout") || params.get("paid") || params.get("payment");
  const isCheckoutReturn = checkoutValue && CHECKOUT_SUCCESS_VALUES.has(checkoutValue.toLowerCase());
  const pendingReport = readPendingReport();
  checkoutConfirmed = Boolean(isCheckoutReturn);

  if (isCheckoutReturn && !auditForm) {
    window.location.href = "/run-report?checkout=success#report-workspace";
    return;
  }

  if (emailInput) emailInput.value = readAccountEmail() || emailInput.value;

  if (pendingReport && isCheckoutReturn) {
    if (emailInput) emailInput.value = pendingReport.email || emailInput.value;
    if (websiteInput) websiteInput.value = pendingReport.website || websiteInput.value;
    if (marketInput) marketInput.value = pendingReport.market || marketInput.value;
  }

  if (!isCheckoutReturn) {
    if (auditSubmitButton) auditSubmitButton.textContent = "Continue to Checkout";
    if (auditStatus) {
      auditStatus.textContent = "Log in or create an account, then complete the report fields before checkout.";
    }
    return;
  }

  if (auditSubmitButton) auditSubmitButton.textContent = "Generate Report Card";
  if (checkoutNotice) checkoutNotice.hidden = false;
  if (auditStatus) {
    auditStatus.textContent = pendingReport?.website
      ? `Payment confirmed. Ready to run the paid report for ${pendingReport.website}.`
      : "Payment confirmed. Enter the contractor details to run the paid report.";
  }

  document.querySelector("#report-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    if (!createAccountForm.checkValidity()) {
      createAccountForm.reportValidity();
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
      email: createEmailInput.value.trim(),
      first_name: createFirstNameInput.value.trim(),
      last_name: createLastNameInput.value.trim(),
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

  if (!email) {
    statusElement.textContent = "Enter your email to log in.";
    emailElement?.reportValidity();
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

  const submitButton = resetPasswordForm.querySelector("button[type='submit']");
  const email = resetEmailInput.value.trim();

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
  const score = typeof report.score === "number" ? report.score : scoreAudit();
  const completedReport = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: emailInput?.value || readPendingReport()?.email || readAccountEmail() || "",
    company: report.company || getHostname(report.website),
    website: report.website,
    market: report.market,
    score,
    grade: report.grade || gradeForScore(score),
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
      const { error } = await builderRankSupabase.from("reports").insert({
        email: completedReport.email,
        company: completedReport.company,
        website: completedReport.website,
        market: completedReport.market,
        score: completedReport.score,
        grade: completedReport.grade,
        report,
      });

      if (error) {
        console.warn("Could not save Supabase report", error);
      } else {
        cloudSaved = true;
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
      const { data, error } = await builderRankSupabase
        .from("reports")
        .select("id,email,company,website,market,score,grade,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not load Supabase reports", error);
      } else {
        history = data.map((item) => ({
          id: item.id,
          email: item.email,
          company: item.company,
          website: item.website,
          market: item.market,
          score: item.score,
          grade: item.grade,
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

function renderHistoryCard(report) {
  const created = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Saved report";
  const scoreLabel = report.score === undefined ? "Score pending" : `${report.score} AI Health Score`;

  return `
    <article class="history-card">
      <strong>${escapeHtml(report.company || "Contractor report")}</strong>
      <p>${escapeHtml(report.market || "Market not set")} · ${escapeHtml(scoreLabel)} · ${escapeHtml(report.grade || "Ungraded")}</p>
      <span>${escapeHtml(report.website || "")}${report.email ? ` · ${escapeHtml(report.email)}` : ""} · ${escapeHtml(created)}</span>
      <a href="/run-report">Run another report</a>
    </article>
  `;
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
      <div class="model-analysis-card">
        <div class="model-analysis-topline">
          <strong>Local heuristic mode</strong>
          <span class="model-status skipped">No API keys</span>
        </div>
        <p>Add API keys and restart the server to compare the local score with ChatGPT, Claude, and Gemini.</p>
      </div>
    `;
  }

  return modelAnalyses.map(renderModelAnalysis).join("");
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
  button.textContent = isLoading ? "Running Audit..." : "Generate Report Card";
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
