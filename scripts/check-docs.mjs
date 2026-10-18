// Checks relative links (and #anchors) in the project's Markdown documents.
// Usage: pnpm docs:check   — exits with code 1 when a link is broken.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const FILES = [
  "PROJECT_PLAN.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "README.md",
  "docs/architecture.md",
  "docs/integrations.md",
  "docs/data-schema.md",
  "docs/quality-assurance.md",
  "docs/ux-spec.md",
  "docs/risks.md",
];

/** GitHub-style heading anchor: lower-case, spaces → "-", punctuation removed (letters with diacritics kept). */
function anchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

function anchorsOf(file) {
  const text = readFileSync(file, "utf8");
  return new Set([...text.matchAll(/^#{1,6} (.+)$/gm)].map((m) => anchor(m[1])));
}

const problems = [];
let checked = 0;
for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!existsSync(file)) {
    problems.push(`${rel}: file is missing`);
    continue;
  }
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#terminal|#local_)/.test(target)) continue;
    checked++;
    const [targetPath, hash] = target.split("#");
    const resolved = targetPath ? path.resolve(path.dirname(file), decodeURI(targetPath).replace(/:\d+$/, "")) : file;
    if (!existsSync(resolved)) {
      problems.push(`${rel}: broken link → ${target}`);
      continue;
    }
    if (hash && resolved.endsWith(".md") && !anchorsOf(resolved).has(decodeURIComponent(hash))) {
      problems.push(`${rel}: missing anchor → ${target}`);
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`docs:check ok — ${checked} internal links in ${FILES.length} files`);
}
