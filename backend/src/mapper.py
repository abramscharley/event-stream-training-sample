from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
import yaml


def get_nested_value(payload: Dict[str, Any], dotted_path: str) -> Any:
    """Return a nested value from a dictionary using dot notation."""
    current: Any = payload
    for part in dotted_path.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def set_nested_value(payload: Dict[str, Any], dotted_path: str, value: Any) -> None:
    """Set a nested dictionary value using dot notation."""
    parts = dotted_path.split(".")
    current = payload
    for part in parts[:-1]:
        current = current.setdefault(part, {})
    current[parts[-1]] = value


def load_mapping(mapping_path: str | Path) -> Dict[str, Any]:
    with open(mapping_path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def transform_event(raw_event: Dict[str, Any], mapping_config: Dict[str, Any]) -> Dict[str, Any]:
    """Transform a raw source event into the normalized target schema."""
    normalized: Dict[str, Any] = {}

    for target_field, source_field in mapping_config.get("mappings", {}).items():
        value = get_nested_value(raw_event, source_field)
        if value is not None:
            set_nested_value(normalized, target_field, value)

    for target_field, constant_value in mapping_config.get("constants", {}).items():
        set_nested_value(normalized, target_field, constant_value)

    return normalized
