/**
 * The Gemini Batch API accepts a JSON schema only up to a nesting depth (the synchronous API accepts
 * deeper ones). Measured on the real API in step 1.7, one request per batch: a chain of 3 nested
 * objects passes, 4 fails; an array of objects passes, an array of arrays of objects fails; Evidence
 * with its table_cell passes alone but fails one level deeper. Rule that fits all 14 measurements:
 * count the levels of objects, arrays and unions that contain an object or array; at most 3.
 */

export const BATCH_MAX_SCHEMA_DEPTH = 3;

type Json = Record<string, unknown>;

const isContainer = (node: Json): boolean => node.type === "object" || node.type === "array" || "properties" in node || "items" in node;

/** Does the node (a union branch, an item…) hold an object or an array anywhere inside? */
function holdsContainer(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const n = node as Json;
  if (isContainer(n)) return true;
  return Array.isArray(n.anyOf) && n.anyOf.some(holdsContainer);
}

export function schemaDepth(schema: unknown): number {
  if (!schema || typeof schema !== "object") return 0;
  const node = schema as Json;
  const children: unknown[] = [];
  if (node.properties && typeof node.properties === "object") children.push(...Object.values(node.properties as Json));
  if (node.items) children.push(node.items);
  const deepestChild = Math.max(0, ...children.map(schemaDepth));

  if (Array.isArray(node.anyOf)) {
    // A union adds a level only when one of its branches is itself an object or an array.
    const branches = Math.max(0, ...node.anyOf.map(schemaDepth));
    return (holdsContainer(node) ? 1 : 0) + Math.max(branches, deepestChild);
  }
  return (isContainer(node) ? 1 : 0) + deepestChild;
}

export const fitsBatchSchemaLimit = (schema: unknown): boolean => schemaDepth(schema) <= BATCH_MAX_SCHEMA_DEPTH;
