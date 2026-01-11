#!/usr/bin/env python3
"""
Reset dataset and run improved classification
"""

import pandas as pd
from pathlib import Path

DATASET_PATH = Path("backend/dataset.csv")

def main():
    print("=" * 60)
    print("  Reset Dataset and Reclassify")
    print("  إعادة تعيين البيانات وإعادة التصنيف")
    print("=" * 60)

    # Load dataset
    df = pd.read_csv(DATASET_PATH)
    print(f"\n  Total products: {len(df)}")

    # Count current classifications
    classified = len(df[df['model_code'] != '0.0.0.0'])
    print(f"  Currently classified: {classified}")

    # Ask user
    print("\n  This will reset ALL model_code values to 0.0.0.0")
    print("  and run the improved classification.")

    try:
        confirm = input("\n  Type 'yes' to continue: ")
        if confirm.lower() != 'yes':
            print("  Cancelled.")
            return
    except KeyboardInterrupt:
        print("\n  Cancelled.")
        return

    # Reset model_code and confidence
    print("\n  Resetting all classifications...")
    df['model_code'] = '0.0.0.0'
    df['confidence'] = 0.0
    df.to_csv(DATASET_PATH, index=False)
    print("  Done!")

    # Run classification
    print("\n  Now running improved classification...")
    print("-" * 60)

    import subprocess
    subprocess.run(["python3", "classify_with_ollama_v2.py"])


if __name__ == "__main__":
    main()
