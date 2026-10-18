import { z } from "zod";
import { SECTIONS } from "./enums.js";

/** Evidence for a value (codebook Phần M and A.2). */
export const Evidence = z
  .object({
    pdf_page: z
      .number()
      .int()
      .min(1)
      .describe("Page counted inside the PDF file (first page of the file = 1), NOT the printed journal page."),
    quote: z
      .string()
      .min(1)
      .max(400)
      .describe(
        "ONE continuous passage copied word for word (max 50 words). Never join fragments with '...' or '…'. For table values, copy the table row as printed.",
      ),
    section: z.enum(SECTIONS).nullable(),
    table_or_figure: z.string().nullable().describe('Table or figure holding the evidence, e.g. "Table 4"; null otherwise.'),
    table_cell: z
      .object({ row: z.string(), column: z.string() })
      .nullable()
      .describe('Cell of the table by its printed labels, e.g. {row: "H2", column: "β"}; null when not in a table.'),
  })
  .describe("Where the value comes from in the PDF.");

export type Evidence = z.infer<typeof Evidence>;

/** A verbatim statement from the paper (contributions, limitations…) is its own evidence. */
export const QuotedStatement = Evidence.describe("A statement copied verbatim from the paper, with its location.");
