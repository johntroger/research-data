/**
 * Shared schema package. The full Zod schemas are written in step 0.11
 * from the codebook; for now this only exposes version constants.
 */

export const SCHEMA_VERSION = "0.0.0";
export const CODEBOOK_VERSION = "0.0.0";

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
