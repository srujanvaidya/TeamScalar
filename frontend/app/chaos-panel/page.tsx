'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore, AgentStatus } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PRESETS = [
  {
    name: 'Typhoon East China Sea',
    desc: 'Category 4 Typhoon at Taiwan Strait. Severity: CRITICAL. Delay: 96h.',
    incident_id: 'INC_8821',
    event_type: 'WEATHER_ANOMALY',
    severity: 'CRITICAL',
    latitude: 25.2,
    longitude: 121.5,
    affected_node: 'PORT_SHANGHAI_01',
    delay: 96,
  },
  {
    name: 'Hormuz Naval Blockade',
    desc: 'Simulate Strait of Hormuz naval blockade. All tanker traffic halted.',
    incident_id: 'INC_8825',
    event_type: 'GEOPOLITICAL_BLOCKADE',
    severity: 'CRITICAL',
    latitude: 26.6,
    longitude: 56.3,
    affected_node: 'PORT_DUBAI_01',
    delay: 120,
  },
  {
    name: 'Europe Rail Strike',
    desc: 'Central European rail union strike. Rail corridors DE/PL/CZ blocked.',
    incident_id: 'INC_8830',
    event_type: 'LABOR_STRIKE',
    severity: 'HIGH',
    latitude: 52.2,
    longitude: 21.0,
    affected_node: 'RAIL_WARSAW',
    delay: 72,
  },
  {
    name: 'Arctic Weather Freeze',
    desc: 'Siberian cold front. Trans-Siberian rail capacity reduced 60%.',
    incident_id: 'INC_8840',
    event_type: 'WEATHER_ANOMALY',
    severity: 'MEDIUM',
    latitude: 56.1,
    longitude: 92.9,
    affected_node: 'RAIL_CHENGDU',
    delay: 48,
  },
];

