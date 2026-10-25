/** CSV for Excel and R (step P4.3): UTF-8 with a byte order mark (Excel needs it to read Vietnamese), CRLF line ends, fields quoted when needed. */

export function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: readonly string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return "﻿" + [columns, ...rows].map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}
