const onboardingForm = document.querySelector("#clientOnboardingForm");
const onboardingStatus = document.querySelector("#clientOnboardingStatus");

onboardingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!onboardingForm.checkValidity()) {
    onboardingForm.reportValidity();
    return;
  }

  const submitButton = onboardingForm.querySelector("button[type='submit']");
  const originalText = submitButton.textContent;
  const form = new FormData(onboardingForm);
  const payload = Object.fromEntries(form.entries());
  payload.intakeType = "signed_client";
  payload.onboardingSource = "client_onboarding_intake";
  payload.jobTypes = listFromTextarea(form.get("jobTypes"));
  payload.targetTerms = [form.get("targetTerm1"), form.get("targetTerm2")].map((item) => String(item || "").trim()).filter(Boolean);
  payload.confirmed = form.get("confirmed") === "on";

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  onboardingStatus.textContent = "Sending onboarding intake to Builder Rank...";

  try {
    const response = await fetch("/api/beta-intake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || data.error || "Could not submit onboarding intake.");
    }

    onboardingStatus.textContent = "Onboarding intake received. Builder Rank will create your private workspace, Site Signal ID, and first dashboard setup from this information.";
    onboardingForm.reset();
  } catch (error) {
    onboardingStatus.textContent = `Could not submit onboarding intake: ${error.message}`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

function listFromTextarea(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
