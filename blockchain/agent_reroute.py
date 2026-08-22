"""
CLI Agent Reroute Script — Broadcasts human-approved container reroute decisions to Polygon Amoy testnet.
"""

import sys
import os
import json
import argparse
from datetime import datetime, timezone

# Ensure project root is in sys.path
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from blockchain.provenance import record_container_event


def main():
    parser = argparse.ArgumentParser(description="Anchor Human-Approved Reroute Decision on Polygon Amoy")
    parser.add_argument("--ship-id", required=True, help="Ship ID or vessel name")
    parser.add_argument("--container-id", default="CONT-8001", help="Container ID")
    parser.add_argument("--location", required=True, help="Current origin/location port")
    parser.add_argument("--route", nargs="+", required=True, help="Selected alternate route waypoints")

    args = parser.parse_args()

    ship_id = args.ship_id
    if "(" in ship_id and ")" in ship_id:
        # Extract ID from vessel name like "MAERSK (SHIP-002)"
        ship_id = ship_id.split("(")[-1].split(")")[0].strip()

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    event_data = {
        "container_id": args.container_id,
        "current_location": args.location,
        "origin": args.route[0] if args.route else args.location,
        "destination": args.route[-1] if args.route else args.location,
        "route": json.dumps(args.route) if isinstance(args.route, list) else args.route,
        "scanned_by": "Agent_4_Blockchain_Anchor",
        "event_type": "HUMAN_APPROVED_REROUTE_ANCHOR",
        "timestamp": now_iso
    }

    # Record container event and broadcast 0 POL transaction on Polygon Amoy
    record = record_container_event(event_data)
    
    # Print JSON line output for subprocess integration
    output_payload = {
        "polygon_tx_hash": record.get("polygon_tx_hash") or record.get("event_hash"),
        "event_hash": record.get("event_hash"),
        "blockchain_status": record.get("blockchain_status", "CONFIRMED"),
        "polygonscan_url": f"https://amoy.polygonscan.com/tx/{record.get('polygon_tx_hash') or record.get('event_hash')}",
        "timestamp": now_iso
    }

    print(json.dumps(output_payload))


if __name__ == "__main__":
    main()
