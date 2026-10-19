/** Which extraction pass a request belongs to, recognised from the JSON schema it carries. */
import { EXTRACTION_SCHEMAS, type ExtractionSchemaName, toGeminiJsonSchema } from "@research-data/schema";

const BY_SCHEMA = new Map(
  (Object.keys(EXTRACTION_SCHEMAS) as ExtractionSchemaName[]).map((name) => [JSON.stringify(toGeminiJsonSchema(EXTRACTION_SCHEMAS[name])), name]),
);

/** The pass, or null for a schema that is not one of the extraction schemas. */
export function passOfSchema(jsonSchema: Record<string, unknown>): ExtractionSchemaName | null {
  return BY_SCHEMA.get(JSON.stringify(jsonSchema)) ?? null;
}
