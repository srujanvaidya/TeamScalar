import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app_agent_1a import app
from src.agents.agent_1a import NewsSemanticParserAgent, SYNTHETIC_INCIDENTS
from src.llm.client import MockLLMClient
from src.contracts.schemas import UnifiedDisruptionEvent, EventSource, Severity

client = TestClient(app)

@pytest.mark.asyncio
async def test_agent1a_e2e_parsing_with_mock_client():
    mock_llm = MockLLMClient()
    agent = NewsSemanticParserAgent(llm_client=mock_llm)
    
    text = "A sudden labor strike has broken out at PORT_SHANGHAI_01, causing critical delays."
    event = await agent.parse_article(text, source_url="https://news.com/strike")
    
    assert isinstance(event, UnifiedDisruptionEvent)
    assert event.source == EventSource.NEWS
    assert event.event_type == "Labor Strike"
    assert event.severity == Severity.CRITICAL
    assert "PORT_SHANGHAI_01" in event.affected_nodes
    assert event.latitude == 31.2304
    assert event.longitude == 121.4737
    assert event.metadata["source_url"] == "https://news.com/strike"

@pytest.mark.asyncio
async def test_agent1a_gdelt_ingestion_fallback_on_network_failure():
    agent = NewsSemanticParserAgent()
    
    # Mocking httpx.AsyncClient.get to throw an Exception
    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection timed out")):
        alerts = await agent.fetch_live_alerts()
        
    assert len(alerts) > 0
    assert alerts[0]["title"] == SYNTHETIC_INCIDENTS[0]["title"]
    assert alerts[0]["url"] == SYNTHETIC_INCIDENTS[0]["url"]

@pytest.mark.asyncio
async def test_agent1a_malformed_llm_response_recovery():
    # Create an LLM client that fails or throws an exception to trigger the fallback parsing logic
    class FailingLLMClient:
        async def generate_structured(self, prompt, schema, system_prompt=None):
            raise ValueError("Inference API returned malformed response code 500")

    failing_client = FailingLLMClient()
    agent = NewsSemanticParserAgent(llm_client=failing_client)
    
    text = "Breakout: A blockade at CORRIDOR_SUEZ_CANAL is causing massive backlogs."
    event = await agent.parse_article(text, source_url="https://news.com/blockade")
    
    assert isinstance(event, UnifiedDisruptionEvent)
    assert event.source == EventSource.NEWS
    assert event.event_type == "Blockade"
    assert event.severity == Severity.CRITICAL
    assert "CORRIDOR_SUEZ_CANAL" in event.affected_nodes
    assert event.latitude == 30.5852
    assert event.longitude == 32.2654
    assert event.metadata["fallback_parsed"] is True
    assert event.metadata["source_url"] == "https://news.com/blockade"

def test_fastapi_endpoints():
    # Test Root Dashboard
    response = client.get("/")
    assert response.status_code == 200
    assert "Scalar Agent 1A" in response.text
    assert "poll-live" in response.text

    # Test Health Check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "agent": "Agent 1A"}

    # Test Demo Page
    response = client.get("/demo")
    assert response.status_code == 200
    assert "Shanghai Port Strike Parsing Demo" in response.text
    assert "PORT_SHANGHAI_01" in response.text

    # Test Parse Endpoint
    payload = {
        "text": "Alert: Labor strike at PORT_SHANGHAI_01 causing delay of 12 hours.",
        "source_url": "https://shipping-alerts.com"
    }
    response = client.post("/api/v1/agent1a/parse", json=payload)
    assert response.status_code == 200
    event_data = response.json()
    assert event_data["event_type"] == "Labor Strike"
    assert "PORT_SHANGHAI_01" in event_data["affected_nodes"]
