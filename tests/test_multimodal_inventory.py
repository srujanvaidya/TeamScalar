import pytest
from src.tools.inventory_allocator import WarehouseInventoryManager
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext

def test_warehouse_stock_query():
    """Test 1: Warehouse stock query and localized fulfillment selection."""
    plan = WarehouseInventoryManager.check_stock_availability(
        sku_id="SKU-PRECISION-SEMI-808",
        quantity=500,
        near_node="PORT_SHANGHAI_01"
    )
    assert plan is not None
    assert plan["warehouse_id"] == "WH_SHANGHAI"
    assert plan["available_stock"] >= 500
    assert plan["transfer_cost_usd"] > 0
    assert plan["dispatch_readiness_hours"] > 0

@pytest.mark.asyncio
async def test_tier_decision_branching():
    """Test 2: TIER_1_VIP vs TIER_3_STANDARD decision branching under the same typhoon disruption."""
    orchestrator = MasterOrchestratorAgent()
    
    # 1. VIP Context (Triggers fastest Air-Bridge bypass to avoid SLA breach)
    vip_context = ShipmentContext(
        container_id="CNTR-TYPHOON-VIP",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="ELECTRONICS",
        is_hazmat=False,
        baseline_cost_usd=40000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        customer_tier="TIER_1_VIP"
    )
    
    # 2. Standard Context (Chooses low-cost maritime bypass within acceptable SLA penalty)
    std_context = ShipmentContext(
        container_id="CNTR-TYPHOON-STD",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="ELECTRONICS",
        is_hazmat=False,
        baseline_cost_usd=40000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        customer_tier="TIER_3_STANDARD"
    )
    
    weather_injection = {
        "lat": 24.5,
        "lon": 119.8,
        "wind_speed_knots": 62.0,
        "wave_height_m": 7.5,
        "corridor_name": "CORRIDOR_TAIWAN_STRAIT"
    }
    
    vip_res = await orchestrator.run_shipment_mission(vip_context, inject_weather=weather_injection)
    std_res = await orchestrator.run_shipment_mission(std_context, inject_weather=weather_injection)
    
    # VIP selects Air-Bridge (12.0 hours transit) to beat SLA
    assert "ROUTE_ALT_AIR" in vip_res.safeguard_evaluation.justification or "ROUTE_ALT_REALLOCATION" in vip_res.safeguard_evaluation.justification
    
    # Standard selects Maritime Detour (72.0 hours or cheaper option)
    assert std_res.proposed_cost_usd < vip_res.proposed_cost_usd

@pytest.mark.asyncio
async def test_multimodal_hazmat_restriction():
    """Test 3: Multi-modal transport constraint checks (ensuring HazMat Class 3 is prohibited on air freight)."""
    orchestrator = MasterOrchestratorAgent()
    context = ShipmentContext(
        container_id="CNTR-HAZMAT-AIR-BLOCK",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="HAZMAT_CLASS_3_FLAMMABLE",
        is_hazmat=True,
        baseline_cost_usd=40000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        customer_tier="TIER_1_VIP",
        allowed_transport_modes=["AIR"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    
    res = await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)
    
    # Even if TIER_1_VIP is set, HazMat is prohibited on air freight
    assert res.safeguard_evaluation.decision == "REJECT_ROUTE"
    assert res.safeguard_evaluation.hazmat_violation is True
