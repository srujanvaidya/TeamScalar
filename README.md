# 🌐 Supply Chain Disruption Control Agent
### *HOP 2026 // Scalar — Enterprise Hackathon Submission*

> **Team:** TeamScalar  
> **Event:** Hackers Occupied Pune (HOP) 2026  
> **Category:** AI / Multi-Agent Systems / Blockchain / Logistics  
> **Tagline:** *"When a typhoon shuts a port, our AI reroutes before the captain even knows."*

---

## 🚨 Problem Statement

Global supply chains bleed **billions of dollars** every year due to:

| Disruption Type | Impact |
|---|---|
| Geopolitical blockades & naval conflicts | Port closures lasting weeks |
| Weather anomalies (typhoons, blizzards) | Catastrophic freight delays |
| Port labor strikes | SLA penalties & demurrage costs |
| Supplier downtime / factory shutdowns | Cascading inventory failures |

**Traditional ERP systems are reactive.** Human operators manually recalculate routes — hours after a disruption — leading to massive OTIF (On Time In Full) penalty exposure. There is no autonomous, explainable, real-time rerouting intelligence.

---

## 🎯 Core Objective

Build an **intelligent, autonomous, multi-agent AI system** that delivers:

1. 🔍 **Dynamic Disruption Detection** — real-time parsing of news, weather, and AIS signals  
2. 🗺️ **Graph-Based Multi-Modal Re-Routing** — Dijkstra/A* fused with Reinforcement Learning  
3. ✅ **Constraint Checking** — carrier availability, inventory, and HazMat compliance  
4. 🌿 **Carbon Footprint Tracking** — ESG grade per alternate route  
5. 🧑‍⚖️ **Human-in-the-Loop (HITL) Financial Guardrails** — sign-off for decisions > $50,000  
6. ⛓️ **Immutable Polygon Blockchain Auditing** — every reroute hash-stamped on-chain  

---

## 🏗️ Tech Stack

### Backend & AI Layer
| Technology | Role |
|---|---|
| **Python 3.11+** | Core language |
| **FastAPI** | REST API server & webhook handlers |
| **LangGraph / CrewAI** | Multi-agent orchestration framework |
| **NetworkX** | Supply chain graph analytics & pathfinding |
| **PyTorch** | Reinforcement Learning routing policy |
| **Ethers.py / Web3.py** | Polygon blockchain interactions |

### Database & Realtime
| Technology | Role |
|---|---|
| **Supabase (PostgreSQL)** | Primary database with Realtime WebSocket subscriptions |
| **Supabase Realtime** | Broadcasts AI decisions live to the frontend |

### Frontend
| Technology | Role |
|---|---|
| **Next.js 14 (App Router)** | Full-stack React framework |
| **TypeScript** | Type-safe frontend development |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Global state management |
| **Mapbox GL JS** | Base 3D map rendering |
| **deck.gl** | ArcLayer, ScatterplotLayer, HeatmapLayer, GeoJsonLayer |
| **Three.js** | Additional 3D visualization elements |

### Blockchain
| Detail | Value |
|---|---|
| **Network** | Polygon POS EVM Testnet/Mainnet |
| **Container Digital Twin (ERC-721/1155)** | `0x48B0DB4e87D280AFB3fDC572f61A641E7261D74D` |
| **Automated Carrier Settlement Escrow** | `0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae` |

---

## 🤖 The 9-Agent Network

```
[ Raw Data Feeds & External Signals ]
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 1A: News & Sentiment Parser                      │
│  Agent 1B: Environmental Telemetry & Weather Agent      │
│  Agent 7:  Predictive Time-Series Forecast Agent        │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Agent 0: Master Orchestrator (The Boss Agent)          │
└───────────────────────────┬─────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌────────────┐    ┌──────────────────┐    ┌────────────┐
│ Agent 2:   │    │ Agent 3:         │    │ Agent 6:   │
│ Graph-RL   │    │ Constraint       │    │ ESG/Carbon │
│ Navigator  │    │ Validator        │    │ Engine     │
└─────┬──────┘    └────────┬─────────┘    └──────┬─────┘
      └────────────────────┼────────────────────┘
                           │
                    Cost > $50K?
                  /               \
                YES               NO
                 │                 │
         Agent 5: Audit      Auto-Approved
         HITL Sign-off            │
                 └───────────┐    │
                             ▼    ▼
                    Agent 4: Blockchain
                    (Hash + Escrow)
                             │
                             ▼
                   Dashboard Command Center
```

---

