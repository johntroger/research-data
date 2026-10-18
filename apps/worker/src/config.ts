import { existsSync } from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

/** Loads the repository's .env once (Node's built-in loader; values already set are kept). */
export function loadEnv(): void {
  const file = path.join(REPO_ROOT, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
}

export interface GeminiConfig {
  apiKey: string;
  strongModel: string;
  fastModel: string;
}

export function geminiConfig(): GeminiConfig {
  loadEnv();
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is empty. Open the .env file at the repository root and paste your paid-tier Gemini API key.",
    );
  }
  return {
    apiKey,
    strongModel: process.env.GEMINI_MODEL_STRONG?.trim() || "gemini-4-argon",
    fastModel: process.env.GEMINI_MODEL_FAST?.trim() || "gemini-3.8-flash",
  };
}
