/**
 * Shared schema package: the single source of truth for the worker, Gemini and the web.
 * Field definitions live in docs/codebook.md; these schemas follow it.
 */

export const SCHEMA_VERSION = "1.0.0";
export const CODEBOOK_VERSION = "1.0.1";

/** Data tiers from the plan (Mục 1.4). */
export const FIELD_TIERS = ["T1", "T2", "T3"] as const;
export type FieldTier = (typeof FIELD_TIERS)[number];

/** Trust badges shown to users (Mục 6.5). */
export const BADGES = [
  "auto_verified",
  "needs_attention",
  "ai_interpreted",
  "hidden",
  "human_reviewed",
  "disputed",
] as const;
export type Badge = (typeof BADGES)[number];

export * from "./enums.js";
export * from "./evidence.js";
export * from "./paper.js";
export * from "./study.js";
export * from "./json-schema.js";
export * from "./canonical.js";
