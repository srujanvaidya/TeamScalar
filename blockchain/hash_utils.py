"""
Deterministic hashing for container events.

Produces a stable SHA-256 hash from event data by:
1. Extracting only the immutable event fields (excludes DB/blockchain metadata)
2. Sorting keys for deterministic JSON serialization
3. Hashing the canonical JSON with SHA-256
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

# Fields that are part of the event identity (included in hash)
_HASH_FIELDS = [
    "container_id",
    "ship_id",
    "current_location",
    "origin",
    "destination",
    "route",
    "event_type",
    "timestamp",
]

# Fields that are mutable / DB-generated (excluded from hash)
_EXCLUDED_FIELDS = {
    "id",
    "created_at",
    "event_hash",
    "polygon_tx_hash",
    "blockchain_status",
}


def compute_event_hash(event_data: dict[str, Any]) -> str:
    """
    Compute a deterministic SHA-256 hash of container event data.

    Args:
        event_data: Dictionary containing container event fields.

    Returns:
        Hex-encoded SHA-256 hash string (64 chars, no '0x' prefix).

    Raises:
        ValueError: If any required hash field is missing.
    """
    # Extract only the fields that define the event
    canonical = {}
    for field in _HASH_FIELDS:
        if field not in event_data:
            raise ValueError(f"Missing required field for hashing: '{field}'")
        canonical[field] = event_data[field]

    # Normalize timestamp to consistent ISO 8601 format (UTC with 'Z' suffix)
    # This ensures "2026-08-22T12:30:00Z" and "2026-08-22T12:30:00+00:00" hash identically
    ts = canonical["timestamp"]
    if isinstance(ts, str):
        # Replace +00:00 suffix with Z for consistency
        ts = ts.replace("+00:00", "Z")
        if not ts.endswith("Z"):
            # Parse and re-format to UTC
            dt = datetime.fromisoformat(ts)
            ts = dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        canonical["timestamp"] = ts

    # Sort keys and serialize with consistent formatting
    canonical_json = json.dumps(canonical, sort_keys=True, separators=(",", ":"))

    # SHA-256 hash
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def verify_hash(event_data: dict[str, Any], expected_hash: str) -> bool:
    """
    Verify that event data matches the expected hash.

    Args:
        event_data: Dictionary containing container event fields.
        expected_hash: The hash to verify against.

    Returns:
        True if the recomputed hash matches the expected hash.
    """
    return compute_event_hash(event_data) == expected_hash
