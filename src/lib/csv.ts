/** RFC 4180 CSV with formula-injection protection for spreadsheet apps. */
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cell = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    let s = typeof value === "object" ? JSON.stringify(value) : String(value);
    // Prevent spreadsheets from interpreting user text as formulas.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}
