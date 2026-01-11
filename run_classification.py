#!/usr/bin/env python3
"""Run classification without interactive prompts"""

import pandas as pd
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "scripts"))
from coicop_prompt import quick_classify, VALID_CODES

DATASET_PATH = Path("backend/dataset.csv")
COICOP_PATH = Path("backend/raw_coicop.json")


def load_valid_codes():
    try:
        with open(COICOP_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        valid = set()
        for item in data:
            code = item.get('code', '')
            if code.count('.') == 3:
                valid.add(code)
        return valid
    except:
        return set(VALID_CODES.keys())


def validate_code(code, valid_codes):
    if not code or code == '0.0.0.0':
        return '0.0.0.0'
    if not re.match(r'^\d{2}\.\d\.\d\.\d+$', code):
        return '0.0.0.0'
    if code in valid_codes:
        return code
    return '0.0.0.0'


def main():
    print("Loading data...")
    valid_codes = load_valid_codes()
    df = pd.read_csv(DATASET_PATH)

    print(f"Total: {len(df)} items")

    success = 0
    failed = 0

    for idx, row in df.iterrows():
        desc = row['description']

        code, confidence = quick_classify(desc)

        if code and confidence >= 0.85:
            validated_code = validate_code(code, valid_codes)
            if validated_code != '0.0.0.0':
                df.at[idx, 'model_code'] = validated_code
                df.at[idx, 'confidence'] = confidence
                success += 1
            else:
                df.at[idx, 'model_code'] = '0.0.0.0'
                df.at[idx, 'confidence'] = 0.0
                failed += 1
        else:
            df.at[idx, 'model_code'] = '0.0.0.0'
            df.at[idx, 'confidence'] = 0.0
            failed += 1

        if (idx + 1) % 100 == 0:
            print(f"  Processed {idx + 1}/{len(df)}...")

    df.to_csv(DATASET_PATH, index=False)

    print(f"\nDone!")
    print(f"  Success: {success}")
    print(f"  Failed: {failed}")
    print(f"  Saved to: {DATASET_PATH}")


if __name__ == "__main__":
    main()
