import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { renderReportPdfBase64 } from "../api/email-report.js";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run report:pdf -- path/to/report.json [output.pdf]");
  process.exitCode = 1;
} else {
  const absoluteInput = path.resolve(inputPath);
  const parsed = JSON.parse(await readFile(absoluteInput, "utf8"));
  const report = parsed.report || parsed;
  const defaultName = `${slugify(report.company || "builder-rank-report")}-builder-rank.pdf`;
  const outputPath = path.resolve(process.argv[3] || path.join("output", "pdf", defaultName));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(renderReportPdfBase64(report), "base64"));
  console.log(outputPath);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "builder-rank-report";
}
