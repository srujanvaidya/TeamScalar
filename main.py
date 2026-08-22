"""
Supply Chain Disruption Control Agent — FastAPI Main Server
HOP 2026 Hackathon Submission

Provides:
- Agent 2 Endpoint: POST /api/v1/agent2/navigate (Graph-RL Pathfinder)
- Agent 3 Endpoint: POST /api/v1/agent3/validate (Constraint Validator)
- Enterprise Mock REST Tool Endpoints:
  * GET  /api/v1/inventory/check
  * POST /api/v1/carrier/rates
  * GET  /api/v1/regulatory/hazmat
- Full Pipeline Endpoint: POST /api/v1/pipeline/reroute
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

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

app = FastAPI(
    title="Supply Chain Disruption Control Agent API",
    description="Agent 2 (Graph-RL Navigator) & Agent 3 (Constraint Validator) microservices",
    version="1.0.0"
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


# --- Root / Health check ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Supply Chain Disruption Control Agent Engine",
        "agents": ["Agent 2: Graph-RL Navigator", "Agent 3: Constraint Validator"],
        "version": "1.0.0"
    }


# --- Enterprise Mock Tool Endpoints (Required by Spec) ---

@app.get("/api/v1/inventory/check", response_model=InventoryCheckResponse)
def check_inventory(node_id: str = Query(..., description="Node ID to check stock for")):
    """Tool Execution Endpoint: GET /api/v1/inventory/check?node_id={id}"""
    return validator.check_inventory(node_id)


@app.post("/api/v1/carrier/rates", response_model=CarrierRateResponse)
def get_carrier_rates(request: CarrierRateRequest):
    """Tool Execution Endpoint: POST /api/v1/carrier/rates"""
    return validator.query_carrier_rate(request)


@app.get("/api/v1/regulatory/hazmat", response_model=HazMatCheckResponse)
def check_hazmat(cargo_id: str = Query(..., description="Cargo ID to verify HazMat compliance for")):
    """Tool Execution Endpoint: GET /api/v1/regulatory/hazmat?cargo_id={id}"""
    return validator.check_hazmat(cargo_id)


# --- Agent 2 Endpoint (Graph-RL Navigator) ---

@app.post("/api/v1/agent2/navigate", response_model=Agent2NavigationResponse)
def run_agent_2(payload: DisruptionPayload):
    """
    Agent 2 Endpoint: Recalculates alternate candidate routes using NetworkX
    graph pathfinding upon disruption events.
    """
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
    """
    Agent 3 Endpoint: Takes a candidate route from Agent 2, runs tool validations,
    and returns constraint check results with calculated total costs and SLA breach risk.
    """
    return validator.validate_route(candidate, cargo_id=cargo_id)


# --- Full Pipeline Endpoint ---

@app.post("/api/v1/pipeline/reroute")
def run_full_pipeline(payload: DisruptionPayload, cargo_id: str = Query("CARGO_2291")):
    """
    Orchestrates Agent 2 pathfinding -> Agent 3 constraint validation in sequence.
    """
    # Step 1: Agent 2 Graph Pathfinding
    nav_response = navigator.calculate_candidates(
        origin=payload.origin,
        destination=payload.destination,
        blocked_nodes=payload.blocked_nodes,
        blocked_edges=payload.blocked_edges,
        max_candidates=payload.max_candidates
    )

    # Step 2: Agent 3 Tool Execution & Validation
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
