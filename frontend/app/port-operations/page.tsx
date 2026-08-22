'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Anchor, Sliders, Upload, QrCode, Star, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';

type BerthStatus = 'docked' | 'anchoring' | 'blocked' | 'available';

const BERTHS: { id: string; vessel: string; status: BerthStatus; cargo: string; eta?: string }[] = [
  { id: 'BERTH_01', vessel: 'MV Ever Growth', status: 'docked', cargo: 'CARGO_2291 — Electronics', eta: 'Completing' },
  { id: 'BERTH_02', vessel: 'MV Cosco Fortune', status: 'anchoring', cargo: 'CARGO_1847 — Textiles', eta: '~4h' },
  { id: 'BERTH_03', vessel: 'MSC Aurora', status: 'blocked', cargo: 'CARGO_0382 — HazMat', eta: 'Strike hold' },
  { id: 'BERTH_04', vessel: '—', status: 'available', cargo: '—', eta: '—' },
  { id: 'BERTH_05', vessel: 'MV Pacific Star', status: 'docked', cargo: 'CARGO_1203 — Auto Parts', eta: 'Completing' },
  { id: 'BERTH_06', vessel: 'MV Atlantic Wind', status: 'anchoring', cargo: 'CARGO_0999 — Food & Beverage', eta: '~7h' },
  { id: 'BERTH_07', vessel: '—', status: 'available', cargo: '—', eta: '—' },
  { id: 'BERTH_08', vessel: 'MV Golden Dragon', status: 'blocked', cargo: 'CARGO_3311 — Machinery', eta: 'Crane fault' },
  { id: 'BERTH_09', vessel: 'MV Nordic Ice', status: 'docked', cargo: 'CARGO_2100 — Frozen Goods', eta: 'Completing' },
  { id: 'BERTH_10', vessel: 'MV Strait Runner', status: 'anchoring', cargo: 'CARGO_0741 — Chemicals', eta: '~2h' },
  { id: 'BERTH_11', vessel: '—', status: 'available', cargo: '—', eta: '—' },
  { id: 'BERTH_12', vessel: 'MV Orange Pearl', status: 'docked', cargo: 'CARGO_1580 — Consumer Goods', eta: 'Unloading' },
];

const CARRIERS = [
  { name: 'Maersk Line', onTime: 94, volatile: 'Low', cancel: 1.2, score: 9.2, tier: 'Premium' },
  { name: 'MSC', onTime: 88, volatile: 'Medium', cancel: 2.8, score: 7.6, tier: 'Standard' },
  { name: 'Evergreen', onTime: 72, volatile: 'High', cancel: 5.1, score: 5.3, tier: 'Watchlist' },
  { name: 'COSCO', onTime: 85, volatile: 'Medium', cancel: 3.0, score: 7.1, tier: 'Standard' },
  { name: 'CMA CGM', onTime: 90, volatile: 'Low', cancel: 1.8, score: 8.5, tier: 'Premium' },
];

const STATUS_CONFIG: Record<BerthStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  docked: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'DOCKED', icon: CheckCircle },
  anchoring: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: 'ANCHORING', icon: Clock },
  blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'BLOCKED', icon: AlertTriangle },
  available: { color: 'var(--text-muted)', bg: 'var(--bg-raised)', label: 'AVAILABLE', icon: Package },
};

