import readXlsxFile from "read-excel-file/node";

// Turning files sent to Laura (Telegram documents, Rota page uploads) into
// something she can use: images and PDFs go to Gemini as-is; spreadsheets
// and CSVs become plain rows.

export type FileKind = "image" | "pdf" | "xlsx" | "csv" | "text";

export function fileKind(mime: string | null | undefined, name: string | null | undefined): FileKind | null {
  const m = (mime ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();
  if (m.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/.test(n)) return "image";
  if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (m.includes("spreadsheetml") || n.endsWith(".xlsx")) return "xlsx";
  if (m === "text/csv" || n.endsWith(".csv")) return "csv";
  if (m.startsWith("text/") || /\.(txt|md)$/.test(n)) return "text";
  return null;
}

export function imageMime(mime: string | null | undefined, name: string | null | undefined): string {
  const n = (name ?? "").toLowerCase();
  if (mime && mime.startsWith("image/")) return mime;
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/** A cell as text; dates come out UK style (dd/mm/yyyy). */
function cellText(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) {
    const d = String(v.getUTCDate()).padStart(2, "0");
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    return `${d}/${m}/${v.getUTCFullYear()}`;
  }
  return String(v).trim();
}

/** Minimal CSV reader: commas or semicolons, quoted fields, "" escapes. */
export function parseCsv(text: string): string[][] {
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell.trim());
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x));
}

/** Rows of a spreadsheet or CSV (first sheet only for Excel). */
export async function tableFromFile(buf: Buffer, kind: "xlsx" | "csv"): Promise<string[][]> {
  if (kind === "csv") return parseCsv(buf.toString("utf8"));
  const rows = await readXlsxFile(buf);
  return rows.map((r) => r.map(cellText)).filter((r) => r.some((x) => x));
}

/** A table as compact text for the AI (capped so huge sheets don't blow the prompt). */
export function tableAsText(rows: string[][], maxChars = 30000): string {
  const text = rows.map((r) => r.join(" | ")).join("\n");
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n…(cut off)` : text;
}
