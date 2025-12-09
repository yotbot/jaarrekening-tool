import pandas as pd
import json
import sys
import re


def clean_text(value):
    if pd.isna(value):
        return None
    return str(value).strip()


def is_i_plus_d(value):
    if value is None or pd.isna(value):
        return False

    original = str(value)
    text = original.lower()

    cleaned = re.sub(r"\s+", "", text)

    # DEBUG: print raw and cleaned value
    print(f"      RAW='{original}'  CLEANED='{cleaned}'  → MATCH={ 'i+d' in cleaned }")

    return "i+d" in cleaned


def debug_dataframe(df, sheet_name):
    print(f"\n=== SHEET: {sheet_name} ===")
    print("Columns:", list(df.columns))

    df_clean = df.dropna(how="all").dropna(axis=1, how="all")
    print(f"Rows after cleanup: {len(df_clean)}")

    return df_clean


def convert_excel_with_debug(file_path):
    xls = pd.ExcelFile(file_path)

    all_items = []
    total_i_d_hits = 0

    for sheet in xls.sheet_names:
        print(f"\n---------------------------------------------")
        print(f"PROCESSING SHEET: {sheet}")
        print(f"---------------------------------------------")

        df = xls.parse(sheet)
        df = debug_dataframe(df, sheet)

        # lowercase columns
        df.columns = [c.lower().strip() for c in df.columns]

        # detect category columns
        categorie_cols = [
            c for c in df.columns
            if "groot" in c or "middel" in c or "midden" in c or "klein" in c
        ]
        print("Detected category columns:", categorie_cols)

        # loop rows
        for idx, row in df.iterrows():
            print(f"\n  ROW {idx}:")
            print("    FULL ROW:", dict(row))

            found = False
            for c in categorie_cols:
                print(f"    Checking column '{c}' …")
                if is_i_plus_d(row.get(c)):
                    print("      → MATCH FOUND in column:", c)
                    found = True

            if found:
                total_i_d_hits += 1

    print("\n==============================================")
    print(" SUMMARY")
    print("==============================================")
    print(" Total rows containing i+d =", total_i_d_hits)
    print("==============================================")

    return []  # we do not output KB items in debug mode


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_checklist_debug.py <path-to-excel-file>")
        sys.exit(1)

    input_file = sys.argv[1]
    convert_excel_with_debug(input_file)
