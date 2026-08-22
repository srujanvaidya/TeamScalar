import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Add project root to path so we can import blockchain modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from blockchain.provenance import reroute_ship

def main():
    parser = argparse.ArgumentParser(description="Trigger a bulk ship reroute for AI agents.")
    parser.add_argument("--ship-id", required=True, help="The ID of the ship to reroute (e.g. SHIP-001)")
    parser.add_argument("--location", required=True, help="The current location where the reroute occurred")
    parser.add_argument("--route", required=True, nargs='+', help="The new route as a space-separated list of ports")
    
    args = parser.parse_args()

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    print(f"Triggering reroute for {args.ship_id}...")
    try:
        new_records = reroute_ship(
            ship_id=args.ship_id,
            new_route=args.route,
            current_location=args.location,
            timestamp=timestamp
        )
        print(f"Agent Action Successful! Updated {len(new_records)} containers.")
    except Exception as e:
        print(f"Agent Action Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
