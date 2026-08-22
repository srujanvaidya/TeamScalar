'use client';

import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function HITLModal() {
  const { hitlData, setHitlPending, addAgentLog, setSystemStatus, setPenaltyAvoided } = useStore();

  if (!hitlData) return null;

  const handleApprove = async () => {
    addAgentLog({ from: 'Human Coordinator', to: 'Agent 4', payload: JSON.stringify({ decision: 'APPROVED', route_id: hitlData.routeId, timestamp: new Date().toISOString() }) });
    setSystemStatus('rerouting');
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
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)', padding: 20
    }}>
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #333333',
        borderRadius: 12, padding: 32, maxWidth: 560, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#ffffff' }}>Human Approval Required</div>
            <div style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>Agent 5 has escalated this reroute decision</div>
          </div>
          <span className="badge badge-critical">THRESHOLD EXCEEDED</span>
        </div>

        {/* Impact */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: '12px', background: '#000000', borderRadius: 6, border: '1px solid #222222' }}>
            <div style={{ fontSize: 10, color: '#888888', marginBottom: 4, fontWeight: 700 }}>FINANCIAL IMPACT</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>
              ${hitlData.impact.toLocaleString()}
            </div>
          </div>
          <div style={{ flex: 1, padding: '12px', background: '#000000', borderRadius: 6, border: '1px solid #222222' }}>
            <div style={{ fontSize: 10, color: '#888888', marginBottom: 4, fontWeight: 700 }}>THRESHOLD</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>$50,000</div>
          </div>
          <div style={{ flex: 1, padding: '12px', background: '#000000', borderRadius: 6, border: '1px solid #222222' }}>
            <div style={{ fontSize: 10, color: '#888888', marginBottom: 4, fontWeight: 700 }}>PENALTY AVOIDED</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>$180,000</div>
          </div>
        </div>

        {/* Reasoning */}
        <div style={{
          background: '#000000', borderRadius: 6, padding: 14, marginBottom: 24,
          border: '1px solid #222222', maxHeight: 160, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, color: '#888888', marginBottom: 8, letterSpacing: '0.1em', fontWeight: 700 }}>AGENT 5 REASONING</div>
          <pre style={{ fontSize: 12, color: '#ffffff', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
            {hitlData.reasoning}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleApprove}
            style={{
              flex: 1, padding: '12px', background: '#ffffff', color: '#000000',
              fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer'
            }}
          >
            Approve Reroute
          </button>
          <button
            onClick={handleReject}
            style={{
              flex: 1, padding: '12px', background: '#111111', color: '#ffffff',
              fontWeight: 700, fontSize: 13, border: '1px solid #333333',
              borderRadius: 6, cursor: 'pointer'
            }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
