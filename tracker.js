(function () {
  var script = document.currentScript;
  var siteId = script && script.getAttribute("data-site-id");
  var endpoint = (script && script.getAttribute("data-endpoint")) || "https://builderrank.io/api/track";
  var skipLoggedIn = script && script.getAttribute("data-skip-logged-in") !== "false";

  if (!siteId || !window.fetch) return;
  if (skipLoggedIn && isLoggedInBuilderRankUser()) return;

  var sessionKey = "builderRankSessionId";
  var sessionId = getSessionId();
  var landingPathKey = "builderRankLandingPath";
  var landingPath = sessionStorage.getItem(landingPathKey) || window.location.pathname;
  sessionStorage.setItem(landingPathKey, landingPath);

  send("page_view");
  bindLeadEvents();

  function bindLeadEvents() {
    document.addEventListener(
      "click",
      function (event) {
        var target = event.target && event.target.closest && event.target.closest("a,button");
        if (!target) return;

        var href = target.getAttribute("href") || "";
        var text = (target.textContent || "").toLowerCase();
        var clickMetadata = describeTarget(target, href, text);

        if (href.indexOf("tel:") === 0) {
          send("phone_click", Object.assign({ ctaType: "phone" }, clickMetadata));
          return;
        }

        if (href.indexOf("mailto:") === 0) {
          send("email_click", Object.assign({ ctaType: "email" }, clickMetadata));
          return;
        }

        if (/quote|estimate|book|schedule|consultation|contact/.test(text + " " + href.toLowerCase())) {
          send("lead_click", Object.assign({ ctaType: inferCtaType(text + " " + href.toLowerCase()) }, clickMetadata));
        }
      },
      true,
    );

    document.addEventListener(
      "submit",
      function (event) {
        var form = event.target;
        send("form_submit", {
          formId: form.id || "",
          formName: form.getAttribute("name") || "",
          formAction: form.getAttribute("action") || "",
          formMethod: form.getAttribute("method") || "get",
          formLabel: labelForForm(form),
        });
      },
      true,
    );
  }

  function describeTarget(target, href, text) {
    return {
      targetHref: href || "",
      targetText: readableText(text),
      targetTag: (target.tagName || "").toLowerCase(),
      targetId: target.id || "",
      targetClasses: readableText(target.className || ""),
      targetAriaLabel: target.getAttribute("aria-label") || "",
    };
  }

  function readableText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160);
  }

  function inferCtaType(value) {
    if (/quote|estimate/.test(value)) return "quote";
    if (/book|schedule|consultation/.test(value)) return "booking";
    if (/contact/.test(value)) return "contact";
    return "lead";
  }

  function inferJobIntent(value) {
    var text = String(value || "").toLowerCase();
    var intents = [
      [/bath|shower|tub|tile|vanity/, "Bathroom"],
      [/kitchen|cabinet|countertop|backsplash/, "Kitchen"],
      [/roof|shingle|gutter|storm damage/, "Roofing"],
      [/hvac|furnace|air conditioning|ac repair|heat pump/, "HVAC"],
      [/water damage|restoration|mold|flood|fire damage/, "Restoration"],
      [/addition|adu|garage|basement|whole home/, "Additions"],
      [/deck|patio|outdoor living|pergola/, "Outdoor living"],
      [/floor|hardwood|carpet|luxury vinyl|lvp/, "Flooring"],
      [/window|door|siding/, "Exterior"],
      [/emergency|repair|service call/, "Emergency service"],
    ];

    for (var i = 0; i < intents.length; i += 1) {
      if (intents[i][0].test(text)) return intents[i][1];
    }

    return "General";
  }

  function labelForForm(form) {
    var label = form.getAttribute("aria-label") || form.getAttribute("data-form-name") || "";
    if (label) return label;
    var legend = form.querySelector && form.querySelector("legend,h1,h2,h3");
    return legend ? readableText(legend.textContent) : "";
  }

  function send(eventName, metadata) {
    var utm = readUtm();
    var source = classifySource(document.referrer, utm);
    var eventMetadata = Object.assign({}, metadata || {});
    eventMetadata.jobIntent = eventMetadata.jobIntent || inferJobIntent([
      window.location.pathname,
      document.title,
      eventMetadata.targetText,
      eventMetadata.targetHref,
      eventMetadata.formLabel,
      eventMetadata.formAction,
    ].join(" "));
    var payload = {
      siteId: siteId,
      event: eventName,
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      sourceType: source.type,
      sourceName: source.name,
      landingPath: landingPath,
      sessionId: sessionId,
      utm: utm,
      metadata: Object.assign(
        {
          path: window.location.pathname,
          viewport: window.innerWidth + "x" + window.innerHeight,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        },
        eventMetadata,
      ),
    };

    try {
      var body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
        return;
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    } catch (error) {
      // Tracking must never break the customer website.
    }
  }

  function classifySource(referrer, utm) {
    var host = "";

    try {
      host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
    } catch (error) {
      host = "";
    }

    var sources = [
      ["chatgpt.com", "ai_assistant", "ChatGPT"],
      ["gemini.google.com", "ai_assistant", "Gemini"],
      ["claude.ai", "ai_assistant", "Claude"],
      ["perplexity.ai", "ai_assistant", "Perplexity"],
      ["copilot.microsoft.com", "ai_assistant", "Microsoft Copilot"],
      ["google.com", "search", "Google"],
      ["bing.com", "search", "Bing"],
      ["yelp.com", "directory", "Yelp"],
      ["angi.com", "directory", "Angi"],
      ["homeadvisor.com", "directory", "HomeAdvisor"],
      ["houzz.com", "directory", "Houzz"],
      ["thumbtack.com", "directory", "Thumbtack"],
      ["bbb.org", "directory", "BBB"],
      ["buildzoom.com", "directory", "BuildZoom"],
    ];

    for (var i = 0; i < sources.length; i += 1) {
      if (host === sources[i][0] || host.endsWith("." + sources[i][0])) {
        return { type: sources[i][1], name: sources[i][2] };
      }
    }

    var taggedSource = classifyTaggedSource(utm);
    if (taggedSource) return taggedSource;

    return { type: host ? "referral" : "direct", name: host || "Direct" };
  }

  function classifyTaggedSource(utm) {
    var value = [utm.source, utm.medium, utm.campaign, utm.term, utm.content, utm.ref].join(" ").toLowerCase();
    if (/chatgpt|openai|gpt/.test(value)) return { type: "ai_assistant", name: "ChatGPT" };
    if (/gemini|bard/.test(value)) return { type: "ai_assistant", name: "Gemini" };
    if (/claude|anthropic/.test(value)) return { type: "ai_assistant", name: "Claude" };
    if (/perplexity/.test(value)) return { type: "ai_assistant", name: "Perplexity" };
    if (/copilot/.test(value)) return { type: "ai_assistant", name: "Microsoft Copilot" };
    if (/google|bing|duckduckgo|search/.test(value)) return { type: "search", name: readableSourceName(utm.source || utm.medium || "Search") };
    if (/yelp|angi|homeadvisor|houzz|thumbtack|bbb|buildzoom/.test(value)) return { type: "directory", name: readableSourceName(utm.source || "Directory") };
    return null;
  }

  function readableSourceName(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); })
      .slice(0, 80);
  }

  function readUtm() {
    var params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      term: params.get("utm_term") || "",
      content: params.get("utm_content") || "",
      ref: params.get("ref") || params.get("source") || "",
    };
  }

  function getSessionId() {
    var existing = sessionStorage.getItem(sessionKey);
    if (existing) return existing;

    var value = "brs_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(sessionKey, value);
    return value;
  }

  function isLoggedInBuilderRankUser() {
    try {
      if (localStorage.getItem("builderRankAccountEmail")) return true;

      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i) || "";
        if (/^sb-.+-auth-token$/.test(key)) return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }
})();