export default function ChaosPanelPage() {
  const {
    role,
    agents,
    setAgentStatus,
    agentLogs,
    addAgentLog,
    clearLogs,
    setHitlPending,
    setSystemStatus,
  } = useStore();

  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.push('/');
    }
  }, [role, router]);

  const [nlInput, setNlInput] = useState('');
  const [injecting, setInjecting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentLogs]);

  const runSimulation = async (payload: typeof PRESETS[0] | { text: string }) => {
    setInjecting(true);
    clearLogs();
    setSystemStatus('disruption_active');

    const isPreset = 'incident_id' in payload;
    const incidentId = isPreset ? payload.incident_id : `INC_${Math.floor(1000 + Math.random() * 9000)}`;

    if (isPreset) {
      try {
        await supabase.from('disruption_events').insert({
          incident_id: incidentId,
          event_type: payload.event_type,
          severity: payload.severity,
          latitude: payload.latitude,
          longitude: payload.longitude,
          affected_node: payload.affected_node,
          raw_payload: { delay_hours: payload.delay },
        });
      } catch (e) {
        console.error(e);
      }
    }

    const steps = [
      { agentId: 0, status: 'processing' as AgentStatus, log: 'Master Orchestrator activated. Ingesting disruption signal...' },
      { agentId: 1, status: 'processing' as AgentStatus, log: `Agent 1A parsing unstructured inputs for ${incidentId}...` },
      { agentId: 1, status: 'locked' as AgentStatus, log: `Agent 1A Output locked. Severity: ${isPreset ? payload.severity : 'CRITICAL'}, Node: ${isPreset ? payload.affected_node : 'PORT_SHANGHAI_01'}` },
      { agentId: 2, status: 'processing' as AgentStatus, log: 'Agent 1B scanning environmental weather feeds near target nodes...' },
      { agentId: 2, status: 'locked' as AgentStatus, log: 'Agent 1B telemetry check complete. Anomaly confirmation set to TRUE.' },
      { agentId: 0, status: 'processing' as AgentStatus, log: 'Master Orchestrator dispatching reroute tasks to Graph-RL Agent...' },
      { agentId: 3, status: 'processing' as AgentStatus, log: 'Agent 2 calculating shortest paths on Directed Weighted Graph G=(V,E)...' },
      { agentId: 3, status: 'locked' as AgentStatus, log: 'Agent 2 selected candidates: ROUTE_ALT_902 (Rail-Truck) vs ROUTE_ALT_903 (Air-Truck).' },
      { agentId: 4, status: 'processing' as AgentStatus, log: 'Agent 3 validating constraints: checking inventory & carrier spot rates...' },
      { agentId: 4, status: 'locked' as AgentStatus, log: 'Agent 3 validation success: inventory_available=true, carrier_rate_confirmed=true.' },
      { agentId: 7, status: 'processing' as AgentStatus, log: 'Agent 6 computing greenhouse gas emissions (CO2e) per ton-km...' },
      { agentId: 7, status: 'locked' as AgentStatus, log: 'Agent 6 emission assessment complete. Sustainability grade: A (CO2 saved: 1,240 kg).' },
      { agentId: 6, status: 'processing' as AgentStatus, log: 'Agent 5 evaluating risk & financial threshold gates...' },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setAgentStatus(step.agentId, step.status);
      addAgentLog({
        from: `agent_${step.agentId}`,
        to: step.agentId === 0 ? 'system' : 'agent_0',
        payload: step.log,
      });
      await new Promise(r => setTimeout(r, 600));
    }

    setAgentStatus(6, 'locked');
    addAgentLog({
      from: 'agent_5',
      to: 'master_coordinator',
      payload: 'Escalation triggered. Financial impact: $64,200 (exceeds $50,000 threshold). Routing to HITL queue.',
    });

    setHitlPending(true, {
      impact: 64200,
      routeId: 'ROUTE_ALT_902',
      reasoning: `### Escalation Summary
- Primary ocean route blocked at Port of Shanghai due to strike blockade.
- Alternate rail route ROUTE_ALT_902 selected.
- Reroute cost impact: $64,200 (exceeds $50,000 limit).
- Action Required: Approve to execute carrier bookings on-chain and prevent $180,000 SLA penalty.`,
    });

    setInjecting(false);
  };

  const handleNlInject = () => {
    if (!nlInput.trim()) return;
    runSimulation({ text: nlInput });
    setNlInput('');
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'processing': return <span className="badge badge-info">PROCESSING</span>;
      case 'executing': return <span className="badge badge-medium">EXECUTING TOOL</span>;
      case 'locked': return <span className="badge badge-low">LOCKED</span>;
      case 'error': return <span className="badge badge-critical">ERROR</span>;
      default: return <span className="badge badge-neutral">IDLE</span>;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', overflow: 'hidden' }}>
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: '1px solid #1a1a1a', background: '#000000',
        gap: 12, flexShrink: 0,
      }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#ffffff', letterSpacing: '0.06em' }}>CHAOS PANEL</span>
        <span style={{ color: '#333333' }}>|</span>
        <span style={{ fontSize: 11, color: '#888888' }}>DISRUPTION SIMULATION & STRESS TESTER</span>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #1a1a1a', background: '#000000' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', marginBottom: 2 }}>Inject Synthetic Disruptions</div>
            <div style={{ fontSize: 11, color: '#888888' }}>Simulate real-world stress triggers and observe multi-agent orchestration</div>
          </div>

          <div className="scroll-y" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888888', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Natural Language Disruption (NLP)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Typhoon warning near Shanghai. Heavy labor strike at Rotterdam causing berth delays of 3 days."
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0a0a',
                  border: '1px solid #333333', color: '#ffffff', fontSize: 12, outline: 'none', resize: 'none'
                }}
                disabled={injecting}
              />
              <button
                className="btn-blue"
                onClick={handleNlInject}
                style={{ width: '100%', marginTop: 10, borderRadius: 6, justifyContent: 'center' }}
                disabled={injecting || !nlInput.trim()}
              >
                Inject Disruption Signal
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
              <span style={{ fontSize: 10, color: '#888888', fontWeight: 700 }}>OR SELECT A PRESET</span>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            </div>

            {PRESETS.map((p) => (
              <div
                key={p.name}
                style={{
                  background: '#0a0a0a', border: '1px solid #222222',
                  borderRadius: 8, padding: 14, cursor: injecting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => !injecting && runSimulation(p)}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', marginBottom: 4 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: '#888888', lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', marginBottom: 12 }}>Active Agent Monitor</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {agents.map((agent) => (
                <div key={agent.id} style={{
                  background: '#000000', border: '1px solid #222222',
                  borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>{agent.label}</span>
                    {getStatusBadge(agent.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888888' }}>
                    <span>Last Act:</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ffffff' }}>{agent.lastActivity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#ffffff' }}>Inter-Agent Telemetry Stream</span>
              <button
                onClick={clearLogs}
                style={{
                  background: '#0a0a0a', border: '1px solid #333333',
                  color: '#ffffff', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer'
                }}
              >
                Clear Stream
              </button>
            </div>

            <div className="scroll-y" style={{ flex: 1, background: '#000000', border: '1px solid #222222', borderRadius: 6, padding: 14 }}>
              {agentLogs.length === 0 ? (
                <div style={{ color: '#888888', fontSize: 12, padding: 8 }}>
                  Standby. Ingest disruption signal to start stream...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {agentLogs.map((log, index) => (
                    <div key={index} style={{ borderBottom: '1px solid #111111', paddingBottom: 6 }}>
                      <span style={{ color: '#888888', marginRight: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>[{log.ts}]</span>
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 11 }}>{log.from}</span>
                      <span style={{ color: '#888888', margin: '0 6px' }}>-&gt;</span>
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 11 }}>{log.to}</span>
                      <div style={{ color: '#cccccc', paddingLeft: 12, marginTop: 2, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                        {log.payload}
                      </div>
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
