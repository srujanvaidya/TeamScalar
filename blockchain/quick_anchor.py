import sys
import os
import json
import hashlib
from datetime import datetime, timezone

_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from blockchain.polygon_anchor import anchor_hash

def main():
    route_str = sys.argv[1] if len(sys.argv) > 1 else "DEFAULT_REROUTE"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    raw_payload = f"{route_str}:{timestamp}"
    event_hash = hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()

    print(f"Broadcasting 0 POL transaction to Polygon Amoy for payload hash: {event_hash}")
    
    # Broadcast directly to Polygon Amoy testnet (NO DATABASE INSERTION)
    result = anchor_hash(event_hash, timeout=60)
    
    output_payload = {
        "status": "SUCCESS",
        "polygon_tx_hash": result.tx_hash,
        "event_hash": event_hash,
        "blockchain_status": result.status,
        "polygonscan_url": result.polygonscan_url or f"https://amoy.polygonscan.com/tx/{result.tx_hash}",
        "timestamp": timestamp
    }
    
    print(json.dumps(output_payload))

if __name__ == "__main__":
    main()
