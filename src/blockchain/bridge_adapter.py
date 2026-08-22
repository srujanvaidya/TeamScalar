import os
import sys
import json
import asyncio
import hashlib
from datetime import datetime
from typing import List, Dict, Any

from src.data.port_registry import GlobalPortRegistry

try:
    from blockchain.provenance import record_container_event
    from blockchain.polygon_anchor import anchor_hash
    BLOCKCHAIN_ENABLED = True
except Exception as err:
    print("Blockchain module import notice:", err)
    BLOCKCHAIN_ENABLED = False

class BlockchainBridge:
    @staticmethod
    async def anchor_reroute_decision(
        ship_id: str,
        location: str,
        route_ports: List[str],
        decision_metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Resolves port names and anchors the reroute decision on the Polygon Amoy blockchain via Web3."""
        registry = GlobalPortRegistry()
        
        # Resolve standardized port names if possible
        resolved_location = location
        resolved_port = registry.get_port(location)
        if resolved_port:
            resolved_location = resolved_port.port_name

        resolved_route = []
        for port_id in route_ports:
            p = registry.get_port(port_id)
            resolved_route.append(p.port_name if p else port_id)

        container_id = (decision_metadata and decision_metadata.get("container_id")) or f"CONT-{ship_id}"

        event_data = {
            "ship_id": ship_id,
            "container_id": container_id,
            "current_location": resolved_location,
            "origin": resolved_route[0] if resolved_route else resolved_location,
            "destination": resolved_route[-1] if resolved_route else resolved_location,
            "route": resolved_route,
            "scanned_by": "Agent_4_Blockchain_Anchor",
            "event_type": "CONTAINER_REROUTE_ANCHOR",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        if BLOCKCHAIN_ENABLED:
            try:
                # Direct Web3 call to record event and broadcast 0 POL transaction on Polygon Amoy
                rec = record_container_event(event_data)
                tx_hash = rec.get("polygon_tx_hash") or rec.get("event_hash")
                status = "CONFIRMED_ON_CHAIN" if rec.get("blockchain_status") == "CONFIRMED" else "PENDING_ON_CHAIN"
                
                return {
                    "tx_hash": tx_hash,
                    "polygon_scan_url": f"https://amoy.polygonscan.com/tx/{tx_hash}",
                    "anchored_timestamp": datetime.utcnow().isoformat() + "Z",
                    "containers_updated_count": 1,
                    "status": status
                }
            except Exception as e:
                print("Live Web3 Polygon Amoy broadcast warning:", e)

        # Fallback SHA-256 hash if RPC/Web3 wallet is offline
        fallback_hash = hashlib.sha256(f"{ship_id}:{resolved_location}:{','.join(resolved_route)}".encode()).hexdigest()
        return {
            "tx_hash": fallback_hash,
            "polygon_scan_url": f"https://amoy.polygonscan.com/tx/{fallback_hash}",
            "anchored_timestamp": datetime.utcnow().isoformat() + "Z",
            "containers_updated_count": 1,
            "status": "SIMULATED_PROVENANCE_RECORD"
        }
