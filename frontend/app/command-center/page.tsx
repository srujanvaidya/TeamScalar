'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import WorldMap, { Shipment, RouteLeg } from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import { Shield, ChevronRight, RefreshCw, AlertTriangle, CheckCircle, Clock, Link as LinkIcon, Cpu, Navigation, FileCode, Truck, Anchor, Train, Plane } from 'lucide-react';

const MODE_ICON_MAP: Record<string, { icon: any; label: string }> = {
  ROAD_TRUCK: { icon: Truck, label: '🚚 ROAD TRUCK' },
  MARITIME: { icon: Anchor, label: '🚢 OCEAN FREIGHT' },
  OCEAN_FREIGHT: { icon: Anchor, label: '🚢 OCEAN FREIGHT' },
  RAIL_FREIGHT: { icon: Train, label: '🚆 RAIL FREIGHT' },
  AIR_FREIGHT: { icon: Plane, label: '✈️ AIR FREIGHT' },
};

export default function CommandCenterPage() {
  const { hitlPending, setPenaltyAvoided, setCarbonSaved } = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string>('');
  const [activeAltRouteId, setActiveAltRouteId] = useState<string | null>(null);
  const [showJsonMsg, setShowJsonMsg] = useState(false);
  const [viewTab, setViewTab] = useState<'LEGS' | 'ALTERNATES'>('LEGS');

  // Fetch real backend data ONLY
  const fetchBackendShipments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("http://localhost:8000/api/v1/shipments");
      if (!res.ok) throw new Error(`Backend HTTP ${res.status}`);
      const json = await res.json();
      if (json.shipments && json.shipments.length) {
        setShipments(json.shipments);
        if (!selectedCargoId) {
          setSelectedCargoId(json.shipments[0].cargo_id);
          if (json.shipments[0].alternate_routes?.length) {
            setActiveAltRouteId(json.shipments[0].alternate_routes[0].route_id);
          }
        }
      } else {
        setErrorMsg("No active shipments returned from backend.");
      }
    } catch (err: any) {
      setErrorMsg(`Failed to connect to Python FastAPI server at http://localhost:8000: ${err?.message || err}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackendShipments();
  }, []);

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

  const selectedShipment = shipments.find(s => s.cargo_id === selectedCargoId) || shipments[0] || null;
  const selectedAltRoute = selectedShipment?.alternate_routes?.find(r => r.route_id === activeAltRouteId) || selectedShipment?.alternate_routes?.[0] || null;

  // Active legs array for the selected shipment / alternate route
  const activeLegs: RouteLeg[] = (selectedAltRoute?.leg_breakdown && selectedAltRoute.leg_breakdown.length > 0)
    ? selectedAltRoute.leg_breakdown
    : (selectedShipment?.route_legs && selectedShipment.route_legs.length > 0)
      ? selectedShipment.route_legs
      : [];

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden' }}>
      {/* Monochromatic Header */}
      <header style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #1a1a1a',
        background: '#090909', flexShrink: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em' }}>COMMAND CENTER // BACKEND REAL-TIME SHIPMENT DATA</span>
        </div>

        {/* Shipment Selector & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={fetchBackendShipments}
            style={{ background: '#141414', border: '1px solid #333', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={11} /> Refresh Backend
          </button>

          {shipments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#888888', fontSize: 10 }}>CARGO ID:</span>
              <select
                value={selectedCargoId}
                onChange={(e) => {
                  setSelectedCargoId(e.target.value);
                  const s = shipments.find(item => item.cargo_id === e.target.value);
                  if (s && s.alternate_routes?.length) {
                    setActiveAltRouteId(s.alternate_routes[0].route_id);
                  }
                }}
                style={{
                  background: '#141414', color: '#ffffff', border: '1px solid #333333',
                  borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer'
                }}
              >
                {shipments.map(s => (
                  <option key={s.cargo_id} value={s.cargo_id}>
                    {s.cargo_id} — {s.vessel_name} ({s.current_status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000000' }}>
        {/* Error or Loading Banner */}
        {errorMsg && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444',
            padding: '8px 16px', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* On-Chain Provenance Banner Overlay */}
        {selectedShipment?.blockchain_provenance && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 30, maxWidth: 450,
            background: 'rgba(10, 10, 10, 0.92)', backdropFilter: 'blur(10px)',
            border: '1px solid #333333', borderRadius: 6, padding: '10px 14px',
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontWeight: 800 }}>
                <LinkIcon size={12} />
                <span>ON-CHAIN BLOCKCHAIN LOCATION LEDGER</span>
              </div>
              <span style={{ color: '#888888', fontSize: 9 }}>Block #{selectedShipment.blockchain_provenance.block_number}</span>
            </div>

            <div style={{ color: '#aaaaaa', marginBottom: 4 }}>
              <strong>TX HASH:</strong> <span style={{ color: '#ffffff' }}>{selectedShipment.blockchain_provenance.tx_hash}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, paddingTop: 6, borderTop: '1px solid #222' }}>
              <div>
                <span style={{ color: '#666' }}>🏁 STARTING POINT: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.blockchain_provenance.origin_point}</span>
              </div>
              <div>
                <span style={{ color: '#666' }}>🎯 DESTINATION: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.blockchain_provenance.destination_point}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mapbox / Leaflet Canvas */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
          <WorldMap
            shipments={shipments}
            selectedShipment={selectedShipment}
            activeAlternateRouteId={activeAltRouteId}
            width={mapSize.w}
            height={mapSize.h}
          />
        </div>
      </div>

      {/* Monochromatic Bottom Data Drawer */}
      {selectedShipment && (
        <div style={{
          height: 250, borderTop: '1px solid #1a1a1a',
          background: '#090909', display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>
          {/* Selected Cargo Control Header & Tabs */}
          <div style={{
            padding: '8px 16px', background: '#111111', borderBottom: '1px solid #1f1f1f',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>
                📦 {selectedShipment.cargo_id}
              </span>
              <span style={{ color: '#cccccc', fontWeight: 600 }}>
                {selectedShipment.vessel_name}
              </span>
              <span style={{ color: '#444444' }}>|</span>
              <span style={{ color: '#888888' }}>
                {selectedShipment.origin} ➔ {selectedShipment.destination}
              </span>
              <span className={`badge ${selectedShipment.current_status.includes('BLOCKED') ? 'badge-critical' : 'badge-low'}`}>
                {selectedShipment.current_status}
              </span>
            </div>

            {/* View Switcher Tabs (Path Legs Breakdown vs Alternate Reroutes) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              <div style={{ display: 'flex', background: '#000', borderRadius: 4, overflow: 'hidden', border: '1px solid #333' }}>
                <button
                  onClick={() => setViewTab('LEGS')}
                  style={{
                    padding: '4px 10px', background: viewTab === 'LEGS' ? '#ffffff' : 'transparent',
                    color: viewTab === 'LEGS' ? '#000000' : '#888888', border: 'none', cursor: 'pointer', fontWeight: 700
                  }}
                >
                  🛤️ REAL ROUTE LEGS & TIMESTAMPS ({activeLegs.length})
                </button>
                <button
                  onClick={() => setViewTab('ALTERNATES')}
                  style={{
                    padding: '4px 10px', background: viewTab === 'ALTERNATES' ? '#ffffff' : 'transparent',
                    color: viewTab === 'ALTERNATES' ? '#000000' : '#888888', border: 'none', cursor: 'pointer', fontWeight: 700
                  }}
                >
                  ⚡ ALTERNATE REROUTES ({selectedShipment.alternate_routes.length})
                </button>
              </div>

              <button
                onClick={() => setShowJsonMsg(!showJsonMsg)}
                style={{
                  background: showJsonMsg ? '#ffffff' : '#141414',
                  color: showJsonMsg ? '#000000' : '#ffffff',
                  border: '1px solid #333', padding: '4px 8px', borderRadius: 4, cursor: 'pointer'
                }}
              >
                {showJsonMsg ? 'Hide On-Chain JSON' : '🔍 JSON Inspector'}
              </button>
            </div>
          </div>

          {/* JSON Inspector View */}
          {showJsonMsg && (
            <div style={{ padding: 10, background: '#050505', borderBottom: '1px solid #222', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
              <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>
                ⚡ BACKEND REAL-TIME BLOCKCHAIN JSON DATA (SERVED BY FASTAPI):
              </div>
              <pre style={{ margin: 0, color: '#00ffcc', background: '#000', padding: 8, borderRadius: 4, maxHeight: 100, overflow: 'auto' }}>
{JSON.stringify(selectedAltRoute?.blockchain_message || selectedShipment.blockchain_provenance, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 1: Real Route Legs Table with Backend Timestamps and Transport Mode Columns */}
          {viewTab === 'LEGS' && (
            <div className="scroll-y" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a', background: '#090909' }}>
                    {['Leg ID', 'Transport Mode', 'From Point ➔ To Point', 'Departure Date & Time (UTC)', 'Arrival Date & Time (UTC)', 'Distance / Duration', 'Blockchain Tx Hash'].map(h => (
                      <th key={h} style={{ padding: '6px 16px', textAlign: 'left', color: '#666666', fontWeight: 500, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeLegs.map((leg, idx) => {
                    const modeObj = MODE_ICON_MAP[leg.mode] || { label: leg.mode };
                    const depDate = leg.departure_time ? new Date(leg.departure_time).toUTCString() : 'N/A';
                    const arrDate = leg.arrival_time ? new Date(leg.arrival_time).toUTCString() : 'N/A';
                    const txHash = leg.tx_hash || selectedShipment.blockchain_provenance?.tx_hash || 'Verified On-Chain';

                    return (
                      <tr key={leg.leg_id || idx} className="table-row">
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ffffff' }}>
                          {leg.leg_id || `LEG-0${idx + 1}`}
                        </td>
                        <td style={{ padding: '6px 16px', color: '#ffffff', fontWeight: 600 }}>
                          <span style={{ background: '#141414', padding: '3px 8px', borderRadius: 4, border: '1px solid #333', fontSize: 10 }}>
                            {modeObj.label}
                          </span>
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#cccccc' }}>
                          <span style={{ color: '#22c55e', fontWeight: 700 }}>{leg.from_node}</span>
                          <span style={{ color: '#666', margin: '0 6px' }}>➔</span>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{leg.to_node}</span>
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          {depDate}
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          {arrDate}
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#aaa' }}>
                          {leg.distance_km ? `${leg.distance_km.toLocaleString()} km` : '—'} | <strong style={{ color: '#fff' }}>{leg.transit_hours || '—'}h</strong>
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22c55e' }}>
                          <span style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 6px', borderRadius: 3 }}>
                            ⛓️ {txHash.slice(0, 16)}...
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Alternate Routes Matrix */}
          {viewTab === 'ALTERNATES' && (
            <div className="scroll-y" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a', background: '#090909' }}>
                    {['Route ID', 'Modal Leg Chain', 'Start Point', 'End Point', 'Est. Hours', 'Cost (USD)', 'Risk Grade', 'Action'].map(h => (
                      <th key={h} style={{ padding: '6px 16px', textAlign: 'left', color: '#666666', fontWeight: 500, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedShipment.alternate_routes.map((alt) => {
                    const isActive = activeAltRouteId === alt.route_id;

                    return (
                      <tr key={alt.route_id} className="table-row" style={{ background: isActive ? '#141414' : undefined }}>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: isActive ? '#ffffff' : '#aaaaaa' }}>
                          {alt.route_id}
                        </td>
                        <td style={{ padding: '6px 16px', color: '#cccccc', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                          {alt.modal_sequence.join(' ➔ ')}
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22c55e' }}>
                          {alt.blockchain_message?.start_node || alt.waypoints[0]}
                        </td>
                        <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#38bdf8' }}>
                          {alt.blockchain_message?.end_node || alt.waypoints[alt.waypoints.length - 1]}
                        </td>
                        <td style={{ padding: '6px 16px', color: '#ffffff' }}>
                          {alt.estimated_transit_hours}h
                        </td>
                        <td style={{ padding: '6px 16px', color: '#ffffff' }}>
                          ${alt.base_freight_cost_usd.toLocaleString()}
                        </td>
                        <td style={{ padding: '6px 16px' }}>
                          <span className={`badge ${alt.risk_grade === 'LOW' ? 'badge-low' : alt.risk_grade === 'HIGH' ? 'badge-critical' : 'badge-medium'}`}>
                            {alt.risk_grade} RISK
                          </span>
                        </td>
                        <td style={{ padding: '6px 16px' }}>
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: '3px 10px', fontSize: 10,
                              background: isActive ? '#ffffff' : undefined,
                              borderColor: isActive ? '#ffffff' : '#333333',
                              color: isActive ? '#000000' : '#ffffff',
                              fontWeight: isActive ? 700 : 400
                            }}
                            onClick={() => {
                              setActiveAltRouteId(alt.route_id);
                              setCarbonSaved(alt.co2_emissions_kg);
                              setPenaltyAvoided(180000);
                            }}
                          >
                            {isActive ? '✓ Selected Route' : 'Select Route'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {hitlPending && <HITLModal />}
    </div>
  );
}
