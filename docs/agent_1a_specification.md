# Agent 1A — News/Semantic Event Parser Specification

## Overview & Role
Agent 1A resides in the **Perception Layer** of the HOP 2026 // Scalar system. Its primary responsibility is parsing raw, unstructured news bulletins, alerts, and articles into structured, standardized event payloads (`UnifiedDisruptionEvent`) that can be consumed by downstream agents (like Agent 0 and Agent 5).

---

## External Data Ingestion
- **GDELT 2.0 API**: Connects to GDELT document endpoints via HTTP requests to search for live logistics disruptions globally.
- **Failover / Resiliency Fixtures**: If network limits, API rate limiting, or connection issues occur, the agent falls back to parsing high-fidelity synthetic incident templates. This ensures the system continues to operate during offline demos or presentation runs.

---

## processing Lifecycle

1. **Ingest**: Fetch raw news articles using the ingestion engine (`fetch_live_alerts`).
2. **LLM Extraction**: Send article text to the configurable `LLMClient` with targeted parsing rules.
3. **Validation & Mapping**: Check properties and map recognized transport nodes (e.g. `PORT_SHANGHAI_01`) to geographical coordinate locations.
4. **Fallback Recovery**: If the LLM generates parsing or connection failures, a regex-based heuristic extractor constructs a safe, validated mock event labeled with `fallback_parsed: True`.

---

## Canonical JSON Schema Instance
Below is an example of the serialized `UnifiedDisruptionEvent` output:

```json
{
  "event_id": "evt_fallback_1787349283",
  "source": "NEWS",
  "event_type": "Labor Strike",
  "severity": "HIGH",
  "confidence": 0.85,
  "timestamp": "2026-08-22T13:00:00Z",
  "latitude": 31.2304,
  "longitude": 121.4737,
  "affected_nodes": [
    "PORT_SHANGHAI_01"
  ],
  "impact_radius_km": 0.0,
  "estimated_delay_hours": 48.0,
  "description": "Fallback parse: Shanghai Port labor strike...",
  "metadata": {
    "source_url": "https://synthetic-shipping-news.logistics/shanghai-strike"
  }
}
```

---

## Deployment & Verification

### Hugging Face Space Standalone Deployment
Agent 1A is deployable as a standalone endpoint using [app_agent_1a.py](file:///c:/Users/SHIVA/Desktop/projects_shiva/HOP/TeamScalar/app_agent_1a.py).
1. Add `src/`, `tests/`, and `app_agent_1a.py` to the Space repository.
2. Select FastAPI container space on Hugging Face.
3. Configure `LLM_PROVIDER=huggingface` and `HUGGINGFACE_API_KEY` in HF Secrets.

### Running Verification Tests
Execute:
```powershell
python -m pytest tests/agents/test_agent_1a.py
```
