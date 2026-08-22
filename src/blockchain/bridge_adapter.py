import os
import sys
import json
import asyncio
import hashlib
from datetime import datetime
from typing import List, Dict, Any

from src.data.port_registry import GlobalPortRegistry

class BlockchainBridge:
    @staticmethod
    async def anchor_reroute_decision(
        ship_id: str,
        location: str,
        route_ports: List[str],
        decision_metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Resolves port names and executes blockchain/under_reroute.py to anchor the reroute decision on Polygon Amoy."""
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

        # Target script: blockchain/under_reroute.py (or blockchain/agent_reroute.py)
        script_path = os.path.join(os.path.dirname(__file__), "..", "..", "blockchain", "under_reroute.py")
        if not os.path.exists(script_path):
            script_path = os.path.join(os.path.dirname(__file__), "..", "..", "blockchain", "agent_reroute.py")

        cmd = [
            sys.executable,
            script_path,
            "--ship-id", ship_id,
            "--container-id", container_id,
            "--location", resolved_location,
            "--route"
        ] + resolved_route

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode == 0:
                stdout_str = stdout.decode().strip()
                json_line = None
                for line in stdout_str.split("\n"):
                    line_clean = line.strip()
                    if line_clean.startswith("{") and line_clean.endswith("}"):
                        json_line = line_clean
                        break

                if json_line:
                    record = json.loads(json_line)
                    tx_hash = record.get("polygon_tx_hash") or record.get("event_hash")
                    status = "CONFIRMED_ON_CHAIN" if record.get("blockchain_status") == "CONFIRMED" else "PENDING_ON_CHAIN"
                    
                    return {
                        "tx_hash": tx_hash,
                        "polygon_scan_url": record.get("polygonscan_url") or f"https://amoy.polygonscan.com/tx/{tx_hash}",
                        "anchored_timestamp": record.get("timestamp") or (datetime.utcnow().isoformat() + "Z"),
                        "containers_updated_count": 1,
                        "status": status
                    }
        except Exception as e:
            print("Exec under_reroute.py exception notice:", e)

        # Fallback SHA-256 hash if subprocess execution returns non-zero
        fallback_hash = hashlib.sha256(f"{ship_id}:{resolved_location}:{','.join(resolved_route)}".encode()).hexdigest()
        return {
            "tx_hash": fallback_hash,
            "polygon_scan_url": f"https://amoy.polygonscan.com/tx/{fallback_hash}",
            "anchored_timestamp": datetime.utcnow().isoformat() + "Z",
            "containers_updated_count": 1,
            "status": "SIMULATED_PROVENANCE_RECORD"
        }
