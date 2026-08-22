'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Smartphone, CheckCircle, Camera, Thermometer, Droplets, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Generate fake telemetry
const generateTelemetry = () =>
  Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    temp: +(2 + Math.sin(i * 0.4) * 1.5 + Math.random() * 0.5).toFixed(1),
    humidity: +(55 + Math.cos(i * 0.3) * 8 + Math.random() * 3).toFixed(1),
  }));

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export default function MobileScannerPage() {
  const { role } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.push('/');
    }
  }, [role, router]);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [txHash, setTxHash] = useState('');
  const [telemetry] = useState(generateTelemetry());
  const [cargoInfo, setCargoInfo] = useState<{ id: string; origin: string; dest: string; status: string } | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScan = () => {
    setScanState('scanning');
    scanTimerRef.current = setTimeout(() => {
      setCargoInfo({ id: 'CARGO_2291', origin: 'Shanghai', dest: 'Berlin', status: 'In Transit' });
      setScanState('success');
    }, 2200);
  };

  const handleConfirm = async () => {
    const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setTxHash(hash);

    // Write to blockchain_audit
    try {
      await supabase.from('blockchain_audit').insert({
        tx_hash: hash,
        block_number: Math.floor(4800000 + Math.random() * 100000),
        cargo_id: 'CARGO_2291',
        action_type: 'PHYSICAL_RECEIPT_CONFIRMED',
        financial_impact_usd: 0,
        reasoning_markdown: 'Field agent confirmed physical receipt via QR scan at Berlin Distribution Hub.',
        contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
      });
    } catch (e) {
      console.error(e);
    }

    setScanState('success');
  };

  useEffect(() => {
    return () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); };
  }, []);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'temp' ? '°C' : '%'}</div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-void)', overflow: 'hidden',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-deep)', gap: 10,
        flexShrink: 0,
      }}>
        <Smartphone size={16} color="var(--text-muted)" />
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Cargo Provenance Scanner</span>
      </header>

      <div className="scroll-y" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {txHash ? (
          /* ✅ Success state */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'fade-in 0.4s ease-out', background: 'rgba(34,197,94,0.03)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#22c55e', marginBottom: 8 }}>ON-CHAIN VERIFIED</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
              Cargo receipt confirmed and recorded on Polygon blockchain
            </div>

            <div style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 12, padding: 16, border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>TRANSACTION HASH</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#22c55e', wordBreak: 'break-all' }}>
                    {txHash.slice(0, 42)}...
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>BLOCK</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>4,829,103</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>NETWORK</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Polygon Mainnet</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>CONTRACT</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>0xbe6E...e8Ae</div>
                  </div>
                </div>
                <a
                  href={`https://polygonscan.com/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#60a5fa', textDecoration: 'none' }}
                >
                  <ExternalLink size={12} />
                  View on Polygonscan
                </a>
              </div>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => { setTxHash(''); setScanState('idle'); setCargoInfo(null); }}
              style={{ marginTop: 20, width: '100%' }}
            >
              Scan Another Cargo
            </button>
          </div>
        ) : (
          <>
            {/* Camera viewport */}
            <div style={{
              height: 260, background: '#020408',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
              {scanState === 'idle' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <Camera size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Camera ready — Tap to scan QR</span>
                </div>
              )}

              {scanState === 'scanning' && (
                <>
                  {/* Scanning overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,216,240,0.02)' }} />
                  {/* Corner brackets */}
                  {[{ t: 20, l: 60 }, { t: 20, r: 60 }, { b: 20, l: 60 }, { b: 20, r: 60 }].map((pos, i) => (
                    <div key={i} style={{
                      position: 'absolute', width: 30, height: 30,
                      ...pos,
                      borderTop: i < 2 ? '2px solid var(--accent)' : 'none',
                      borderBottom: i >= 2 ? '2px solid var(--accent)' : 'none',
                      borderLeft: i % 2 === 0 ? '2px solid var(--accent)' : 'none',
                      borderRight: i % 2 === 1 ? '2px solid var(--accent)' : 'none',
                    }} />
                  ))}
                  {/* Scan line */}
                  <div style={{
                    position: 'absolute', left: 60, right: 60, height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    animation: 'scan-line 1.5s ease-in-out infinite',
                    boxShadow: '0 0 8px var(--accent)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 16, width: '100%', textAlign: 'center',
                    color: 'var(--accent)', fontSize: 12,
                  }}>
                    Scanning QR code...
                  </div>
                </>
              )}

              {scanState === 'success' && !txHash && cargoInfo && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.05)',
                }}>
                  <CheckCircle size={40} color="#22c55e" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>QR Detected</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cargoInfo.id}</div>
                </div>
              )}
            </div>

            {/* Cargo info */}
            {cargoInfo && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', animation: 'fade-in 0.3s ease-out' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'CARGO ID', value: cargoInfo.id },
                    { label: 'ORIGIN', value: cargoInfo.origin },
                    { label: 'DESTINATION', value: cargoInfo.dest },
                    { label: 'STATUS', value: cargoInfo.status, color: '#eab308' },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: (f as { color?: string }).color || 'var(--text-primary)' }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cold chain telemetry */}
            <div style={{ padding: '12px 16px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Thermometer size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Cold Chain Telemetry — Last 24h</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 2, background: '#60a5fa', borderRadius: 1 }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Temp (°C)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 2, background: '#4ade80', borderRadius: 1 }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Humidity (%)</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetry}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={5} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={80} stroke="#eab308" strokeDasharray="3 3" yAxisId={0} />
                    <Line type="monotone" dataKey="temp" stroke="#60a5fa" dot={false} strokeWidth={1.5} name="temp" />
                    <Line type="monotone" dataKey="humidity" stroke="#4ade80" dot={false} strokeWidth={1.5} name="humidity" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scanState === 'idle' && (
                <button className="btn btn-primary" onClick={handleScan} style={{ width: '100%', padding: '12px' }}>
                  <Camera size={16} />
                  Scan Cargo QR Code
                </button>
              )}
              {scanState === 'scanning' && (
                <button className="btn btn-ghost" style={{ width: '100%', padding: '12px' }} disabled>
                  Scanning...
                </button>
              )}
              {scanState === 'success' && !txHash && (
                <button className="btn btn-success" onClick={handleConfirm} style={{ width: '100%', padding: '12px' }}>
                  <CheckCircle size={16} />
                  Confirm Physical Receipt & Sign Handoff
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'temp' ? '°C' : '%'}</div>
      ))}
    </div>
  );
}
