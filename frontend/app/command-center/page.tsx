'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { supabase, DisruptionEvent, ActiveRoute } from '@/lib/supabase';
import WorldMap from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import {
  AlertTriangle, TrendingDown, Leaf, DollarSign,
  Activity, Clock, ChevronRight, RefreshCw
} from 'lucide-react';

const DEMO_DISRUPTIONS: DisruptionEvent[] = [
  {
    id: '1', incident_id: 'INC_8821', event_type: 'LABOR_STRIKE',
    severity: 'CRITICAL', latitude: 31.23, longitude: 121.47,
    affected_node: 'PORT_SHANGHAI_01',
    raw_payload: { confidence: 0.95, delay_hours: 72 },
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: '2', incident_id: 'INC_8819', event_type: 'WEATHER_ANOMALY',
    severity: 'HIGH', latitude: 25.2, longitude: 121,
    affected_node: 'CORRIDOR_TAIWAN_STRAIT',
    raw_payload: { confidence: 0.88, wind_speed: 64.5 },
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: '3', incident_id: 'INC_8810', event_type: 'PORT_CONGESTION',
    severity: 'MEDIUM', latitude: 51.9, longitude: 4.47,
    affected_node: 'PORT_ROTTERDAM_02',
    raw_payload: { confidence: 0.87, predicted_hours: 48 },
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const DEMO_ROUTES: ActiveRoute[] = [
  {
    id: '1', route_id: 'ROUTE_ALT_902', cargo_id: 'CARGO_2291',
    origin: 'PORT_SHANGHAI_01', destination: 'DIST_BERLIN',
    current_status: 'REROUTED',
    polyline_geojson: {},
    cost_usd: 14200, co2_emissions_kg: 620,
    updated_at: new Date().toISOString(),
  },
  {
    id: '2', route_id: 'ROUTE_ACTIVE_101', cargo_id: 'CARGO_1847',
    origin: 'PORT_SINGAPORE_01', destination: 'PORT_DUBAI_01',
    current_status: 'IN_TRANSIT',
    polyline_geojson: {},
    cost_usd: 8400, co2_emissions_kg: 980,
    updated_at: new Date().toISOString(),
  },
  {
    id: '3', route_id: 'ROUTE_ACTIVE_099', cargo_id: 'CARGO_0392',
    origin: 'PORT_BUSAN_01', destination: 'PORT_LOSANGELES_01',
    current_status: 'IN_TRANSIT',
    polyline_geojson: {},
    cost_usd: 11200, co2_emissions_kg: 2100,
    updated_at: new Date().toISOString(),
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function CommandCenterPage() {
  const {
    role,
    disruptions,
    setDisruptions,
    routes,
    setRoutes,
    hitlPending,
    penaltyAvoided,
    carbonSaved,
    systemStatus,
    setPenaltyAvoided,
    setCarbonSaved
  } = useStore();
  
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState('ROUTE_ALT_902');



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Try to fetch from Supabase, fall back to demo data
      try {
        const { data: dEvts } = await supabase.from('disruption_events').select('*').order('created_at', { ascending: false }).limit(20);
        const { data: dRoutes } = await supabase.from('active_routes').select('*').order('updated_at', { ascending: false }).limit(20);
        setDisruptions(dEvts?.length ? dEvts : DEMO_DISRUPTIONS);
        setRoutes(dRoutes?.length ? dRoutes : DEMO_ROUTES);
      } catch {
        setDisruptions(DEMO_DISRUPTIONS);
        setRoutes(DEMO_ROUTES);
      }
      setLoading(false);
    };
    loadData();

    // Supabase realtime
    const ch = supabase.channel('command_center')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'disruption_events' }, (payload) => {
        useStore.getState().addDisruption(payload.new as DisruptionEvent);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // Track map container size
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    if (mapContainerRef.current) obs.observe(mapContainerRef.current);
    return () => obs.disconnect();
  }, []);

  const displayDisruptions = disruptions.length ? disruptions : DEMO_DISRUPTIONS;
  const displayRoutes = routes.length ? routes : DEMO_ROUTES;

  const severityClass = (s: string) => {
    const m: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
    return m[s] || 'badge-neutral';
  };

  const statusColors: Record<string, string> = {
    IN_TRANSIT: '#60a5fa', REROUTED: '#eab308', DELAYED: '#ef4444', DELIVERED: '#22c55e',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: 'var(--bg-void)' }}>
      {/* Header */}
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-deep)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            Global Logistics Command Center
          </span>
          <span className={`badge ${systemStatus === 'nominal' ? 'badge-low' : 'badge-critical'}`}>
            {systemStatus === 'nominal' ? '● LIVE' : '⚠ DISRUPTION ACTIVE'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
          <Clock size={12} />
          <span className="text-mono">{new Date().toUTCString().slice(17, 25)} UTC</span>
          {loading && <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />}
        </div>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Map area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* ESG overlay cards — top left */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              { icon: DollarSign, label: 'Penalty Avoided', value: `$${(penaltyAvoided || 180000).toLocaleString()}`, color: '#22c55e' },
              { icon: Leaf, label: 'CO₂ Saved', value: `${(carbonSaved || 1240).toLocaleString()} kg`, color: '#4ade80' },
              { icon: TrendingDown, label: 'ESG Grade', value: 'A', color: 'var(--accent)' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="glass" style={{ padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color={card.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{card.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map canvas */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
            <WorldMap
              disruptions={displayDisruptions}
              routes={displayRoutes}
              width={mapSize.w}
              height={mapSize.h}
            />
          </div>

          {/* Legend */}
          <div className="glass" style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 10,
            padding: '8px 12px', borderRadius: 8, display: 'flex', gap: 16,
          }}>
            {[
              { color: '#60a5fa', label: 'Ocean' },
              { color: '#4ade80', label: 'Rail (Reroute)' },
              { color: '#fb923c', label: 'Road' },
              { color: '#ef4444', label: 'Disrupted Node' },
              { color: '#eab308', label: 'Predicted Congestion' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          width: 300, borderLeft: '1px solid var(--border-subtle)',
          background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Disruption triage feed */}
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <AlertTriangle size={13} color="#ef4444" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Disruption Triage Feed</span>
              <span className="badge badge-critical" style={{ marginLeft: 'auto' }}>{displayDisruptions.length}</span>
            </div>
          </div>
          <div className="scroll-y" style={{ flex: 1 }}>
            {displayDisruptions.map((d, i) => (
              <div
                key={d.id}
                style={{
                  padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  animation: i === 0 ? 'slide-in-right 0.3s ease-out' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className={`badge ${severityClass(d.severity)}`}>{d.severity}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(d.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {d.event_type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.affected_node || d.incident_id}</div>
              </div>
            ))}
          </div>

          {/* Active routes summary */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 12px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Activity size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Active Routes</span>
            </div>
            {displayRoutes.map(r => (
              <div key={r.id} style={{
                padding: '8px 10px', marginBottom: 6, borderRadius: 8,
                background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{r.cargo_id}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: statusColors[r.current_status] || 'var(--text-muted)',
                  }}>
                    {r.current_status}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {r.origin.replace('PORT_', '').split('_')[0]} → {r.destination.replace('DIST_', '').replace('PORT_', '').split('_')[0]}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>${r.cost_usd.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: '#4ade80' }}>{r.co2_emissions_kg} kg CO₂</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Route matrix — bottom panel */}
      <div style={{
        height: 160, borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-deep)', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Route Comparison Matrix</span>
          <ChevronRight size={13} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Agent 2 candidates — Shanghai → Berlin</span>
        </div>
        <div className="scroll-y" style={{ height: 'calc(100% - 36px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Route ID', 'Mode', 'Waypoints', 'Transit (h)', 'Cost (USD)', 'CO₂ (kg)', 'SLA Risk', 'ESG', 'Action'].map(h => (
                  <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'ROUTE_ALT_901', mode: 'Ocean→Rail', via: 'SHA→CDG→BER', h: 96, cost: 12100, co2: 980, risk: 'LOW', esg: 'B' },
                { id: 'ROUTE_ALT_902', mode: 'Rail→Truck', via: 'SHA→CHG→WAW→BER', h: 110, cost: 14200, co2: 620, risk: 'LOW', esg: 'A' },
                { id: 'ROUTE_ALT_903', mode: 'Air→Truck', via: 'SHA→FRA→BER', h: 18, cost: 48000, co2: 3400, risk: 'HIGH', esg: 'F' },
              ].map(row => {
                const isSel = selectedRouteId === row.id;
                return (
                  <tr key={row.id} className="table-row" style={{ background: isSel ? 'rgba(200,216,240,0.05)' : undefined }}>
                    <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontSize: 11, color: isSel ? 'var(--accent)' : 'var(--text-primary)' }}>{row.id}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>{row.mode}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10 }}>{row.via}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-primary)' }}>{row.h}h</td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-primary)' }}>${row.cost.toLocaleString()}</td>
                    <td style={{ padding: '6px 12px', color: '#4ade80' }}>{row.co2}</td>
                    <td style={{ padding: '6px 12px' }}><span className={`badge badge-${row.risk === 'LOW' ? 'low' : row.risk === 'HIGH' ? 'critical' : 'medium'}`}>{row.risk}</span></td>
                    <td style={{ padding: '6px 12px', fontWeight: 700, color: row.esg === 'A' ? '#22c55e' : row.esg === 'F' ? '#ef4444' : 'var(--text-secondary)' }}>{row.esg}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <button
                        className="btn btn-ghost"
                        style={{
                          padding: '3px 10px',
                          fontSize: 11,
                          background: isSel ? 'var(--accent-dim)' : undefined,
                          borderColor: isSel ? 'var(--accent)' : undefined,
                          color: isSel ? 'var(--accent)' : undefined
                        }}
                        onClick={() => {
                          setSelectedRouteId(row.id);
                          if (row.id === 'ROUTE_ALT_901') {
                            setCarbonSaved(880);
                            setPenaltyAvoided(140000);
                          } else if (row.id === 'ROUTE_ALT_902') {
                            setCarbonSaved(1240);
                            setPenaltyAvoided(180000);
                          } else {
                            setCarbonSaved(120);
                            setPenaltyAvoided(40000);
                          }
                        }}
                      >
                        {isSel ? '✓ Active' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HITL Modal */}
      {hitlPending && <HITLModal />}
    </div>
  );
}
