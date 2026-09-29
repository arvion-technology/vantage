// Browser-only CSV download helper. Kept out of the pure admin core so tests do
// not need a DOM.

export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  const cols = columns || Object.keys(rows[0] || {});
  const escape = (value: unknown): string => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [cols.join(","), ...rows.map((row) => cols.map((col) => escape(row[col])).join(","))].join("\n");
}

export function downloadText(filename: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
