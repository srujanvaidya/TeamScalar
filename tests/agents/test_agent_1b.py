import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app_agent_1b import app
from src.agents.agent_1b import WeatherTelemetryAgent
from src.contracts.schemas import UnifiedDisruptionEvent, Severity, EventSource

client = TestClient(app)

@pytest.mark.asyncio
async def test_agent1b_typhoon_detection():
    agent = WeatherTelemetryAgent()
    event = await agent.evaluate_vessel_telemetry(
        vessel_id="IMO_123",
        lat=24.5,
        lon=119.8,
        wind_speed_knots=55.0,
        wave_height_m=6.5,
        corridor_name="CORRIDOR_TAIWAN_STRAIT"
    )
    assert isinstance(event, UnifiedDisruptionEvent)
    assert event.source == EventSource.WEATHER
    assert event.event_type == "TYPHOON"
    assert event.severity == Severity.CRITICAL
    assert event.estimated_delay_hours >= 48.0
    assert event.impact_radius_km == 150.0

@pytest.mark.asyncio
async def test_agent1b_calm_transit():
    agent = WeatherTelemetryAgent()
    event = await agent.evaluate_vessel_telemetry(
        vessel_id="IMO_456",
        lat=9.1,
        lon=-79.7,
        wind_speed_knots=5.0,
        wave_height_m=1.0,
        corridor_name="CORRIDOR_PANAMA_CANAL"
    )
    assert isinstance(event, UnifiedDisruptionEvent)
    assert event.event_type == "CLEAR_TRANSIT"
    assert event.severity == Severity.LOW
    assert event.estimated_delay_hours == 0.0

@pytest.mark.asyncio
async def test_agent1b_api_fallback_on_timeout():
    agent = WeatherTelemetryAgent()
    
    with patch("httpx.AsyncClient.get", side_effect=Exception("Timeout connecting to Open-Meteo")):
        weather = await agent.fetch_corridor_weather(24.5, 119.8)
        
    assert weather["wind_speed_knots"] == 12.0
    assert weather["wave_height_m"] == 1.8

def test_fastapi_agent_1b_endpoints():
    # Test Root redirect/dashboard
    response = client.get("/")
    assert response.status_code == 200
    assert "Scalar Agent 1B" in response.text

    # Test Health Check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    # Test Demo
    response = client.get("/demo")
    assert response.status_code == 200
    assert "Taiwan Strait Typhoon Evaluation Demo" in response.text

    # Test Evaluate Endpoint
    payload = {
        "vessel_id": "TEST_VESSEL",
        "lat": 12.6,
        "lon": 43.3,
        "wind_speed_knots": 35.0,
        "wave_height_m": 4.5,
        "corridor_name": "CORRIDOR_BAB_EL_MANDEB"
    }
    response = client.post("/api/v1/agent1b/evaluate", json=payload)
    assert response.status_code == 200
    event_data = response.json()
    assert event_data["event_type"] == "SEVERE_STORM"
    assert event_data["severity"] == "HIGH"
