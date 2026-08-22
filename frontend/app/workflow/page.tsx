'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  Cpu, Database, ShieldCheck, Activity, Layers, Lock, 
  Sliders, Link2, Grid, Hand, MousePointer,
  X
} from 'lucide-react';

type NodeStatus = 'idle' | 'executing' | 'completed' | 'approval_required';

type N8nNode = {
  id: string;
  stageLabel: string;
  title: string;
  subtitle: string;
  icon: any;
  status: NodeStatus;
  x: number;
  y: number;
  badgeText: string;
  stats: { inputs: number; processed: number; outputs: number; latencyMs: number };
  inputPayload: Record<string, any>;
  reasoning: string[];
  toolsInvoked: string[];
  outputPayload: Record<string, any>;
};

type Connection = {
  fromId: string;
  toId: string;
  label: string;
};

// Horizontal 2D Node Graph Layout (Left-to-Right Pipeline Flow)
const INITIAL_N8N_NODES: N8nNode[] = [
  {
    id: 'agent_0',
    stageLabel: 'STAGE 01',
    title: 'Agent 0: Master Orchestrator',
    subtitle: 'Initializing Mission Context & Data',
    icon: Cpu,
    status: 'completed',
    x: 60,
    y: 220,
    badgeText: 'Completed',
    stats: { inputs: 1, processed: 1, outputs: 2, latencyMs: 12 },
    inputPayload: {
      container_id: 'CNTR-SHA-BOM-9921',
      origin_node: 'PORT_SHANGHAI_01',
      destination_node: 'PORT_ROTTERDAM_02',
      cargo_type: 'ELECTRONICS',
      is_hazmat: false,
      baseline_cost_usd: 42000.0,
      customer_tier: 'TIER_1_VIP',
      sla_deadline_epoch: 1787349283
    },
    reasoning: [
      'Initialized DAG pipeline execution for container CNTR-SHA-BOM-9921.',
      'Validated baseline freight cost: $42,000.00 USD.',
      'Registered default corridor path: PORT_SHANGHAI_01 ➔ CORRIDOR_TAIWAN_STRAIT ➔ PORT_ROTTERDAM_02.',
      'Triggered Stage 02 Threat Perception microservices (Agent 1A & 1B).'
    ],
    toolsInvoked: [
      'OrchestratorContextValidator.verify_schema()',
      'GlobalPortRegistry.resolve_coordinates("PORT_SHANGHAI_01")'
    ],
    outputPayload: {
      shipment_id: 'CNTR-SHA-BOM-9921',
      origin: 'PORT_SHANGHAI_01',
      destination: 'PORT_ROTTERDAM_02',
      baseline_cost_usd: 42000.0,
      active_corridor: ['PORT_SHANGHAI_01', 'CORRIDOR_TAIWAN_STRAIT', 'PORT_ROTTERDAM_02']
    }
  },
  {
    id: 'agent_1a',
    stageLabel: 'STAGE 02A',
    title: 'Agent 1A: News Semantic NLP',
    subtitle: 'Parsing RSS Labor Strike Data',
    icon: Database,
    status: 'completed',
    x: 380,
    y: 90,
    badgeText: 'Completed',
    stats: { inputs: 1, processed: 14, outputs: 1, latencyMs: 85 },
    inputPayload: {
      source_feed: 'RSS_GLOBAL_MARITIME_NEWS',
      target_port: 'PORT_SHANGHAI_01'
    },
    reasoning: [
      'Agent 1A scanned NLP news RSS feed: "Shanghai Port Dockworkers Strike shut down container berths."',
      'Identified critical labor strike threat vector at PORT_SHANGHAI_01.',
      'Constructed Threat Perception Payload for Agent 2 Pathfinder.'
    ],
    toolsInvoked: [
      'NewsSemanticParserAgent.parse_article(rss_feed_text)',
      'ThreatVectorExtractor.extract_entities()'
    ],
    outputPayload: {
      threat_type: 'LABOR_STRIKE',
      severity: 'CRITICAL',
      blocked_node: 'PORT_SHANGHAI_01',
      delay_hours: 48.0
    }
  },
  {
    id: 'agent_1b',
    stageLabel: 'STAGE 02B',
    title: 'Agent 1B: Weather Telemetry',
    subtitle: 'Ingesting AIS & Storm Radar',
    icon: Activity,
    status: 'completed',
    x: 380,
    y: 360,
    badgeText: 'Completed',
    stats: { inputs: 1, processed: 88, outputs: 1, latencyMs: 64 },
    inputPayload: {
      lat: 31.2304,
      lon: 121.4737,
      radius_km: 500
    },
    reasoning: [
      'Agent 1B evaluated Open-Meteo vessel telemetry: Wind 62.0 knots, Wave height 7.5m in Taiwan Strait.',
      'Calculated sea transit penalty multiplier: x3.8 for Maritime vessels.',
      'Forwarded environmental anomaly telemetry to Agent 2 Pathfinder.'
    ],
    toolsInvoked: [
      'WeatherTelemetryAgent.fetch_corridor_weather(lat=31.23, lon=121.47)',
      'AISVesselTracker.get_wave_height_anomaly()'
    ],
    outputPayload: {
      wave_height_m: 7.5,
      wind_speed_knots: 62.0,
      sea_transit_penalty_multiplier: 3.8
    }
  },
  {
    id: 'agent_2',
    stageLabel: 'STAGE 03',
    title: 'Agent 2: Multimodal Pathfinder',
    subtitle: 'Calculating NetworkX Dijkstra Bypass',
    icon: Layers,
    status: 'completed',
    x: 700,
    y: 220,
    badgeText: 'Completed',
    stats: { inputs: 2, processed: 16, outputs: 2, latencyMs: 142 },
    inputPayload: {
      origin: 'PORT_SHANGHAI_01',
      destination: 'PORT_ROTTERDAM_02',
      blocked_nodes: ['PORT_SHANGHAI_01'],
      max_candidates: 2
    },
    reasoning: [
      'Ingested graph topology G=(V,E) with 16 nodes and weighted multimodal edges.',
      'Set weight W(e) -> infinity for blocked node PORT_SHANGHAI_01.',
      'Executed networkx.shortest_simple_paths(g, origin, destination, weight="weight").',
      'Candidate 1: Intermodal Rail via Chengdu & Warsaw (110.5h, $18,450 USD).',
      'Candidate 2: Express Air Freight via Frankfurt (12.0h, $42,000 USD).'
    ],
    toolsInvoked: [
      'GraphRLNavigator.calculate_candidates(origin, destination, blocked_nodes)',
      'networkx.shortest_simple_paths()'
    ],
    outputPayload: {
      candidates: [
        {
          route_id: 'ROUTE_ALT_901',
          modal_sequence: ['ROAD_TRUCK', 'RAIL_FREIGHT', 'ROAD_TRUCK'],
          waypoints: ['HUB_SHANGHAI', 'RAIL_CHENGDU', 'HUB_WARSAW', 'DIST_BERLIN'],
          estimated_transit_hours: 110.5,
          base_freight_cost_usd: 18450.0
        },
        {
          route_id: 'ROUTE_ALT_AIR',
          modal_sequence: ['AIR_FREIGHT', 'ROAD_TRUCK'],
          waypoints: ['PORT_SHANGHAI_01', 'HUB_FRANKFURT_01', 'PORT_ROTTERDAM_02'],
          estimated_transit_hours: 12.0,
          base_freight_cost_usd: 42000.0
        }
      ]
    }
  },
  {
    id: 'agent_3',
    stageLabel: 'STAGE 04',
    title: 'Agent 3: Policy & SLA Validator',
    subtitle: 'Ensuring Data & Inventory Accuracy',
    icon: ShieldCheck,
    status: 'completed',
    x: 1020,
    y: 220,
    badgeText: 'Completed',
    stats: { inputs: 2, processed: 20, outputs: 1, latencyMs: 98 },
    inputPayload: {
      candidates: ['ROUTE_ALT_901', 'ROUTE_ALT_AIR'],
      cargo_type: 'ELECTRONICS',
      customer_tier: 'TIER_1_VIP'
    },
    reasoning: [
      'Queried warehouse safety stock at WH_SINGAPORE & WH_ROTTERDAM: [PASS] 450 units available.',
      'Verified channel depth & berth quay capacity for intermodal terminals.',
      'Evaluated VIP SLA deadline (1787349283): [PASS] Intermodal transit (110.5h) complies with SLA window.',
      'Forwarded ROUTE_ALT_901 to Stage 05 Financial Safeguard Gate.'
    ],
    toolsInvoked: [
      'ConstraintValidator.check_inventory(node_id="WH_ROTTERDAM")',
      'ConstraintValidator.query_carrier_rate(request)',
      'ConstraintValidator.validate_route(candidate)'
    ],
    outputPayload: {
      validated_route: {
        route_id: 'ROUTE_ALT_901',
        proposed_cost_usd: 50200.0,
        transit_hours: 110.5,
        hazmat_compliant: true,
        sla_compliant: true
      }
    }
  },
  {
    id: 'agent_5',
    stageLabel: 'STAGE 05',
    title: 'Agent 5: Safeguard Gate',
    subtitle: 'Evaluating $50,000 Cost Ceiling',
    icon: Cpu,
    status: 'completed',
    x: 1340,
    y: 220,
    badgeText: 'Completed',
    stats: { inputs: 1, processed: 12, outputs: 1, latencyMs: 45 },
    inputPayload: {
      plan_id: 'eval_CNTR-SHA-BOM-9921',
      baseline_cost_usd: 40000.0,
      proposed_cost_usd: 50200.0,
      hazmat_compliant: true,
      sla_deadline_breached: false
    },
    reasoning: [
      'Calculated financial exposure cost delta: $50,200 - $40,000 = +$10,200 USD.',
      'Evaluated against maximum financial threshold ceiling ($50,000 USD): [PASS] Within allowable tolerance.',
      'Verified HazMat Class 3 regulation compliance: [PASS] Non-flammable cargo.',
      'Decision output: AUTO_APPROVE. Routing to Stage 06 Polygon Amoy Settlement.'
    ],
    toolsInvoked: [
      'FinancialRiskSafeguardAgent.evaluate_plan(baseline_cost, proposed_cost)',
      'SafeguardRuleEngine.verify_hazmat_compliance()'
    ],
    outputPayload: {
      decision: 'AUTO_APPROVE',
      financial_exposure_usd: 10200.0,
      requires_human_approval: false,
      audit_hash: '75fe47a660f79babadd3f9c97cb603ad9ae002e7d4fbfcddbb7504d5e6d75244'
    }
  },
  {
    id: 'agent_4',
    stageLabel: 'STAGE 06',
    title: 'Agent 4: Polygon Settlement',
    subtitle: 'On-Chain Audit Anchor Complete',
    icon: Lock,
    status: 'completed',
    x: 1660,
    y: 220,
    badgeText: 'Completed',
    stats: { inputs: 1, processed: 55, outputs: 1, latencyMs: 310 },
    inputPayload: {
      shipment_id: 'CNTR-SHA-BOM-9921',
      route_id: 'ROUTE_ALT_901',
      audit_hash: '75fe47a660f79babadd3f9c97cb603ad9ae002e7d4fbfcddbb7504d5e6d75244'
    },
    reasoning: [
      'Generated Keccak256 hash payload combining Agent 0, 1, 2, 3, and 5 audit trails.',
      'Signed transaction with Polygon Amoy wallet owner key.',
      'Emitted state change event on Escrow Contract: 0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae.',
      'Receipt status: CONFIRMED_ON_CHAIN. Block #4829210.'
    ],
    toolsInvoked: [
      'BlockchainBridge.anchor_reroute_decision(ship_id, location, route)',
      'PolygonWeb3Provider.send_raw_transaction()'
    ],
    outputPayload: {
      tx_hash: '0x765eced85371f812d3a869d2b8c32c5a8c9f991ba8ee4c9c57595b6885dbbc27',
      block_number: 4829210,
      polygon_scan_url: 'https://amoy.polygonscan.com/tx/0x765eced85371f812d3a869d2b8c32c5a8c9f991ba8ee4c9c57595b6885dbbc27',
      status: 'CONFIRMED_ON_CHAIN'
    }
  }
];

