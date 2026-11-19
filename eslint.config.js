import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.next-prod/**",
      "**/next-env.d.ts",
      "legacy/**",
      // Throwaway scripts kept out of git (.git/info/exclude); not part of the project.
      "apps/worker/scratch/**",
      "raw_papers/**",
      "extracted_data/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Plain Node.js scripts (not type-checked by tsc).
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
);
