# Autonomous Multi-Agent Disruption Control System

## 1. Team Details

- **Team Name**: Team Scalar
- **Project Title**: Autonomous Multi-Agent Supply Chain Disruption Control & On-Chain Audit Network

---

## 2. Problem Statement in Short

Global supply chains are inherently fragile and vulnerable to catastrophic delays caused by unexpected geopolitical conflicts, severe weather events, labor strikes, and maritime port bottlenecks (such as Suez and Panama Canal blockades). When disruptions occur, traditional logistics systems rely on manual human intervention, disjointed phone/email coordination, and static routing tables. This leads to delayed response times, spiraling demurrage costs, missed SLA deadlines, and lack of verified auditability across multi-carrier networks. The primary challenge is building an autonomous, real-time perception and decision network that can dynamically detect disruptions, evaluate multimodal bypass candidates using dynamic financial and environmental metrics, enforce strict operational constraints, and anchor human-approved rerouting actions on an immutable blockchain ledger.

---

## 3. Understanding of the Problem Statement

Our team focused on addressing the critical bottleneck in real-time supply chain crisis mitigation: **Autonomous Multi-Agent Perception, Dynamic Path Optimization, and Verifiable Human-in-the-Loop Governance**.

Rather than treating rerouting as a static table lookup or a purely manual decision, our analysis identified three mandatory operational pillars:
1. **Real-Time Automated Perception**: Converting unstructured news feeds, weather telemetry, and satellite AIS positional updates into structured disruption events with defined geographic impact radii.
2. **Multimodal Path Optimization**: Calculating dynamic Dijkstra and Bellman value iterations across intermodal transport networks (Ocean Maritime, Rail Freight, Road Trucking, and Express Air Cargo) while factoring in real-world Haversine geographic distances, transit durations, carrier rates, and carbon emissions.
3. **Immutable Provenance & Human Authorization**: Ensuring that high-cost rerouting decisions ($50,000 threshold caps) require Human-in-the-Loop (HITL) authorization while automatically recording cryptographically signed transactions on the Polygon Amoy blockchain ledger for zero-trust auditability.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#050505', 'fontFamily': 'Inter, sans-serif' }}}%%
flowchart TD
    subgraph Perception_Layer [Perception & Ingestion Layer]
        A1[Agent 1A: News Semantic Parser] -->|Unstructured Signal| E1[Disruption Event Extraction]
        A2[Agent 1B: Weather Telemetry] -->|Open-Meteo REST API| E2[Sea State & Wind Evaluation]
    end

    subgraph Optimization_Layer [Graph-RL & Constraint Engine]
        E1 & E2 --> A0[Agent 0: Master Orchestrator]
        A0 -->|Bellman Value Iteration| C1[Multimodal Candidate Routes]
        C1 --> A3_Val[Agent 3: Constraint Validator]
        A3_Val -->|Pydantic Schema Audit| C2[Validated Route Options]
        C2 --> A2_Nav[Agent 2: Graph-RL Navigator]
    end

    subgraph Governance_Layer [Financial Gate & Blockchain Provenance]
        A2_Nav --> A5_Gate[Agent 5: Financial Safeguard]
        A5_Gate -->|Cost > $50k Cap| HITL[Human-in-the-Loop Approval Matrix]
        A5_Gate -->|Cost <= $50k Cap| AUTO[Autonomous Execution Engine]
        HITL -->|Human Approved| A6_Chain[Agent 6: Polygon Amoy Web3 Broadcast]
        AUTO --> A6_Chain
        A6_Chain -->|Signed 0 POL Tx| BLOCKCHAIN[(Polygon Amoy Testnet 80002)]
        A6_Chain -->|Event Record| SUPABASE[(Supabase Ledger)]
    end

    %% Aesthetic Color Palette Styles
    style Perception_Layer fill:#0a0d14,stroke:#06b6d4,stroke-width:2px,color:#ffffff
    style Optimization_Layer fill:#0d0d1a,stroke:#8b5cf6,stroke-width:2px,color:#ffffff
    style Governance_Layer fill:#140a0f,stroke:#f59e0b,stroke-width:2px,color:#ffffff

    classDef perception fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:700
    classDef eventNode fill:#0f766e,stroke:#2dd4bf,stroke-width:2px,color:#ffffff,font-weight:700
    classDef masterNode fill:#6d28d9,stroke:#a78bfa,stroke-width:2px,color:#ffffff,font-weight:800
    classDef optNode fill:#4c1d95,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:700
    classDef gateNode fill:#b45309,stroke:#fbbf24,stroke-width:2px,color:#ffffff,font-weight:800
    classDef hitlNode fill:#be123c,stroke:#fb7185,stroke-width:2px,color:#ffffff,font-weight:800
    classDef autoNode fill:#15803d,stroke:#4ade80,stroke-width:2px,color:#ffffff,font-weight:800
    classDef web3Node fill:#831843,stroke:#f472b6,stroke-width:2px,color:#ffffff,font-weight:800
    classDef dbNode fill:#1e293b,stroke:#94a3b8,stroke-width:2px,color:#ffffff,font-weight:700

    class A1,A2 perception
    class E1,E2 eventNode
    class A0 masterNode
    class A2_Nav,C1,A3_Val,C2 optNode
    class A5_Gate gateNode
    class HITL hitlNode
    class AUTO autoNode
    class A6_Chain web3Node
    class BLOCKCHAIN,SUPABASE dbNode
