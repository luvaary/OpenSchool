#!/usr/bin/env python3
"""
OpenSchool – JSON Schema Validator (Python 3.12+)

Validates every sample data file against its matching schema.
Uses only stdlib; optionally uses `jsonschema` if installed.

Usage:
    python scripts/schema_check.py
    python scripts/schema_check.py --verbose
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMAS_DIR = ROOT / "schemas"
DATA_DIR = ROOT / "data" / "sample"
VERBOSE = "--verbose" in sys.argv

# ── Lightweight validator (stdlib only) ───────────────────────────────────────

TYPE_CHECKS: dict[str, callable] = {
    "string":  lambda v: isinstance(v, str),
    "number":  lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
    "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
    "boolean": lambda v: isinstance(v, bool),
    "array":   lambda v: isinstance(v, list),
    "object":  lambda v: isinstance(v, dict),
    "null":    lambda v: v is None,
}


def validate_value(value, schema: dict, path: str = "$") -> list[str]:
    """Return list of error messages."""
    errors: list[str] = []

    # type
    if "type" in schema:
        types = schema["type"] if isinstance(schema["type"], list) else [schema["type"]]
        if not any(TYPE_CHECKS.get(t, lambda _: False)(value) for t in types):
            errors.append(f"{path}: expected type {schema['type']}, got {type(value).__name__}")
            return errors

    # enum
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: value {value!r} not in enum {schema['enum']}")

    # required
    if schema.get("type") == "object" and "required" in schema and isinstance(value, dict):
        for key in schema["required"]:
            if key not in value:
                errors.append(f"{path}: missing required property '{key}'")

    # properties
    if "properties" in schema and isinstance(value, dict):
        for key, prop_schema in schema["properties"].items():
            if key in value:
                errors.extend(validate_value(value[key], prop_schema, f"{path}.{key}"))

    # array items
    if "items" in schema and isinstance(value, list):
        for i, item in enumerate(value):
            errors.extend(validate_value(item, schema["items"], f"{path}[{i}]"))

    # string constraints
    if isinstance(value, str):
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path}: string length {len(value)} < minLength {schema['minLength']}")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(f"{path}: string length {len(value)} > maxLength {schema['maxLength']}")

    # numeric constraints
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} < minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {value} > maximum {schema['maximum']}")

    return errors


# ── Try full jsonschema library if available ──────────────────────────────────

try:
    import jsonschema  # type: ignore
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


def validate_with_jsonschema(data: list, schema: dict, name: str) -> int:
    """Validate using the jsonschema library. Returns error count."""
    err_count = 0
    for i, record in enumerate(data):
        try:
            jsonschema.validate(record, schema)
        except jsonschema.ValidationError as e:
            err_count += 1
            if VERBOSE:
                print(f"  [ERR] {name}[{i}]: {e.message}")
    return err_count


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    print("\n=== OpenSchool Schema Validation (Python) ===\n")

    if HAS_JSONSCHEMA:
        print(f"Using jsonschema library (v{jsonschema.__version__})\n")
    else:
        print("Using built-in lightweight validator (pip install jsonschema for full support)\n")

    if not SCHEMAS_DIR.is_dir():
        print("[FAIL] schemas/ directory not found")
        return 1
    if not DATA_DIR.is_dir():
        print("[FAIL] data/sample/ directory not found")
        return 1

    schema_files = sorted(SCHEMAS_DIR.glob("*.schema.json"))
    total_errors = 0
    validated = 0

    for schema_path in schema_files:
        entity_name = schema_path.stem.replace(".schema", "")
        data_path = DATA_DIR / f"{entity_name}.json"

        if not data_path.exists():
            print(f"[SKIP] No sample data for {entity_name}")
            continue

        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        data = json.loads(data_path.read_text(encoding="utf-8"))
        records = data if isinstance(data, list) else [data]

        if HAS_JSONSCHEMA:
            file_errors = validate_with_jsonschema(records, schema, entity_name)
        else:
            file_errors = 0
            for i, record in enumerate(records):
                errs = validate_value(record, schema, f"{entity_name}[{i}]")
                file_errors += len(errs)
                if VERBOSE:
                    for e in errs:
                        print(f"  [ERR] {e}")

        if file_errors == 0:
            print(f"[PASS] {entity_name} ({len(records)} records)")
        else:
            print(f"[FAIL] {entity_name} — {file_errors} error(s)")
            total_errors += file_errors

        validated += 1

    print(f"\n{validated} files validated, {total_errors} total error(s)\n")
    return 1 if total_errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
