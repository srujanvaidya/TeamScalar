# 🚀 Features — Supply Chain Disruption Control Agent

> Complete feature catalogue: current core features from the architecture spec + proposed new features to supercharge the hackathon demo.

---

## ✅ Core Features (Planned / In Scope)

### 🧠 Multi-Agent AI Orchestration
- **9-Agent autonomous network** orchestrated by a central LangGraph/CrewAI state machine
- **Master Orchestrator (Agent 0)** delegates tasks, sequences agents, and propagates state in real time
- **Agent health monitoring** with live status badges: Idle → Processing → Executing Tool Call → Decision Locked
- **Parallel agent execution** for Agents 2 (Graph-RL), 3 (Constraint Validator), and 6 (ESG) to minimize latency

### 🔍 Disruption Detection (Agents 1A, 1B, 7)
- **Real-time news & sentiment parsing** — converts unstructured text (news APIs, RSS feeds, social signals) into structured incident JSON
- **AIS vessel telemetry ingestion** — tracks vessel ID, coordinates, heading, sea state
- **Weather radar integration** — processes storm grids, typhoon categories, wind speeds
- **48-hour predictive congestion forecast** — ML time-series model per port node with preemptive reroute triggers
- Disruption categories: `LABOR_STRIKE`, `WEATHER_ANOMALY`, `GEOPOLITICAL_BLOCKADE`, `SUPPLIER_DOWNTIME`, `PORT_CONGESTION`
- Severity levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

### 🗺️ Graph-Based Multi-Modal Routing (Agent 2)
- Supply chain modelled as a **directed weighted graph G=(V,E)** using NetworkX
- Nodes: ports, warehouses, distribution hubs, rail heads
- Edges: sea lanes, road corridors, rail freight lines, air cargo lanes
- **Dynamic edge weight** = Transit Time + Freight Cost + Risk Penalty → ∞ when blocked
- **Dijkstra / A* pathfinding** fused with **PyTorch RL policy** for optimal route selection
- Returns multiple ranked candidate routes per disruption event
- **Multi-modal sequencing**: `OCEAN_FREIGHT`, `RAIL_FREIGHT`, `ROAD_TRUCK`, `AIR_CARGO`

### ✅ Constraint Validation (Agent 3)
- Live carrier spot-rate confirmation via REST tool calls
- Warehouse inventory availability check per waypoint
- **HazMat regulatory compliance** per transit corridor
- SLA breach risk assessment: `LOW`, `MEDIUM`, `HIGH`
- Full Pydantic-validated schema for every tool call result

### 💰 Financial Guardrails & Human-in-the-Loop (Agent 5)
- **Automatic HITL escalation** when cost impact > $50,000
- HazMat exception override requiring manual sign-off
- AI-generated **Markdown reasoning log** explaining the escalation rationale
- Dashboard modal overlay for coordinator Approve/Reject with one click
- Full audit trail of every HITL decision

### 🌿 ESG & Carbon Tracking (Agent 6)
- **CO₂e emissions calculation** per ton-kilometer per transport mode
- Emissions vs baseline comparison (% delta shown on dashboard)
- **Sustainability grade A–F** per route candidate
- Carbon cost factored into route ranking alongside financial cost

### ⛓️ Blockchain Provenance (Agent 4)
- **Polygon POS EVM** smart contract integration (Testnet + Mainnet)
- **ERC-721/1155 Digital Container Twin** minting per cargo shipment
- **Automated Escrow Settlement** triggered on physical cargo receipt (QR scan) or auto-approval
- Every rerouting decision hashed and written on-chain for immutable audit
- Polygonscan-linked transaction hashes in the UI
- Smart contract events trigger Supabase webhook → Agent 0 real-time state update

### 📡 Real-Time Dashboard Reactivity
- **Supabase Realtime WebSocket subscriptions** on all core tables
- Zero page reloads — deck.gl 3D layers update live as agent decisions propagate
- **Zustand global state store** in Next.js for predictable UI reactivity
- Sub-second latency from AI decision to map visualization update

### 🗄️ Supabase Database
- `disruption_events` — live incident ingestion log
- `active_routes` — current route state with GeoJSON polylines
- `blockchain_audit` — immutable on-chain ledger mirror
- Realtime subscriptions enabled on all tables

---

## 🌟 New Features — Proposed Enhancements

These are high-impact additions recommended to elevate the project beyond the core spec.

---

### 🆕 Feature 1: Digital Cargo Twin QR Code Generator
**Why:** Gives the demo a tangible, physical element judges can interact with.
- Auto-generate printable QR codes per cargo batch at time of route approval
- QR encodes: cargo ID, route ID, agent decision timestamp, contract address
- Scanning the QR on the `/mobile-scanner` page triggers the Agent 4 blockchain receipt confirmation
- Display QR on `/port-operations` page with download button

---

### 🆕 Feature 2: Live Natural Language Disruption Input
**Why:** Makes the system accessible and demo-friendly — judges can type a disruption in plain English.
- Free-text input field on `/chaos-panel`: *"Typhoon category 5 heading toward Taiwan Strait, expected landfall in 18 hours"*
- Agent 1A parses the text, infers `target_node`, `severity_rating`, `estimated_delay_hours`
- Feeds directly into Agent 0 with a single NLP → structured JSON conversion step
- Reduces demo friction dramatically vs. requiring pre-formatted JSON inputs