```

---

## 4. Idea Summary

Our solution is an **Autonomous Multi-Agent Disruption Control Network**. It replaces manual logistics management with a coordinated fleet of specialized AI and rule-based micro-agents operating in a distributed decision funnel.

Key components of the solution include:
- **Perception Agents**: Continuously monitor real-world news feeds and REST telemetry APIs to detect port closures, strikes, and marine storms.
- **Pathfinder Engine**: Uses graph topology algorithms (`networkx.DiGraph`) combined with Bellman reward functions to dynamically penalize blocked ocean corridors and generate valid intermodal bypass routes.
- **Constraint Validator**: Verifies warehouse storage capacity, carrier spot rates, and HazMat corridor regulations before presenting alternative paths.
- **Financial Risk Gate**: Enforces enterprise spending limits, triggering interactive Human-in-the-Loop approval when costs breach predefined thresholds.
- **On-Chain Audit Anchor**: Cryptographically anchors every reroute decision onto the Polygon Amoy testnet using Web3 transaction signing, producing immutable transaction receipts.

What makes this system unique is its hybrid governance architecture: it achieves high-speed autonomous execution for minor routing adjustments while enforcing strict, cryptographically verified human control over high-value enterprise logistics decisions.

---

## 5. Proposed Solution

### System Architecture and Workflow

The system operates as an end-to-end multi-agent pipeline executing across five synchronized stages:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'primaryColor': '#18181b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#3b82f6', 'lineColor': '#06b6d4', 'secondaryColor': '#09090b', 'tertiaryColor': '#18181b', 'actorLineColor': '#52525b', 'labelTextColor': '#f4f4f5' }}}%%
sequenceDiagram
    autonumber
    participant Sensor as External News / Telemetry
    participant Parser as Agent 1A & 1B (Perception)
    participant Orchestrator as Agent 0 (Master Orchestrator)
    participant Navigator as Agent 2 (Graph-RL Navigator)
    participant Validator as Agent 3 & 5 (Constraints & Risk)
    participant UI as Command Center UI
    participant Web3 as Agent 6 (Polygon Amoy Web3)

    Sensor->>Parser: Ingest news RSS / Weather REST API payload
    Parser->>Orchestrator: Emit structured Disruption Event
    Orchestrator->>Navigator: Request multimodal bypass routes
    Navigator->>Validator: Pass candidate paths for validation
    Validator-->>Orchestrator: Return verified low-risk route options
    Orchestrator->>UI: Render live map & Human Approval Matrix
    UI->>Web3: User clicks "Approve & Execute Reroute"
    Web3->>Web3: Sign 0 POL Web3 Tx with Private Key
    Web3-->>UI: Return Polygon Tx Hash & Block Confirmation
```

### Core Features