## 👥 Agent Roles

### Agent 0 — Master Orchestrator *(The Boss)*
Central state machine. Controls agent sequence, listens to Supabase webhooks, delegates tasks, and broadcasts Global System State via WebSockets.

### Agent 1A — News Sentiment Parser
Converts unstructured news, social signals, and strike notices into structured disruption JSON with severity ratings and confidence scores.

**Output sample:**
```json
{
  "incident_id": "INC_8821",
  "target_node": "PORT_SHANGHAI_01",
  "disruption_category": "LABOR_STRIKE",
  "severity_rating": "CRITICAL",
  "confidence_score": 0.95,
  "estimated_delay_hours": 72.0
}
```

### Agent 1B — Environmental & Weather Agent
Processes AIS vessel coordinates, storm radar alerts, and sea-state data. Flags corridors as BLOCKED.

### Agent 2 — Graph-RL Navigator
Directed weighted graph G=(V,E). V = ports/warehouses/hubs, E = transit lanes. Uses Dijkstra/A* + PyTorch RL policy for optimal alternate route selection.

Edge weight: `W(e) = Transit Time + Freight Cost + Risk Penalty` (→ ∞ when blocked)

### Agent 3 — Constraint Validator
Programmatic tool calls against carrier rate APIs, inventory endpoints, and HazMat regulatory APIs to validate each candidate route.

### Agent 4 — Blockchain Provenance Agent
Mints ERC-721/1155 digital container twin tokens and triggers Polygon escrow settlement upon cargo receipt or reroute approval.

**Contracts:**
- Token: `0x48B0DB4e87D280AFB3fDC572f61A641E7261D74D`
- Escrow: `0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae`

### Agent 5 — Explainable Audit & Risk Agent
Financial gatekeeper. Triggers HITL sign-off when cost impact > $50,000 or HazMat violation detected. Generates Markdown reasoning logs.

### Agent 6 — ESG & Carbon Emissions Engine
Calculates CO₂e per ton-km across modal paths. Returns sustainability grade (A–F) and % vs baseline.

### Agent 7 — Predictive Forecast Agent
48-hour ahead congestion probability forecast per node using historical bottleneck time-series. Feeds proactive preemptive reroutes.

---

## 🗄️ Database Schema (Supabase)

### disruption_events
```sql
CREATE TABLE public.disruption_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id VARCHAR(50) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    affected_node VARCHAR(50),
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### active_routes
```sql
CREATE TABLE public.active_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id VARCHAR(50) UNIQUE NOT NULL,
    cargo_id VARCHAR(50) NOT NULL,
    origin VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    current_status VARCHAR(30) NOT NULL,
    polyline_geojson JSONB NOT NULL,
    cost_usd NUMERIC(12, 2) NOT NULL,
    co2_emissions_kg NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### blockchain_audit
```sql
CREATE TABLE public.blockchain_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    cargo_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    financial_impact_usd NUMERIC(12, 2) NOT NULL,
    reasoning_markdown TEXT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

> Realtime subscriptions enabled on all three tables.

---

## 🧑‍💼 Team Roles

| Role | Responsibility |
|---|---|
| **Lead Architect** | System design, agent protocols, LangGraph orchestration |
| **AI/ML Engineer** | PyTorch RL model, Agents 2 & 7 |
| **Backend Engineer** | FastAPI, Pydantic schemas, Supabase integration |
| **Blockchain Developer** | Polygon contracts, Web3.py / Ethers.js |
| **Frontend Engineer** | Next.js dashboard, deck.gl 3D map, HITL modals |
| **DevOps / Infra** | Supabase setup, Realtime config, deployment |

---

## 📁 Project Structure

```
TeamScalar/
├── backend/
│   ├── agents/           # All 9 agents
│   ├── api/              # FastAPI routes
│   ├── graph/            # NetworkX supply chain graph
│   ├── blockchain/       # Polygon client & contracts
│   └── schemas/          # Pydantic models
├── frontend/
│   ├── app/
│   │   ├── command-center/     # Page 1
│   │   ├── port-operations/    # Page 2
│   │   ├── mobile-scanner/     # Page 3
│   │   ├── audit-explorer/     # Page 4
│   │   └── chaos-panel/        # Page 5
│   ├── components/
│   └── store/                  # Zustand
└── supabase/
    └── migrations/
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/srujanvaidya/TeamScalar
cd TeamScalar

# Backend
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev
```

---

## ⚖️ License

MIT — Built for HOP 2026 // Scalar Hackathon.