---

### 🆕 Feature 3: Route Cost vs. Carbon Trade-off Optimizer
**Why:** Enterprises increasingly mandate sustainability alongside cost efficiency.
- Slider on the Command Center: "Prioritize Cost ←→ Prioritize Carbon"
- Agent 2's route ranking dynamically reweights based on the slider position
- Routes re-sort in real time on the Route Comparison Matrix Table
- ESG grade updates live in the sidebar metric cards
- Stores user preference in Zustand and persists to Supabase `user_preferences` table

---

### 🆕 Feature 4: Disruption Heat Calendar (Historical View)
**Why:** Shows long-term operational intelligence, not just reactive response.
- GitHub-contribution-style heat calendar on `/audit-explorer`
- Each cell = one day; color intensity = total disruption severity score
- Click a day to drill down into all incidents, reroutes, and blockchain transactions for that date
- Powered by querying `disruption_events` with daily aggregation
- Highlights seasonality (e.g., typhoon season, Chinese New Year port closures)

---

### 🆕 Feature 5: Carrier Scorecard & Reliability Rating
**Why:** Adds procurement intelligence on top of pure routing.
- Track each carrier's on-time performance, rate volatility, and cancellation frequency across all reroutes
- Ranked leaderboard table on `/port-operations` page
- Agent 3 penalises low-scored carriers in its spot-rate validation (Pydantic `carrier_score` field)
- Ties carrier quality into route selection weight alongside cost and transit time

---

### 🆕 Feature 6: Multi-Language Alert Broadcasting
**Why:** Global supply chain teams span multiple languages.
- When Agent 5 generates an escalation alert, auto-translate the reasoning Markdown into: English, Mandarin, German, Japanese, Spanish
- Dropdown language selector on the HITL sign-off modal
- Uses a lightweight translation API call within Agent 5's output pipeline
- Demonstrates global-readiness of the platform

---

### 🆕 Feature 7: SLA Penalty Financial Simulator
**Why:** Makes the financial stakes of rerouting decisions viscerally clear to judges.
- Real-time counter on the Command Center sidebar
- Shows: `Estimated OTIF Penalty Avoided` in $$ based on the delta between old blocked route and new approved route
- Formula: `Penalty Avoided = Daily Penalty Rate × (Original Delay Hours − New Route Delay Hours) / 24`
- Updates every time Agent 2 proposes a new route candidate
- Large, bold green number — maximum demo impact

---

### 🆕 Feature 8: Agent Communication Log (Explainable AI Trace)
**Why:** Judges love seeing the "AI thinking" — it's the core differentiator vs. a regular dashboard.
- Collapsible panel on `/chaos-panel` showing a **live step-by-step execution trace**
- Each message in the trace is styled as a chat bubble: `[Agent 0 → Agent 2]: "Calculate alternate routes for PORT_SHANGHAI_01 blockade"`
- Color-coded by agent identity
- Full JSON payload expandable on each message
- Timestamps and latency per hop displayed

---

### 🆕 Feature 9: Webhook Simulator for External ERP Integration
**Why:** Enterprise buyers care about integrations.
- `/api/v1/webhook/simulate` endpoint in FastAPI
- Accepts standardized payload from SAP S/4HANA, Oracle TMS, or Blue Yonder formats (mock)
- Auto-maps external event format to internal `DisruptionEvent` Pydantic schema
- Triggers the full 9-agent pipeline exactly as if it came from a real ERP
- Show the integration endpoint on the chaos panel for demo purposes

---

### 🆕 Feature 10: Agent Performance Analytics Dashboard Tile
**Why:** Shows operational maturity — the system monitors itself.
- Metrics tile on Command Center: Average response time per agent, success/failure rate, HITL escalation rate (%)
- Stored in a `agent_metrics` Supabase table (auto-populated after each run)
- Sparkline charts for last 24h agent activity
- Highlights bottleneck agents for continuous improvement

---

## 📊 Feature Priority Matrix

| Feature | Impact | Effort | Priority |
|---|---|---|---|
| NL Disruption Input | 🔥 Very High | Low | **P0 — Ship First** |
| SLA Penalty Simulator | 🔥 Very High | Low | **P0 — Ship First** |
| Agent Comms Log | 🔥 Very High | Medium | **P0 — Ship First** |
| QR Digital Twin Generator | High | Medium | P1 |
| Cost vs Carbon Optimizer | High | Medium | P1 |
| Carrier Scorecard | Medium | Medium | P2 |
| Disruption Heat Calendar | Medium | Low | P2 |
| Multi-Language Alerts | Medium | Low | P2 |
| Webhook ERP Simulator | Medium | High | P3 |
| Agent Performance Analytics | Low | High | P3 |

---

## 🏁 Demo Flow — Feature Sequence for Pitch

1. Open **Command Center** → show live global route arcs on 3D map
2. Go to **Chaos Panel** → type natural language disruption → watch agents cascade
3. HITL modal fires → Approve the reroute → see SLA Penalty Avoided counter jump
4. Scan QR on **Mobile Scanner** → blockchain receipt confirmed (green screen + tx hash)
5. Open **Audit Explorer** → show on-chain immutable record with Agent 5 reasoning
6. Toggle the Cost ↔ Carbon slider → watch routes re-sort in real time
