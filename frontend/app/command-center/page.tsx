'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import WorldMap, { Shipment, RouteLeg } from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import AgentFunnelModal from '@/components/AgentFunnelModal';

const MODE_LABEL_MAP: Record<string, string> = {
  ROAD_TRUCK: 'ROAD TRUCK',
  MARITIME: 'OCEAN FREIGHT',
  OCEAN_FREIGHT: 'OCEAN FREIGHT',
  RAIL_FREIGHT: 'RAIL FREIGHT',
  AIR_FREIGHT: 'AIR FREIGHT',
};

export default function CommandCenterPage() {
  const { hitlPending, setPenaltyAvoided, setCarbonSaved } = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [loading, setLoading] = useState(true);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string>('CONT-99482-SH');
  const [activeAltRouteId, setActiveAltRouteId] = useState<string | null>('ROUTE_ALT_A');
  const [showJsonMsg, setShowJsonMsg] = useState(false);
  const [viewTab, setViewTab] = useState<'LEGS' | 'ALTERNATES'>('LEGS');
  const [funnelOpen, setFunnelOpen] = useState(false);

  const fetchBackendShipments = async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/shipments');
      if (!res.ok) {
        res = await fetch('http://localhost:8000/api/v1/shipments');
      }

      if (res.ok) {
        const json = await res.json();
        if (json.shipments && json.shipments.length) {
          setShipments(json.shipments);
          if (!selectedCargoId || !json.shipments.some((s: any) => s.cargo_id === selectedCargoId)) {
            setSelectedCargoId(json.shipments[0].cargo_id);
            if (json.shipments[0].alternate_routes?.length) {
              setActiveAltRouteId(json.shipments[0].alternate_routes[0].route_id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend fetch warning, retrying...', err);
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

  const activeLegs: RouteLeg[] = (selectedAltRoute?.leg_breakdown && selectedAltRoute.leg_breakdown.length > 0)
    ? selectedAltRoute.leg_breakdown
    : (selectedShipment?.route_legs && selectedShipment.route_legs.length > 0)
      ? selectedShipment.route_legs
      : [];

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden' }}>
      {/* Monochromatic Header (Pure Black & White with DAG Inspector Button) */}
      <header style={{
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', borderBottom: '1px solid #1a1a1a',
        background: '#000000', flexShrink: 0, fontSize: 12, fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em' }}>COMMAND CENTER</span>
          <span style={{ color: '#333333' }}>|</span>
          <span style={{ color: '#888888', fontSize: 11 }}>REAL-TIME MULTIMODAL TELEMETRY</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Multi-Agent DAG Funnel Inspector Button */}
          <button
            onClick={() => setFunnelOpen(true)}
            style={{
              background: '#ffffff', color: '#000000', border: 'none',
              borderRadius: 4, padding: '5px 12px', fontSize: 11,
              fontWeight: 800, cursor: 'pointer'
            }}
          >
            Multi-Agent Execution Funnel
          </button>

          <button
            onClick={fetchBackendShipments}
            style={{
              background: '#111111', border: '1px solid #333333',
              color: '#ffffff', borderRadius: 4, padding: '5px 12px', fontSize: 11,
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Sync Backend Data
          </button>

          {shipments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888888', fontSize: 11, fontWeight: 600 }}>CARGO ID:</span>
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
                  background: '#111111', color: '#ffffff', border: '1px solid #333333',
                  borderRadius: 4, padding: '5px 12px', fontSize: 12, fontWeight: 700, outline: 'none', cursor: 'pointer'
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

      {/* Main Map Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000000' }}>
        {selectedShipment?.blockchain_provenance && (
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 30, maxWidth: 460,
            background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid #333333', borderRadius: 6, padding: '12px 16px',
            fontSize: 11, fontFamily: 'Inter, sans-serif', boxShadow: '0 12px 32px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#ffffff', fontWeight: 800, letterSpacing: '0.05em' }}>ON-CHAIN LOCATION PROVENANCE</span>
              <span style={{ color: '#888888', fontSize: 10 }}>Block #{selectedShipment.blockchain_provenance.block_number}</span>
            </div>

            <div style={{ color: '#888888', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              TX HASH: <span style={{ color: '#ffffff' }}>{selectedShipment.blockchain_provenance.tx_hash}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px solid #222222' }}>
              <div>
                <span style={{ color: '#888888' }}>ORIGIN: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.blockchain_provenance.origin_point}</span>
              </div>
              <div>
                <span style={{ color: '#888888' }}>DESTINATION: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.blockchain_provenance.destination_point}</span>
              </div>
            </div>
          </div>
        )}

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
          background: '#000000', display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>
          <div style={{
            padding: '10px 20px', background: '#0a0a0a', borderBottom: '1px solid #1f1f1f',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>
                {selectedShipment.cargo_id}
              </span>
              <span style={{ color: '#888888', fontWeight: 600 }}>
                {selectedShipment.vessel_name}
              </span>
              <span style={{ color: '#333333' }}>|</span>
              <span style={{ color: '#888888' }}>
                {selectedShipment.origin} TO {selectedShipment.destination}
              </span>
              <span className={`badge ${selectedShipment.current_status.includes('BLOCKED') ? 'badge-critical' : 'badge-low'}`}>
                {selectedShipment.current_status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
              <div style={{ display: 'flex', background: '#000000', borderRadius: 4, overflow: 'hidden', border: '1px solid #333333' }}>
                <button
                  onClick={() => setViewTab('LEGS')}
                  style={{
                    padding: '6px 14px', background: viewTab === 'LEGS' ? '#ffffff' : 'transparent',
                    color: viewTab === 'LEGS' ? '#000000' : '#888888', border: 'none', cursor: 'pointer', fontWeight: 700
                  }}
                >
                  ROUTE LEGS & TIMESTAMPS ({activeLegs.length})
                </button>
                <button
                  onClick={() => setViewTab('ALTERNATES')}
                  style={{
                    padding: '6px 14px', background: viewTab === 'ALTERNATES' ? '#ffffff' : 'transparent',
                    color: viewTab === 'ALTERNATES' ? '#000000' : '#888888', border: 'none', cursor: 'pointer', fontWeight: 700
                  }}
                >
                  ALTERNATE REROUTES ({selectedShipment.alternate_routes.length})
                </button>
              </div>

              <button
                onClick={() => setShowJsonMsg(!showJsonMsg)}
                style={{
                  background: showJsonMsg ? '#ffffff' : '#111111',
                  color: showJsonMsg ? '#000000' : '#ffffff',
                  border: '1px solid #333333', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600
                }}
              >
                {showJsonMsg ? 'Hide On-Chain JSON' : 'JSON Inspector'}
              </button>
            </div>
          </div>

          {showJsonMsg && (
            <div style={{ padding: 12, background: '#050505', borderBottom: '1px solid #1f1f1f', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: 4 }}>
                BACKEND REAL-TIME BLOCKCHAIN JSON TELEMETRY:
              </div>
              <pre style={{ margin: 0, color: '#ffffff', background: '#000000', padding: 10, borderRadius: 4, maxHeight: 100, overflow: 'auto', border: '1px solid #222' }}>
{JSON.stringify(selectedAltRoute?.blockchain_message || selectedShipment.blockchain_provenance, null, 2)}
              </pre>
            </div>
          )}

          {viewTab === 'LEGS' && (
            <div className="scroll-y" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f', background: '#000000' }}>
                    {['Leg ID', 'Transport Mode', 'From Point -> To Point', 'Departure UTC', 'Arrival UTC', 'Distance / Hours', 'Blockchain Tx Hash'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontWeight: 600, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeLegs.map((leg, idx) => {
                    const modeLabel = MODE_LABEL_MAP[leg.mode] || leg.mode;
                    const depDate = leg.departure_time ? new Date(leg.departure_time).toUTCString() : 'N/A';
                    const arrDate = leg.arrival_time ? new Date(leg.arrival_time).toUTCString() : 'N/A';
                    const txHash = leg.tx_hash || selectedShipment.blockchain_provenance?.tx_hash || 'Verified On-Chain';

                    return (
                      <tr key={leg.leg_id || idx} style={{ borderBottom: '1px solid #111111' }}>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ffffff' }}>
                          {leg.leg_id || `LEG-0${idx + 1}`}
                        </td>
                        <td style={{ padding: '8px 16px', color: '#ffffff', fontWeight: 600 }}>
                          <span style={{ background: '#111111', padding: '4px 8px', borderRadius: 4, border: '1px solid #333333', fontSize: 10 }}>
                            {modeLabel}
                          </span>
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#cccccc' }}>
                          <span style={{ color: '#ffffff', fontWeight: 700 }}>{leg.from_node}</span>
                          <span style={{ color: '#888888', margin: '0 6px' }}>-&gt;</span>
                          <span style={{ color: '#ffffff', fontWeight: 700 }}>{leg.to_node}</span>
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          {depDate}
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          {arrDate}
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888888' }}>
                          {leg.distance_km ? `${leg.distance_km.toLocaleString()} km` : '—'} | <strong style={{ color: '#fff' }}>{leg.transit_hours || '—'}h</strong>
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          <span style={{ background: '#181818', border: '1px solid #333333', padding: '3px 8px', borderRadius: 3 }}>
                            {txHash.slice(0, 16)}...
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewTab === 'ALTERNATES' && (
            <div className="scroll-y" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f', background: '#000000' }}>
                    {['Route ID', 'Modal Chain', 'Start Point', 'End Point', 'Est. Hours', 'Cost (USD)', 'Risk Grade', 'Action'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#888888', fontWeight: 600, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedShipment.alternate_routes.map((alt) => {
                    const isActive = activeAltRouteId === alt.route_id;

                    return (
                      <tr key={alt.route_id} style={{ background: isActive ? '#111111' : undefined, borderBottom: '1px solid #111111' }}>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: isActive ? '#ffffff' : '#888888' }}>
                          {alt.route_id}
                        </td>
                        <td style={{ padding: '8px 16px', color: '#cccccc', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                          {alt.modal_sequence.join(' -> ')}
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          {alt.blockchain_message?.start_node || alt.waypoints[0]}
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ffffff' }}>
                          {alt.blockchain_message?.end_node || alt.waypoints[alt.waypoints.length - 1]}
                        </td>
                        <td style={{ padding: '8px 16px', color: '#ffffff' }}>
                          {alt.estimated_transit_hours}h
                        </td>
                        <td style={{ padding: '8px 16px', color: '#ffffff' }}>
                          ${alt.base_freight_cost_usd.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <span className={`badge ${alt.risk_grade === 'LOW' ? 'badge-low' : alt.risk_grade === 'HIGH' ? 'badge-critical' : 'badge-medium'}`}>
                            {alt.risk_grade} RISK
                          </span>
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <button
                            style={{
                              padding: '4px 12px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
                              background: isActive ? '#ffffff' : 'transparent',
                              border: isActive ? '1px solid #ffffff' : '1px solid #333333',
                              color: isActive ? '#000000' : '#ffffff',
                              fontWeight: isActive ? 700 : 500
                            }}
                            onClick={() => {
                              setActiveAltRouteId(alt.route_id);
                              setCarbonSaved(alt.co2_emissions_kg);
                              setPenaltyAvoided(180000);
                            }}
                          >
                            {isActive ? 'Selected Route' : 'Select Route'}
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
      <AgentFunnelModal isOpen={funnelOpen} onClose={() => setFunnelOpen(false)} missionData={selectedShipment} />
    </div>
  );
}
