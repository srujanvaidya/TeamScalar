import pytest
import subprocess
import sys
import json
from src.blockchain.bridge_adapter import BlockchainBridge
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext

@pytest.mark.asyncio
async def test_python_bridge_invocation():
    """Test 1: Direct Python invocation of the bridge returning valid transaction receipt."""
    receipt = await BlockchainBridge.anchor_reroute_decision(
        ship_id="SHIP-TEST-99",
        location="CNSHA",
        route_ports=["CNSHA", "SGSIN", "NLROT"]
    )
    assert receipt is not None
    assert "tx_hash" in receipt
    assert "polygon_scan_url" in receipt
    assert receipt["status"] in ["CONFIRMED_ON_CHAIN", "SIMULATED_PROVENANCE_RECORD"]

def test_cli_parsing_compatibility():
    """Test 2: CLI argument parsing compatibility matching exact command syntax."""
    # Build CLI command execution
    cmd = [
        sys.executable,
        "blockchain/agent_reroute.py",
        "--ship-id", "SHIP-CLI-11",
        "--location", "Shanghai",
        "--route", "Shanghai", "Singapore", "Rotterdam"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0
    stdout_str = res.stdout.strip()
    json_line = None
    for line in stdout_str.split("\n"):
        if line.strip().startswith("{") and line.strip().endswith("}"):
            json_line = line.strip()
            break
    assert json_line is not None
    record = json.loads(json_line)
    assert record["container_id"] == "SHIP-CLI-11"
    assert record["current_location"] == "Shanghai"
    assert record["route"] == ["Shanghai", "Singapore", "Rotterdam"]
    assert "event_hash" in record

@pytest.mark.asyncio
async def test_agent0_mints_on_approval():
    """Test 3: End-to-end test verifying Agent 0 automatically mints blockchain audit provenance upon route approval."""
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-MINT-AUTO-01",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="ELECTRONICS",
        is_hazmat=False,
        baseline_cost_usd=42000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    
    # Run shipment mission (AUTO_APPROVE will trigger automatic blockchain anchor)
    res = await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)
    
    assert res.reroute_selected is True
    assert res.safeguard_evaluation.decision == "AUTO_APPROVE"
    assert res.blockchain_receipt is not None
    assert "tx_hash" in res.blockchain_receipt
    assert "polygon_scan_url" in res.blockchain_receipt
