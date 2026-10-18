import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.next/**",
      "**/next-env.d.ts",
      "legacy/**",
      "raw_papers/**",
      "extracted_data/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
