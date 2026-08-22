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
        """Resolves port names and anchors the reroute decision on the blockchain via Srujan's CLI."""
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

        # Build CLI command execution
        cmd = [
            sys.executable,
            "blockchain/agent_reroute.py",
            "--ship-id", ship_id,
            "--location", resolved_location,
            "--route"
        ] + resolved_route

        # Execute as sub-process CLI
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
                    if line.strip().startswith("{") and line.strip().endswith("}"):
                        json_line = line.strip()
                        break
                if json_line:
                    record = json.loads(json_line)
                    tx_hash = record.get("polygon_tx_hash") or record.get("event_hash")
                    status = "CONFIRMED_ON_CHAIN" if record.get("blockchain_status") == "CONFIRMED" else "SIMULATED_PROVENANCE_RECORD"
                    
                    return {
                        "tx_hash": tx_hash,
                        "polygon_scan_url": f"https://amoy.polygonscan.com/tx/{tx_hash}",
                        "anchored_timestamp": datetime.utcnow().isoformat() + "Z",
                        "containers_updated_count": 1,
                        "status": status
                    }
        except Exception as e:
            pass

        # In-memory Python module fallback if subprocess fails or offline
        fallback_hash = hashlib.sha256(f"{ship_id}:{resolved_location}:{','.join(resolved_route)}".encode()).hexdigest()
        return {
            "tx_hash": fallback_hash,
            "polygon_scan_url": f"https://amoy.polygonscan.com/tx/{fallback_hash}",
            "anchored_timestamp": datetime.utcnow().isoformat() + "Z",
            "containers_updated_count": 1,
            "status": "SIMULATED_PROVENANCE_RECORD"
        }
