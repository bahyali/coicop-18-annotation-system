#!/usr/bin/env python3
"""
Reset dataset and run improved classification with Ollama/OpenRouter fallback
"""

import pandas as pd
import requests
import json
import re
import os
import sys
import logging
from pathlib import Path

# Configuration
DATASET_PATH = Path("../backend/dataset.csv")
COICOP_PATH = Path("../backend/raw_coicop.json")
PROMPT_PATH = Path("prompt_c.txt")
LOG_PATH = Path("classification_debug.log")

# Primary
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "ministral-8b-2512"

# Fallback
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "mistralai/ministral-8b-2512"

# Setup logging to file
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH, mode='w', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Import keyword classifier
from coicop_prompt import VALID_CODES


def load_prompt_template():
    """Load prompt template from prompt_c.txt"""
    try:
        with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"  Warning: {PROMPT_PATH} not found, using default prompt")
        return None


def load_valid_codes():
    """Load valid COICOP codes from JSON database"""
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


def validate_code(code: str) -> str:
    """Validate and fix COICOP code format - accepts XX.X.X or XX.X.X.X"""
    if not code or code == '0.0.0' or code == '0.0.0':
        return '0.0.0'

    # Check format XX.X.X or XX.X.X.X
    if not re.match(r'^\d{2}\.\d\.\d(\.\d+)?$', code):
        return '0.0.0'

    # Return the code as-is if it's a valid 3-part format (XX.X.X)
    # This is the standard COICOP 2018 class-level format
    if code.count('.') == 2:
        return code

    return '0.0.0'


def check_ollama_available():
    """Check if Ollama is running and has the required model"""
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        if r.status_code == 200:
            models = [m['name'] for m in r.json().get('models', [])]
            if any(OLLAMA_MODEL in m for m in models):
                return True
    except:
        pass
    return False


def create_prompt(description: str, template: str) -> str:
    """Create classification prompt from template"""
    if template:
        return template.replace("{{item_description}}", description)
    # Fallback simple prompt
    return f"""Classify this product into COICOP 2018 code.
PRODUCT: "{description}"
Return ONLY valid JSON: {{"code": "XX.X.X", "confidence": 85, "reasoning": "..."}}"""


