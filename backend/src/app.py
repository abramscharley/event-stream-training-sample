from __future__ import annotations

import json
from pathlib import Path
from .mapper import load_mapping, transform_event
from .validator import validate_event

# Project root directory (two levels up from this file)
ROOT = Path(__file__).resolve().parents[2]


def run_demo() -> dict:
    # Load an example AWS CloudTrail event from the repo
    raw_event = json.loads((ROOT / "sample-data" / "aws-cloudtrail-login.json").read_text())
    # Load the field mapping used to transform the raw event
    mapping = load_mapping(ROOT / "mappings" / "aws-to-ecs.yaml")
    # Load the schema describing required ECS fields
    schema = json.loads((ROOT / "schemas" / "ecs-required-fields.json").read_text())

    # Transform the raw event into a normalized ECS-shaped event
    normalized = transform_event(raw_event, mapping)
    # Validate the normalized event against the required-fields schema
    validation_errors = validate_event(normalized, schema)

    return {
        "raw_event": raw_event,
        "normalized_event": normalized,
        "validation_errors": validation_errors,
    }


if __name__ == "__main__":
    # When executed directly, run the demo and print the results as JSON
    print(json.dumps(run_demo(), indent=2))
    