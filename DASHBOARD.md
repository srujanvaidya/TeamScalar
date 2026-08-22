# 🖥️ Dashboard Architecture — Supply Chain Disruption Control Agent

> Full specification of the 5-page dashboard UI: layout, components, interactions, data sources, and visual design for every page.

---

## Design System

| Token | Value |
|---|---|
| **Primary Background** | `#050a1a` (deep navy black) |
| **Surface** | `#0d1630` (dark blue card) |
| **Accent — Cyan** | `#00d4ff` (primary interactive) |
| **Accent — Green** | `#00ff9f` (success / safe route) |
| **Accent — Red** | `#ff3b5c` (critical alert / disruption) |
| **Accent — Amber** | `#f7b731` (warning / elevated risk) |
| **Text Primary** | `#e8f4f8` |
| **Text Muted** | `#5e7fa6` |
| **Font** | Inter (Google Fonts) — weights 400, 500, 600, 700 |
| **Border Radius** | `12px` cards, `8px` inputs, `24px` badges |
| **Glassmorphism** | `backdrop-filter: blur(16px)` + `rgba(13, 22, 48, 0.7)` |

---

## Navigation

Fixed left sidebar, 64px wide collapsed / 240px expanded on hover.

| Icon | Label | Route |
|---|---|---|
| 🌐 | Command Center | `/command-center` |
| 🚢 | Port Operations | `/port-operations` |
| 📱 | Mobile Scanner | `/mobile-scanner` |
| ⛓️ | Audit Explorer | `/audit-explorer` |
| ⚡ | Chaos Panel | `/chaos-panel` |

Global header bar: System status pill (ALL SYSTEMS NOMINAL / DISRUPTION ACTIVE), current UTC time, active agent count badge.

---

## Page 1: Global Logistics Command Center (`/command-center`)

**Purpose:** The primary mission control view. Full situational awareness of the entire global supply chain in one screen.

---

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: [DISRUPTION ACTIVE ●] [Agents Running: 4/9] [UTC 14:23:01]│
├──────────────────────────────────────────────────────────┬──────────┤
│                                                          │ TRIAGE   │
│                                                          │  FEED    │
│              FULL-SCREEN 3D MAPBOX MAP                   │ (right   │
│              + deck.gl Arc / Scatter / Heat layers        │ panel)   │
│                                                          │          │
│  [ESG Cards — top left overlay]                          │          │
│                                                          │          │
│                                                          │          │
├──────────────────────────────────────────────────────────┴──────────┤
│              ROUTE COMPARISON MATRIX TABLE (bottom panel)           │
└─────────────────────────────────────────────────────────────────────┘
     [HITL MODAL overlay when Agent 5 escalates — full-screen dim]
```

---

### Primary Visual: 3D Mapbox GL JS + deck.gl

**Map Style:** `mapbox://styles/mapbox/dark-v11` (dark base)  
**Pitch:** 45° for 3D perspective  
**Bearing:** Slight rotation on load, user-draggable

#### ArcLayer — Animated Shipment Routes
- Source: `active_routes` Supabase table (Realtime subscription)
- `getSourcePosition`: `d => d.start_coords`
- `getTargetPosition`: `d => d.end_coords`
- `getHeight`: Air routes = `8`, others = `1.5`
- Color by transport mode:
  - 🌊 Ocean: `[2, 136, 209]` (blue)
  - 🚂 Rail: `[56, 142, 60]` (green)
  - ✈️ Air: `[255, 255, 255]` (white)
  - 🚛 Road: `[245, 124, 0]` (orange)
- Animated dash offset for "in transit" feel
- On hover: tooltip showing cargo ID, ETA, cost, CO₂

#### ScatterplotLayer — Hub Nodes
- Normal hub: grey `[150, 150, 150]`, radius 10km
- Disrupted hub: pulsing red `[211, 47, 47]`, radius 50km with CSS radial animation
- Predictive congestion (Agent 7): amber `[247, 183, 49]`, radius 30km

