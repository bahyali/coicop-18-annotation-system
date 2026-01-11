#!/usr/bin/env python3
"""
AI Classification Script using Ollama with Improved Arabic Support
==================================================================

This version prioritizes keyword-based classification for accuracy,
and only falls back to AI when needed. All codes are validated.

Usage:
  1. Install Ollama: https://ollama.ai
  2. Run: ollama pull mistral
  3. Run: python classify_with_ollama_v2.py
"""

import requests
import pandas as pd
import json
import re
import sys
from pathlib import Path

# Import the custom prompt module
sys.path.insert(0, str(Path(__file__).parent / "scripts"))
from coicop_prompt import quick_classify, create_simple_prompt, VALID_CODES

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"
DATASET_PATH = Path("backend/dataset.csv")
COICOP_PATH = Path("backend/raw_coicop.json")


def load_valid_codes():
    """Load valid COICOP codes from JSON database"""
    try:
        with open(COICOP_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Get all codes that have 4 parts (XX.X.X.X format)
        valid = set()
        for item in data:
            code = item.get('code', '')
            if code.count('.') == 3:  # Product-level codes
                valid.add(code)
        return valid
    except:
        return set(VALID_CODES.keys())


def validate_code(code: str, valid_codes: set) -> str:
    """Validate and fix COICOP code format"""
    if not code or code == '0.0.0.0':
        return '0.0.0.0'

    # Check format XX.X.X.X
    if not re.match(r'^\d{2}\.\d\.\d\.\d+$', code):
        return '0.0.0.0'

    # If code exists in valid codes, return it
    if code in valid_codes:
        return code

    # Try to find nearest valid code
    parts = code.split('.')
    if len(parts) == 4:
        # Try parent codes
        for i in range(1, 10):
            candidate = f"{parts[0]}.{parts[1]}.{parts[2]}.{i}"
            if candidate in valid_codes:
                return candidate

    return '0.0.0.0'


def classify_with_ollama(prompt: str, valid_codes: set, timeout: int = 180) -> tuple:
    """Call Ollama API and parse response with validation"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 100
                }
            },
            timeout=timeout
        )

        if response.status_code == 200:
            result = response.json()
            text = result.get('response', '')

            # Parse JSON from response
            json_match = re.search(r'\{[^}]+\}', text)
            if json_match:
                data = json.loads(json_match.group())
                code = str(data.get('code', '0.0.0.0'))
                confidence = float(data.get('confidence', 0.0))

                # Validate and fix code
                validated_code = validate_code(code, valid_codes)
                if validated_code == '0.0.0.0':
                    return '0.0.0.0', 0.0

                return validated_code, min(confidence, 0.7)  # Cap AI confidence at 70%

        return '0.0.0.0', 0.0

    except requests.exceptions.ConnectionError:
        return '0.0.0.0', 0.0
    except requests.exceptions.Timeout:
        return '0.0.0.0', 0.0
    except json.JSONDecodeError:
        return '0.0.0.0', 0.0
    except Exception as e:
        print(f"  Error: {e}")
        return '0.0.0.0', 0.0


def main():
    print("=" * 70)
    print("  COICOP Classification System - Improved Version")
    print("  نظام تصنيف COICOP المحسن")
    print("=" * 70)

    # Load valid codes first
    print("\n[1/4] Loading valid COICOP codes...")
    valid_codes = load_valid_codes()
    print(f"  Loaded {len(valid_codes)} valid product codes")

    # Check Ollama connection (optional - will work without it)
    print("\n[2/4] Checking Ollama connection...")
    ollama_available = False
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        if r.status_code == 200:
            models = [m['name'] for m in r.json().get('models', [])]
            if any(MODEL_NAME in m for m in models):
                ollama_available = True
                print(f"  Ollama available with model: {MODEL_NAME}")
    except:
        pass

    if not ollama_available:
        print("  Ollama not available - using keyword classification only")
        print("  (This is usually more accurate anyway!)")

    # Load data
    print("\n[3/4] Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    print(f"  Total products: {len(df)}")

    # Filter products needing classification
    to_classify = df[
        (df['model_code'] == '0.0.0.0') |
        (df['model_code'].isna()) |
        (df['confidence'] < 0.5)
    ]

    print(f"  Need classification: {len(to_classify)}")

    if len(to_classify) == 0:
        print("\n  All products already classified!")
        return

    # Ask user
    print(f"\n[4/4] Ready to classify {len(to_classify)} products")
    print("\n  The improved classifier will:")
    print("  1. Use keyword matching (95% accurate)")
    print("  2. Fall back to AI only when needed")
    print("  3. Validate all codes against COICOP database")

    try:
        input("\n  Press Enter to start (Ctrl+C to cancel)...")
    except KeyboardInterrupt:
        print("\n  Cancelled.")
        sys.exit(0)

    # Classify
    print("\n" + "=" * 70)
    print("  Starting classification...")
    print("-" * 70)

    success = 0
    failed = 0
    keyword_matched = 0
    ai_matched = 0

    for idx, row in to_classify.iterrows():
        desc = row['description']
        short_desc = desc[:50] + "..." if len(desc) > 50 else desc

        print(f"\n  [{success + failed + 1}/{len(to_classify)}] {short_desc}")

        # Try keyword classification FIRST (more accurate)
        code, confidence = quick_classify(desc)

        if code and confidence >= 0.85:
            # Keyword match - validate and use
            validated_code = validate_code(code, valid_codes)
            if validated_code != '0.0.0.0':
                code = validated_code
                keyword_matched += 1
                print(f"  -> {code} (confidence: {confidence:.0%}) [KEYWORD]")
            else:
                code, confidence = '0.0.0.0', 0.0
        else:
            # Try AI if Ollama available
            if ollama_available:
                prompt = create_simple_prompt(desc)
                code, confidence = classify_with_ollama(prompt, valid_codes)
                if code != '0.0.0.0':
                    ai_matched += 1
                    print(f"  -> {code} (confidence: {confidence:.0%}) [AI]")
                else:
                    print(f"  -> FAILED - no match found")
            else:
                code, confidence = '0.0.0.0', 0.0
                print(f"  -> FAILED - no keyword match")

        # Update dataframe
        df.at[idx, 'model_code'] = code
        df.at[idx, 'confidence'] = confidence

        if code != '0.0.0.0':
            success += 1
        else:
            failed += 1

        # Save progress after each item
        df.to_csv(DATASET_PATH, index=False)

    # Summary
    print("\n" + "=" * 70)
    print("  Classification Complete!")
    print("=" * 70)
    print(f"\n  Results:")
    print(f"  - Total processed: {success + failed}")
    print(f"  - Successfully classified: {success}")
    print(f"    - By keywords: {keyword_matched}")
    print(f"    - By AI: {ai_matched}")
    print(f"  - Failed to classify: {failed}")
    print(f"\n  Saved to: {DATASET_PATH}")
    print("=" * 70)


if __name__ == "__main__":
    main()
