import pytest
from pydantic import BaseModel, Field
from src.contracts.schemas import UnifiedDisruptionEvent, EventSource, Severity
from src.llm.client import MockLLMClient, HuggingFaceClient

@pytest.mark.asyncio
async def test_mock_llm_client_event():
    client = MockLLMClient()
    prompt = "A major labor strike has occurred at the Port of Los Angeles."
    
    event = await client.generate_structured(prompt, UnifiedDisruptionEvent)
    
    assert isinstance(event, UnifiedDisruptionEvent)
    assert event.source == EventSource.NEWS
    assert event.event_type == "Labor Strike"
    assert "Port of Los Angeles" in event.affected_nodes
    assert event.estimated_delay_hours == 48.0

@pytest.mark.asyncio
async def test_mock_llm_client_weather():
    client = MockLLMClient()
    prompt = "Severe weather warning: Category 4 hurricane heading to Houston Port."
    
    event = await client.generate_structured(prompt, UnifiedDisruptionEvent)
    
    assert isinstance(event, UnifiedDisruptionEvent)
    assert event.source == EventSource.WEATHER
    assert event.event_type == "Hurricane"
    assert "Houston Port Authority" in event.affected_nodes
    assert event.impact_radius_km == 150.0

def test_huggingface_json_extraction():
    client = HuggingFaceClient(api_key="dummy")
    
    # Text with markdown block
    text_with_markdown = "Here is your JSON:\n```json\n{\"key\": \"value\"}\n```\nHope it helps!"
    assert client._extract_json(text_with_markdown) == '{"key": "value"}'
    
    # Text with plain brace structure
    text_with_braces = "Analysis complete: {\"success\": true} and everything works."
    assert client._extract_json(text_with_braces) == '{"success": true}'
    
    # Text with bracket array structure
    text_with_brackets = "List of items: [1, 2, 3] end of list."
    assert client._extract_json(text_with_brackets) == '[1, 2, 3]'
