import os
import json
import uvicorn
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# Import Tejas's Agents and Models
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

# Import Shiva's Agents and Models
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext, OrchestrationResult
from src.agents.agent_1a import NewsSemanticParserAgent
from src.agents.agent_1b import WeatherTelemetryAgent
from src.agents.agent_5 import FinancialRiskSafeguardAgent

app = FastAPI(
    title="HOP 2026 // Scalar — Supply Chain Disruption Control Agent",
    description="Unified API Gateway integrating Perception, Graph-RL Pathfinding, Constraint Validation, and Financial Risk Safeguards.",
    version="1.0.0"
)

# Setup CORS middleware for Next.js frontend (local dev and wildcard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Shiva's Agent Singletons
orchestrator = MasterOrchestratorAgent()
agent_1a = NewsSemanticParserAgent()
agent_1b = WeatherTelemetryAgent()
agent_5 = FinancialRiskSafeguardAgent()

# Instantiate Tejas's Agent Singletons
navigator = GraphRLNavigator()
validator = ConstraintValidator()

# Load shipments JSON helper
DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "backend", "data", "shipments.json")

def load_shipments_data() -> Dict[str, Any]:
    if os.path.exists(DATA_FILE_PATH):
        with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    # Fallback in-memory shipment structure if file is missing
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

# --- Root redirect ---
@app.get("/")
def read_root():
    return RedirectResponse("/docs")

# --- System Health status ---
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "agent_fleet": {
            "Agent 0 - Master Orchestrator": "active",
            "Agent 1A - News Parser": "active",
            "Agent 1B - Weather Ingestor": "active",
            "Agent 2 - Graph-RL Navigator": "active",
            "Agent 3 - Constraint Validator": "active",
            "Agent 5 - Financial Safeguard": "active"
        }
    }

# --- Shiva's Agent 0 Dispatch Endpoint ---
@app.post("/api/v1/orchestrator/dispatch", response_model=OrchestrationResult)
async def dispatch_shipment(payload: ShipmentContext):
    try:
        result = await orchestrator.run_shipment_mission(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Preset Simulations ---
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

@app.get("/demo/full-funnel-strike", response_model=OrchestrationResult)
async def demo_full_funnel_strike():
    return await demo_full_mission_strike()

@app.get("/demo/full-funnel-typhoon", response_model=OrchestrationResult)
async def demo_full_funnel_typhoon():
    return await demo_full_mission_typhoon()

@app.get("/demo/full-funnel-hazmat-violation", response_model=OrchestrationResult)
async def demo_full_funnel_hazmat_violation():
    context = ShipmentContext(
        container_id="CNTR-HAZMAT-VIOLATION-505",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="HAZMAT_CLASS_3_FLAMMABLE",
        is_hazmat=True,
        baseline_cost_usd=50000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    return await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)


# --- Tejas's Shipments Endpoints ---
@app.get("/api/v1/shipments")
def get_all_shipments():
    return load_shipments_data()

@app.get("/api/v1/shipments/{cargo_id}")
def get_shipment_by_id(cargo_id: str):
    data = load_shipments_data()
    for shipment in data.get("shipments", []):
        if shipment.get("cargo_id") == cargo_id:
            return shipment
    raise HTTPException(status_code=404, detail=f"Shipment with cargo_id '{cargo_id}' not found.")

# --- Tejas's Enterprise Mock Tools Endpoints ---
@app.get("/api/v1/inventory/check", response_model=InventoryCheckResponse)
def check_inventory(node_id: str = Query(..., description="Node ID to check stock for")):
    return validator.check_inventory(node_id)

@app.post("/api/v1/carrier/rates", response_model=CarrierRateResponse)
def get_carrier_rates(request: CarrierRateRequest):
    return validator.query_carrier_rate(request)

@app.get("/api/v1/regulatory/hazmat", response_model=HazMatCheckResponse)
def check_hazmat(cargo_id: str = Query(..., description="Cargo ID to verify HazMat compliance for")):
    return validator.check_hazmat(cargo_id)

# --- Tejas's Agent 2 (Graph Navigator) Endpoint ---
@app.post("/api/v1/agent2/navigate", response_model=Agent2NavigationResponse)
def run_agent_2(payload: DisruptionPayload):
    return navigator.calculate_candidates(
        origin=payload.origin,
        destination=payload.destination,
        blocked_nodes=payload.blocked_nodes,
        blocked_edges=payload.blocked_edges,
        max_candidates=payload.max_candidates
    )

# --- Tejas's Agent 3 (Constraint Validator) Endpoint ---
@app.post("/api/v1/agent3/validate", response_model=Agent3ValidationResult)
def run_agent_3(candidate: RouteCandidate, cargo_id: str = Query("CARGO_2291")):
    return validator.validate_route(candidate, cargo_id=cargo_id)

# --- Tejas's Combined Pipeline Endpoint ---
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

# --- Spatial Maritime Registry Endpoints ---
@app.get("/api/v1/ports/search")
def api_search_ports(q: str = Query(..., description="Query substring for port name, ID or country")):
    from src.data.port_registry import GlobalPortRegistry
    registry = GlobalPortRegistry()
    results = registry.search_ports(q)
    return [p.model_dump() for p in results]

@app.get("/api/v1/ports/nearby")
def api_nearby_ports(
    lat: float = Query(..., description="Latitude coordinate"),
    lon: float = Query(..., description="Longitude coordinate"),
    radius_km: float = Query(600.0, description="Search radius in kilometers")
):
    from src.data.port_registry import GlobalPortRegistry
    registry = GlobalPortRegistry()
    results = registry.search_nearby_ports(lat, lon, radius_km)
    return [p.model_dump() for p in results]

@app.get("/api/v1/ports/route-distance")
def api_route_distance(
    origin: str = Query(..., description="Origin port ID or alias"),
    destination: str = Query(..., description="Destination port ID or alias")
):
    from src.data.port_registry import GlobalPortRegistry
    registry = GlobalPortRegistry()
    port1 = registry.get_port(origin)
    port2 = registry.get_port(destination)
    if not port1 or not port2:
        raise HTTPException(status_code=404, detail="One or both ports could not be resolved.")
    distance_nm = registry.compute_maritime_distance_nm(origin, destination)
    return {
        "origin": port1.model_dump(),
        "destination": port2.model_dump(),
        "maritime_distance_nm": distance_nm
    }

class BlockchainRerouteRequest(BaseModel):
    ship_id: str
    location: str
    route: List[str]

@app.post("/api/v1/blockchain/reroute")
async def api_blockchain_reroute(payload: BlockchainRerouteRequest):
    from src.blockchain.bridge_adapter import BlockchainBridge
    receipt = await BlockchainBridge.anchor_reroute_decision(
        ship_id=payload.ship_id,
        location=payload.location,
        route_ports=payload.route
    )
    return receipt

@app.get("/api/v1/blockchain/status")
def api_blockchain_status():
    from blockchain.config import OWNER_ADDRESS
    # Standard health details
    return {
        "polygon_rpc": "http://mock.polygon.amoy" if not os.getenv("RPC_URL") else "connected",
        "supabase_connection": "healthy",
        "wallet_address": OWNER_ADDRESS or "0x0000000000000000000000000000000000000000"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