export default function PortOperationsPage() {
  const { role } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.push('/');
    }
  }, [role, router]);

  const [params, setParams] = useState({
    berthWaitHours: 4,
    demurrageRate: 8000,
    craneShortagePct: 15,
    truckAvailability: 75,
    hazmatRestrictions: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Write to Supabase
    try {
      await supabase.from('port_constraints' as string).upsert({
        port_id: 'PORT_ROTTERDAM_02',
        berth_wait_hours: params.berthWaitHours,
        demurrage_rate_usd: params.demurrageRate,
        crane_shortage_pct: params.craneShortagePct,
        truck_availability_pct: params.truckAvailability,
        hazmat_restricted: params.hazmatRestrictions,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tierConfig: Record<string, { color: string; icon: string }> = {
    Premium: { color: '#22c55e', icon: 'PREMIUM' },
    Standard: { color: '#60a5fa', icon: 'STANDARD' },
    Watchlist: { color: '#eab308', icon: 'WATCHLIST' },
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-deep)',
        gap: 12, flexShrink: 0,
      }}>
        <Anchor size={16} color="var(--text-muted)" />
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Port & Terminal Operations — Rotterdam (PORT_ROTTERDAM_02)</span>
        <span className="badge badge-medium" style={{ marginLeft: 'auto' }}>CONGESTION PREDICTED</span>
      </header>

      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* Left: Berth Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>Terminal Berth Status Grid</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['docked', 'anchoring', 'blocked', 'available'] as BerthStatus[]).map(s => {
                const c = STATUS_CONFIG[s];
                const count = BERTHS.filter(b => b.status === s).length;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{count} {c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="scroll-y" style={{ flex: 1, padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {BERTHS.map(berth => {
                const cfg = STATUS_CONFIG[berth.status];
                const Icon = cfg.icon;
                return (
                  <div key={berth.id} style={{
                    background: cfg.bg,
                    border: `1px solid ${berth.status === 'blocked' ? 'rgba(239,68,68,0.25)' : berth.status === 'docked' ? 'rgba(34,197,94,0.15)' : 'var(--border-subtle)'}`,
                    borderRadius: 10, padding: 12, transition: 'all 0.2s',
                    cursor: 'default',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em' }}>{berth.id}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon size={10} color={cfg.color} />
                        <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {berth.vessel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{berth.cargo}</div>
                    {berth.eta !== '—' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} color="var(--text-muted)" />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ETA: {berth.eta}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carrier Scorecard */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', height: 200, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>Carrier Scorecard</span>
            </div>
            <div className="scroll-y" style={{ height: 'calc(100% - 36px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Carrier', 'On-Time %', 'Rate Volatility', 'Cancellation', 'Score', 'Tier'].map(h => (
                      <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CARRIERS.map(c => {
                    const tc = tierConfig[c.tier];
                    return (
                      <tr key={c.name} className="table-row">
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                        <td style={{ padding: '6px 12px', color: c.onTime > 90 ? '#22c55e' : c.onTime > 80 ? '#eab308' : '#ef4444' }}>{c.onTime}%</td>
                        <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{c.volatile}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{c.cancel}%</td>
                        <td style={{ padding: '6px 12px', fontWeight: 700, color: 'var(--accent)' }}>{c.score}/10</td>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{ fontSize: 11, color: tc.color }}>
                            {tc.icon} {c.tier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Parameter Panel */}
        <div style={{ width: 320, background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={14} color="var(--text-muted)" />
              <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>Live Parameter Adjustment</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Changes propagate to Agent 0 in real time
            </div>
          </div>

          <div className="scroll-y" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Berth Wait Hours */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Berth Wait Hours</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{params.berthWaitHours}h</span>
              </div>
              <input
                type="range" min={0} max={72} value={params.berthWaitHours}
                onChange={e => setParams(p => ({ ...p, berthWaitHours: +e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>0h</span><span>72h</span>
              </div>
            </div>

            {/* Demurrage Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Demurrage Rate ($/day)</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>${params.demurrageRate.toLocaleString()}</span>
              </div>
              <input
                type="number" className="input" value={params.demurrageRate}
                onChange={e => setParams(p => ({ ...p, demurrageRate: +e.target.value }))}
                min={0} max={50000} step={500}
              />
            </div>

            {/* Crane Shortage */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Crane Shortage Index</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: params.craneShortagePct > 50 ? '#ef4444' : params.craneShortagePct > 25 ? '#eab308' : '#22c55e' }}>
                  {params.craneShortagePct}%
                </span>
              </div>
              <input
                type="range" min={0} max={100} value={params.craneShortagePct}
                onChange={e => setParams(p => ({ ...p, craneShortagePct: +e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* Truck Availability */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Drayage Truck Availability</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: params.truckAvailability > 60 ? '#22c55e' : '#ef4444' }}>
                  {params.truckAvailability}%
                </span>
              </div>
              <input
                type="range" min={0} max={100} value={params.truckAvailability}
                onChange={e => setParams(p => ({ ...p, truckAvailability: +e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* HazMat toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', background: 'var(--bg-raised)', borderRadius: 8,
              border: `1px solid ${params.hazmatRestrictions ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>HazMat Restrictions</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Blocks hazardous cargo transit</div>
              </div>
              <button
                onClick={() => setParams(p => ({ ...p, hazmatRestrictions: !p.hazmatRestrictions }))}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: params.hazmatRestrictions ? '#ef4444' : 'var(--bg-void)',
                  border: `1px solid ${params.hazmatRestrictions ? '#ef4444' : 'var(--border-default)'}`,
                  cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3,
                  left: params.hazmatRestrictions ? 24 : 3,
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {/* Summary stats */}
            <div style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>IMPACT ESTIMATE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily demurrage exposure</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444' }}>
                    ${(params.demurrageRate * BERTHS.filter(b => b.status === 'blocked').length).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Route delay impact</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#eab308' }}>
                    +{params.berthWaitHours}h avg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '10px' }}
            >
              <Upload size={14} />
              {saving ? 'Updating...' : saved ? '✓ Updated!' : 'Push Live Updates to Network'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setQrVisible(v => !v)}
              style={{ width: '100%', padding: '10px' }}
            >
              <QrCode size={14} />
              {qrVisible ? 'Hide QR' : 'Generate Cargo QR Code'}
            </button>
            {qrVisible && (
              <div style={{
                padding: 16, background: 'var(--bg-raised)', borderRadius: 8,
                border: '1px solid var(--border-subtle)', textAlign: 'center',
              }}>
                {/* QR code visual (styled SVG grid) */}
                <div style={{
                  width: 100, height: 100, margin: '0 auto 8px',
                  background: 'white', borderRadius: 4, padding: 8,
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1,
                }}>
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div key={i} style={{
                      background: Math.random() > 0.4 ? '#000' : '#fff',
                      borderRadius: 1,
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CARGO_2291 · ROUTE_ALT_902</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  0x48B0...4D74
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
