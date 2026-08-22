import pytest
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext
from src.contracts.schemas import Severity

@pytest.mark.asyncio
async def test_funnel_shanghai_strike():
    """Test 1: Full pipeline execution for Shanghai Strike -> verifies data handoff across 1A -> 2 -> 3 -> 5 -> 0."""
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-STRIKE-FUNNEL",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="ELECTRONICS",
        is_hazmat=False,
        baseline_cost_usd=42000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    res = await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)

    # Agent 0 & 1A checks
    assert res.reroute_selected is True
    assert len(res.active_disruptions) > 0
    assert res.active_disruptions[0].severity in [Severity.HIGH, Severity.CRITICAL]

    # Agent 2 & 3 checks
    assert "CORRIDOR_EAST_PACIFIC_BYPASS" in res.proposed_corridor_path
    assert res.proposed_cost_usd == 42000.0 + 8200.0

    # Agent 5 & final checks
    assert res.safeguard_evaluation.decision == "AUTO_APPROVE"
    assert res.execution_status == "DISPATCHED_AUTONOMOUS"
    assert len(res.audit_hash) == 64

@pytest.mark.asyncio
async def test_funnel_taiwan_typhoon():
    """Test 2: Full pipeline execution for Taiwan Strait Typhoon -> verifies data handoff across 1B -> 2 -> 3 -> 5 -> 0 with HITL escalation."""
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-TYPHOON-FUNNEL",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="TEXTILES",
        is_hazmat=False,
        baseline_cost_usd=35000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    weather_injection = {
        "lat": 24.5,
        "lon": 119.8,
        "wind_speed_knots": 62.0,
        "wave_height_m": 7.5,
        "corridor_name": "CORRIDOR_TAIWAN_STRAIT"
    }
    res = await orchestrator.run_shipment_mission(context, inject_weather=weather_injection)

    # Verify weather ingestion
    assert res.reroute_selected is True
    assert "CORRIDOR_EAST_PACIFIC_BYPASS" in res.proposed_corridor_path
    # Cost delta ($64,200) exceeds $50k threshold
    assert res.proposed_cost_usd == 35000.0 + 64200.0
    assert res.safeguard_evaluation.decision == "HUMAN_APPROVAL_REQUIRED"
    assert res.execution_status == "HELD_FOR_HUMAN_APPROVAL"

@pytest.mark.asyncio
async def test_funnel_hazmat_violation():
    """Test 3: HazMat safety tripwire -> verifies immediate rejection on regulatory violation."""
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-HAZMAT-FUNNEL",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="HAZMAT_CLASS_3_FLAMMABLE",
        is_hazmat=True,
        baseline_cost_usd=50000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    res = await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)

    # Should be rejected because HazMat Class 3 cannot route through bypass corridors
    assert res.reroute_selected is True
    assert res.safeguard_evaluation.decision == "REJECT_ROUTE"
    assert res.execution_status == "REJECTED_SAFETY_VIOLATION"