def classify_with_ollama(prompt: str, valid_codes: set, timeout: int = 180) -> tuple:
    """Call Ollama API for classification"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 300}
            },
            timeout=timeout
        )

        if response.status_code == 200:
            result = response.json()
            text = result.get('response', '')
            return parse_classification_response(text)

        return '0.0.0', 0.0
    except Exception as e:
        print(f"  Ollama error: {e}")
        return '0.0.0', 0.0


def classify_with_openrouter(prompt: str, valid_codes: set, api_key: str, timeout: int = 60) -> tuple:
    """Call OpenRouter API for classification"""
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/coicop-classifier",
        }

        request_body = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 3000
        }

        logger.info("=" * 80)
        logger.info("[OPENROUTER REQUEST]")
        logger.info(f"Model: {OPENROUTER_MODEL}")
        logger.info(f"Prompt length: {len(prompt)} chars")
        # logger.debug(f"Full prompt:\n{prompt}")
        logger.info("=" * 80)

        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=request_body,
            timeout=timeout
        )

        logger.info("[OPENROUTER RESPONSE]")
        logger.info(f"Status code: {response.status_code}")
        logger.info(f"Full raw response:\n{response.text}")
        logger.info("=" * 80)

        if response.status_code == 200:
            result = response.json()
            text = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            logger.info(f"Extracted content:\n{text}")
            return parse_classification_response(text)
        else:
            logger.error(f"Error response: {response.text}")

        return '0.0.0', 0.0
    except Exception as e:
        logger.exception(f"[OPENROUTER EXCEPTION] {type(e).__name__}: {e}")
        return '0.0.0', 0.0


def parse_classification_response(text: str) -> tuple:
    """Parse JSON response from LLM"""
    logger.info("[PARSING] Attempting to extract JSON from response...")

    # Remove markdown code fences
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    # Method 1: Try to extract code and confidence directly with regex (most reliable)
    code_match = re.search(r'"code"\s*:\s*"([^"]+)"', text)
    confidence_match = re.search(r'"confidence"\s*:\s*(\d+(?:\.\d+)?)', text)

    if code_match:
        code = code_match.group(1)
        confidence = float(confidence_match.group(1)) if confidence_match else 50.0
        logger.info(f"[PARSING] Regex extracted - code: {code}, confidence: {confidence}")

        # Normalize confidence (could be 0-100 or 0-1)
        if confidence > 1:
            confidence = confidence / 100.0
            logger.info(f"[PARSING] Normalized confidence: {confidence}")

        validated_code = validate_code(code)
        logger.info(f"[PARSING] Validated code: {validated_code}")
        if validated_code == '0.0.0':
            logger.warning(f"[PARSING] Code validation failed for: {code}")
            return '0.0.0', 0.0

        return validated_code, confidence

    # Method 2: Try standard JSON parsing as fallback
    try:
        json_match = re.search(r'\{[^{}]*"code"[^{}]*\}', text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            # Try to fix common JSON issues - escape newlines in strings
            json_str = re.sub(r':\s*"([^"]*)\n([^"]*)"', lambda m: ': "' + m.group(1).replace('\n', '\\n') + m.group(2) + '"', json_str)
            logger.info(f"[PARSING] Attempting JSON parse: {json_str[:200]}...")
            data = json.loads(json_str)
            code = str(data.get('code', '0.0.0'))
            confidence = float(data.get('confidence', 0))
            logger.info(f"[PARSING] JSON parsed - code: {code}, confidence: {confidence}")

            if confidence > 1:
                confidence = confidence / 100.0

            validated_code = validate_code(code)
            logger.info(f"[PARSING] Validated code: {validated_code}")
            if validated_code == '0.0.0':
                return '0.0.0', 0.0

            return validated_code, min(confidence, 0.7)
    except json.JSONDecodeError as e:
        logger.error(f"[PARSING] JSON fallback failed: {e}")

    logger.warning(f"[PARSING] Could not extract code from response")
    return '0.0.0', 0.0


def main():
    print("=" * 70)
    print("  Reset Dataset and Reclassify (Ollama/OpenRouter)")
    print("  إعادة تعيين البيانات وإعادة التصنيف")
    print("=" * 70)

    # Load prompt template
    print("\n[1/5] Loading prompt template...")
    prompt_template = load_prompt_template()
    if prompt_template:
        print(f"  Loaded prompt from {PROMPT_PATH}")
    else:
        print("  Using default prompt")

    # Load valid codes
    print("\n[2/5] Loading valid COICOP codes...")
    valid_codes = load_valid_codes()

    # Check AI backend availability
    print("\n[3/5] Checking AI backend...")
    ollama_available = check_ollama_available()
    openrouter_key = os.environ.get('OPENROUTER_API_KEY', '')

    if ollama_available:
        print(f"  Using Ollama with model: {OLLAMA_MODEL}")
        ai_backend = 'ollama'
    elif openrouter_key:
        print(f"  Ollama not available, using OpenRouter with model: {OPENROUTER_MODEL}")
        ai_backend = 'openrouter'
    else:
        print("  WARNING: Neither Ollama nor OpenRouter available!")
        print("  Set OPENROUTER_API_KEY environment variable for OpenRouter fallback")
        print("  Will use keyword classification only")
        ai_backend = None

    # Load dataset
    print("\n[4/5] Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    print(f"  Total products: {len(df)}")

    # Count current classifications
    classified = len(df[df['model_code'] != '0.0.0'])
    print(f"  Currently classified: {classified}")

    # Ask user
    print("\n  This will reset ALL model_code values to 0.0.0")
    print("  and run the classification.")

    try:
        confirm = input("\n  Type 'yes' to continue: ")
        if confirm.lower() != 'yes':
            print("  Cancelled.")
            return
    except KeyboardInterrupt:
        print("\n  Cancelled.")
        return

    # Reset model_code and confidence
    print("\n[5/5] Resetting and classifying...")
    df['model_code'] = '0.0.0'
    df['confidence'] = 0.0
    df.to_csv(DATASET_PATH, index=False)

    # Classify each product
    print("\n" + "=" * 70)
    print("  Starting classification...")
    print("-" * 70)

    success = 0
    failed = 0
    keyword_matched = 0
    ai_matched = 0

    for idx, row in df.iterrows():
        desc = row['description']
        short_desc = desc[:50] + "..." if len(str(desc)) > 50 else desc

        print(f"\n  [{idx + 1}/{len(df)}] {short_desc}")

        # KEYWORD CLASSIFICATION DISABLED - using AI only
        # code, confidence = quick_classify(str(desc))
        # if code and confidence >= 0.85:
        #     validated_code = validate_code(code, valid_codes)
        #     if validated_code != '0.0.0':
        #         code = validated_code
        #         keyword_matched += 1
        #         print(f"  -> {code} (confidence: {confidence:.0%}) [KEYWORD]")
        #     else:
        #         code, confidence = '0.0.0', 0.0
        # else:

        # Use AI classification directly
        if ai_backend:
            prompt = create_prompt(str(desc), prompt_template)

            if ai_backend == 'ollama':
                code, confidence = classify_with_ollama(prompt, valid_codes)
            else:
                code, confidence = classify_with_openrouter(prompt, valid_codes, openrouter_key)

            if code != '0.0.0':
                ai_matched += 1
                print(f"  -> {code} (confidence: {confidence:.0%}) [AI-{ai_backend.upper()}]")
            else:
                print(f"  -> FAILED - no match found")
        else:
            code, confidence = '0.0.0', 0.0
            print(f"  -> FAILED - no AI backend available")

        # Update dataframe
        df.at[idx, 'model_code'] = code
        df.at[idx, 'confidence'] = confidence

        if code != '0.0.0':
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
    print(f"  Debug log: {LOG_PATH.absolute()}")
    print("=" * 70)


if __name__ == "__main__":
    main()
