'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';

type AgentFunnelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  missionData?: any;
};

const STAGES = [
  {
    id: 'agent_0',
    title: 'Agent 0: Master Orchestrator (Ingest)',
    desc: 'Ingests container metadata, SLA epoch deadline, baseline freight cost, and destination node.',
    role: 'ORCHESTRATOR',
  },
  {
    id: 'agent_1',
    title: 'Agent 1A & 1B: Threat Perception & Weather Radars',
    desc: 'Parses unstructured RSS news alerts and scans Open-Meteo vessel wave height & wind speed telemetry.',
    role: 'PERCEPTION',
  },
  {
    id: 'agent_2',
    title: 'Agent 2: Multimodal Graph-RL Pathfinder',
    desc: 'Explores NetworkX directed weighted graphs for ocean detours, air cargo bridges, rail corridors & warehouse safety stock.',
    role: 'PATHFINDER',
  },
  {
    id: 'agent_3',
    title: 'Agent 3: Route Policy & SLA Constraint Validator',
    desc: 'Queries warehouse stock, quay berth availability, and checks VIP customer SLA tier deadlines.',
    role: 'VALIDATOR',
  },
  {
    id: 'agent_5',
    title: 'Agent 5: Financial Risk & Safeguard Gate',
    desc: 'Evaluates HazMat Class 3 compliance, calculates cost deltas against $50,000 ceiling, and gates HITL approvals.',
    role: 'SAFEGUARD',
  },
  {
    id: 'agent_4',
    title: 'Agent 4: Polygon Amoy Cryptographic Settlement',
    desc: 'Anchors Keccak256 hash payload onto Polygon Amoy smart contract and generates dispute-proof verification receipt.',
    role: 'BLOCKCHAIN ANCHOR',
  },
];

export default function AgentFunnelModal({ isOpen, onClose, missionData }: AgentFunnelModalProps) {
  const { agents, agentLogs } = useStore();
  const [activeStage, setActiveStage] = useState<number>(0);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#0a0a0a', width: '100%', maxWidth: 900, borderRadius: 12,
        border: '1px solid #262626', padding: 32, display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              REAL-TIME EXECUTION FUNNEL // MULTI-AGENT DAG
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
              Multi-Agent Workflow Inspector
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              style={{
                background: showJsonInspector ? '#ffffff' : '#111111',
                color: showJsonInspector ? '#000000' : '#ffffff',
                border: '1px solid #333333', padding: '6px 14px', borderRadius: 6,
                fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              {showJsonInspector ? 'Hide JSON Inspector' : 'Toggle Raw JSON Inspector'}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', fontSize: 20, color: '#888888', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 6-Stage Horizontal Pipeline Handoff Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 24 }}>
          {STAGES.map((stg, idx) => {
            const isActive = activeStage === idx;
            return (
              <div
                key={stg.id}
                onClick={() => setActiveStage(idx)}
                style={{
                  background: isActive ? '#ffffff' : '#111111',
                  color: isActive ? '#000000' : '#ffffff',
                  border: isActive ? '1px solid #ffffff' : '1px solid #222222',
                  borderRadius: 6, padding: '10px 8px', cursor: 'pointer',
                  textAlign: 'center', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>STAGE 0{idx + 1}</div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stg.role}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Stage Details */}
        <div style={{ background: '#000000', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {STAGES[activeStage].title}
            </h4>
            <span style={{ background: '#181818', border: '1px solid #333333', color: '#ffffff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
              VERIFIED ACTIVE
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#888888', margin: 0, lineHeight: 1.5 }}>
            {STAGES[activeStage].desc}
          </p>
        </div>

        {/* JSON Inspector View / Telemetry Stream */}
        {showJsonInspector ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#050505', border: '1px solid #222222', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
              RAW INTER-AGENT JSON PAYLOAD // STAGE 0{activeStage + 1}
            </div>
            <pre style={{ flex: 1, margin: 0, color: '#ffffff', background: '#000000', padding: 14, borderRadius: 6, overflow: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, border: '1px solid #1a1a1a' }}>
{JSON.stringify(missionData || { stage: STAGES[activeStage].role, active_agent: STAGES[activeStage].id, logs: agentLogs }, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#000000', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888888', marginBottom: 8, letterSpacing: '0.08em' }}>
              REAL-TIME INTER-AGENT TELEMETRY STREAM
            </div>
            <div className="scroll-y" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agentLogs.length === 0 ? (
                <div style={{ fontSize: 12, color: '#666666', fontStyle: 'italic', padding: 12 }}>
                  Ingest a disruption scenario to watch multi-agent handoffs in real-time...
                </div>
              ) : (
                agentLogs.map((log, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #111111', paddingBottom: 6 }}>
                    <span style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, marginRight: 8 }}>[{log.ts}]</span>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 11 }}>{log.from}</span>
                    <span style={{ color: '#888888', margin: '0 6px' }}>-&gt;</span>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 11 }}>{log.to}</span>
                    <div style={{ color: '#aaaaaa', paddingLeft: 12, marginTop: 2, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                      {log.payload}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ background: '#ffffff', color: '#000000', fontWeight: 800, padding: '10px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
