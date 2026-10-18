/**
 * Real acceptance check for packages/schema (step 0.11): sends every extraction schema to Gemini
 * with a small self-written fictional paper, and checks that the API accepts the schema and the
 * answer validates against the Zod schema.  Usage: pnpm schema:gemini-check   (≈ $0.05–0.10)
 */
import { CODEBOOK_VERSION, EXTRACTION_SCHEMAS, SCHEMA_VERSION, toGeminiJsonSchema } from "@research-data/schema";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { geminiConfig } from "../config.js";
import { geminiGenerator } from "../extract/gemini.js";
import { callCostUsd } from "../extract/pricing.js";

const PAGES = [
  [
    "Influencer credibility and brand trust in short-video commerce",
    "Abstract. We tested the model with an online survey of 412 Vietnamese shoppers.",
    "Drawing on the S-O-R framework, we expect influencer credibility to raise brand trust (H1),",
    "and brand trust to raise purchase intention (H2). No study has tested this mechanism in",
    "live-stream shopping.",
  ],
  [
    "Method. Data were collected through an online survey in March-April 2024. Respondents were",
    "recruited via social media. The final sample comprised 412 respondents after attention checks.",
    "Influencer credibility (5 items, adapted from Ohanian, 1990) is the extent to which followers",
    "see the influencer as expert and trustworthy. We analysed the data with PLS-SEM in SmartPLS 4.",
    "Harman's single-factor test showed no dominant factor.",
  ],
  [
    "Table 2. Correlations (square root of AVE on the diagonal), N = 412",
    "1. Influencer Credibility 0.82",
    "2. Brand Trust 0.48 0.84",
    "Table 3. Structural model results",
    "H1 Influencer Credibility -> Brand Trust 0.42 8.40 <0.001 Supported",
    "H2 Brand Trust -> Purchase Intention 0.35 6.10 <0.001 Supported",
    "Discussion. We extend the S-O-R framework to short-video commerce. Brands should disclose",
    "sponsorships early. The cross-sectional design limits causal claims. Future studies could",
    "use longitudinal data.",
  ],
];

async function fictionalPaper(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of PAGES) {
    const page = doc.addPage([595, 842]);
    lines.forEach((line, i) => page.drawText(line, { x: 50, y: 780 - i * 16, size: 10, font }));
  }
  return doc.save();
}

const INSTRUCTIONS = `You extract structured data from one academic paper. Use ONLY the attached PDF.
If a value is not reported, return null (or an empty array). Copy quotes word for word, one continuous passage.
evidence.pdf_page counts pages of the PDF file (first page = 1). The paper has one study: "Study 1".`;

const config = geminiConfig();
const generate = geminiGenerator(config.apiKey);
const pdf = await fictionalPaper();
console.log(`Model ${config.strongModel} · schema ${SCHEMA_VERSION} · codebook ${CODEBOOK_VERSION}\n`);

let total = 0;
let failures = 0;
for (const [name, schema] of Object.entries(EXTRACTION_SCHEMAS)) {
  const started = Date.now();
  try {
    const { text, usage } = await generate({
      model: config.strongModel,
      pdf,
      instructions: INSTRUCTIONS,
      prompt: `Extract the fields defined by the response schema ("${name}") for Study 1.`,
      jsonSchema: toGeminiJsonSchema(schema),
    });
    const cost = callCostUsd(config.strongModel, usage) ?? 0;
    total += cost;
    const parsed = schema.safeParse(JSON.parse(text));
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    if (parsed.success) {
      console.log(`✓ ${name.padEnd(26)} accepted, valid   ${seconds}s  ${usage.inputTokens}/${usage.outputTokens} tokens  $${cost.toFixed(4)}`);
    } else {
      failures++;
      const issues = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.log(`✗ ${name.padEnd(26)} accepted, INVALID ${seconds}s  ${issues}`);
    }
  } catch (error) {
    failures++;
    console.log(`✗ ${name.padEnd(26)} REJECTED: ${(error as Error).message.slice(0, 300)}`);
  }
}
console.log(`\nTotal cost: $${total.toFixed(4)}`);
process.exitCode = failures ? 1 : 0;
