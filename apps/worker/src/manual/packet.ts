/**
 * Work packet for an external extractor (step 1b.8a, D16, Mục 4.5): everything a tool such as Codex needs to
 * extract one paper, in one folder outside the repository. The text comes from the same sources as the Gemini
 * calls (FULL_INSTRUCTIONS, PASS_PROMPTS, EXTRACTION_SCHEMAS), so a change of prompt or schema happens in one place.
 * Pure: the same input gives the same files, byte for byte.
 */
import { CODEBOOK_VERSION, EXTRACTION_SCHEMAS, type ExtractionSchemaName, SCHEMA_VERSION, toGeminiJsonSchema } from "@research-data/schema";
import { FULL_INSTRUCTIONS, FULL_PROMPT_VERSION, PASS_PROMPTS, STUDY_PART_NAMES, type StudyPartName, studyPrompt } from "../extract/full-prompt.js";

export interface PacketInput {
  /** Name of the packet folder, e.g. "Q1-codex". */
  code: string;
  fileHash: string;
  title: string | null;
  pdf: Uint8Array;
  /** The text of each page as our checker reads it (reading order, then visual rows): quotes copied from it pass the check. */
  pageTexts?: { text: string; rows: string }[];
}

export interface PacketFile {
  /** Path inside the packet folder, with "/". */
  path: string;
  content: string | Uint8Array;
}

/** What the packet says about itself; `manual check` and `manual import` read it back. */
export interface PacketMeta {
  code: string;
  fileHash: string;
  title: string | null;
  promptVersion: string;
  schemaVersion: string;
  codebookVersion: string;
}

export const PACKET_FILES = { meta: "packet.json", pdf: "paper.pdf", instructions: "INSTRUCTIONS.md", agents: "AGENTS.md", feedback: "FEEDBACK.md", out: "out" } as const;

/** Name of the answer file of a pass of the paper, inside `out/`. */
export const paperFileName = (pass: "paper_structure" | "paper_discussion") => `${pass}.json`;

/** Name of the answer file of one part of a study (studies are numbered from 1, in the order of paper_structure). */
export const studyFileName = (studyNumber: number, part: StudyPartName) => `study_${studyNumber}_${part}.json`;

/** Text copy of page n (1-based) of the PDF, inside `text/`. */
export const pageTextFileName = (page: number) => `text/page-${String(page).padStart(2, "0")}.txt`;

export const schemaFileName = (pass: ExtractionSchemaName) => `schemas/${pass}.schema.json`;

export function packetMeta(input: PacketInput): PacketMeta {
  return { code: input.code, fileHash: input.fileHash, title: input.title, promptVersion: FULL_PROMPT_VERSION, schemaVersion: SCHEMA_VERSION, codebookVersion: CODEBOOK_VERSION };
}

/** The extra rule that points at the page texts, when the packet has them. */
function pageTextRule(input: PacketInput): string {
  if (!input.pageTexts) return "";
  return (
    "\n* The folder `text/` has the text of every page (`page-NN.txt`, NN = pdf_page): first the text in reading order, then the same page as visual rows (use the rows for tables). " +
    'A checker compares your quotes with exactly this text, so copy quotes from these files character for character (also odd characters such as ligatures, "!" or "->" standing for an arrow) and use the PDF itself for layout, tables and figures.'
  );
}

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, " ");

function instructions(input: PacketInput): string {
  const exampleFiles = STUDY_PART_NAMES.map((part) => `out/${studyFileName(1, part)}`).join(", ");
  const parts = STUDY_PART_NAMES.map(
    (part) =>
      `#### ${part}\nSchema: ${schemaFileName(part)}\nPrompt: ${oneLine(studyPrompt(part, "<LABEL>", ["<LABEL>", "<OTHER>"])).replace(' Ignore "<OTHER>".', " Ignore every other study.")}\nFile for study i: out/study_<i>_${part}.json`,
  ).join("\n\n");
  return `# Extraction task: ${input.code}

You extract structured data from ONE academic paper, \`${PACKET_FILES.pdf}\` in this folder, for a research database.
Use only this paper and the files in this folder. Do not use the internet and do not read any file outside this folder.
Prompt version ${FULL_PROMPT_VERSION}, schema ${SCHEMA_VERSION}, codebook ${CODEBOOK_VERSION}.

## General rules (apply to every field)

${FULL_INSTRUCTIONS}

## Extra rules for this setting

* Read the whole PDF, all pages. When a table is hard to read as text, look at the page image.
* If numbers are only in a figure or image and you cannot read them reliably, return null for them. Never guess.
* Each output file contains ONE JSON object, exactly matching the JSON Schema named for that file: no markdown fences, no comments, no text around it, UTF-8.
* Field names, enum values and nesting must follow the schema exactly. Use null for unreported values where the schema allows it.
* A quote must be a single continuous passage that appears in the PDF (see rule 3). Copy it as printed, also when a word is split by a hyphen at the end of a line.${pageTextRule(input)}

## Work order (write every file into \`${PACKET_FILES.out}/\`, with exactly these names)

### Step 1: structure
Schema: ${schemaFileName("paper_structure")}
Prompt: ${oneLine(PASS_PROMPTS.paper_structure)}
Write: ${PACKET_FILES.out}/${paperFileName("paper_structure")}

### Step 2: discussion
Schema: ${schemaFileName("paper_discussion")}
Prompt: ${oneLine(PASS_PROMPTS.paper_discussion)}
Write: ${PACKET_FILES.out}/${paperFileName("paper_discussion")}

### Step 3: four files for each study
Take the studies listed in ${PACKET_FILES.out}/${paperFileName("paper_structure")} (field \`studies\`), in that order, numbered i = 1, 2, … For each study, replace <LABEL> by its \`study_label\` and write four files. Use the file names in full. For study 1 they are: ${exampleFiles}.
If the paper has no studies (a conceptual paper or a review), write no study files.

${parts}

## Feedback loop

If a file named ${PACKET_FILES.feedback} exists in this folder, it lists files that did not pass validation. Read it, fix ONLY those files, write them again, and do not touch the others.

## When you finish

Print one line: the number of files written in ${PACKET_FILES.out}/.
`;
}

const agents = `# Instructions for the coding agent

Do exactly the task in ${PACKET_FILES.instructions}. Work only inside this folder. Never read, search or open anything outside it (no parent folders, no environment files, no keys). Do not install anything. Write results only to ${PACKET_FILES.out}/.
`;

/** All files of the packet, sorted by path. The empty \`out/\` folder is created by the writer. */
export function buildPacket(input: PacketInput): PacketFile[] {
  const files: PacketFile[] = [
    { path: PACKET_FILES.meta, content: `${JSON.stringify(packetMeta(input), null, 2)}\n` },
    { path: PACKET_FILES.pdf, content: input.pdf },
    { path: PACKET_FILES.instructions, content: instructions(input) },
    { path: PACKET_FILES.agents, content: agents },
  ];
  (input.pageTexts ?? []).forEach((page, i) => files.push({ path: pageTextFileName(i + 1), content: `=== PAGE ${i + 1}: TEXT IN READING ORDER ===
${page.text}

=== PAGE ${i + 1}: VISUAL ROWS (tables) ===
${page.rows}
` }));
  for (const pass of Object.keys(EXTRACTION_SCHEMAS) as ExtractionSchemaName[]) {
    files.push({ path: schemaFileName(pass), content: `${JSON.stringify(toGeminiJsonSchema(EXTRACTION_SCHEMAS[pass]), null, 2)}\n` });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
