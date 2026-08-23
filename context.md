# Project Context & Deployment Guide: Railway.app

## 1. Project Overview

**Project Name**: Autonomous Multi-Agent Supply Chain Disruption Control & On-Chain Audit Network  
**Repository**: `https://github.com/srujanvaidya/TeamScalar` (Branch: `main`)  
**Stack**:
- **Frontend**: Next.js 16 (App Router, Turbopack, Tailwind CSS, Leaflet Maps, TypeScript)
- **Backend Microservices**: Python 3.13, FastAPI, Uvicorn, NetworkX, Pydantic v2
- **Blockchain**: Web3.py, Polygon Amoy Testnet (Chain ID 80002), Smart Contract `0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae`
- **Database**: Supabase Cloud PostgreSQL (`container_events` table) & Local `backend/data/shipments.json`

---

## 2. Directory Structure & Key Files

```
TeamScalar/
├── README.md                      # Official Submission & Architecture Documentation
├── requirements.txt               # Python backend dependencies (fastapi, uvicorn, networkx, pydantic, web3, httpx, supabase)
├── main.py                        # Unified FastAPI Microservice Server (Port 8000)
├── agent_2_navigator.py           # Agent 2: Graph-RL Pathfinder Engine & Bellman Value Iteration
├── agent_3_validator.py           # Agent 3: Constraint Validator & Pydantic Schema Auditor
├── brutal.md                      # Full Technical Audit Report & Scores
├── context.md                     # Deployment Context & Prompt for Gemini
├── backend/
│   └── data/
│       └── shipments.json         # Master 30 shipping routes dataset (90 global ports)
├── blockchain/
│   ├── config.py                  # Polygon Amoy RPC & Supabase config
│   ├── hash_utils.py              # SHA-256 event hashing
│   ├── polygon_anchor.py          # 0 POL Web3 transaction sender
│   ├── quick_anchor.py           # Fast CLI Web3 transaction trigger
│   ├── agent_reroute.py           # Full provenance recording script
│   └── supabase_ops.py            # Supabase container_events CRUD operations
├── src/
│   ├── agents/                    # Core Micro-Agent Implementations (Agents 0, 1A, 1B, 5, 6)
│   ├── blockchain/                # Bridge Adapters
│   ├── contracts/                 # Canonical Master Node Normalizer
│   ├── data/                      # Spatial Port Registry
│   ├── llm/                       # LLM Clients (Gemini & Mock)
│   ├── tools/                     # Enterprise Carrier Rates & Inventory Allocators
│   └── utils/                     # Dynamic Haversine Calculation Engines
└── frontend/
    ├── package.json               # Next.js 16 dependencies
    ├── next.config.ts             # Next.js config
    ├── lib/                       # Supabase & Dynamic Calculators
    ├── store/                     # Zustand Global State
    ├── components/
    │   ├── WorldMap.tsx           # Leaflet Spatial Telemetry Map & Route Polylines
    │   ├── HITLModal.tsx          # Human-in-the-Loop Approval Modal
    │   └── AgentFunnelModal.tsx   # Multi-Agent Execution Funnel
    └── app/
        ├── page.tsx               # Authentication & Landing Page
        ├── command-center/        # Main Logistics Command Center Dashboard
        ├── audit-explorer/        # On-Chain Provenance Audit Explorer
        ├── workflow/              # Live Multi-Agent Process Funnel
        ├── chaos-panel/           # Disruption Injection Panel
        ├── mobile-scanner/        # QR/Barcode Container Scanner
        └── api/
            ├── shipments/         # Proxy to backend/data/shipments.json
            └── blockchain/reroute/# Next.js route calling quick_anchor.py
```

---

## 3. Environment Variables Required

### Railway Backend Service (FastAPI)
```env
SUPABASE_URL=https://palvwjxfasrwvstbccld.supabase.co
SUPABASE_KEY=<YOUR_SUPABASE_SECRET_KEY>
RPC_URL=https://rpc-amoy.polygon.technology/
OWNER_PRIVATE_KEY=<YOUR_POLYGON_PRIVATE_KEY>
```

### Railway Frontend Service (Next.js)
```env
NEXT_PUBLIC_SUPABASE_URL=https://palvwjxfasrwvstbccld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_BACKEND_URL=https://${RAILWAY_BACKEND_SERVICE_URL}
```

---

## 4. Prompt for Gemini (Copy-Paste Prompt below into Gemini)

```text
PROMPT FOR GEMINI AI:

"Hi Gemini! I am deploying my full-stack Autonomous Multi-Agent Supply Chain Disruption Control system on Railway.app. 

Here is the exact project architecture and repository structure:

Project Name: TeamScalar (GitHub: https://github.com/srujanvaidya/TeamScalar, Branch: main)

Repository Layout:
1. Python FastAPI Backend:
   - Root directory contains main.py, requirements.txt, agent_2_navigator.py, agent_3_validator.py, blockchain/ directory, and backend/data/shipments.json.
   - Microservice runs Uvicorn on FastAPI (Port 8000).
   - Dependencies in requirements.txt: fastapi, uvicorn, networkx, pydantic, web3, httpx, supabase, python-dotenv.

2. Next.js 16 Frontend:
   - Located in the subfolder `/frontend`.
   - Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Leaflet spatial mapping.
   - Dependencies in `frontend/package.json`.

3. Database & Blockchain:
   - Database: Supabase Cloud PostgreSQL (https://palvwjxfasrwvstbccld.supabase.co).
   - Blockchain: Polygon Amoy Testnet (Chain ID 80002).

Please provide a clear, beginner-friendly, step-by-step click-by-click guide to deploy this repository on Railway.app:
- Service 1: How to deploy the Python FastAPI Backend service on Railway (Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT).
- Service 2: How to deploy the Next.js Frontend service from the `/frontend` subfolder on Railway.
- How to connect the environment variables and link the Next.js frontend to the live Railway backend URL.
- How to verify that the live deployed URL is fully working."
```