1. **Live Spatial Telemetry Map**: Interactive Leaflet map displaying active cargo positions, realistic ocean shipping lanes, trade congestion heatmaps, active danger zones, and origin/destination markers.
2. **Dynamic Mathematical Calculation Engine**: Eliminates static lookup tables by computing real-time transit durations, base freight costs, and carbon emissions using Haversine geographic distance formulas across maritime, rail, road, and air transport modes.
3. **Interactive Human Approval Matrix**: Presents operational trade-offs (Baseline vs Intermodal Rail vs Express Air) with dynamic cost/time savings metrics.
4. **On-Chain Audit Explorer**: Provides full provenance verification for every container reroute event, displaying Polygon block numbers, contract addresses, and live PolygonScan explorer links.

---

## 6. MVP Description

The Minimum Viable Product (MVP) delivers a complete, fully functional command center demonstrating automated disruption perception, dynamic rerouting, and on-chain verification.

### Core Features Included in the MVP

- **30 Global Shipping Routes Dataset**: Pre-populated with 90 worldwide port coordinates covering major trade corridors (Transpacific, Asia-Europe, Transatlantic, Intra-Asia, Middle East, and South America).
- **FastAPI Microservice Backend**: Unified Python backend serving perception, navigation, validation, and Web3 transaction endpoints (`/api/v1/*`).
- **Next.js Command Center Interface**: High-performance dashboard with dark-mode spatial map rendering, multi-vessel dropdown selection, and real-time metric cards.
- **Live Polygon Amoy Web3 Broadcasting**: Direct integration with Python `web3.py` for signing and broadcasting transactions to contract `0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae`.
- **Supabase Event Persistence**: Real-time logging of container event histories and transaction receipts.

### User Flow Demonstrated in the MVP

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#050505', 'fontFamily': 'Inter, sans-serif' }}}%%
graph LR
    Step1[1. Select Vessel / Cargo ID] --> Step2[2. View Bottleneck Alert on Map]
    Step2 --> Step3[3. Compare Alternate Bypass Routes]
    Step3 --> Step4[4. Click Approve & Execute Reroute]
    Step4 --> Step5[5. View Live Polygon Block Confirmation]

    classDef s1 fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#ffffff,font-weight:700
    classDef s2 fill:#450a0a,stroke:#f87171,stroke-width:2px,color:#ffffff,font-weight:700
    classDef s3 fill:#14532d,stroke:#4ade80,stroke-width:2px,color:#ffffff,font-weight:700
    classDef s4 fill:#701a75,stroke:#f0abfc,stroke-width:2px,color:#ffffff,font-weight:800
    classDef s5 fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:800

    class Step1 s1
    class Step2 s2
    class Step3 s3
    class Step4 s4
    class Step5 s5
```

### Exclusions in Current Version

- Physical IoT sensor hardware integration (simulated via REST telemetry).
- Live fiat bank payment clearing APIs (handled via financial risk gate policies).

---

## 7. Impact and Feasibility

### Technical Feasibility

The system is built on proven enterprise technologies:
- **Frontend**: Next.js 16, TypeScript, Leaflet spatial mapping, Tailwind CSS.
- **Backend**: Python 3.13, FastAPI, NetworkX graph library, Pydantic data validation.
- **Blockchain**: Web3.py, Polygon Amoy Testnet (Chain ID 80002), Supabase PostgreSQL.

All components have been fully integrated, tested, and validated with zero compilation errors and fast execution times.

### Operational Impact

- **Response Time Reduction**: Cuts emergency rerouting decision time from hours to seconds.
- **Cost Minimization**: Avoids port demurrage penalties ($1,500/day per container) by proactively routing cargo around congested chokepoints.
- **Environmental Efficiency**: Optimizes modal choices to minimize total CO2 emissions during detour routes.
- **Complete Auditability**: Eliminates multi-carrier disputes by maintaining an immutable, cryptographically verified record of all rerouting decisions on-chain.

---

## 8. Summary Checklist Verification

- [x] Final document strictly under 3 pages maximum length.
- [x] Clear breakdown of problem statement, understanding, proposed solution, and MVP.
- [x] Inclusion of detailed Mermaid process and architecture diagrams.
- [x] Zero emojis used throughout the entire document.
- [x] Publication-grade formatting in standard Markdown (`.md`).