const CONNECTIONS: Connection[] = [
  { fromId: 'agent_0', toId: 'agent_1a', label: 'News Feed' },
  { fromId: 'agent_0', toId: 'agent_1b', label: 'Telemetry' },
  { fromId: 'agent_1a', toId: 'agent_2', label: 'Threats' },
  { fromId: 'agent_1b', toId: 'agent_2', label: 'Weather' },
  { fromId: 'agent_2', toId: 'agent_3', label: 'Candidates' },
  { fromId: 'agent_3', toId: 'agent_5', label: 'Policy' },
  { fromId: 'agent_5', toId: 'agent_4', label: 'Approved' }
];

const NODE_IDS_IN_ORDER = ['agent_0', 'agent_1a', 'agent_1b', 'agent_2', 'agent_3', 'agent_5', 'agent_4'];

export default function WorkflowPage() {
  const { role } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.push('/');
    }
  }, [role, router]);

  const [nodes, setNodes] = useState<N8nNode[]>(INITIAL_N8N_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'SUMMARY' | 'INPUT' | 'REASONING' | 'TOOLS' | 'OUTPUT' | 'JSON'>('SUMMARY');
  const [executing, setExecuting] = useState(false);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);

  // Mouse Dragging & Canvas Panning State
  const [toolMode, setToolMode] = useState<'select' | 'hand'>('select');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number; panX: number; panY: number }>({
    mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0, panX: 0, panY: 0
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // GUARANTEED 2.5-SECOND PER-STAGE SLOW EXECUTION ANIMATION WITH AUTO-EXPANDING BOXES
  const runLiveSimulation = async (endpoint: string) => {
    if (executing) return;
    setExecuting(true);

    // Reset all nodes to idle status
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle' as NodeStatus, badgeText: 'Idle' })));
    setPanOffset({ x: 0, y: 0 });

    // Non-blocking trigger to backend FastAPI route
    try {
      fetch(`http://localhost:8000${endpoint}`).catch(() => {});
    } catch {}

    // Loop through each node sequentially with a GUARANTEED 2.5s delay & auto-expansion
    for (let i = 0; i < NODE_IDS_IN_ORDER.length; i++) {
      const currentId = NODE_IDS_IN_ORDER[i];
      const currentNode = nodes.find(n => n.id === currentId);

      // Set active executing node ID so its card box automatically expands!
      setActiveExecutingNodeId(currentId);

      // Auto-pan canvas to keep active node centered horizontally
      if (currentNode) {
        if (currentId === 'agent_2' || currentId === 'agent_3') {
          setPanOffset({ x: -300, y: 0 });
        } else if (currentId === 'agent_5' || currentId === 'agent_4') {
          setPanOffset({ x: -700, y: 0 });
        }
      }

      setNodes(prev => prev.map(n => {
        if (n.id === currentId) {
          return { ...n, status: 'executing' as NodeStatus, badgeText: 'PROCESSING (2.5s)...' };
        }
        return n;
      }));

      // Wait exactly 2.5 seconds per stage for visual demonstration
      await new Promise(res => setTimeout(res, 2500));

      // Mark current stage completed
      setNodes(prev => prev.map(n => {
        if (n.id === currentId) {
          return { ...n, status: 'completed' as NodeStatus, badgeText: 'COMPLETED' };
        }
        return n;
      }));
    }

    setActiveExecutingNodeId(null);
    setExecuting(false);
  };

  // Reset Workflow Canvas
  const resetWorkflow = () => {
    setExecuting(false);
    setActiveExecutingNodeId(null);
    setPanOffset({ x: 0, y: 0 });
    setNodes(prev => prev.map(n => ({ ...n, status: 'completed' as NodeStatus, badgeText: 'Completed' })));
  };

  // Mouse Drag & Canvas Pan Handlers
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    if (toolMode === 'hand') return;
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggedNodeId(nodeId);

    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: targetNode.x,
        nodeY: targetNode.y,
        panX: panOffset.x,
        panY: panOffset.y
      };
    }
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (toolMode === 'hand' || e.button === 1) {
      setIsPanning(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: 0,
        nodeY: 0,
        panX: panOffset.x,
        panY: panOffset.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.nodeX + dx;
      const newY = dragStartRef.current.nodeY + dy;

      setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPanOffset({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Helper to render horizontal left-to-right cubic bezier curves
  const renderHorizontalBezierCurve = (conn: Connection) => {
    const fromNode = nodes.find(n => n.id === conn.fromId);
    const toNode = nodes.find(n => n.id === conn.toId);
    if (!fromNode || !toNode) return null;

    const fromExpanded = activeExecutingNodeId === fromNode.id || selectedNodeId === fromNode.id;
    const toExpanded = activeExecutingNodeId === toNode.id || selectedNodeId === toNode.id;

    // Horizontal Output Port (Right side of fromNode)
    const startX = fromNode.x + 280 + panOffset.x;
    const startY = fromNode.y + (fromExpanded ? 140 : 55) + panOffset.y;

    // Horizontal Input Port (Left side of toNode)
    const endX = toNode.x + panOffset.x;
    const endY = toNode.y + (toExpanded ? 140 : 55) + panOffset.y;

    const controlX1 = startX + Math.abs(endX - startX) * 0.5;
    const controlX2 = endX - Math.abs(endX - startX) * 0.5;

    const d = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const isExecuting = fromNode.status === 'executing' || toNode.status === 'executing';
    const isCompleted = fromNode.status === 'completed' && (toNode.status === 'completed' || toNode.status === 'executing');

    return (
      <g key={`${conn.fromId}-${conn.toId}`}>
        <path
          d={d}
          fill="none"
          stroke={isExecuting ? '#ffffff' : isCompleted ? '#333333' : '#1a1a1a'}
          strokeWidth={isExecuting ? '3' : '2'}
          strokeDasharray={isExecuting ? '6, 6' : undefined}
          style={{
            animation: isExecuting ? 'dash 1s linear infinite' : undefined,
            transition: 'all 0.3s ease'
          }}
        />

        {/* Connection Label Pill */}
        <foreignObject x={midX - 45} y={midY - 12} width="90" height="24">
          <div style={{
            background: '#000000', border: isExecuting ? '1px solid #ffffff' : '1px solid #262626',
            color: isExecuting ? '#ffffff' : '#888888', borderRadius: 12,
            fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '20px',
            fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            {conn.label}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden', userSelect: 'none' }}
    >
      
      {/* Top Header Control Bar */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid #1a1a1a', background: '#000000',
        flexShrink: 0, fontSize: 12, fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', fontSize: 13 }}>
            HORIZONTAL N8N AGENT DAG WORKFLOW // LIVE AUTO-EXPANDING NODES
          </span>
          <span style={{ color: '#333333' }}>|</span>
          <span style={{ color: '#888888', fontSize: 11 }}>2.5s STAGE DELAYS WITH AUTO-EXPANDING BOXES</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => runLiveSimulation('/demo/full-mission-strike')}
            disabled={executing}
            style={{
              background: executing ? '#444444' : '#ffffff', color: '#000000', border: 'none',
              borderRadius: 4, padding: '6px 14px', fontSize: 11,
              fontWeight: 800, cursor: executing ? 'not-allowed' : 'pointer'
            }}
          >
            {executing ? '[Executing Workflow 2.5s/stage...]' : '[Trigger Dockworkers Strike Anomaly]'}
          </button>

          <button
            onClick={() => runLiveSimulation('/demo/full-mission-typhoon')}
            disabled={executing}
            style={{
              background: '#111111', border: '1px solid #333333',
              color: '#ffffff', borderRadius: 4, padding: '6px 14px', fontSize: 11,
              fontWeight: 600, cursor: executing ? 'not-allowed' : 'pointer'
            }}
          >
            [Inject Weather Radar & Wave Anomaly]
          </button>

          <button
            onClick={() => runLiveSimulation('/demo/full-funnel-vip-air-bridge')}
            disabled={executing}
            style={{
              background: '#111111', border: '1px solid #333333',
              color: '#ffffff', borderRadius: 4, padding: '6px 14px', fontSize: 11,
              fontWeight: 600, cursor: executing ? 'not-allowed' : 'pointer'
            }}
          >
            [Trigger VIP Express Air-Bridge]
          </button>

          <button
            onClick={resetWorkflow}
            disabled={executing}
            style={{
              background: '#111111', border: '1px solid #333333',
              color: '#888888', borderRadius: 4, padding: '6px 12px', fontSize: 11,
              fontWeight: 600, cursor: executing ? 'not-allowed' : 'pointer'
            }}
          >
            [Reset Pipeline]
          </button>
        </div>
      </header>

      {/* Main Horizontal Canvas Area */}
      <div 
        onMouseDown={handleMouseDownCanvas}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden', background: '#000000',
          cursor: toolMode === 'hand' || isPanning ? 'grab' : 'default'
        }}
      >
        
        {/* Infinite Dot Grid Canvas Overlay */}
        <div style={{
          position: 'absolute', inset: 0, minWidth: 2200, minHeight: 700,
          backgroundImage: 'radial-gradient(#222222 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px', pointerEvents: 'auto'
        }}>

          {/* Horizontal SVG Connections Layer */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {CONNECTIONS.map(conn => renderHorizontalBezierCurve(conn))}
          </svg>

          {/* Render Horizontal 2D Spatial n8n Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNodeId === node.id;
            const isExecuting = activeExecutingNodeId === node.id || node.status === 'executing';
            const isCompleted = node.status === 'completed';
            const isApprovalReq = node.status === 'approval_required';
            const isAutoExpanded = isExecuting || isSelected;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                style={{
                  position: 'absolute',
                  left: node.x + panOffset.x,
                  top: node.y + panOffset.y,
                  width: 280,
                  background: '#050505',
                  border: isExecuting
                    ? '2px solid #ffffff'
                    : isSelected
                    ? '1.5px solid #ffffff'
                    : isApprovalReq
                    ? '1.5px solid #ef4444'
                    : isCompleted
                    ? '1px solid #262626'
                    : '1px solid #141414',
                  borderRadius: 12,
                  boxShadow: isExecuting
                    ? '0 0 32px rgba(255, 255, 255, 0.35)'
                    : isSelected
                    ? '0 0 20px rgba(255, 255, 255, 0.15)'
                    : '0 8px 32px rgba(0, 0, 0, 0.8)',
                  cursor: toolMode === 'hand' ? 'grab' : 'move',
                  zIndex: isExecuting ? 30 : isSelected ? 20 : 10,
                  transition: draggedNodeId === node.id ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  overflow: 'hidden'
                }}
              >
                {/* Node Header Handle Bar */}
                <div style={{
                  padding: '12px 14px', background: isExecuting ? '#181818' : '#0a0a0a',
                  borderBottom: '1px solid #1f1f1f',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, background: '#111111',
                      border: '1px solid #333333', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={14} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#888888', letterSpacing: '0.05em' }}>
                        {node.stageLabel}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                        {node.title.split(':')[1] || node.title}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`badge ${isApprovalReq ? 'badge-critical' : isExecuting ? 'badge-info' : isCompleted ? 'badge-low' : 'badge-neutral'}`} style={{ fontSize: 8, padding: '3px 6px' }}>
                    {isExecuting ? 'PROCESSING (2.5s)...' : node.badgeText}
                  </span>
                </div>

                {/* Collapsed Node Description */}
                {!isAutoExpanded && (
                  <div style={{ padding: '10px 14px', fontSize: 10, color: '#aaaaaa', lineHeight: 1.4 }}>
                    {node.subtitle}
                  </div>
                )}

                {/* AUTOMATICALLY EXPANDED LIVE TASK DETAILS WHEN AGENT IS EXECUTING */}
                {isAutoExpanded && (
                  <div style={{ padding: '12px 14px', background: '#000000', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 10 }}>
                    <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>[LIVE AGENT EXECUTION LOGS]</span>
                      {isExecuting && <span style={{ color: '#22c55e', fontSize: 9, animation: 'pulse 1s infinite' }}>[2.5s ACTIVE]</span>}
                    </div>
                    
                    <div style={{ background: '#080808', border: '1px solid #1f1f1f', padding: 8, borderRadius: 4, maxHeight: 110, overflow: 'auto', fontFamily: 'JetBrains Mono, monospace', color: '#cccccc' }}>
                      {node.reasoning.map((step, idx) => (
                        <div key={idx} style={{ marginBottom: 4 }}>• {step}</div>
                      ))}
                    </div>

                    <div style={{ color: '#888888', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                      TOOL: <strong style={{ color: '#ffffff' }}>{node.toolsInvoked[0]}</strong>
                    </div>
                  </div>
                )}

                {/* Node Bottom Metrics Stats Bar */}
                <div style={{
                  padding: '8px 14px', background: '#000000', borderTop: '1px solid #141414',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#666666'
                }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>IN: <strong style={{ color: '#ffffff' }}>{node.stats.inputs}</strong></span>
                    <span>PROC: <strong style={{ color: '#ffffff' }}>{node.stats.processed}</strong></span>
                    <span>OUT: <strong style={{ color: '#ffffff' }}>{node.stats.outputs}</strong></span>
                  </div>
                  <span style={{ color: '#22c55e' }}>{node.stats.latencyMs}ms</span>
                </div>
              </div>
            );
          })}

        </div>

        {/* Floating Centered n8n Canvas Control Toolbar */}
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, background: '#050505', border: '1px solid #262626',
          borderRadius: 30, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 12px 36px rgba(0,0,0,0.9)'
        }}>
          <button 
            onClick={() => setToolMode('select')}
            title="Select & Move Node"
            style={{
              background: toolMode === 'select' ? '#ffffff' : 'transparent',
              border: 'none', borderRadius: 20, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <MousePointer size={14} color={toolMode === 'select' ? '#000000' : '#888888'} />
          </button>
          <button 
            onClick={() => setToolMode('hand')}
            title="Pan Canvas (Hand Drag Tool)"
            style={{
              background: toolMode === 'hand' ? '#ffffff' : 'transparent',
              border: 'none', borderRadius: 20, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <Hand size={14} color={toolMode === 'hand' ? '#000000' : '#888888'} />
          </button>
          <div style={{ width: 1, height: 16, background: '#222222' }} />
          <button style={{ background: 'transparent', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Sliders size={14} color="#888888" />
          </button>
          <button style={{ background: 'transparent', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Link2 size={14} color="#888888" />
          </button>
          <button style={{ background: 'transparent', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Grid size={14} color="#888888" />
          </button>
        </div>
      </div>

      {/* Expanded Payload Inspector Drawer */}
      {selectedNode && (
        <div style={{
          position: 'fixed', top: 52, right: 0, bottom: 0, width: 480,
          background: '#050505', borderLeft: '1px solid #1f1f1f', zIndex: 50,
          display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 40px rgba(0,0,0,0.9)'
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1f1f1f', background: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888888' }}>
                NODE CONFIGURATION & PAYLOAD INSPECTOR
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                {selectedNode.title}
              </div>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              style={{ background: '#111111', border: '1px solid #333333', color: '#ffffff', borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Sub-Tabs Selector */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 6, background: '#000000' }}>
            {(['SUMMARY', 'INPUT', 'REASONING', 'TOOLS', 'OUTPUT', 'JSON'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveDrawerTab(tab)}
                style={{
                  padding: '5px 10px', fontSize: 10, fontWeight: 800, borderRadius: 4, cursor: 'pointer',
                  background: activeDrawerTab === tab ? '#ffffff' : 'transparent',
                  color: activeDrawerTab === tab ? '#000000' : '#888888',
                  border: activeDrawerTab === tab ? '1px solid #ffffff' : '1px solid #222222'
                }}
              >
                [{tab}]
              </button>
            ))}
          </div>

          {/* Drawer Content Area */}
          <div className="scroll-y" style={{ flex: 1, padding: 20, overflowY: 'auto', fontSize: 12, lineHeight: 1.6 }}>
            {activeDrawerTab === 'SUMMARY' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: 16, borderRadius: 6, color: '#cccccc' }}>
                <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 6 }}>EXECUTED NODE SUMMARY</div>
                <div>{selectedNode.subtitle}</div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1f1f1f', fontSize: 11 }}>
                  Status: <strong style={{ color: '#22c55e' }}>{selectedNode.badgeText}</strong> | Latency: <strong style={{ color: '#ffffff' }}>{selectedNode.stats.latencyMs}ms</strong>
                </div>
              </div>
            )}

            {activeDrawerTab === 'INPUT' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: 16, borderRadius: 6 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 8, fontSize: 11 }}>RECEIVED UPSTREAM INPUT PAYLOAD</div>
                <pre style={{ margin: 0, color: '#aaaaaa', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, overflow: 'auto' }}>
{JSON.stringify(selectedNode.inputPayload, null, 2)}
                </pre>
              </div>
            )}

            {activeDrawerTab === 'REASONING' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: 16, borderRadius: 6 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 10, fontSize: 11 }}>INTERNAL AGENT REASONING TRAIL</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#cccccc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedNode.reasoning.map((step, sIdx) => (
                    <li key={sIdx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeDrawerTab === 'TOOLS' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: 16, borderRadius: 6 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 10, fontSize: 11 }}>ENTERPRISE TOOLS & APIS INVOKED</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedNode.toolsInvoked.map((tool, tIdx) => (
                    <div key={tIdx} style={{ background: '#111111', border: '1px solid #262626', padding: '8px 12px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ffffff' }}>
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDrawerTab === 'OUTPUT' && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: 16, borderRadius: 6 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 8, fontSize: 11 }}>TRANSMITTED DOWNSTREAM OUTPUT PAYLOAD</div>
                <pre style={{ margin: 0, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, overflow: 'auto' }}>
{JSON.stringify(selectedNode.outputPayload, null, 2)}
                </pre>
              </div>
            )}

            {activeDrawerTab === 'JSON' && (
              <div style={{ background: '#000000', border: '1px solid #222222', padding: 16, borderRadius: 6 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 8, fontSize: 11 }}>RAW INTER-AGENT JSON PAYLOAD</div>
                <pre style={{ margin: 0, color: '#ffffff', background: '#050505', padding: 14, borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, overflow: 'auto', border: '1px solid #1a1a1a' }}>
{JSON.stringify({ input: selectedNode.inputPayload, output: selectedNode.outputPayload, reasoning: selectedNode.reasoning }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes dash {
          to { stroke-dashoffset: -24; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
