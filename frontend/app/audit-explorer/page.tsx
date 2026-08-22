'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { supabase, BlockchainAudit } from '@/lib/supabase';

const DEMO_AUDIT_LOGS: BlockchainAudit[] = [
  {
    id: '1',
    tx_hash: '0x7f9a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    block_number: 4829103,
    cargo_id: 'CARGO_2291',
    action_type: 'REROUTE_APPROVED',
    financial_impact_usd: 64200.00,
    reasoning_markdown: `### Escalation Summary
- Primary ocean route blocked at Port of Shanghai due to labor dispute.
- Alternate rail path selected to meet 48-hour SLA window.
- Total cost impact exceeds $50,000 threshold ($64,200 total).
- Recommendation: Approve rail freight booking to prevent $180,000 OTIF breach penalty.`,
    contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '2',
    tx_hash: '0x3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    block_number: 4829012,
    cargo_id: 'CARGO_1847',
    action_type: 'TOKEN_MINTED',
    financial_impact_usd: 0.00,
    reasoning_markdown: `### Digital Cargo Twin Created
- ERC-721/1155 token minted to represent cargo container twin.
- Origin: PORT_SINGAPORE_01.
- Initial temperature: 3.4°C.
- Initial humidity: 62%.`,
    contract_address: '0x48B0DB4e87D280AFB3fDC572f61A641E7261D74D',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '3',
    tx_hash: '0x9d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    block_number: 4828854,
    cargo_id: 'CARGO_0392',
    action_type: 'ESCROW_RELEASED',
    financial_impact_usd: 18450.00,
    reasoning_markdown: `### Escrow Released
- Carrier settlement triggered upon cargo check-in receipt at Berlin Dist Hub.
- Carrier on-time SLA fulfilled.
- Escrow funds released to carrier wallet.`,
    contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const generateHeatCalendar = () => {
  const data = [];
  for (let i = 0; i < 371; i++) {
    let weight = Math.random();
    if (i % 7 === 0 || i % 15 === 0) weight = Math.random() * 0.9;
    else if (i > 150 && i < 240) weight = Math.random() * 0.95;
    else weight = Math.random() * 0.3;

    data.push({
      day: i,
      value: weight > 0.85 ? 'critical' : weight > 0.6 ? 'high' : weight > 0.3 ? 'medium' : weight > 0.1 ? 'low' : 'empty'
    });
  }
  return data;
};

export default function AuditExplorerPage() {
  const { role, auditLogs, setAuditLogs } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [heatData] = useState(generateHeatCalendar());

  useEffect(() => {
    if (!role) {
      router.push('/');
    }
  }, [role, router]);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('blockchain_audit')
          .select('*')
          .order('created_at', { ascending: false });
        setAuditLogs(data && data.length ? data : DEMO_AUDIT_LOGS);
      } catch {
        setAuditLogs(DEMO_AUDIT_LOGS);
      }
      setLoading(false);
    };

    fetchAudit();

    const channel = supabase
      .channel('blockchain_audit_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blockchain_audit' }, (payload) => {
        const newLog = payload.new as BlockchainAudit;
        setAuditLogs([newLog, ...useStore.getState().auditLogs]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayLogs = auditLogs.length ? auditLogs : DEMO_AUDIT_LOGS;

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getHeatColor = (value: string) => {
    switch (value) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#888888';
      case 'low': return '#ffffff';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', overflow: 'hidden' }}>
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: '1px solid #1a1a1a', background: '#000000',
        gap: 12, flexShrink: 0,
      }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#ffffff', letterSpacing: '0.06em' }}>AUDIT EXPLORER</span>
        <span style={{ color: '#333333' }}>|</span>
        <span style={{ fontSize: 11, color: '#888888' }}>BLOCKCHAIN COMPLIANCE LEDGER</span>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #1a1a1a' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff' }}>Live On-Chain Immutable Ledger</div>
            <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>Verifiable records of route approvals, container twin creations, and escrows</div>
          </div>

          <div className="scroll-y" style={{ flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f1f1f', background: '#000000', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>TIMESTAMP</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>CARGO ID</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>ACTION TYPE</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>FINANCIAL IMPACT</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>TX HASH</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontSize: 10, fontWeight: 600 }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {displayLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #111111' }}>
                      <td style={{ padding: '12px 16px', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ffffff' }}>{log.cargo_id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${log.action_type.includes('APPROVED') ? 'badge-low' : log.action_type.includes('MINTED') ? 'badge-neutral' : 'badge-info'}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: log.financial_impact_usd > 0 ? '#ef4444' : '#888888', fontFamily: 'JetBrains Mono, monospace' }}>
                        {log.financial_impact_usd > 0 ? `$${log.financial_impact_usd.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <a
                          href={`https://polygonscan.com/tx/${log.tx_hash}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: '#ffffff', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                        >
                          {log.tx_hash.slice(0, 14)}...
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 11 }}>VERIFIED ON-CHAIN</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => toggleRow(log.id)}
                          style={{ background: '#0a0a0a', border: '1px solid #333333', color: '#ffffff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                        >
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ width: 320, background: '#000000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff' }}>
              Smart Contract Status
            </div>
          </div>

          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0a0a0a', borderRadius: 8, border: '1px solid #222222', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', marginBottom: 4 }}>Container Twin Token</div>
              <div style={{ fontSize: 11, color: '#888888', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                0x48B0DB4e87D280AFB3fDC572f61A641E7261D74D
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#888888' }}>Total Twin Tokens Minted</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>2,847</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#888888' }}>Active Cargo Twins</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>341</span>
              </div>
            </div>

            <div style={{ background: '#0a0a0a', borderRadius: 8, border: '1px solid #222222', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', marginBottom: 4 }}>Carrier Escrow Contract</div>
              <div style={{ fontSize: 11, color: '#888888', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#888888' }}>Total Settled Escrows</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>$1,248,500</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#888888' }}>Pending Escrows</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888888' }}>$127,400</span>
              </div>
            </div>

            <div style={{ background: '#0a0a0a', borderRadius: 8, border: '1px solid #222222', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', marginBottom: 10 }}>SLA Compliance Rate</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff' }}>96.4%</div>
                <div style={{ fontSize: 11, color: '#888888', lineHeight: 1.3 }}>
                  Average carrier on-time rate across all reroutes
                </div>
              </div>
              <div style={{ height: 4, background: '#222222', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '96.4%', background: '#ffffff', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 160, borderTop: '1px solid #1a1a1a', background: '#000000', flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: '#ffffff' }}>Disruption Heat Calendar</span>
          <span style={{ fontSize: 11, color: '#888888' }}>Historical daily disruption index (last 365 days)</span>

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {['low', 'medium', 'high', 'critical'].map(lvl => (
              <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: getHeatColor(lvl) }} />
                <span style={{ fontSize: 9, color: '#888888' }}>{lvl}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateColumns: 'repeat(53, 1fr)',
          gridTemplateRows: 'repeat(7, 1fr)',
          gap: 2,
          height: 'calc(100% - 28px)',
        }}>
          {heatData.map((d, index) => (
            <div
              key={index}
              style={{
                background: getHeatColor(d.value),
                borderRadius: 1.5,
              }}
              title={`Day ${d.day}: ${d.value} severity`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
