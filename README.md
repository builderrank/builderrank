# Builder Rank Local MVP

Builder Rank audits general contractor websites for LLM readability and local AI search visibility.

## Run locally

```bash
npm start
```

Then open:

```text
http://localhost:4174
```

If port `4174` is already busy:

```bash
PORT=4175 npm start
```

Then open:

```text
http://localhost:4175
```

## Enable real ChatGPT, Claude, and Gemini analysis

The MVP works without API keys using local scoring heuristics. To call the real model APIs, set any or all of
these environment variables before starting the server:

```bash
export OPENAI_API_KEY="your_openai_key"
export ANTHROPIC_API_KEY="your_anthropic_key"
export GEMINI_API_KEY="your_gemini_key"
npm start
```

Or create a private `.env` file:

```bash
cp .env.example .env
```

Then paste your real keys into `.env` and restart the server.

You can also override the default models:

```bash
export OPENAI_MODEL="gpt-5.2"
export ANTHROPIC_MODEL="claude-sonnet-4-6"
export GEMINI_MODEL="gemini-2.5-flash"
```

API keys stay server-side. The browser only receives the model's score, status, summary, and recommendations.

## What the MVP checks

- Crawls the homepage plus up to five useful internal pages.
- Looks for phone, address, service-area, license, bonded, and insured signals.
- Checks for contractor or LocalBusiness JSON-LD schema.
- Checks for `/llms.txt`.
- Looks for specific remodel/construction service language.
- Looks for localized cost, permit, timeline, FAQ, review, and project proof language.
- Produces a Builder Rank score, category scores, prioritized fixes, and crawl evidence.
- When keys are configured, sends the crawled evidence to ChatGPT, Claude, and Gemini for model-specific scoring.

## Local sample

Use this test URL after starting the server:

```text
http://localhost:4174/sample-contractor.html
```

If you started on another port, replace `4174` with that port.

## Deploy to Vercel

This project is Vercel-ready:

- Static files are served from the project root.
- The production audit endpoint lives at `/api/audit`.
- API keys must be configured in Vercel Project Settings, not committed to GitHub.

Add these Vercel Environment Variables for Production and Preview:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
OPENAI_MODEL
ANTHROPIC_MODEL
GEMINI_MODEL
```

Recommended model values:

```text
OPENAI_MODEL=gpt-5.2
ANTHROPIC_MODEL=claude-sonnet-4-6
GEMINI_MODEL=gemini-2.5-flash
```

After connecting the GitHub repo to Vercel, redeploy after adding or changing environment variables.
