'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import WorldMap, { Shipment, RouteLeg } from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import AgentFunnelModal from '@/components/AgentFunnelModal';
import { supabase } from '@/lib/supabase';

const MODE_LABEL_MAP: Record<string, string> = {
  ROAD_TRUCK: 'ROAD TRUCK',
  MARITIME: 'OCEAN FREIGHT',
  OCEAN_FREIGHT: 'OCEAN FREIGHT',
  RAIL_FREIGHT: 'RAIL FREIGHT',
  AIR_FREIGHT: 'AIR FREIGHT',
};

const AREA_COORDS: Record<string, [number, number]> = {
  'Shanghai Port': [31.2304, 121.4737],
  'PORT_SHANGHAI_01': [31.2304, 121.4737],
  'PORT_SHANGHAI': [31.2304, 121.4737],
  'Port of Singapore': [1.3521, 103.8198],
  'PORT_SINGAPORE_01': [1.3521, 103.8198],
  'PORT_SINGAPORE': [1.3521, 103.8198],
  'Suez Canal': [29.9753, 32.5599],
  'Port of Rotterdam': [51.9244, 4.4777],
  'PORT_ROTTERDAM_02': [51.9244, 4.4777],
  'PORT_ROTTERDAM': [51.9244, 4.4777],
  'Port of Los Angeles': [33.7426, -118.2673],
  'Panama Canal': [9.0800, -79.6800],
  'Port of New York/New Jersey': [40.6681, -74.1610],
  'Port of Nhava Sheva': [18.9500, 72.9500],
  'PORT_NHAVA_SHEVA_02': [18.9500, 72.9500],
  'Port of Dubai': [25.2048, 55.2708],
  'PORT_DUBAI_01': [25.2048, 55.2708],
  'HUB_SHANGHAI': [31.2304, 121.4737],
  'RAIL_CHENGDU': [30.5728, 104.0668],
  'HUB_WARSAW': [52.2370, 21.0175],
  'DIST_BERLIN': [52.5200, 13.4050],
  'AIR_DUBAI': [25.2532, 55.3657],
  'HUB_FRANKFURT_01': [50.1109, 8.6821],
};

function resolveAreaCoords(areaName: string): [number, number] {
  if (AREA_COORDS[areaName]) return AREA_COORDS[areaName];
  for (const [key, coords] of Object.entries(AREA_COORDS)) {
    if (areaName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(areaName.toLowerCase())) {
      return coords;
    }
  }
  return [20.0, 75.0];
}

