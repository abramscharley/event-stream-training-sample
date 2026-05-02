from __future__ import annotations

from typing import Any, Dict, List
from .mapper import get_nested_value


def validate_required_fields(event: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
    """Return readable validation errors for missing required fields."""
    errors: List[str] = []
    for field in schema.get("required", []):
        if get_nested_value(event, field) in (None, ""):
            errors.append(f"Missing required field: {field}")
    return errors


def validate_field_types(event: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
    """Return readable validation errors for simple type mismatches."""
    errors: List[str] = []
    expected_types = schema.get("field_types", {})
    type_lookup = {"string": str, "object": dict, "array": list}

    for field, expected_type_name in expected_types.items():
        value = get_nested_value(event, field)
        if value is None:
            continue
        expected_type = type_lookup.get(expected_type_name)
        if expected_type and not isinstance(value, expected_type):
            errors.append(f"Field {field} expected {expected_type_name}, received {type(value).__name__}")
    return errors


def validate_event(event: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
    return validate_required_fields(event, schema) + validate_field_types(event, schema)
