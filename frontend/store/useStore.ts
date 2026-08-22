import { create } from 'zustand';
import { DisruptionEvent, ActiveRoute, BlockchainAudit } from '@/lib/supabase';

export type Role = 'master_coordinator' | 'port_manager' | 'field_agent' | 'compliance_officer' | 'judge';

export type AgentStatus = 'idle' | 'processing' | 'executing' | 'locked' | 'error';

export type Agent = {
  id: number;
  name: string;
  label: string;
  status: AgentStatus;
  lastActivity: string;
  processingTime?: number;
};

type AppState = {
  role: Role | null;
  setRole: (role: Role) => void;

  disruptions: DisruptionEvent[];
  setDisruptions: (events: DisruptionEvent[]) => void;
  addDisruption: (event: DisruptionEvent) => void;

  routes: ActiveRoute[];
  setRoutes: (routes: ActiveRoute[]) => void;

  auditLogs: BlockchainAudit[];
  setAuditLogs: (logs: BlockchainAudit[]) => void;

  agents: Agent[];
  setAgentStatus: (id: number, status: AgentStatus) => void;
  resetAgents: () => void;

  hitlPending: boolean;
  hitlData: { impact: number; reasoning: string; routeId: string } | null;
  setHitlPending: (pending: boolean, data?: { impact: number; reasoning: string; routeId: string }) => void;

  systemStatus: 'nominal' | 'disruption_active' | 'rerouting';
  setSystemStatus: (s: 'nominal' | 'disruption_active' | 'rerouting') => void;

  agentLogs: { ts: string; from: string; to: string; payload: string }[];
  addAgentLog: (log: { from: string; to: string; payload: string }) => void;
  clearLogs: () => void;

  penaltyAvoided: number;
  setPenaltyAvoided: (n: number) => void;

  carbonSaved: number;
  setCarbonSaved: (n: number) => void;
};

const defaultAgents: Agent[] = [
  { id: 0, name: 'agent_0', label: 'Master Orchestrator', status: 'idle', lastActivity: 'Standby' },
  { id: 1, name: 'agent_1a', label: 'News Sentiment Parser', status: 'idle', lastActivity: 'Standby' },
  { id: 2, name: 'agent_1b', label: 'Weather & Telemetry', status: 'idle', lastActivity: 'Standby' },
  { id: 3, name: 'agent_2', label: 'Graph-RL Navigator', status: 'idle', lastActivity: 'Standby' },
  { id: 4, name: 'agent_3', label: 'Constraint Validator', status: 'idle', lastActivity: 'Standby' },
  { id: 5, name: 'agent_4', label: 'Blockchain Provenance', status: 'idle', lastActivity: 'Standby' },
  { id: 6, name: 'agent_5', label: 'Explainable Audit', status: 'idle', lastActivity: 'Standby' },
  { id: 7, name: 'agent_6', label: 'ESG Carbon Engine', status: 'idle', lastActivity: 'Standby' },
  { id: 8, name: 'agent_7', label: 'Predictive Forecast', status: 'idle', lastActivity: 'Standby' },
];

export const useStore = create<AppState>((set) => ({
  role: 'master_coordinator',
  setRole: (role) => set({ role }),

  disruptions: [],
  setDisruptions: (events) => set({ disruptions: events }),
  addDisruption: (event) => set((s) => ({ disruptions: [event, ...s.disruptions] })),

  routes: [],
  setRoutes: (routes) => set({ routes }),

  auditLogs: [],
  setAuditLogs: (logs) => set({ auditLogs: logs }),

  agents: defaultAgents,
  setAgentStatus: (id, status) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, status, lastActivity: new Date().toLocaleTimeString() } : a
      ),
    })),
  resetAgents: () => set({ agents: defaultAgents }),

  hitlPending: false,
  hitlData: null,
  setHitlPending: (pending, data) => set({ hitlPending: pending, hitlData: data ?? null }),

  systemStatus: 'nominal',
  setSystemStatus: (s) => set({ systemStatus: s }),

  agentLogs: [],
  addAgentLog: (log) =>
    set((s) => ({
      agentLogs: [
        { ...log, ts: new Date().toLocaleTimeString('en', { hour12: false }) },
        ...s.agentLogs.slice(0, 199),
      ],
    })),
  clearLogs: () => set({ agentLogs: [] }),

  penaltyAvoided: 0,
  setPenaltyAvoided: (n) => set({ penaltyAvoided: n }),

  carbonSaved: 0,
  setCarbonSaved: (n) => set({ carbonSaved: n }),
}));