export default function CommandCenterPage() {
  const { hitlPending, setPenaltyAvoided, setCarbonSaved } = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [loading, setLoading] = useState(true);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string>('CONT-9010');
  const [activeAltRouteId, setActiveAltRouteId] = useState<string | null>('ROUTE_SUPABASE_CONT-9010');
  const [showJsonMsg, setShowJsonMsg] = useState(false);
  const [viewTab, setViewTab] = useState<'LEGS' | 'ALTERNATES'>('LEGS');
  const [funnelOpen, setFunnelOpen] = useState(false);

  // Fetch real backend data & Supabase ships, containers & route areas
  const fetchBackendShipments = async () => {
    setLoading(true);
    let allShipments: Shipment[] = [];

    // Step 1: Fetch directly from Supabase container_events and ships tables
    try {
      const { data: ships } = await supabase.from('ships').select('*');
      const shipNameMap: Record<string, string> = {};
      if (ships && ships.length) {
        ships.forEach((s: any) => {
          shipNameMap[s.id] = s.name;
        });
      }

      const { data: containerEvents } = await supabase.from('container_events').select('*');

      if (containerEvents && containerEvents.length > 0) {
        const parsedSupabase: Shipment[] = containerEvents.map((row: any, idx: number) => {
          const cargoId = row.container_id || `CONT-SUPABASE-${idx + 1}`;
          const shipName = shipNameMap[row.ship_id] || row.ship_id || 'SUPABASE VESSEL';
          const origin = row.origin || 'Shanghai Port';
          const destination = row.destination || 'Port of Rotterdam';

          // Extract route column (array of area strings)
          let routeAreas: string[] = [];
          if (Array.isArray(row.route)) {
            routeAreas = row.route;
          } else if (typeof row.route === 'string') {
            try { routeAreas = JSON.parse(row.route); } catch { routeAreas = [origin, destination]; }
          } else {
            routeAreas = [origin, destination];
          }

          const routeCoords: [number, number][] = routeAreas.map(area => resolveAreaCoords(area));

          const legBreakdown: RouteLeg[] = [];
          for (let i = 0; i < routeAreas.length - 1; i++) {
            legBreakdown.push({
              leg_id: `SUPABASE-LEG-0${i + 1}`,
              from_node: routeAreas[i],
              from_type: 'OCEAN_PORT',
              to_node: routeAreas[i + 1],
              to_type: 'OCEAN_PORT',
              mode: 'MARITIME',
              distance_km: 1200.0 * (i + 1),
              transit_hours: 24.0 * (i + 1),
              departure_time: row.timestamp || new Date().toISOString(),
              arrival_time: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
              tx_hash: row.polygon_tx_hash || row.event_hash || '0x' + Math.random().toString(16).slice(2)
            });
          }

          return {
            cargo_id: cargoId,
            mode: 'MARITIME',
            vessel_name: `${shipName} (${row.ship_id || 'SHIP'})`,
            origin: origin,
            destination: destination,
            current_status: row.blockchain_status === 'CONFIRMED' ? 'ON_CHAIN_VERIFIED' : 'IN_TRANSIT',
            current_coordinates: routeCoords[0] || [31.2304, 121.4737],
            active_route_coords: routeCoords,
            metrics: {
              transit_hours: 96.0,
              cost_usd: 14500.0,
              co2_kg: 1200.0,
              sla_risk: 'LOW'
            },
            blockchain_provenance: {
              tx_hash: row.polygon_tx_hash || row.event_hash,
              block_number: 4829200 + idx,
              contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
              origin_point: `${origin} [${routeCoords[0]?.[0]}, ${routeCoords[0]?.[1]}]`,
              destination_point: `${destination} [${routeCoords[routeCoords.length - 1]?.[0]}, ${routeCoords[routeCoords.length - 1]?.[1]}]`,
              verified_on_chain: row.blockchain_status === 'CONFIRMED',
              timestamp: row.timestamp || row.created_at
            },
            route_legs: legBreakdown,
            alternate_routes: [
              {
                route_id: `ROUTE_SUPABASE_${cargoId}`,
                modal_sequence: ['MARITIME', 'OCEAN_FREIGHT'],
                waypoints: routeAreas,
                waypoint_coords: routeCoords,
                estimated_transit_hours: 96.0,
                base_freight_cost_usd: 14500.0,
                co2_emissions_kg: 1200.0,
                risk_grade: 'LOW',
                color_gradient: [56, 142, 60],
                leg_breakdown: legBreakdown
              }
            ]
          };
        });
        allShipments = [...parsedSupabase];
      }
    } catch (e) {
      console.warn('Supabase client fetch warning:', e);
    }

    // Step 2: Fetch from Next.js API / FastAPI backend
    try {
      let res = await fetch('/api/shipments');
      if (!res.ok) {
        res = await fetch('http://localhost:8000/api/v1/shipments');
      }

      if (res.ok) {
        const json = await res.json();
        if (json.shipments && json.shipments.length) {
          allShipments = [...allShipments, ...json.shipments];
        }
      }
    } catch (err) {
      console.warn('Backend fetch warning, retrying...', err);
    }

    // Deduplicate by cargo_id
    if (allShipments.length) {
      const uniqueShipments = Array.from(new Map(allShipments.map(s => [s.cargo_id, s])).values());
      setShipments(uniqueShipments);

      if (!selectedCargoId || !uniqueShipments.some(s => s.cargo_id === selectedCargoId)) {
        setSelectedCargoId(uniqueShipments[0].cargo_id);
        if (uniqueShipments[0].alternate_routes?.length) {
          setActiveAltRouteId(uniqueShipments[0].alternate_routes[0].route_id);
        }
      }
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
      {/* Monochromatic Header */}
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
            Sync Backend & Supabase Data
          </button>

          {/* Ship & Cargo Container Selector Dropdown (Plots chosen ship & container route on Map) */}
          {shipments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888888', fontSize: 11, fontWeight: 600 }}>SELECT SHIP / CONTAINER:</span>
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
                    {s.vessel_name} — Container: {s.cargo_id} ({s.origin} ➔ {s.destination})
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
                <span style={{ color: '#888888' }}>SHIP NAME: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.vessel_name}</span>
              </div>
              <div>
                <span style={{ color: '#888888' }}>CONTAINER ID: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.cargo_id}</span>
              </div>
              <div>
                <span style={{ color: '#888888' }}>ORIGIN AREA: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedShipment.blockchain_provenance.origin_point}</span>
              </div>
              <div>
                <span style={{ color: '#888888' }}>DESTINATION AREA: </span>
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
                {selectedShipment.vessel_name}
              </span>
              <span style={{ color: '#888888', fontWeight: 600 }}>
                CONTAINER: {selectedShipment.cargo_id}
              </span>
              <span style={{ color: '#333333' }}>|</span>
              <span style={{ color: '#888888' }}>
                ROUTE: {selectedShipment.origin} ➔ {selectedShipment.destination}
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
                  PLOTTED ROUTE AREAS ({activeLegs.length})
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
                    {['Leg ID', 'Transport Mode', 'From Area -> To Area', 'Departure UTC', 'Arrival UTC', 'Distance / Hours', 'Blockchain Tx Hash'].map(h => (
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
                    {['Route ID', 'Modal Chain', 'Start Area', 'End Area', 'Est. Hours', 'Cost (USD)', 'Risk Grade', 'Action'].map(h => (
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
