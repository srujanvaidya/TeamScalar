"""
Supabase CRUD operations for the container_events table.
"""

from typing import Any
from datetime import datetime

from blockchain.config import supabase

TABLE = "container_events"

ALLOWED_COLUMNS = {
    "container_id", "current_location", "origin", "destination", "route",
    "event_type", "timestamp", "event_hash", "blockchain_status", "polygon_tx_hash", "created_at"
}

def insert_event(event_data: dict[str, Any]) -> dict[str, Any]:
    """
    Insert a new container event into Supabase (filtering keys for table schema).
    """
    filtered = {k: v for k, v in event_data.items() if k in ALLOWED_COLUMNS}
    if "event_type" not in filtered:
        filtered["event_type"] = "CONTAINER_REROUTE_ANCHOR"
    if "timestamp" not in filtered:
        filtered["timestamp"] = datetime.utcnow().isoformat() + "Z"

    response = supabase.table(TABLE).insert(filtered).execute()
    return response.data[0] if response.data else filtered


def update_blockchain_status(
    record_id: str,
    polygon_tx_hash: str | None,
    blockchain_status: str,
) -> dict[str, Any]:
    """
    Update the blockchain fields of an existing container event.
    """
    update_data = {"blockchain_status": blockchain_status}
    if polygon_tx_hash is not None:
        update_data["polygon_tx_hash"] = polygon_tx_hash

    try:
        response = (
            supabase.table(TABLE)
            .update(update_data)
            .eq("id", record_id)
            .execute()
        )
        return response.data[0] if response.data else update_data
    except Exception:
        return update_data


def get_events_by_container(container_id: str) -> list[dict[str, Any]]:
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("container_id", container_id)
        .order("timestamp", desc=False)
        .execute()
    )
    return response.data


def get_event_by_hash(event_hash: str) -> dict[str, Any] | None:
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("event_hash", event_hash)
        .execute()
    )
    return response.data[0] if response.data else None
