import argparse
import json
import sys
from datetime import datetime

# Add project root to path if running directly
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from blockchain.provenance import record_container_event

def main():
    parser = argparse.ArgumentParser(description="Blockchain Agent Reroute CLI")
    parser.add_argument("--ship-id", required=True, help="Ship ID")
    parser.add_argument("--location", required=True, help="Current Location")
    parser.add_argument("--route", nargs="+", required=True, help="Route waypoints")
    args = parser.parse_args()

    # Form event data
    event_data = {
        "container_id": args.ship_id,
        "current_location": args.location,
        "origin": args.route[0] if args.route else "Unknown",
        "destination": args.route[-1] if args.route else "Unknown",
        "route": args.route,
        "scanned_by": "Agent_0_Orchestrator",
        "event_type": "ROUTE_REROUTE",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    try:
        record = record_container_event(event_data)
        print(json.dumps(record))
    except Exception as e:
        # Fallback to simulated record if keys are missing or offline
        import hashlib
        tx_hash = hashlib.sha256(f"{args.ship_id}:{args.location}:{','.join(args.route)}".encode()).hexdigest()
        simulated = {
            "container_id": args.ship_id,
            "current_location": args.location,
            "origin": args.route[0] if args.route else "Unknown",
            "destination": args.route[-1] if args.route else "Unknown",
            "route": args.route,
            "scanned_by": "Agent_0_Orchestrator",
            "event_type": "ROUTE_REROUTE",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_hash": tx_hash,
            "polygon_tx_hash": tx_hash,
            "blockchain_status": "SIMULATED_PROVENANCE_RECORD"
        }
        print(json.dumps(simulated))

if __name__ == "__main__":
    main()
