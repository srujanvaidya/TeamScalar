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


def insert_ship(ship_id: str, name: str) -> dict[str, Any] | None:
    """
    Insert a new ship into the ships table, ignoring if it already exists.
    """
    try:
        response = supabase.table("ships").upsert({"id": ship_id, "name": name}).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error inserting ship {ship_id}: {e}")
        return None


def get_active_containers_on_ship(ship_id: str) -> list[str]:
    """
    Retrieve a list of unique container_ids currently associated with a ship.
    """
    response = (
        supabase.table(TABLE)
        .select("container_id")
        .eq("ship_id", ship_id)
        .execute()
    )
    
    # Extract unique container IDs
    container_ids = set(row["container_id"] for row in response.data)
    return list(container_ids)


def get_container_history_with_ship_name(container_id: str) -> list[dict[str, Any]]:
    """
    Retrieves the complete chronological history of a container for the dashboard,
    including the joined human-readable ship name.
    """
    response = (
        supabase.table(TABLE)
        .select("*, ships(name)")
        .eq("container_id", container_id)
        .order("timestamp", desc=False)
        .execute()
    )
    return response.data
