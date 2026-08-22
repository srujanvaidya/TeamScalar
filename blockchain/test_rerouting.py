"""
End-to-end test for ship rerouting and dashboard functionality.
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timezone

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from blockchain.provenance import record_container_event, reroute_ship, get_dashboard_data
from blockchain.supabase_ops import insert_ship


def generate_containers(ship_id: str, count: int, start_idx: int, route: list[str]) -> list[str]:
    """Generates initial load events for a given number of containers."""
    print(f"\n📦 Loading {count} containers onto {ship_id}...")
    container_ids = []
    
    for i in range(count):
        cid = f"CONT-{start_idx + i:04d}"
        event = {
            "container_id": cid,
            "ship_id": ship_id,
            "current_location": route[0],  # Origin
            "origin": route[0],
            "destination": route[-1],
            "route": route,
            "event_type": "LOADED_ON_SHIP",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        # Record to Supabase & Polygon
        record_container_event(event)
        container_ids.append(cid)
        
    return container_ids


def main():
    print("\n" + "=" * 60)
    print("🚢 SHIP REROUTING & DASHBOARD TEST (NORMALIZED)")
    print("=" * 60)

    # 0. Seed Ships
    print("\n🏗️  Registering ships...")
    insert_ship("SHIP-001", "EVERGREEN")
    insert_ship("SHIP-002", "MAERSK")

    # 1. Seed Data: Ship 1 (EVERGREEN)
    evergreen_route = ['Shanghai Port', 'Port of Singapore', 'Suez Canal', 'Port of Rotterdam']
    evergreen_cids = generate_containers(
        ship_id="SHIP-001", 
        count=10,  # 10 containers
        start_idx=9001,
        route=evergreen_route
    )

    # 2. Seed Data: Ship 2 (MAERSK)
    maersk_route = ['Port of Los Angeles', 'Panama Canal', 'Port of New York/New Jersey']
    maersk_cids = generate_containers(
        ship_id="SHIP-002",
        count=10,  # 10 containers
        start_idx=8001,
        route=maersk_route
    )

    # 3. Reroute Ship 1 (EVERGREEN) to bypass Suez Canal
    # new_evergreen_route = ['Shanghai Port', 'Port of Singapore', 'Cape of Good Hope', 'Port of Rotterdam']
    # reroute_ship(
    #     ship_id="SHIP-001",
    #     new_route=new_evergreen_route,
    #     current_location="Port of Singapore",
    #     timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # )

    # 4. Display Dashboard Data for one of the updated containers
    # sample_cid = evergreen_cids[0]
    # print("\n" + "=" * 60)
    # print(f"📊 DASHBOARD DATA FOR {sample_cid}")
    # print("=" * 60)
    # 
    # dashboard = get_dashboard_data(sample_cid)
    # print(json.dumps(dashboard, indent=2))
    
    print("\n🏁 Database successfully seeded with ships and containers!")


if __name__ == "__main__":
    main()
