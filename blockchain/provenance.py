"""
Provenance orchestration — the single entry point for recording and
verifying container events with blockchain anchoring.

Flow:
  record_container_event(event_data)
    1. Compute deterministic event_hash
    2. Insert into Supabase with blockchain_status=PENDING
    3. Send Polygon Amoy tx with event_hash in data field
    4. Update Supabase with polygon_tx_hash + CONFIRMED/FAILED
    5. Return the complete record
"""

from typing import Any

from blockchain.config import POLYGONSCAN_TX_URL
from blockchain.hash_utils import compute_event_hash, verify_hash
from blockchain.polygon_anchor import anchor_hash, read_anchor_data
from blockchain.supabase_ops import (
    insert_event,
    update_blockchain_status,
    get_event_by_hash,
)


def record_container_event(event_data: dict[str, Any]) -> dict[str, Any]:
    """
    Record a container event with blockchain provenance.

    This is the main entry point. It:
      1. Computes a deterministic SHA-256 hash of the event
      2. Inserts the full event into Supabase (status=PENDING)
      3. Anchors the hash on Polygon Amoy
      4. Updates Supabase with the tx hash and final status

    Args:
        event_data: Dict with required fields:
            - container_id, current_location, origin, destination,
              route, scanned_by, event_type, timestamp

    Returns:
        The complete Supabase record with event_hash, polygon_tx_hash,
        and blockchain_status.
    """
    print(f"\n{'='*60}")
    print(f"📦 Recording container event: {event_data.get('container_id')}")
    print(f"   Event type: {event_data.get('event_type')}")
    print(f"{'='*60}")

    # ── Step 1: Compute deterministic hash ───────────────────────────────
    event_hash = compute_event_hash(event_data)
    print(f"\n1️⃣  Event hash: {event_hash}")

    # ── Step 2: Insert into Supabase with PENDING status ─────────────────
    db_record = {
        **event_data,
        "event_hash": event_hash,
        "blockchain_status": "PENDING",
    }
    inserted = insert_event(db_record)
    record_id = inserted["id"]
    print(f"2️⃣  Supabase record created: {record_id}")

    # ── Step 3: Anchor hash on Polygon Amoy ──────────────────────────────
    print(f"3️⃣  Anchoring on Polygon Amoy...")
    result = anchor_hash(event_hash)

    # ── Step 4: Update Supabase with blockchain result ───────────────────
    updated = update_blockchain_status(
        record_id=record_id,
        polygon_tx_hash=result.tx_hash,
        blockchain_status=result.status,
    )
    print(f"4️⃣  Supabase updated: blockchain_status={result.status}")

    if result.polygonscan_url:
        print(f"\n🔗 PolygonScan: {result.polygonscan_url}")

    print(f"{'='*60}\n")

    return updated


def verify_event(event_hash: str) -> dict[str, Any]:
    """
    Verify the integrity of a container event.

    Checks:
      1. The event exists in Supabase
      2. The stored event_hash matches recomputed hash
      3. The Polygon transaction exists and contains the correct hash

    Args:
        event_hash: The SHA-256 hash of the event to verify.

    Returns:
        Dict with verification results:
            - supabase_found: bool
            - hash_valid: bool
            - blockchain_verified: bool
            - record: the Supabase record (if found)
            - polygonscan_url: str (if tx exists)
    """
    result = {
        "supabase_found": False,
        "hash_valid": False,
        "blockchain_verified": False,
        "record": None,
        "polygonscan_url": None,
    }

    # Step 1: Look up in Supabase
    record = get_event_by_hash(event_hash)
    if not record:
        return result

    result["supabase_found"] = True
    result["record"] = record

    # Step 2: Recompute hash from stored data and verify
    result["hash_valid"] = verify_hash(record, event_hash)

    # Step 3: Verify on-chain
    tx_hash = record.get("polygon_tx_hash")
    if tx_hash:
        result["polygonscan_url"] = f"{POLYGONSCAN_TX_URL}{tx_hash}"
        on_chain_data = read_anchor_data(tx_hash)
        if on_chain_data and on_chain_data == event_hash:
            result["blockchain_verified"] = True

    return result


def reroute_ship(
    ship_id: str,
    new_route: list[str],
    current_location: str,
    timestamp: str,
) -> list[dict[str, Any]]:
    """
    Reroutes a ship, updating all containers on board with a new route and creating
    a blockchain event for each.

    Args:
        ship_id: The ID of the ship.
        new_route: The updated route list.
        current_location: Where the rerouting decision was made.
        timestamp: The ISO timestamp.

    Returns:
        List of all new container_events created.
    """
    from blockchain.supabase_ops import (
        get_active_containers_on_ship,
        get_events_by_container,
    )

    print(f"\n{'='*60}")
    print(f"🚢 REROUTING SHIP: {ship_id}")
    print(f"   New Route: {new_route}")
    print(f"{'='*60}")

    container_ids = get_active_containers_on_ship(ship_id)
    print(f"📦 Found {len(container_ids)} containers on {ship_id}")

    new_records = []
    for cid in container_ids:
        # Get the latest event to carry over origin/destination
        history = get_events_by_container(cid)
        if not history:
            continue
        latest = history[-1]

        new_event = {
            "container_id": cid,
            "ship_id": ship_id,
            "current_location": current_location,
            "origin": latest["origin"],
            "destination": latest["destination"],
            "route": new_route,
            "event_type": "SHIP_REROUTED",
            "timestamp": timestamp,
        }
        record = record_container_event(new_event)
        new_records.append(record)

    print(f"\n✅ Rerouted {len(new_records)} containers successfully.")
    return new_records


def get_dashboard_data(container_id: str) -> dict[str, Any]:
    """
    Fetch the complete history for a container for dashboard display.

    Returns a structured dictionary with container info, route progress,
    and the chronological list of events with blockchain verification links.
    """
    from blockchain.supabase_ops import get_container_history_with_ship_name
    from blockchain.config import POLYGONSCAN_TX_URL

    history = get_container_history_with_ship_name(container_id)
    if not history:
        return {"error": f"No data found for {container_id}"}

    latest = history[-1]
    
    # Extract ship name from the joined 'ships' object, if present
    latest_ship_name = "N/A"
    if latest.get("ships") and isinstance(latest["ships"], dict):
        latest_ship_name = latest["ships"].get("name", "N/A")

    dashboard = {
        "container_id": container_id,
        "current_status": {
            "location": latest["current_location"],
            "event_type": latest["event_type"],
            "last_updated": latest["timestamp"],
            "ship_id": latest.get("ship_id", "N/A"),
            "ship_name": latest_ship_name,
        },
        "journey": {
            "origin": latest["origin"],
            "destination": latest["destination"],
            "route": latest["route"],
        },
        "history": []
    }

    for event in history:
        ship_name = "N/A"
        if event.get("ships") and isinstance(event["ships"], dict):
            ship_name = event["ships"].get("name", "N/A")
            
        dashboard["history"].append({
            "timestamp": event["timestamp"],
            "event": event["event_type"],
            "location": event["current_location"],
            "ship_id": event.get("ship_id", "N/A"),
            "ship_name": ship_name,
            "blockchain": {
                "status": event["blockchain_status"],
                "tx_url": f"{POLYGONSCAN_TX_URL}{event['polygon_tx_hash']}" if event.get("polygon_tx_hash") else None
            }
        })

    return dashboard
