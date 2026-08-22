import pytest
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext, OrchestrationResult

@pytest.mark.asyncio
async def test_orchestrator_nominal_journey():
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-NOMINAL-101",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="GENERAL_CARGO",
        is_hazmat=False,
        baseline_cost_usd=40000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "PORT_ROTTERDAM_02"]
    )
    # Rerouting should not trigger because no weather/news alerts intersect this clean path
    res = await orchestrator.run_shipment_mission(context)
    
    assert isinstance(res, OrchestrationResult)
    assert res.reroute_selected is False
    assert res.execution_status == "DISPATCHED_AUTONOMOUS"
    assert res.proposed_cost_usd == 40000.0
    assert len(res.audit_hash) == 64

@pytest.mark.asyncio
async def test_orchestrator_shanghai_strike_reroute():
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-STRIKE-202",
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
    
    assert res.reroute_selected is True
    assert "CORRIDOR_EAST_PACIFIC_BYPASS" in res.proposed_corridor_path
    assert res.proposed_cost_usd == 42000.0 + 8200.0
    assert res.execution_status == "DISPATCHED_AUTONOMOUS"

@pytest.mark.asyncio
async def test_orchestrator_typhoon_hitl():
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-TYPHOON-303",
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
    
    assert res.reroute_selected is True
    assert res.proposed_cost_usd == 35000.0 + 64200.0
    assert res.execution_status == "HELD_FOR_HUMAN_APPROVAL"

@pytest.mark.asyncio
async def test_orchestrator_hazmat_rejection():
    orchestrator = MasterOrchestratorAgent()
    # HazMat shipment routed through a bypass corridor due to strike
    context = ShipmentContext(
        container_id="CNTR-HAZMAT-404",
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
    
    assert res.reroute_selected is True
    assert res.execution_status == "REJECTED_SAFETY_VIOLATION"
    assert res.safeguard_evaluation.decision == "REJECT_ROUTE"
