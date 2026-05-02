from __future__ import annotations

import json
from pathlib import Path
from .mapper import load_mapping, transform_event
from .validator import validate_event

ROOT = Path(__file__).resolve().parents[2]


def run_demo() -> dict:
    raw_event = json.loads((ROOT / "sample-data" / "aws-cloudtrail-login.json").read_text())
    mapping = load_mapping(ROOT / "mappings" / "aws-to-ecs.yaml")
    schema = json.loads((ROOT / "schemas" / "ecs-required-fields.json").read_text())

    normalized = transform_event(raw_event, mapping)
    validation_errors = validate_event(normalized, schema)

    return {
        "raw_event": raw_event,
        "normalized_event": normalized,
        "validation_errors": validation_errors,
    }


if __name__ == "__main__":
    print(json.dumps(run_demo(), indent=2))
