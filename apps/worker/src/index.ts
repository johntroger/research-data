import { SCHEMA_VERSION } from "@research-data/schema";

/**
 * Worker entry point. Pipeline commands (sync, extract, verify, publish…)
 * are added step by step from step 0.4 onward.
 */
export function describeWorker(): string {
  return `research-data worker (schema ${SCHEMA_VERSION})`;
}
