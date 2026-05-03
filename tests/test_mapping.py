import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "backend"))

from src.mapper import load_mapping, transform_event
from src.validator import validate_event


def test_aws_cloudtrail_event_maps_to_ecs_required_fields():
    raw_event = json.loads((ROOT / "sample-data" / "aws-cloudtrail-login.json").read_text())
    mapping = load_mapping(ROOT / "mappings" / "aws-to-ecs.yaml")
    schema = json.loads((ROOT / "schemas" / "ecs-required-fields.json").read_text())

    normalized = transform_event(raw_event, mapping)
    errors = validate_event(normalized, schema)

    assert errors == []
    assert normalized["@timestamp"] == "2026-04-15T14:03:22Z"
    assert normalized["event"]["action"] == "ConsoleLogin"
    assert normalized["source"]["ip"] == "203.0.113.42"
    assert normalized["user"]["name"] == "alex"
    assert normalized["cloud"]["account"]["id"] == "123456789012"
