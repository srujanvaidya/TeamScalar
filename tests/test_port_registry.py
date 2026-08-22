import pytest
from src.data.port_registry import GlobalPortRegistry, PortRecord
from src.agents.agent_2 import MultimodalNavigatorAgent
from src.contracts.schemas import UnifiedDisruptionEvent, Severity, EventSource

def test_port_parsing_and_schema():
    """Test 1: Excel/CSV parsing and schema verification."""
    registry = GlobalPortRegistry()
    assert len(registry.ports) > 0
    # Check Shanghai port schema
    port = registry.get_port("CNSHA")
    assert port is not None
    assert isinstance(port, PortRecord)
    assert port.port_name == "Shanghai"
    assert port.country == "China"
    assert port.latitude == 31.2304
    assert port.longitude == 121.4737

def test_fuzzy_lookup():
    """Test 2: Fuzzy lookup resolving common port queries."""
    registry = GlobalPortRegistry()
    assert registry.get_port("Shanghai") is not None
    assert registry.get_port("Singapore") is not None
    assert registry.get_port("Nhava Sheva") is not None
    assert registry.get_port("Rotterdam") is not None
    assert registry.get_port("PORT_SHANGHAI_01") is not None

def test_haversine_distance():
    """Test 3: Haversine distance calculation in nautical miles."""
    registry = GlobalPortRegistry()
    # Distance between Shanghai and Singapore
    distance_nm = registry.compute_maritime_distance_nm("CNSHA", "SGSIN")
    assert distance_nm > 1500.0 and distance_nm < 2200.0

@pytest.mark.asyncio
async def test_dynamic_bypass_port_discovery():
    """Test 4: Dynamic bypass port discovery in Agent 2."""
    registry = GlobalPortRegistry()
    # Shanghai coords
    shanghai = registry.get_port("CNSHA")
    # Search nearby container ports within 600km
    nearby = registry.search_nearby_ports(shanghai.latitude, shanghai.longitude, radius_km=600.0)
    # Ningbo/Zhoushan should be in the nearby list
    nearby_names = [p.port_name for p in nearby]
    assert any("Ningbo" in name or "Zhoushan" in name for name in nearby_names)
