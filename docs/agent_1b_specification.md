# Agent 1B — Environmental Telemetry & Weather Agent Specification

## Overview & Role
Agent 1B resides in the **Perception Layer** of HOP 2026 // Scalar. Its task is to consume real-time weather and oceanographic metrics from sensors and external APIs (such as Open-Meteo Marine) and map these environmental signals into structured `UnifiedDisruptionEvent` payloads.

---

## Registered Global Chokepoints
The agent monitors five critical global shipping corridors:
- `CORRIDOR_TAIWAN_STRAIT`: Lat 24.5, Lon 119.8
- `CORRIDOR_SUEZ_CANAL`: Lat 30.5, Lon 32.3
- `CORRIDOR_BAB_EL_MANDEB`: Lat 12.6, Lon 43.3
- `CORRIDOR_STRAIT_OF_HORMUZ`: Lat 26.6, Lon 56.2
- `CORRIDOR_PANAMA_CANAL`: Lat 9.1, Lon -79.7

---

## Environmental Metrics & Severity Matrix
Disruptions are synthesized deterministically based on thresholds:

| Wind Speed (kn) | Wave Height (m) | Synthesized Event Type | Severity | Estimated Delay |
| :--- | :--- | :--- | :--- | :--- |
| $\ge$ 50.0 knots | $\ge$ 6.0m | `TYPHOON` | `CRITICAL` | 48.0 Hours |
| 30.0 - 49.9 knots | 4.0 - 5.9m | `SEVERE_STORM` | `HIGH` | 24.0 Hours |
| 15.0 - 29.9 knots | 2.0 - 3.9m | `HIGH_SWELL` | `MEDIUM` | 12.0 Hours |
| < 15.0 knots | < 2.0m | `CLEAR_TRANSIT` | `LOW` | 0.0 Hours |

---

## Ingestion Layer & API Failover
The agent queries Open-Meteo's Marine Forecast APIs:
```text
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=wind_speed_10m,wind_gusts_10m,precipitation&hourly=wave_height&wind_speed_unit=kn
```
If the network is unavailable or times out, the agent falls back to generating a calm weather object (`wind_speed_knots=12.0`, `wave_height_m=1.8`) to avoid halting the monitoring loop.

---

## Example Payload
```json
{
  "event_id": "evt_weather_IMO_938411_1787349283",
  "source": "WEATHER",
  "event_type": "TYPHOON",
  "severity": "CRITICAL",
  "confidence": 0.98,
  "timestamp": "2026-08-22T13:00:00Z",
  "latitude": 24.5,
  "longitude": 119.8,
  "affected_nodes": [
    "CORRIDOR_TAIWAN_STRAIT"
  ],
  "impact_radius_km": 150.0,
  "estimated_delay_hours": 48.0,
  "description": "TYPHOON conditions detected near CORRIDOR_TAIWAN_STRAIT. High winds (64.5 kn) and extreme waves (7.2m) require vessel diversion.",
  "metadata": {
    "vessel_id": "IMO_938411",
    "wind_speed_knots": 64.5,
    "wave_height_m": 7.2
  }
}
```
---

## Verification Tests
Run the test suite via:
```powershell
python -m pytest tests/agents/test_agent_1b.py
```
