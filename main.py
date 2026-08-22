"""
Supply Chain Disruption Control Agent — FastAPI Main Server
HOP 2026 Hackathon Submission

Provides unified microservices for all 9 autonomous agents:
- Agent 0: Master Mission Orchestrator (POST /api/v1/orchestrator/dispatch, /demo/*)
- Agent 1A: News Semantic Ingestion Agent (POST /api/v1/agent1a/parse)
- Agent 1B: Environmental Weather Telemetry Agent (POST /api/v1/agent1b/weather)
- Agent 2: Graph-RL Pathfinder (POST /api/v1/agent2/navigate)
- Agent 3: Constraint & Pydantic REST Validator (POST /api/v1/agent3/validate)
- Agent 5: Financial Risk & Safeguard Gate (POST /api/v1/agent5/evaluate)
- Enterprise Tool Endpoints (/api/v1/inventory/check, /api/v1/carrier/rates, /api/v1/regulatory/hazmat)
- Live Shipments Telemetry (/api/v1/shipments, /api/v1/shipments/{cargo_id})
- Full Pipeline Rerouting Orchestration (/api/v1/pipeline/reroute)
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import json
import os

from agent_2_navigator import (
    GraphRLNavigator,
    DisruptionPayload,
    Agent2NavigationResponse,
    RouteCandidate
)
from agent_3_validator import (
    ConstraintValidator,
    InventoryCheckResponse,
    CarrierRateRequest,
    CarrierRateResponse,
    HazMatCheckResponse,
    Agent3ValidationResult,
    Agent3ValidationResponse
)

# Unified Agents (Shiva & Tejas Pipeline Integration)
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext, OrchestrationResult
from src.agents.agent_1a import NewsSemanticParserAgent
from src.agents.agent_1b import WeatherTelemetryAgent
from src.agents.agent_5 import FinancialRiskSafeguardAgent

app = FastAPI(
    title="Supply Chain Disruption Control Agent API",
    description="Unified Microservices Engine (Agents 0, 1A, 1B, 2, 3, 5, 6, 7, 8, 9)",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent Engines
navigator = GraphRLNavigator()
validator = ConstraintValidator()
orchestrator = MasterOrchestratorAgent()
agent_1a = NewsSemanticParserAgent()
agent_1b = WeatherTelemetryAgent()
agent_5 = FinancialRiskSafeguardAgent()

# Load shipments JSON helper
DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "backend", "data", "shipments.json")

def load_shipments_data() -> Dict[str, Any]:
    if os.path.exists(DATA_FILE_PATH):
        with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "shipments": [
            {
                "cargo_id": "CONT-99482-SH",
                "mode": "MARITIME",
                "vessel_name": "COSCO SHIPPING GEMINI",
                "origin": "PORT_SHANGHAI_01",
                "destination": "PORT_ROTTERDAM_02",
                "current_status": "BLOCKED_BY_STRIKE",
                "current_coordinates": [31.2304, 121.4737],
                "active_route_coords": [[31.23, 121.47], [22.31, 114.16], [1.29, 103.85], [26.6, 56.3], [12.5, 43.3], [29.9, 32.5], [51.9, 4.47]],
                "metrics": {"transit_hours": 142.0, "cost_usd": 14200.0, "co2_kg": 1850.0, "sla_risk": "HIGH"},
                "alternate_routes": [
                    {
                        "route_id": "ROUTE_ALT_A",
                        "modal_sequence": ["ROAD_TRUCK", "RAIL_FREIGHT"],
                        "waypoints": ["HUB_SHANGHAI", "HUB_WARSAW", "DIST_BERLIN"],
                        "waypoint_coords": [[31.23, 121.47], [30.57, 104.07], [52.23, 21.01], [52.52, 13.4]],
                        "estimated_transit_hours": 110.5,
                        "base_freight_cost_usd": 18450.00,
                        "co2_emissions_kg": 1240.5,
                        "risk_grade": "LOW",
                        "color_gradient": [56, 142, 60]
                    },
                    {
                        "route_id": "ROUTE_ALT_B",
                        "modal_sequence": ["MARITIME", "AIR_FREIGHT"],
                        "waypoints": ["PORT_SHANGHAI", "AIR_DUBAI", "PORT_ROTTERDAM"],
                        "waypoint_coords": [[31.23, 121.47], [25.2, 55.27], [51.9, 4.47]],
                        "estimated_transit_hours": 165.0,
                        "base_freight_cost_usd": 29100.00,
                        "co2_emissions_kg": 3400.0,
                        "risk_grade": "HIGH",
                        "color_gradient": [211, 47, 47]
                    }
                ]
            }
        ]
    }


# --- Root / Health check ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Supply Chain Disruption Control Agent Engine",
        "agent_fleet": {
            "Agent 0": "Master Orchestrator",
            "Agent 1A": "News Semantic Parser",
            "Agent 1B": "Weather Ingestor",
            "Agent 2": "Graph-RL Navigator",
            "Agent 3": "Constraint Validator",
            "Agent 5": "Financial Risk Safeguard"
        },
        "version": "2.0.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "agent_fleet": {
            "Agent 0 - Orchestrator": "healthy",
            "Agent 1A - News Parser": "healthy",
            "Agent 1B - Weather Ingestor": "healthy",
            "Agent 2 - Graph-RL Navigator": "healthy",
            "Agent 3 - Constraint Validator": "healthy",
            "Agent 5 - Financial Safeguard": "healthy"
        }
    }


# --- Live Shipments Endpoints ---

@app.get("/api/v1/shipments")
def get_all_shipments():
    """GET /api/v1/shipments — Returns all active live tracked cargo shipments."""
    return load_shipments_data()


@app.get("/api/v1/shipments/{cargo_id}")
def get_shipment_by_id(cargo_id: str):
    """GET /api/v1/shipments/{cargo_id} — Returns detailed telemetry & alternate routes for cargo_id."""
    data = load_shipments_data()
    for shipment in data.get("shipments", []):
        if shipment.get("cargo_id") == cargo_id:
            return shipment
    raise HTTPException(status_code=404, detail=f"Shipment with cargo_id '{cargo_id}' not found.")


# --- Enterprise Mock Tool Endpoints ---

@app.get("/api/v1/inventory/check", response_model=InventoryCheckResponse)
def check_inventory(node_id: str = Query(..., description="Node ID to check stock for")):
    return validator.check_inventory(node_id)


@app.post("/api/v1/carrier/rates", response_model=CarrierRateResponse)
def get_carrier_rates(request: CarrierRateRequest):
    return validator.query_carrier_rate(request)


@app.get("/api/v1/regulatory/hazmat", response_model=HazMatCheckResponse)
def check_hazmat(cargo_id: str = Query(..., description="Cargo ID to verify HazMat compliance for")):
    return validator.check_hazmat(cargo_id)


# --- Agent 0 Endpoint (Master Orchestrator DAG) ---

@app.post("/api/v1/orchestrator/dispatch", response_model=OrchestrationResult)
async def dispatch_shipment(payload: ShipmentContext):
    try:
        return await orchestrator.run_shipment_mission(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/demo/full-mission-strike", response_model=OrchestrationResult)
async def demo_full_mission_strike():
    context = ShipmentContext(
        container_id="CNTR-SHA-BOM-9921",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="ELECTRONICS",
        is_hazmat=False,
        baseline_cost_usd=42000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    return await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)

@app.get("/demo/full-mission-typhoon", response_model=OrchestrationResult)
async def demo_full_mission_typhoon():
    context = ShipmentContext(
        container_id="CNTR-TPE-ROT-4481",
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
    return await orchestrator.run_shipment_mission(context, inject_weather=weather_injection)


# --- Agent 1A & 1B Endpoints ---

@app.post("/api/v1/agent1a/parse")
async def run_agent_1a(text: str = Query(...)):
    """Agent 1A Endpoint: Unstructured News NLP parser."""
    return await agent_1a.parse_article(text)

@app.post("/api/v1/agent1b/weather")
async def run_agent_1b(lat: float = Query(...), lon: float = Query(...), vessel_id: str = Query("SYSTEM_MONITOR")):
    """Agent 1B Endpoint: Weather & environmental telemetry anomaly detector."""
    weather = await agent_1b.fetch_corridor_weather(lat, lon)
    return await agent_1b.evaluate_vessel_telemetry(
        vessel_id=vessel_id,
        lat=lat,
        lon=lon,
        wind_speed_knots=weather.get("wind_speed_knots", 10.0),
        wave_height_m=weather.get("wave_height_m", 2.0),
        corridor_name="CUSTOM_COORDINATE"
    )


# --- Agent 2 Endpoint (Graph-RL Navigator) ---

@app.post("/api/v1/agent2/navigate", response_model=Agent2NavigationResponse)
def run_agent_2(payload: DisruptionPayload):
    return navigator.calculate_candidates(
        origin=payload.origin,
        destination=payload.destination,
        blocked_nodes=payload.blocked_nodes,
        blocked_edges=payload.blocked_edges,
        max_candidates=payload.max_candidates
    )


# --- Agent 3 Endpoint (Constraint Validator) ---

@app.post("/api/v1/agent3/validate", response_model=Agent3ValidationResult)
def run_agent_3(candidate: RouteCandidate, cargo_id: str = Query("CARGO_2291")):
    return validator.validate_route(candidate, cargo_id=cargo_id)


# --- Agent 5 Endpoint (Financial Risk Safeguard) ---

@app.post("/api/v1/agent5/evaluate")
async def run_agent_5(
    baseline_cost_usd: float = Query(45000.0),
    proposed_cost_usd: float = Query(64200.0),
    hazmat_compliant: bool = Query(True),
    sla_deadline_breached: bool = Query(False),
    sla_penalty_usd: float = Query(0.0)
):
    """Agent 5 Endpoint: Financial Risk & Safeguard evaluation gate."""
    return await agent_5.evaluate_plan(
        plan_id="api_eval",
        baseline_cost_usd=baseline_cost_usd,
        proposed_cost_usd=proposed_cost_usd,
        hazmat_compliant=hazmat_compliant,
        sla_deadline_breached=sla_deadline_breached,
        sla_penalty_usd=sla_penalty_usd
    )


# --- Full Pipeline Endpoint ---

@app.post("/api/v1/pipeline/reroute")
def run_full_pipeline(payload: DisruptionPayload, cargo_id: str = Query("CARGO_2291")):
    nav_response = navigator.calculate_candidates(
        origin=payload.origin,
        destination=payload.destination,
        blocked_nodes=payload.blocked_nodes,
        blocked_edges=payload.blocked_edges,
        max_candidates=payload.max_candidates
    )
    val_response = validator.validate_all(nav_response.candidates, cargo_id=cargo_id)

    return {
        "disruption": {
            "origin": payload.origin,
            "destination": payload.destination,
            "blocked_nodes": payload.blocked_nodes
        },
        "agent_2_candidates": nav_response.candidates,
        "agent_3_validations": val_response.results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
