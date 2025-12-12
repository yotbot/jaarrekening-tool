// lib/parseChecklistExcel.ts
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

export interface ChecklistItem {
  sheet: string;
  vraag: string;
  subvragen: string[];
  bron?: string | null;
}

export interface ParsedChecklist {
  items: ChecklistItem[];
  sheetNames: string[];
}

export function parseChecklistExcel(buffer: Buffer): ParsedChecklist {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  console.log("DEBUG sheet names:", workbook.SheetNames);

  const allItems: ChecklistItem[] = [];
  const sheetNamesWithItems = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1, // raw rows (no header row detection)
      blankrows: false,
    });

    if (!rows || rows.length === 0) continue;

    // ---- header row zoeken voor deze sheet ----
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

    if (headerIndex === -1) {
      // geen geldige checklist-structuur in deze sheet → skip
      continue;
    }

    const header = rows[headerIndex].map(clean);
    const data = rows.slice(headerIndex + 1);

    const vraagCol = 0;

    const grootCol = header.findIndex((v) => v && v.toLowerCase() === "groot");
    const middenCol = header.findIndex(
      (v) => v && (v.toLowerCase() === "midden" || v.toLowerCase() === "middel")
    );
    const kleinCol = header.findIndex((v) => v && v.toLowerCase() === "klein");
    const bronCol = header.findIndex((v) => v && v.toLowerCase() === "bron");

    console.log("DEBUG col indexes for sheet", sheetName, {
      grootCol,
      middenCol,
      kleinCol,
      bronCol,
    });

    let currentItem: ChecklistItem | null = null;
    let itemCountForSheet = 0;

    for (const row of data) {
      const vraagRaw = clean(row[vraagCol]);
      if (!vraagRaw) continue;

      // Koptitel in all caps → skippen
      if (isAllCaps(vraagRaw)) continue;

      const grootVal = grootCol !== -1 ? clean(row[grootCol]) : null;
      const middenVal = middenCol !== -1 ? clean(row[middenCol]) : null;
      const kleinVal = kleinCol !== -1 ? clean(row[kleinCol]) : null;
      const bronVal = bronCol !== -1 ? clean(row[bronCol]) : null;

      const hasID = isID(grootVal) || isID(middenVal) || isID(kleinVal);
      if (!hasID) continue;

      // SUBVRAAG: "-" OR "a." / "b." / "c." etc.
      const isDashSub = vraagRaw.trim().startsWith("-");

      // STRICT letter+dot pattern: a. b. c. … z.
      const isLetterSub = /^[a-zA-Z]\.\s+/.test(vraagRaw.trim());

      if (isDashSub || isLetterSub) {
        if (currentItem) {
          const sub = vraagRaw
            .trim()
            // remove leading "-" or "--"
            .replace(/^[-]+\s*/, "")
            // remove leading "a. " or "B. "
            .replace(/^[a-zA-Z]\.\s+/, "")
            .trim();

          if (sub) currentItem.subvragen.push(sub);
        }
        continue;
      }

      // nieuwe hoofdvraag
      currentItem = {
        sheet: sheetName,
        vraag: vraagRaw,
        subvragen: [],
      };

      if (bronVal) currentItem.bron = bronVal;

      allItems.push(currentItem);
      itemCountForSheet++;
    }

    if (itemCountForSheet > 0) {
      sheetNamesWithItems.add(sheetName);
      console.log(
        `DEBUG: sheet "${sheetName}" → ${itemCountForSheet} checklist items`
      );
    }
  }

  return {
    items: allItems,
    sheetNames: Array.from(sheetNamesWithItems),
  };
}
