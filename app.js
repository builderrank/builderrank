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

const auditForm = document.querySelector("#auditForm");
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

auditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
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
    auditStatus.textContent = `Real audit complete for ${payload.website}.`;
    render();
  } catch (error) {
    auditStatus.textContent = `Could not complete the audit: ${error.message}`;
  } finally {
    setLoading(false);
  }
});

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

render();
