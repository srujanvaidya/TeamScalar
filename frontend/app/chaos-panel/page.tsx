'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore, AgentStatus } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Zap, Play, Terminal, CheckCircle2, AlertOctagon, HelpCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PRESETS = [
  {
    name: '🌊 Typhoon East China Sea',
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
    name: '🚢 Hormuz Naval Blockade',
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
    name: '🚂 Europe Rail Strike',
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
    name: '❄️ Arctic Weather Freeze',
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

  // Auto scroll terminal to bottom when logs update
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
    const label = isPreset ? payload.name : `NLP Disruption: "${payload.text.slice(0, 30)}..."`;

    // 1. Write incident to Supabase
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

    // 2. Cascade Agent states & logs step-by-step
    const steps = [
      { agentId: 0, status: 'processing' as AgentStatus, log: 'Master Orchestrator activated. Ingesting disruption signal...' },
      { agentId: 1, status: 'processing' as AgentStatus, log: `Agent 1A parsing unstructured inputs for ${incidentId}...` },
      { agentId: 1, status: 'locked' as AgentStatus, log: `Agent 1A Output locked. Severity: ${isPreset ? payload.severity : 'CRITICAL'}, Node: ${isPreset ? payload.affected_node : 'PORT_SHANGHAI_01'}` },
      { agentId: 2, status: 'processing' as AgentStatus, log: 'Agent 1B scanning environmental weather feeds near target nodes...' },
      { agentId: 2, status: 'locked' as AgentStatus, log: 'Agent 1B telemetry check complete. Anomaly confirmation set to TRUE.' },
      { agentId: 0, status: 'processing' as AgentStatus, log: 'Master Orchestrator dispatching reroute tasks to Graph-RL Agent...' },
      { agentId: 3, status: 'processing' as AgentStatus, log: 'Agent 2 calculating shortest paths on Directed Weighted Graph G=(V,E)...' },
      { agentId: 3, status: 'locked' as AgentStatus, log: 'Agent 2 selected candidates: ROUTE_ALT_902 (Rail→Truck) vs ROUTE_ALT_903 (Air→Truck).' },
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

    // Trigger HITL if critical/high (or simply trigger for demo)
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
- Primary ocean route blocked at **Port of Shanghai** due to strike blockade.
- Alternate rail route **ROUTE_ALT_902** selected.
- Reroute cost impact: **$64,200** (exceeds $50,000 limit).
- **Action Required:** Approve to execute carrier bookings on-chain and prevent $180,000 SLA penalty.`,
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
      case 'processing': return <span className="badge badge-info animate-pulse">PROCESSING</span>;
      case 'executing': return <span className="badge badge-medium">EXECUTING TOOL</span>;
      case 'locked': return <span className="badge badge-low">LOCKED</span>;
      case 'error': return <span className="badge badge-critical">ERROR</span>;
      default: return <span className="badge badge-neutral">IDLE</span>;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-deep)',
        gap: 12, flexShrink: 0,
      }}>
        <Zap size={16} color="var(--text-muted)" />
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Chaos Engineering & Simulation Panel</span>
        <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>JUDGE SIMULATION MODE</span>
      </header>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Signal Injection */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-deep)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>Inject Synthetic Disruptions</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Simulate real-world stress triggers and observe multi-agent orchestration</div>
          </div>

          <div className="scroll-y" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* NLP Disruption */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Natural Language Disruption (NLP)
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Typhoon warning near Shanghai. Heavy labor strike at Rotterdam causing berth delays of 3 days."
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                style={{ resize: 'none', fontSize: 12 }}
                disabled={injecting}
              />
              <button
                className="btn btn-primary"
                onClick={handleNlInject}
                style={{ width: '100%', marginTop: 8 }}
                disabled={injecting || !nlInput.trim()}
              >
                <Play size={12} />
                Inject Signal
              </button>
            </div>

            {/* Presets separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>OR SELECT A PRESET</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            {/* Presets */}
            {PRESETS.map((p) => (
              <div
                key={p.name}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, padding: 12, cursor: injecting ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => !injecting && runSimulation(p)}
                onMouseEnter={e => !injecting && (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  {p.name}
                  <Zap size={11} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Monitor & Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Agent State Grid */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 12 }}>Active Agent Monitor</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {agents.map((agent) => (
                <div key={agent.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{agent.label}</span>
                    {getStatusBadge(agent.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>Last Act:</span>
                    <span className="text-mono">{agent.lastActivity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal / Comms Log */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Terminal size={14} color="var(--text-secondary)" />
              <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>Inter-Agent JSON Stream</span>
              <button
                className="btn btn-ghost"
                onClick={clearLogs}
                style={{ marginLeft: 'auto', padding: '3px 8px', fontSize: 10 }}
              >
                Clear Stream
              </button>
            </div>

            <div className="terminal scroll-y" style={{ flex: 1, background: '#020406' }}>
              {agentLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: 8 }}>
                  Standby. Ingest disruption signal to start stream...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {agentLogs.map((log, index) => (
                    <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>[{log.ts}]</span>
                      <span style={{ color: '#60a5fa', fontWeight: 600 }}>{log.from}</span>
                      <span style={{ color: 'var(--text-muted)' }}> → </span>
                      <span style={{ color: '#c8d8f0', fontWeight: 600 }}>{log.to}</span>
                      <div style={{ color: '#e2e8f0', paddingLeft: 12, marginTop: 2, fontSize: 11 }}>
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