#### HeatmapLayer — Agent 7 Predictive Congestion Zones
- Yellow/Orange gradient clusters showing forecasted 48h congestion probability
- Opacity tied to `predicted_congestion_probability` value
- Updates on Agent 7 output via Supabase Realtime

---

### Top-Left Overlay: ESG Metric Cards (Glassmorphism)
Three floating cards:

| Card | Metric | Source |
|---|---|---|
| 🌿 Carbon Saved | `1,240 kg CO₂e (-34.2%)` | Agent 6 output |
| 💰 Penalty Avoided | `$180,000` | Agent 5 calculation |
| 🏆 Sustainability Grade | `A` | Agent 6 grade |

Cards update live via Realtime subscription.

---

### Top-Right Panel: Live Disruption Triage Feed
- Scrolling vertical feed of incoming disruption events
- Each card: severity badge (color-coded), incident ID, target node, time ago
- Critical events pulse red with vibrate animation
- Click a card → map flies to the affected node and zooms in

---

### Bottom Panel: Route Comparison Matrix Table
Shown when Agent 2 returns candidate routes:

| Route ID | Mode Sequence | Waypoints | Transit Hours | Cost (USD) | CO₂ (kg) | SLA Risk | ESG Grade | Action |
|---|---|---|---|---|---|---|---|---|
| ROUTE_ALT_901 | Ocean→Rail | SHA→CDG→BER | 96h | $12,100 | 980 | LOW | B | Select ▶ |
| ROUTE_ALT_902 ✓ | Rail→Truck | SHA→CHG→WAW→BER | 110h | $14,200 | 620 | LOW | A | Select ▶ |
| ROUTE_ALT_903 | Air→Truck | SHA→FRA→BER | 18h | $48,000 | 3,400 | CRITICAL | F | Select ▶ |

Selected route highlighted in cyan. "Select" button triggers Agent 3 constraint validation.

---

