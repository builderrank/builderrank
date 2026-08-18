import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runAudit } from "../server.js";
import { renderReportPdfBase64 } from "../api/email-report.js";

const [website, market, outputDirectory = "output/pdf"] = process.argv.slice(2);
if (!website || !market) {
  console.error('Usage: npm run report:rerun -- "https://example.com" "Denver, CO or 80202" [output-directory]');
  process.exitCode = 1;
} else {
  const report = await runAudit(website, market);
  const incompleteModels = report.modelAnalyses.filter((analysis) => analysis.status !== "complete");
  if (incompleteModels.length && !process.argv.includes("--allow-incomplete-models")) {
    const labels = incompleteModels.map((analysis) => analysis.label).join(", ");
    throw new Error(`${labels} did not complete. No customer PDF was written. Run this command only where the production model credentials are loaded, or pass --allow-incomplete-models for a clearly labeled diagnostic PDF.`);
  }
  const slug = slugify(report.company || new URL(report.website).hostname);
  const directory = path.resolve(outputDirectory);
  const pdfPath = path.join(directory, `${slug}-builder-rank.pdf`);
  const jsonPath = path.join(directory, `${slug}-builder-rank.json`);
  await mkdir(directory, { recursive: true });
  await writeFile(pdfPath, Buffer.from(renderReportPdfBase64(report), "base64"));
  await writeFile(jsonPath, JSON.stringify({ exportedAt: new Date().toISOString(), report }, null, 2));
  console.log(JSON.stringify({ pdfPath, jsonPath, score: report.score, grade: report.grade }, null, 2));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "builder-rank-report";
}
