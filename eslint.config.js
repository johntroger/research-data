import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "legacy/**",
      "raw_papers/**",
      "extracted_data/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
