import * as XLSX from "xlsx";

function clean(text: any): string | null {
  if (text == null) return null;
  let t = String(text).replace(/\r|\n/g, " ").replace(/\s+/g, " ").trim();
  return t.length ? t : null;
}

function isAllCaps(str: string) {
  const t = str.replace(/[\s-]/g, "");
  return t.length > 1 && t === t.toUpperCase();
}

function isID(text: any): boolean {
  if (!text) return false;
  const cleaned = String(text).toLowerCase().replace(/\s+/g, "");
  return cleaned.includes("i+d");
}

export function parseChecklistExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  console.log("DEBUG sheet names:", workbook.SheetNames);

  // ⬅️ Temporary filter (your request)
  const targetSheet = workbook.SheetNames.find(
    (n) => n.trim().toLowerCase() === "accountantscontrole"
  );

  if (!targetSheet) {
    console.log("DEBUG: sheet not found");
    return [];
  }

  console.log("DEBUG: using sheet:", targetSheet);

  const sheet = workbook.Sheets[targetSheet];

  if (!sheet) return [];

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1, // raw rows (no header)
    blankrows: false,
  });

  console.log("DEBUG rows 0–20:\n", rows.slice(0, 20));
  console.log(
    "DEBUG ALL TEXT LOWERED:\n",
    rows.slice(0, 5).map((r) => r.map((v) => String(v).toLowerCase()))
  );

  // ---- find header row ----
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(clean);
    const lowered = row.map((v) => v?.toLowerCase());

    if (
      lowered.includes("groot") &&
      lowered.some((v) => v === "midden" || v === "middel") &&
      lowered.includes("klein") &&
      lowered.includes("bron")
    ) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return [];

  const header = rows[headerIndex].map(clean);
  const data = rows.slice(headerIndex + 1);

  const vraagCol = 0;

  const grootCol = header.findIndex((v) => v && v.toLowerCase() === "groot");
  const middenCol = header.findIndex(
    (v) => v && (v.toLowerCase() === "midden" || v.toLowerCase() === "middel")
  );
  const kleinCol = header.findIndex((v) => v && v.toLowerCase() === "klein");
  const bronCol = header.findIndex((v) => v && v.toLowerCase() === "bron");

  console.log("DEBUG col indexes:", { grootCol, middenCol, kleinCol, bronCol });

  const items: any[] = [];
  let currentItem: any = null;

  for (const row of data) {
    const vraagRaw = clean(row[vraagCol]);
    if (!vraagRaw) continue;

    if (isAllCaps(vraagRaw)) continue;

    const grootVal = clean(row[grootCol]);
    const middenVal = clean(row[middenCol]);
    const kleinVal = clean(row[kleinCol]);
    const bronVal = bronCol !== -1 ? clean(row[bronCol]) : null;

    const hasID = isID(grootVal) || isID(middenVal) || isID(kleinVal);

    if (!hasID) continue;

    // subvraag
    if (vraagRaw.startsWith("-")) {
      if (currentItem) {
        const sub = vraagRaw.replace(/^-+\s*/, "").trim();
        if (sub) currentItem.subvragen.push(sub);
      }
      continue;
    }

    // new main question
    currentItem = {
      sheet: targetSheet,
      check: vraagRaw,
      subvragen: [],
    };

    if (bronVal) currentItem.bron = bronVal;

    items.push(currentItem);
  }

  return items;
}
