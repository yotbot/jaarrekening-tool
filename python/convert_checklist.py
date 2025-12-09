import pandas as pd
import json
import sys
import re


def clean_text(value):
    """Maak van een cel een nette string zonder newline of rare whitespace."""
    if value is None or pd.isna(value):
        return None

    text = str(value)

    # verwijder newline / carriage return
    text = text.replace("\n", " ").replace("\r", " ")

    # collapse dubbele spaties
    text = re.sub(r"\s+", " ", text)

    return text.strip()

def is_all_caps(text):
    """Check if a text is a full ALL CAPS category header."""
    if text is None:
        return False

    t = text.replace(" ", "").replace("-", "")
    return t.isupper() and len(t) > 1



def is_i_plus_d(value):
    """
    Check of de cel 'i + d' bevat in welke variant dan ook:
    - 'i + d'
    - 'i+d'
    - ' I  +  D '
    - 'i + d verplicht'
    """
    if value is None or pd.isna(value):
        return False

    try:
        text = str(value).lower()
    except Exception:
        return False

    # alle spaties eruit → 'i+d'
    cleaned = re.sub(r"\s+", "", text)
    return "i+d" in cleaned


def find_header_row_raw(df_raw):
    """
    Zoek de rij waarin de kolomtitels staan: Groot / Midden / Klein / Bron.
    We lezen de sheet zonder header, dus alle rijen zijn 'data'.
    """
    for idx, row in df_raw.iterrows():
        values = [clean_text(v) for v in row]

        # lowercased values voor matching
        lowered = [v.lower() for v in values if v is not None]

        # eis: we zien minimaal Groot, Midden/Middel en Klein en Bron in deze rij
        has_groot = any(v == "groot" for v in lowered)
        has_midden = any(v in ("midden", "middel") for v in lowered)
        has_klein = any(v == "klein" for v in lowered)
        has_bron = any(v == "bron" for v in lowered)

        if has_groot and has_midden and has_klein and has_bron:
            return idx

    return None


def build_structured_df(df_raw):
    """
    Neemt een 'ruwe' sheet (header=None) en bouwt er een nette dataframe van
    met echte kolomnamen op basis van de header-rij.
    """
    header_row_idx = find_header_row_raw(df_raw)
    if header_row_idx is None:
        # geen header gevonden → sheet overslaan
        return None

    # De header is de volledige rij op header_row_idx
    header_row = df_raw.iloc[header_row_idx]

    # Nieuwe kolomnamen (strings, niet-lowercase, we willen de originele labels behouden)
    new_columns = [clean_text(v) or "" for v in header_row]

    # Data begint op de rij NA de header
    df_data = df_raw.iloc[header_row_idx + 1:].copy()
    df_data.columns = new_columns

    # Lege kolommen weggooien
    df_data = df_data.dropna(how="all", axis=1)

    # Lege rijen weggooien
    df_data = df_data.dropna(how="all", axis=0)

    if df_data.empty:
        return None

    return df_data


def extract_items_from_sheet(df_data, sheet_name):
    """
    Verwerkt één sheet en consolideert '- opsommingen' in subvragen.
    """
    items = []

    cols = list(df_data.columns)

    # vraagkolom is de eerste kolom
    vraag_col = cols[0]

    groot_col = next((c for c in cols if c.lower() == "groot"), None)
    midden_col = next((c for c in cols if c.lower() in ("midden", "middel")), None)
    klein_col = next((c for c in cols if c.lower() == "klein"), None)
    bron_col = next((c for c in cols if c.lower() == "bron"), None)

    current_main_item = None

    for _, row in df_data.iterrows():

        groot_val = clean_text(row.get(groot_col)) if groot_col else None
        midden_val = clean_text(row.get(midden_col)) if midden_col else None
        klein_val = clean_text(row.get(klein_col)) if klein_col else None

        bron_val = clean_text(row.get(bron_col)) if bron_col else None
        vraag_raw = clean_text(row.get(vraag_col))

        # Skip category entries (ALL CAPS)
        if is_all_caps(vraag_raw):
          continue

        # Skip completely empty questions
        if not vraag_raw:
            continue

        # Check i+d
        has_i_d = any(
            is_i_plus_d(v)
            for v in (groot_val, midden_val, klein_val)
            if v is not None
        )
        if not has_i_d:
            continue

        # 🟦 CASE 1: Subvraag (begint met '-')
        if vraag_raw.startswith("-"):
            if current_main_item:
                # Voeg subvraag toe zonder '-'
                sub = vraag_raw.lstrip("- ").strip()
                if sub:
                    current_main_item.setdefault("subvragen", []).append(sub)
            # Geen eigen item maken voor dit type rij
            continue

        # 🟩 CASE 2: Nieuw hoofd-item
        item = {
            "sheet": sheet_name,
            "vraag": vraag_raw,
        }

        if bron_val:
            item["bron"] = bron_val

        items.append(item)
        current_main_item = item  # Deze wordt de parent voor volgende '-'-regels

    return items



def convert_excel_to_json(file_path):
    all_items = []

    # We lezen ZONDER header zodat we zelf de header-rij kunnen detecteren
    xls = pd.ExcelFile(file_path)

    for sheet in xls.sheet_names:

        # 🔥 TEMPORARY FILTER — ONLY THIS SHEET
        if sheet != "Accountantscontrole":
            continue

        df_raw = pd.read_excel(file_path, sheet_name=sheet, header=None)

        structured = build_structured_df(df_raw)
        if structured is None:
            continue

        items = extract_items_from_sheet(structured, sheet)
        all_items.extend(items)

    return all_items



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_checklist.py <path-to-excel-file>")
        sys.exit(1)

    input_file = sys.argv[1]
    items = convert_excel_to_json(input_file)
    print(json.dumps(items, indent=2, ensure_ascii=False))
