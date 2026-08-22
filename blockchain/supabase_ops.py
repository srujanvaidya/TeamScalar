"""
Supabase CRUD operations for the container_events table.
"""

from typing import Any

from blockchain.config import supabase

TABLE = "container_events"


def insert_event(event_data: dict[str, Any]) -> dict[str, Any]:
    """
    Insert a new container event into Supabase.

    Args:
        event_data: Dict with all container event fields including
                    event_hash and blockchain_status.

    Returns:
        The inserted row as a dict (includes generated id, created_at).
    """
    response = supabase.table(TABLE).insert(event_data).execute()
    return response.data[0]


def update_blockchain_status(
    record_id: str,
    polygon_tx_hash: str | None,
    blockchain_status: str,
) -> dict[str, Any]:
    """
    Update the blockchain fields of an existing container event.

    Args:
        record_id: The UUID of the Supabase row.
        polygon_tx_hash: The Polygon transaction hash (or None if failed).
        blockchain_status: One of PENDING, CONFIRMED, FAILED.

    Returns:
        The updated row as a dict.
    """
    update_data = {"blockchain_status": blockchain_status}
    if polygon_tx_hash is not None:
        update_data["polygon_tx_hash"] = polygon_tx_hash

    response = (
        supabase.table(TABLE)
        .update(update_data)
        .eq("id", record_id)
        .execute()
    )
    return response.data[0]


def get_events_by_container(container_id: str) -> list[dict[str, Any]]:
    """
    Retrieve all events for a given container, ordered by timestamp.

    Args:
        container_id: The container identifier (e.g. "CONT-1024").

    Returns:
        List of event dicts.
    """
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("container_id", container_id)
        .order("timestamp", desc=False)
        .execute()
    )
    return response.data


def get_event_by_hash(event_hash: str) -> dict[str, Any] | None:
    """
    Retrieve an event by its deterministic event_hash.

    Args:
        event_hash: The SHA-256 hash of the event data.

    Returns:
        The event dict, or None if not found.
    """
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("event_hash", event_hash)
        .execute()
    )
    return response.data[0] if response.data else None
