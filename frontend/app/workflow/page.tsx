'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

type NodeStatus = 'idle' | 'processing' | 'completed' | 'approval_required' | 'rejected';

type WorkflowNode = {
  id: string;
  stageNumber: string;
  title: string;
  agentRole: string;
  agentId: string;
  status: NodeStatus;
  summaryOutput: string;
  inputPayload: Record<string, any>;
  reasoning: string[];
  toolsInvoked: string[];
  outputPayload: Record<string, any>;
};

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: 'agent_0',
    stageNumber: 'STAGE 01',
    title: 'Agent 0: Master Mission Orchestrator',
    agentRole: 'ORCHESTRATOR',
    agentId: 'agent_0',
    status: 'completed',
    summaryOutput: 'Shipment context ingested. Target: CNTR-SHA-BOM-9921 (Origin: PORT_SHANGHAI_01 ➔ Destination: PORT_ROTTERDAM_02). Baseline Cost: $42,000.',
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
    id: 'agent_1a_1b',
    stageNumber: 'STAGE 02',
    title: 'Agent 1A & 1B: Threat Perception & AIS Telemetry',
    agentRole: 'PERCEPTION',
    agentId: 'agent_1',
    status: 'completed',
    summaryOutput: 'Labor strike & weather anomaly detected. Event: Shanghai Dockworkers Strike (Severity: CRITICAL, Lat: 31.23, Lon: 121.47).',
    inputPayload: {
      shipment_id: 'CNTR-SHA-BOM-9921',
      active_corridor: ['PORT_SHANGHAI_01', 'CORRIDOR_TAIWAN_STRAIT', 'PORT_ROTTERDAM_02']
    },
    reasoning: [
      'Agent 1A scanned NLP news RSS feed: "Shanghai Port Dockworkers Strike shut down container berths."',
      'Agent 1B evaluated Open-Meteo vessel telemetry: Wind 62.0 knots, Wave height 7.5m in Taiwan Strait.',
      'Constructed Unified Disruption Triage Event (INC_8821). Severity: CRITICAL.',
      'Marked PORT_SHANGHAI_01 berth node as BLOCKED_BY_STRIKE.'
    ],
    toolsInvoked: [
      'NewsSemanticParserAgent.parse_article(rss_feed_text)',
      'WeatherTelemetryAgent.fetch_corridor_weather(lat=31.23, lon=121.47)'
    ],
    outputPayload: {
      disruption_event: {
        event_id: 'INC_8821',
        event_type: 'LABOR_STRIKE',
        severity: 'CRITICAL',
        blocked_nodes: ['PORT_SHANGHAI_01'],
        estimated_delay_hours: 48.0
      }
    }
  },
  {
    id: 'agent_2',
    stageNumber: 'STAGE 03',
    title: 'Agent 2: Multimodal Graph-RL Pathfinder',
    agentRole: 'PATHFINDER',
    agentId: 'agent_2',
    status: 'completed',
    summaryOutput: 'Pathfinder calculated 2 alternate bypass routes using NetworkX Dijkstra: ROUTE_ALT_901 (Intermodal Rail) & ROUTE_ALT_AIR (Express Air Cargo).',
    inputPayload: {
      origin: 'PORT_SHANGHAI_01',
      destination: 'PORT_ROTTERDAM_02',
      blocked_nodes: ['PORT_SHANGHAI_01'],
      max_candidates: 3
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
    stageNumber: 'STAGE 04',
    title: 'Agent 3: Route Policy & SLA Constraint Validator',
    agentRole: 'VALIDATOR',
    agentId: 'agent_3',
    status: 'completed',
    summaryOutput: 'Validation passed. Route ROUTE_ALT_901 verified for stock availability, berth channel depth, and VIP tier SLA deadline.',
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
    stageNumber: 'STAGE 05',
    title: 'Agent 5: Financial Risk & Safeguard Gate',
    agentRole: 'SAFEGUARD',
    agentId: 'agent_5',
    status: 'completed',
    summaryOutput: 'Safeguard evaluation complete. Decision: AUTO_APPROVE. Cost delta: +$10,200 (Within $50,000 threshold ceiling).',
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
    stageNumber: 'STAGE 06',
    title: 'Agent 4: Polygon Amoy Cryptographic Settlement',
    agentRole: 'BLOCKCHAIN ANCHOR',
    agentId: 'agent_4',
    status: 'completed',
    summaryOutput: 'Cryptographic provenance anchored on Polygon Amoy testnet. Tx Hash: 0x765eced85371f812d3a869d2b8c32c5a8c9f991ba8ee4c9c57595b6885dbbc27.',
    inputPayload: {
      shipment_id: 'CNTR-SHA-BOM-9921',
      route_id: 'ROUTE_ALT_901',
      audit_hash: '75fe47a660f79babadd3f9c97cb603ad9ae002e7d4fbfcddbb7504d5e6d75244'
    },
    reasoning: [
      'Generated Keccak256 hash payload combining Agent 0, 1, 2, 3, and 5 audit trails.',
      'Signed transaction with Polygon Amoy wallet owner key: 0x0000...0000.',
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

export default function WorkflowPage() {
  const { role } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.push('/');
    }
  }, [role, router]);

  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    agent_0: false,
    agent_1a_1b: false,
    agent_2: false,
    agent_3: false,
    agent_5: false,
    agent_4: false
  });
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'SUMMARY' | 'INPUT' | 'REASONING' | 'TOOLS' | 'OUTPUT' | 'JSON'>>({
    agent_0: 'SUMMARY',
    agent_1a_1b: 'SUMMARY',
    agent_2: 'SUMMARY',
    agent_3: 'SUMMARY',
    agent_5: 'SUMMARY',
    agent_4: 'SUMMARY'
  });
  const [executing, setExecuting] = useState(false);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const setNodeTab = (nodeId: string, tab: 'SUMMARY' | 'INPUT' | 'REASONING' | 'TOOLS' | 'OUTPUT' | 'JSON') => {
    setActiveTabMap(prev => ({ ...prev, [nodeId]: tab }));
  };

  const runLiveSimulation = async (endpoint: string) => {
    setExecuting(true);

    // Reset statuses to idle then processing sequentially
    const resetNodes = nodes.map(n => ({ ...n, status: 'idle' as NodeStatus }));
    setNodes(resetNodes);

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        // Update nodes sequentially with animated delays
        for (let i = 0; i < nodes.length; i++) {
          await new Promise(r => setTimeout(r, 600));
          setNodes(prev => prev.map((nd, idx) => {
            if (idx === i) {
              return {
                ...nd,
                status: (i === 4 && data.safeguard_evaluation?.requires_human_approval) ? 'approval_required' : 'completed'
              };
            }
            if (idx === i + 1 && i < nodes.length - 1) {
              return { ...nd, status: 'processing' };
            }
            return nd;
          }));
        }
      }
    } catch (e) {
      console.warn('Backend live simulation fallback:', e);
    }

    setExecuting(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden' }}>
      {/* Monochromatic Top Control Bar */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid #1a1a1a', background: '#000000',
        flexShrink: 0, fontSize: 12, fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', fontSize: 13 }}>
            WORKFLOW INSPECTOR // N8N-STYLE AGENT DAG GRAPH CANVAS
          </span>
          <span style={{ color: '#333333' }}>|</span>
          <span style={{ color: '#888888', fontSize: 11 }}>DYNAMIC INTER-AGENT PIPELINE HANDOFFS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => runLiveSimulation('/demo/full-mission-strike')}
            disabled={executing}
            style={{
              background: '#ffffff', color: '#000000', border: 'none',
              borderRadius: 4, padding: '6px 14px', fontSize: 11,
              fontWeight: 800, cursor: executing ? 'not-allowed' : 'pointer'
            }}
          >
            [Execute Strike Scenario]
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
            [Execute Typhoon Scenario]
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
            [Execute VIP Air-Bridge Scenario]
          </button>
        </div>
      </header>

      {/* Main Canvas Area with Dark Grid Background */}
      <div className="scroll-y" style={{
        flex: 1, padding: '40px 60px', background: '#000000',
        backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)',
        backgroundSize: '24px 24px', overflowY: 'auto'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          
          {nodes.map((node, index) => {
            const isExpanded = !!expandedNodes[node.id];
            const activeTab = activeTabMap[node.id] || 'SUMMARY';
            const isLast = index === nodes.length - 1;
            const isProcessing = node.status === 'processing';
            const isCompleted = node.status === 'completed';
            const isApprovalReq = node.status === 'approval_required';

            return (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                
                {/* n8n Node Box Container */}
                <div style={{
                  width: '100%', background: '#050505',
                  border: isProcessing ? '1px solid #ffffff' : isApprovalReq ? '1px solid #ef4444' : isCompleted ? '1px solid #333333' : '1px solid #1a1a1a',
                  borderRadius: 8, transition: 'all 0.2s ease',
                  boxShadow: isProcessing ? '0 0 20px rgba(255, 255, 255, 0.15)' : '0 8px 32px rgba(0,0,0,0.8)',
                  overflow: 'hidden', zIndex: 10
                }}>
                  {/* Node Header Handle Bar */}
                  <div style={{
                    padding: '14px 20px', background: '#0a0a0a', borderBottom: '1px solid #1f1f1f',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{
                        background: '#181818', border: '1px solid #333333', color: '#ffffff',
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        {node.stageNumber}
                      </span>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {node.title}
                      </h4>
                      <span className="badge badge-neutral" style={{ fontSize: 9 }}>
                        [{node.agentRole}]
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Node Status Badge */}
                      {isProcessing && (
                        <span className="badge badge-info" style={{ animation: 'pulse 1.5s infinite' }}>
                          [PROCESSING...]
                        </span>
                      )}
                      {isCompleted && (
                        <span className="badge badge-low">
                          [COMPLETED & LOCKED]
                        </span>
                      )}
                      {isApprovalReq && (
                        <span className="badge badge-critical">
                          [HUMAN APPROVAL REQUIRED]
                        </span>
                      )}
                      {node.status === 'idle' && (
                        <span className="badge badge-neutral">
                          [IDLE]
                        </span>
                      )}

                      {/* Expand / Collapse Toggle Button */}
                      <button
                        onClick={() => toggleExpand(node.id)}
                        style={{
                          background: isExpanded ? '#ffffff' : '#111111',
                          color: isExpanded ? '#000000' : '#ffffff',
                          border: '1px solid #333333', padding: '4px 12px', borderRadius: 4,
                          fontSize: 11, fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        {isExpanded ? '[-] Collapse Node' : '[+] Expand Details'}
                      </button>
                    </div>
                  </div>

                  {/* Collapsed Node Content: Concise Summary */}
                  {!isExpanded && (
                    <div style={{ padding: '14px 20px', background: '#000000', fontSize: 12, color: '#cccccc', lineHeight: 1.5 }}>
                      <span style={{ color: '#888888', fontWeight: 700, marginRight: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                        OUTPUT SUMMARY:
                      </span>
                      {node.summaryOutput}
                    </div>
                  )}

                  {/* Expanded Node Content: Detailed Multi-Tab View */}
                  {isExpanded && (
                    <div style={{ padding: 20, background: '#000000', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Sub-Tabs Bar */}
                      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #1a1a1a', paddingBottom: 10 }}>
                        {(['SUMMARY', 'INPUT', 'REASONING', 'TOOLS', 'OUTPUT', 'JSON'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setNodeTab(node.id, tab)}
                            style={{
                              background: activeTab === tab ? '#ffffff' : 'transparent',
                              color: activeTab === tab ? '#000000' : '#888888',
                              border: activeTab === tab ? '1px solid #ffffff' : '1px solid #222222',
                              padding: '5px 12px', borderRadius: 4, fontSize: 10, fontWeight: 800, cursor: 'pointer'
                            }}
                          >
                            [{tab}]
                          </button>
                        ))}
                      </div>

                      {/* Tab Content Display */}
                      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                        {activeTab === 'SUMMARY' && (
                          <div style={{ background: '#050505', border: '1px solid #1a1a1a', padding: 14, borderRadius: 6, color: '#cccccc' }}>
                            <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 4 }}>EXECUTED NODE SUMMARY</div>
                            <div>{node.summaryOutput}</div>
                          </div>
                        )}

                        {activeTab === 'INPUT' && (
                          <div style={{ background: '#050505', border: '1px solid #1a1a1a', padding: 14, borderRadius: 6 }}>
                            <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 6, fontSize: 11 }}>RECEIVED UPSTREAM INPUT PAYLOAD</div>
                            <pre style={{ margin: 0, color: '#aaaaaa', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, overflow: 'auto' }}>
{JSON.stringify(node.inputPayload, null, 2)}
                            </pre>
                          </div>
                        )}

                        {activeTab === 'REASONING' && (
                          <div style={{ background: '#050505', border: '1px solid #1a1a1a', padding: 14, borderRadius: 6 }}>
                            <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 8, fontSize: 11 }}>INTERNAL AGENT REASONING & DECISION TRAIL</div>
                            <ul style={{ margin: 0, paddingLeft: 18, color: '#cccccc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {node.reasoning.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {activeTab === 'TOOLS' && (
                          <div style={{ background: '#050505', border: '1px solid #1a1a1a', padding: 14, borderRadius: 6 }}>
                            <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 8, fontSize: 11 }}>ENTERPRISE TOOLS & API CALLS INVOKED</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {node.toolsInvoked.map((tool, tIdx) => (
                                <div key={tIdx} style={{ background: '#111111', border: '1px solid #262626', padding: '6px 10px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ffffff' }}>
                                  {tool}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeTab === 'OUTPUT' && (
                          <div style={{ background: '#050505', border: '1px solid #1a1a1a', padding: 14, borderRadius: 6 }}>
                            <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 6, fontSize: 11 }}>TRANSMITTED DOWNSTREAM OUTPUT PAYLOAD</div>
                            <pre style={{ margin: 0, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, overflow: 'auto' }}>
{JSON.stringify(node.outputPayload, null, 2)}
                            </pre>
                          </div>
                        )}

                        {activeTab === 'JSON' && (
                          <div style={{ background: '#000000', border: '1px solid #222222', padding: 14, borderRadius: 6 }}>
                            <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: 6, fontSize: 11 }}>RAW INTER-AGENT JSON PAYLOAD INSPECTOR</div>
                            <pre style={{ margin: 0, color: '#ffffff', background: '#050505', padding: 12, borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, overflow: 'auto', border: '1px solid #1a1a1a' }}>
{JSON.stringify({ input: node.inputPayload, output: node.outputPayload, reasoning: node.reasoning }, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* n8n Dynamic Arrow Connector Line between nodes */}
                {!isLast && (
                  <div style={{ height: 48, width: 2, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Background line */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: isCompleted ? '#ffffff' : '#222222' }} />

                    {/* Dynamic Animated Dashed Arrow when processing */}
                    {isProcessing && (
                      <svg width="24" height="48" style={{ overflow: 'visible', zIndex: 5 }}>
                        <line x1="12" y1="0" x2="12" y2="48" stroke="#ffffff" strokeWidth="2" strokeDasharray="6, 6" style={{ animation: 'dash 1s linear infinite' }} />
                      </svg>
                    )}

                    {/* Arrow Head Indicator */}
                    <div style={{
                      position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                      width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                      borderTop: isCompleted ? '6px solid #ffffff' : '6px solid #444444', zIndex: 6
                    }} />
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

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
