'use client';

import { useStore } from '@/store/useStore';
import { CheckCircle, XCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HITLModal() {
  const { hitlData, setHitlPending, addAgentLog, setSystemStatus, setPenaltyAvoided } = useStore();

  if (!hitlData) return null;

  const handleApprove = async () => {
    addAgentLog({ from: 'Human Coordinator', to: 'Agent 4', payload: JSON.stringify({ decision: 'APPROVED', route_id: hitlData.routeId, timestamp: new Date().toISOString() }) });
    setSystemStatus('rerouting');
    // Write to blockchain_audit table
    try {
      await supabase.from('blockchain_audit').insert({
        tx_hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        block_number: Math.floor(4800000 + Math.random() * 100000),
        cargo_id: 'CARGO_2291',
        action_type: 'REROUTE_APPROVED',
        financial_impact_usd: hitlData.impact,
        reasoning_markdown: hitlData.reasoning,
        contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
      });
    } catch (e) {
      console.error(e);
    }
    setPenaltyAvoided(180000);
    setTimeout(() => setSystemStatus('nominal'), 3000);
    setHitlPending(false);
  };

  const handleReject = () => {
    addAgentLog({ from: 'Human Coordinator', to: 'Agent 0', payload: JSON.stringify({ decision: 'REJECTED', route_id: hitlData.routeId }) });
    setHitlPending(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(4,6,8,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fade-in 0.2s ease-out',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 16, padding: 28, maxWidth: 560, width: '90%',
        animation: 'slide-in-top 0.3s ease-out',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Human Approval Required</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Agent 5 has escalated this decision</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className="badge badge-critical">THRESHOLD EXCEEDED</span>
          </div>
        </div>

        {/* Impact */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20,
        }}>
          <div style={{ flex: 1, padding: '12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>FINANCIAL IMPACT</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>
              ${hitlData.impact.toLocaleString()}
            </div>
          </div>
          <div style={{ flex: 1, padding: '12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>THRESHOLD</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-secondary)' }}>$50,000</div>
          </div>
          <div style={{ flex: 1, padding: '12px', background: 'rgba(34,197,94,0.05)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>PENALTY AVOIDED</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>$180,000</div>
          </div>
        </div>

        {/* Reasoning */}
        <div style={{
          background: '#020408', borderRadius: 8, padding: 14, marginBottom: 20,
          border: '1px solid var(--border-subtle)', maxHeight: 160, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em' }}>AGENT 5 REASONING</div>
          <pre style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>
            {hitlData.reasoning}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-success"
            onClick={handleApprove}
            style={{ flex: 1, padding: '12px' }}
          >
            <CheckCircle size={16} />
            Approve Reroute
          </button>
          <button
            className="btn btn-danger"
            onClick={handleReject}
            style={{ flex: 1, padding: '12px' }}
          >
            <XCircle size={16} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