### HITL Sign-Off Modal (Full-Screen Overlay)
Triggered when Agent 5 emits `requires_hitl_approval: true`.

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  HUMAN APPROVAL REQUIRED                                 │
│  Financial Impact: $64,200 | Threshold: $50,000              │
│                                                              │
│  ── Agent 5 Reasoning ──────────────────────────────────── │
│  ### Escalation Summary                                      │
│  - Primary ocean route blocked at **Port of Shanghai**.       │
│  - Alternate rail path selected for 48-hour SLA window.      │
│  - Total cost **$64,200** exceeds $50,000 threshold.         │
│  - Approve to prevent **$180,000 OTIF breach penalty**.      │
│                                                              │
│  Language: [EN ▼]                                            │
│                                                              │
│  [  ✅ APPROVE  ]           [ ❌ REJECT ]                    │
└──────────────────────────────────────────────────────────────┘
```

Background dims to 80% black. Modal slides in from top. Approve button → triggers Agent 4 blockchain write.

---

## Page 2: Port & Terminal Operations Workspace (`/port-operations`)

**Purpose:** Ground-level terminal management. Real-time constraint adjustment by port coordinators.

---

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Port Operations Dashboard                              │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│  TERMINAL BERTH STATUS GRID          │  PARAMETER ADJUSTMENT    │
│  (left 60%)                          │  PANEL (right 40%)       │
│                                      │                          │
│                                      │  Sliders + Inputs        │
│                                      │                          │
├──────────────────────────────────────┴──────────────────────────┤
│  CARRIER SCORECARD TABLE (bottom)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Terminal Berth Status Grid
- Grid of berth cards (e.g., 12 berths per terminal)
- Each card shows: Berth ID, vessel name, status badge
- Status badges:
  - 🟢 **Docked** — vessel actively loading/unloading
  - 🟡 **Anchoring** — waiting in outer harbor
  - 🔴 **Blocked** — crane outage / labor dispute
  - ⚪ **Available** — berth free
- Live update via Supabase Realtime on `port_constraints` table

---

### Parameter Adjustment Panel
Interactive controls that write directly to Supabase `port_constraints`, triggering Agent 0 recalculation:

| Control | Type | Range | Default |
|---|---|---|---|
| Berth Wait Hours | Slider | 0–72h | 4h |
| Daily Demurrage Rate | Number Input | $0–$50,000 | $8,000 |
| Crane Shortage Index | Slider % | 0–100% | 15% |
| Drayage Truck Availability | Slider % | 0–100% | 75% |
| Hazardous Cargo Restrictions | Toggle | ON/OFF | OFF |

**"Push Live Updates to Network"** button — CTA in cyan, full width. Sends PATCH to Supabase and triggers Agent 0 via webhook.

Confirmation toast: *"Port constraints updated. Agent 0 recalculating routes..."*

---

### Carrier Scorecard Table (New Feature)
| Carrier | On-Time % | Rate Volatility | Cancellation Rate | Score | Tier |
|---|---|---|---|---|---|
| Maersk Line | 94% | Low | 1.2% | 9.2/10 | ⭐ Premium |
| MSC | 88% | Medium | 2.8% | 7.6/10 | ✅ Standard |
| Evergreen | 72% | High | 5.1% | 5.3/10 | ⚠️ Watchlist |

---

### Digital Twin QR Code Panel (New Feature)
- After route approval, QR code auto-generates and displays
- Download as PNG button
- QR encodes: `cargo_id`, `route_id`, `approval_timestamp`, `contract_address`

---

## Page 3: Field Cargo Scanner & Mobile Provenance PWA (`/mobile-scanner`)

**Purpose:** Mobile-first view for warehouse handlers and field agents to confirm physical cargo receipt on-chain.

---

### Layout (Mobile-Optimized, 390px width target)

```
┌─────────────────────────────┐
│  📦 CARGO PROVENANCE        │
│  SCANNER                    │
├─────────────────────────────┤
│                             │
│   ████████████████████████  │
│   ██                    ██  │
│   ██   CAMERA VIEWPORT   ██  │
│   ██   [QR scan target]  ██  │
│   ██                    ██  │
│   ████████████████████████  │
│                             │
├─────────────────────────────┤
│  COLD CHAIN TELEMETRY GRAPH │
│  Temperature & Humidity     │
│  [Line chart — last 24h]    │
├─────────────────────────────┤
│  Cargo Info                 │
│  ID: CARGO_2291             │
│  Origin: Shanghai           │
│  Status: In Transit         │
├─────────────────────────────┤
│  [ ✅ Confirm Receipt &     │
│     Sign Handoff ]          │
└─────────────────────────────┘
```

---

### Camera Scanner
- Full-width HTML5 / WebRTC `<video>` viewport
- QR code detection using `jsQR` or `zxing-js` library
- Corner bracket overlay (UI target guides)
- On successful scan: vibration haptic + success beep + cargo details populate below
- Error state: red flash + "QR not recognized" toast

---

### Cold-Chain Telemetry Graph
- Line chart (Recharts or Chart.js) showing:
  - Temperature (°C) — left Y axis, cyan line
  - Humidity (%) — right Y axis, green line
  - X axis — last 24 hours in 1h intervals
- Threshold lines: Temperature alert at 8°C (red dashed), Humidity alert at 80% (amber dashed)
- Data source: mock IoT telemetry endpoint (or Supabase `iot_telemetry` table)
- Breach alert banner if threshold exceeded

---

### Confirm Receipt Button
- Large, full-width green CTA: *"✅ Confirm Physical Receipt & Sign Handoff"*
- Triggers Agent 4 smart contract call (escrow release)
- Loading state: spinner + *"Writing to Polygon blockchain..."*
- **Success State:**
```
┌─────────────────────────────┐
│  ✅ ON-CHAIN VERIFIED        │
│  Transaction Hash:          │
│  0x7f9a1b3c4d5e6f7a...      │
│  [View on Polygonscan ↗]    │
│  Block: 4,829,103           │
│  Network: Polygon Mainnet   │
└─────────────────────────────┘
```
Green full-screen flash, then success card with hash.

---

## Page 4: On-Chain Audit & Compliance Explorer (`/audit-explorer`)

**Purpose:** Enterprise-grade transparency into every AI decision and blockchain transaction.

---

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Blockchain Audit & Compliance Explorer                     │
├────────────────────────────────────────────┬────────────────────────┤
│  LIVE TRANSACTION TABLE (left 65%)          │ TOKEN STATUS PANEL    │
│                                            │ (right 35%)           │
│                                            │                       │
├────────────────────────────────────────────┴────────────────────────┤
│  DISRUPTION HEAT CALENDAR (bottom)                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Blockchain Transaction Table
Real-time table fed by `blockchain_audit` Supabase table (Realtime subscription).

| Timestamp | Cargo ID | Event Type | Cost Impact | Tx Hash | Contract | Status |
|---|---|---|---|---|---|---|
| 14:23:01 UTC | CARGO_2291 | REROUTE_APPROVED | $64,200 | 0x7f9a...8f9a ↗ | 0xbe6E...e8Ae | ✅ VERIFIED |
| 13:58:44 UTC | CARGO_1847 | TOKEN_MINTED | — | 0x3a2b...9f1c ↗ | 0x48B0...4D74 | ✅ VERIFIED |
| 13:41:20 UTC | CARGO_0392 | ESCROW_RELEASED | $18,450 | 0x9d1a...7e22 ↗ | 0xbe6E...e8Ae | ✅ VERIFIED |

- Tx Hash links open Polygonscan in new tab
- Table auto-prepends new rows as Realtime subscription fires
- New rows flash cyan for 2 seconds

**Expandable Row:** Click any row → accordion opens below with:
- Full rendered Markdown from Agent 5's `reasoning_markdown` field
- Raw JSON payload used in the agent decision
- Agent 2 route candidate comparison that was considered

---

### Token Status Panel
```
┌───────────────────────────────┐
│  🪙 CONTAINER TOKEN           │
│  Contract: 0x48B0...4D74      │
│  Network: Polygon             │
│  Total Minted: 2,847          │
│  Active: 341                  │
│  [View on Polygonscan ↗]      │
├───────────────────────────────┤
│  🔒 ESCROW CONTRACT           │
│  Contract: 0xbe6E...e8Ae      │
│  Total Settled: $1.24M        │
│  Pending: $127,400            │
│  [View on Polygonscan ↗]      │
└───────────────────────────────┘
```

---

### Disruption Heat Calendar (New Feature)
- GitHub-contribution-style grid: 52 weeks × 7 days
- Cell color intensity = daily total disruption severity score
  - White → Light amber → Deep red
- Hover tooltip: "Aug 22 — 3 incidents, CRITICAL × 1, HIGH × 2"
- Click a day → table filters to that day's transactions
- Legend: severity scale 0–10+ incidents/day

---

## Page 5: Chaos Engineering & Judge Simulation Panel (`/chaos-panel`)

**Purpose:** Interactive playground for hackathon judges to inject synthetic events and observe the full 9-agent pipeline live.

---

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: ⚡ Chaos Engineering Panel — Judge Simulation Mode         │
├──────────────────────────┬──────────────────────────────────────────┤
│  SYNTHETIC EVENT         │  AGENT STATE MONITOR                    │
│  INJECTION               │  (9 agents, live status badges)         │
│  (left 40%)              │  (right 60%)                            │
│                          │                                         │
│  NL Input Field          │                                         │
│  Preset Buttons          │                                         │
│                          │                                         │
├──────────────────────────┴──────────────────────────────────────────┤
│  LIVE JSON STREAM TERMINAL — Inter-Agent RPC Messages               │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Synthetic Event Injection Panel

**Natural Language Disruption Input (New Feature):**
```
┌─────────────────────────────────────────────────────────┐
│  Describe a disruption in plain English:                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ "Category 5 typhoon approaching Taiwan Strait..." │  │
│  └───────────────────────────────────────────────────┘  │
│  [ 🚨 Inject Disruption ]                               │
└─────────────────────────────────────────────────────────┘
```

**Preset Trigger Buttons:**

| Button | Disruption |
|---|---|
| 🌊 **Typhoon East China Sea** | Inject Category 4 Typhoon at Taiwan Strait. Severity: CRITICAL. Delay: 96h |
| 🚢 **Hormuz Naval Blockade** | Simulate Strait of Hormuz naval blockade. All tanker traffic halted |
| 🚂 **Europe Rail Strike** | Central European rail union strike. Rail corridors DE/PL/CZ blocked |
| ❄️ **Arctic Weather Freeze** | Siberian cold front. Trans-Siberian rail capacity reduced 60% |
| 🏭 **Supplier Shutdown — APAC** | Tier-1 supplier factory shutdown. Shenzhen, 5-day outage |

Each button: dark card with icon, bold disruption title, one-line description, red "Inject" CTA.

---

### Agent State Monitor
9 agent cards arranged in a 3×3 grid. Each card:
```
┌──────────────────────┐
│  Agent 2             │
│  Graph-RL Navigator  │
│  ████████████ 73%    │
│  [PROCESSING]        │
│  Last: 847ms ago     │
└──────────────────────┘
```

Status badge colors:
- ⚫ **IDLE** — grey
- 🔵 **PROCESSING** — cyan pulse
- 🟡 **EXECUTING TOOL CALL** — amber
- 🟢 **DECISION LOCKED** — green
- 🔴 **ERROR** — red

---

### Live JSON Stream Terminal (Agent Communication Log — New Feature)

Monospace terminal panel, dark background, scrolling upward:

```
[14:23:01.412] Agent 0 → Agent 1A   {"task": "parse_news", "raw_text": "Shanghai port labor..."}
[14:23:01.891] Agent 1A → Agent 0   {"incident_id": "INC_8821", "severity": "CRITICAL", ...}
[14:23:02.014] Agent 0 → Agent 2   {"task": "calculate_routes", "blocked_node": "PORT_SHANGHAI_01"}
[14:23:03.219] Agent 2 → Agent 0   {"candidates": [{"route_id": "ROUTE_ALT_902", ...}]}
[14:23:03.301] Agent 0 → Agent 3   {"task": "validate_route", "route_id": "ROUTE_ALT_902"}
...
```

- Each line color-coded by source agent
- Click any line → expand full JSON payload in a side drawer
- **Copy JSON** button on each expanded payload
- "Clear Terminal" button top-right
- Auto-scroll toggle

---

## Global Interactions & Accessibility

- **Keyboard navigation** — all interactive elements focusable
- **Responsive design** — Command Center full-screen on desktop; Mobile Scanner optimized for 390px
- **Loading skeletons** — all data panels show animated skeleton before data loads
- **Error boundaries** — graceful error states for failed agent calls or Supabase timeouts
- **Dark mode only** — enforced globally, matches command center aesthetic
- **Smooth page transitions** — Next.js View Transitions API

---

## Data Flow Summary

```
External Signal / Chaos Panel Input
          │
          ▼
    Supabase disruption_events (INSERT)
          │
          ▼ (Realtime WebSocket)
    Agent 0 Master Orchestrator (FastAPI)
          │
    ┌─────┴─────────────────┐
    ▼                       ▼
  Agent Pipeline          Supabase active_routes (UPDATE)
  (Agents 1A→7)                    │
          │                        ▼ (Realtime)
    Agent 4 Blockchain     Frontend deck.gl Layers
    blockchain_audit       Route Matrix Table
    (INSERT)               ESG Cards
          │                HITL Modal (if triggered)
          ▼ (Realtime)
    Audit Explorer
    Transaction Table
```
