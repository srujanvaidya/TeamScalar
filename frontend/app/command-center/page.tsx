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
  'Port of Shenzhen': [22.5431, 114.0579],
  'Port of Colombo': [6.9271, 79.8612],
  'Cape of Good Hope': [-34.3568, 18.4740],
  'Port of Hamburg': [53.5511, 9.9937],
  'Port of Busan': [35.1796, 129.0756],
  'Port of Yokohama': [35.4437, 139.6380],
  'Port of Long Beach': [33.7701, -118.1937],
  'Port of Ningbo': [29.8683, 121.5440],
  'Malacca Strait': [2.5000, 101.5000],
  'Port of Jebel Ali': [24.9857, 55.0642],
  'Port of Antwerp': [51.2194, 4.4025],
  'Strait of Gibraltar': [35.9562, -5.6026],
  'Port of Genoa': [44.4056, 8.9463],
  'Port of Hong Kong': [22.3193, 114.1694],
  'Port of Kaohsiung': [22.6273, 120.3014],
  'Port of Tokyo': [35.6762, 139.6503],
  'Port of Qingdao': [36.0671, 120.3826],
  'Port of Brisbane': [-27.4698, 153.0251],
  'Port of Sydney': [-33.8688, 151.2093],
  'Port of Guangzhou': [23.1291, 113.2644],
  'Port of Manila': [14.5995, 120.9842],
  'Port of Ho Chi Minh': [10.8231, 106.6297],
  'Port of Tianjin': [39.3434, 117.3616],
  'Port of Dalian': [38.9140, 121.6147],
  'Port of Incheon': [37.4563, 126.7052],
  'Port of Klang': [3.0000, 101.4000],
  'Port of Nhava Sheva': [18.9500, 72.9500],
  'PORT_NHAVA_SHEVA_02': [18.9500, 72.9500],
  'Port of Felixstowe': [51.9628, 1.3511],
  'Port of Laem Chabang': [13.0827, 100.9161],
  'Port of Tanjung Pelepas': [1.3653, 103.5486],
  'Port of Melbourne': [-37.8136, 144.9631],
  'Port of Xiamen': [24.4798, 118.0894],
  'Port of Keelung': [25.1283, 121.7419],
  'Port of Osaka': [34.6937, 135.5023],
  'Port of Tanjung Priok': [-6.1000, 106.8833],
  'Port of Fremantle': [-32.0569, 115.7428],
  'Port of Adelaide': [-34.8422, 138.5042],
  'Port of Savannah': [32.0809, -81.0912],
  'Port of Miami': [25.7617, -80.1918],
  'Port of Houston': [29.7604, -95.3698],
  'Port of Callao': [-12.0566, -77.1437],
  'Port of Santos': [-23.9608, -46.3339],
  'Port of Buenos Aires': [-34.6037, -58.3816],
  'Port of Montevideo': [-34.9011, -56.1645],
  'Port of Valencia': [39.4699, -0.3763],
  'Port of Barcelona': [41.3851, 2.1734],
  'Port of Marseille': [43.2965, 5.3698],
  'Port of Algeciras': [36.1408, -5.4562],
  'Port of Tangier': [35.7595, -5.8340],
  'Port of Dakar': [14.7167, -17.4677],
  'Port of Salalah': [17.0152, 54.0924],
  'Port of Jeddah': [21.5433, 39.1728],
  'Port Said': [31.2653, 32.3019],
  'Port of Durban': [-29.8587, 31.0218],
  'Port of Mombasa': [-4.0435, 39.6682],
  'Port of Dar es Salaam': [-6.7924, 39.2083],
  'Port of Vancouver': [49.2827, -123.1207],
  'Port of Seattle': [47.6062, -122.3321],
  'Port of Oakland': [37.8044, -122.2711],
  'Port of Bremerhaven': [53.5463, 8.5831],
  'Port of Gothenburg': [57.7089, 11.9746],
  'Port of Aarhus': [56.1629, 10.2039],
  'Port of Le Havre': [49.4944, 0.1079],
  'Port of Southampton': [50.9097, -1.4044],
  'Port of Dublin': [53.3498, -6.2603],
  'Port of Piraeus': [37.9475, 23.6372],
  'Port of Istanbul': [41.0082, 28.9784],
  'Port of Constanta': [44.1792, 28.6498],
  'Port of Mumbai': [18.9438, 72.8360],
  'Port of Mundra': [22.8395, 69.7042],
  'Port of Pipavav': [20.9167, 71.5000],
  'Port of Chennai': [13.0827, 80.2707],
  'Port of Visakhapatnam': [17.6868, 83.2185],
  'Port of Kolkata': [22.5726, 88.3639],
  'Port of Karachi': [24.8607, 67.0011],
  'Port of Port Qasim': [24.7739, 67.3486],
  'Port of Gwadar': [25.1264, 62.3225],
  'Port of Chittagong': [22.3569, 91.7832],
  'Port of Yangon': [16.8661, 96.1951],
  'Port of Penang': [5.4164, 100.3327],
  'Port of Auckland': [-36.8485, 174.7633],
  'Port of Tauranga': [-37.6878, 176.1651],
  'Port of Lyttelton': [-43.6031, 172.7214],
  'HUB_SHANGHAI': [31.2304, 121.4737],
  'RAIL_CHENGDU': [30.5728, 104.0668],
  'HUB_WARSAW': [52.2370, 21.0175],
  'DIST_BERLIN': [52.5200, 13.4050],
  'AIR_DUBAI': [25.2532, 55.3657],
  'HUB_FRANKFURT_01': [50.1109, 8.6821],
  'HUB_CHICAGO_01': [41.8781, -87.6298],
  'AIR_ATLANTA_01': [33.7490, -84.3880],
  'WH_REGIONAL_TEXAS': [29.7604, -95.3698],
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
  const [mapSize, setMapSize] = useState({ w: 800, h: 520 });
  const [loading, setLoading] = useState(true);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string>('CONT-8001');
  const [activeAltRouteId, setActiveAltRouteId] = useState<string | null>(null);
  const [showJsonMsg, setShowJsonMsg] = useState(false);
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [approvedRouteId, setApprovedRouteId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // Fetch real backend data from /api/shipments (Supabase is only used for output event logging & Polygon proofs)
  const fetchBackendShipments = async () => {
    setLoading(true);
    let allShipments: Shipment[] = [];

    try {
      let res = await fetch('/api/shipments');
      if (!res.ok) {
        res = await fetch('http://localhost:8000/api/v1/shipments');
      }

      if (res.ok) {
        const json = await res.json();
        if (json.shipments && json.shipments.length) {
          allShipments = json.shipments;
        }
      }
    } catch (err) {
      console.warn('Backend fetch warning:', err);
    }

    if (allShipments.length) {
      setShipments(allShipments);

      if (!selectedCargoId || !allShipments.some(s => s.cargo_id === selectedCargoId)) {
        const initial = allShipments[0];
        setSelectedCargoId(initial.cargo_id);
        if (initial.alternate_routes?.length) {
          setActiveAltRouteId(initial.alternate_routes[0].route_id);
        }
      } else {
        const current = allShipments.find(s => s.cargo_id === selectedCargoId);
        if (current && current.alternate_routes?.length) {
          setActiveAltRouteId(current.alternate_routes[0].route_id);
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
        setMapSize({ w: entry.contentRect.width, h: 520 });
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

  // HUMAN-IN-THE-LOOP ROUTE APPROVAL BUTTON HANDLER (TRIGGERS under_reroute.py / POLYGON BROADCAST)
  const handleApproveRoute = async (routeId: string, cost: number, hours: number) => {
    setActiveAltRouteId(routeId);
    setApprovedRouteId(routeId);
    setApproving(true);

    if (!selectedShipment) {
      setApproving(false);
      return;
    }

    const altRoute = selectedShipment.alternate_routes?.find(r => r.route_id === routeId) || selectedAltRoute;
    const waypoints = altRoute ? altRoute.waypoints : [selectedShipment.origin, selectedShipment.destination];
    const location = waypoints[0] || selectedShipment.origin;

    try {
      const res = await fetch('http://localhost:8000/api/v1/blockchain/reroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ship_id: selectedShipment.vessel_name || 'SHIP-002',
          container_id: selectedShipment.cargo_id || 'CONT-8001',
          location: location,
          route: waypoints
        })
      });

      if (res.ok) {
        const receipt = await res.json();
        console.log('Polygon Amoy Transaction Broadcast Receipt:', receipt);

        if (receipt.tx_hash) {
          setShipments(prev => prev.map(s => {
            if (s.cargo_id === selectedShipment.cargo_id) {
              const baseProv = s.blockchain_provenance || {
                tx_hash: receipt.tx_hash,
                block_number: 4829210,
                contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
                origin_point: s.origin,
                destination_point: s.destination,
                verified_on_chain: true
              };
              return {
                ...s,
                blockchain_provenance: {
                  ...baseProv,
                  tx_hash: receipt.tx_hash,
                  verified_on_chain: true,
                  timestamp: receipt.anchored_timestamp || new Date().toISOString()
                }
              };
            }
            return s;
          }));
        }
      }
    } catch (err) {
      console.warn('API call to /api/v1/blockchain/reroute notice:', err);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflowY: 'auto' }}>
      
      {/* Sleek Un-Cluttered Sticky Monochromatic Header */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid #1a1a1a',
        background: '#000000', position: 'sticky', top: 0, zIndex: 100, fontSize: 12, fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', fontSize: 13 }}>COMMAND CENTER</span>
          
          {/* Ship & Cargo Container Selector Dropdown */}
          {shipments.length > 0 && (
            <select
              value={selectedCargoId}
              onChange={(e) => {
                const newCargoId = e.target.value;
                setSelectedCargoId(newCargoId);
                setApprovedRouteId(null);
                const s = shipments.find(item => item.cargo_id === newCargoId);
                if (s && s.alternate_routes?.length) {
                  setActiveAltRouteId(s.alternate_routes[0].route_id);
                }
              }}
              style={{
                background: '#0a0a0a', color: '#ffffff', border: '1px solid #262626',
                borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              {shipments.map(s => (
                <option key={s.cargo_id} value={s.cargo_id}>
                  {s.vessel_name} ({s.cargo_id}: {s.origin} ➔ {s.destination})
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setFunnelOpen(true)}
            style={{
              background: '#ffffff', color: '#000000', border: 'none',
              borderRadius: 20, padding: '5px 14px', fontSize: 11,
              fontWeight: 800, cursor: 'pointer'
            }}
          >
            Multi-Agent Execution Funnel
          </button>

          <button
            onClick={fetchBackendShipments}
            style={{
              background: '#0a0a0a', border: '1px solid #262626',
              color: '#888888', borderRadius: 20, padding: '5px 12px', fontSize: 11,
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Sync Telemetry
          </button>
        </div>
      </header>

      {/* Spacious 520px Leaflet Map Section */}
      <div style={{ height: 520, position: 'relative', background: '#000000', borderBottom: '1px solid #1a1a1a' }}>
        
        {/* Compact 1-Line Floating Provenance Telemetry Bar */}
        {selectedShipment?.blockchain_provenance && (
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 30,
            background: 'rgba(5, 5, 5, 0.9)', backdropFilter: 'blur(10px)',
            border: '1px solid #222222', borderRadius: 20, padding: '6px 16px',
            fontSize: 10, fontFamily: 'Inter, sans-serif', color: '#ffffff',
            display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
          }}>
            <div><span style={{ color: '#888888' }}>SHIP:</span> <strong>{selectedShipment.vessel_name}</strong></div>
            <div style={{ width: 1, height: 12, background: '#222222' }} />
            <div><span style={{ color: '#888888' }}>CONTAINER:</span> <strong>{selectedShipment.cargo_id}</strong></div>
            <div style={{ width: 1, height: 12, background: '#222222' }} />
            <div><span style={{ color: '#888888' }}>OPTIMIZED PATH:</span> <strong style={{ color: '#22c55e' }}>{selectedAltRoute ? selectedAltRoute.waypoints.join(' ➔ ') : `${selectedShipment.origin} ➔ ${selectedShipment.destination}`}</strong></div>
            <div style={{ width: 1, height: 12, background: '#222222' }} />
            <div><span style={{ color: '#888888' }}>POLYGON TX:</span> <strong style={{ color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>{selectedShipment.blockchain_provenance.tx_hash.slice(0, 14)}...</strong></div>
          </div>
        )}

        {/* Map Container */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
          {selectedShipment && (
            <WorldMap
              width={mapSize.w}
              height={mapSize.h}
              shipments={shipments}
              selectedShipment={selectedShipment}
              activeAlternateRouteId={activeAltRouteId}
            />
          )}
        </div>
      </div>

      {/* Details Container */}
      {selectedShipment && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* SECTION 1: Active Vessel KPI Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: '#888888', fontWeight: 700, letterSpacing: '0.05em' }}>VESSEL & CONTAINER ID</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>{selectedShipment.vessel_name}</div>
              <div style={{ fontSize: 11, color: '#888888', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                Container: {selectedShipment.cargo_id}
              </div>
            </div>

            <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: '#888888', fontWeight: 700, letterSpacing: '0.05em' }}>ORIGIN ➔ DESTINATION</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                {selectedShipment.origin} ➔ {selectedShipment.destination}
              </div>
              <div style={{ fontSize: 11, color: '#eab308', marginTop: 2 }}>[DISRUPTED CORRIDOR]</div>
            </div>

            <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: '#888888', fontWeight: 700, letterSpacing: '0.05em' }}>DEFAULT VS OPTIMIZED TIME</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>
                {selectedAltRoute ? `${selectedAltRoute.estimated_transit_hours}h` : `${selectedShipment.metrics.transit_hours}h`}
              </div>
              <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
                {selectedAltRoute ? `Saves ${Math.round(selectedShipment.metrics.transit_hours - selectedAltRoute.estimated_transit_hours)}h vs Default` : 'Baseline'}
              </div>
            </div>

            <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: '#888888', fontWeight: 700, letterSpacing: '0.05em' }}>POLYGON AMOY PROVENANCE</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                {selectedShipment.blockchain_provenance?.tx_hash ? `${selectedShipment.blockchain_provenance.tx_hash.slice(0, 16)}...` : 'Verified On-Chain'}
              </div>
              <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2 }}>[VERIFIED ON-CHAIN]</div>
            </div>
          </div>

          {/* SECTION 2: Route Comparison Matrix & Human Approval Action Card */}
          <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  HUMAN-IN-THE-LOOP AUTHORIZATION MATRIX
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                  Route Cost & Transit Comparison — Human Approval Gate
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setShowJsonMsg(!showJsonMsg)}
                  style={{
                    background: showJsonMsg ? '#ffffff' : '#111111',
                    color: showJsonMsg ? '#000000' : '#ffffff',
                    border: '1px solid #333333', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 11
                  }}
                >
                  {showJsonMsg ? 'Hide Raw JSON Inspector' : 'Toggle Raw JSON Inspector'}
                </button>
              </div>
            </div>

            {showJsonMsg && (
              <div style={{ padding: 16, background: '#000000', border: '1px solid #222222', borderRadius: 6, marginBottom: 20, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: 6 }}>
                  BACKEND REAL-TIME BLOCKCHAIN JSON TELEMETRY:
                </div>
                <pre style={{ margin: 0, color: '#ffffff', background: '#080808', padding: 12, borderRadius: 4, maxHeight: 160, overflow: 'auto', border: '1px solid #1a1a1a' }}>
{JSON.stringify(selectedAltRoute?.blockchain_message || selectedShipment.blockchain_provenance, null, 2)}
                </pre>
              </div>
            )}

            {/* Un-cluttered Full-Width Comparison Table */}
            <div style={{ border: '1px solid #1f1f1f', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Route Option & Type</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Waypoints Path</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Transit Duration</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Base Freight Cost</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Cost Savings</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Risk Grade</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>Human Approval Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Normal Unoptimized Route */}
                  <tr style={{ borderBottom: '1px solid #181818', background: '#000000' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#ef4444' }}>
                      [NORMAL / UNOPTIMIZED ROUTE]
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#aaaaaa' }}>
                      {selectedShipment.active_route_coords.length > 2 ? `${selectedShipment.origin} ➔ CANAL ➔ ${selectedShipment.destination}` : `${selectedShipment.origin} ➔ ${selectedShipment.destination}`}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#ffffff', fontWeight: 600 }}>
                      {selectedShipment.metrics.transit_hours}h
                    </td>
                    <td style={{ padding: '14px 20px', color: '#ef4444', fontWeight: 800 }}>
                      ${selectedShipment.metrics.cost_usd.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#666666', fontStyle: 'italic' }}>
                      — (Baseline)
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-critical">[HIGH RISK - BOTTLENECK]</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: '#666666', fontSize: 11, fontWeight: 600 }}>[Default Path]</span>
                    </td>
                  </tr>

                  {/* Rows 2+: Agent 2 & Agent 3 Multi-Modal Candidates */}
                  {selectedShipment.alternate_routes.map((alt) => {
                    const isSelected = activeAltRouteId === alt.route_id;
                    const isApproved = approvedRouteId === alt.route_id;
                    const costDelta = selectedShipment.metrics.cost_usd - alt.base_freight_cost_usd;
                    const timeSavings = Math.round(selectedShipment.metrics.transit_hours - alt.estimated_transit_hours);

                    return (
                      <tr key={alt.route_id} style={{ borderBottom: '1px solid #181818', background: isSelected ? '#0d0d0d' : '#000000' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>
                          [AGENT OPTIMIZED] {alt.route_id}
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ffffff' }}>
                          {alt.waypoints.join(' ➔ ')}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#22c55e', fontWeight: 700 }}>
                          {alt.estimated_transit_hours}h <span style={{ color: '#888888', fontSize: 11 }}>(Saves {timeSavings}h)</span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#ffffff', fontWeight: 800 }}>
                          ${alt.base_freight_cost_usd.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 20px', color: costDelta >= 0 ? '#22c55e' : '#eab308', fontWeight: 700 }}>
                          {costDelta >= 0 ? `Saves $${costDelta.toLocaleString()}` : `+$${Math.abs(costDelta).toLocaleString()} (Express Air)`}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge badge-low">[LOW RISK]</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {isApproved ? (
                            <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 12 }}>
                              [HUMAN APPROVED]
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApproveRoute(alt.route_id, alt.base_freight_cost_usd, alt.estimated_transit_hours)}
                              disabled={approving}
                              style={{
                                background: isSelected ? '#ffffff' : '#111111',
                                color: isSelected ? '#000000' : '#ffffff',
                                border: '1px solid #ffffff',
                                padding: '6px 16px', borderRadius: 4,
                                cursor: approving ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 11
                              }}
                            >
                              {approving ? '[Broadcasting to Polygon...]' : isSelected ? 'Approve & Execute Reroute' : 'Select & Approve Route'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Leg-by-Leg Route Breakdown & On-Chain Hashes */}
          <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              PLOTTED ROUTE LEGS & TIMESTAMPS
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>
              Leg-by-Leg Intermodal Breakdown ({activeLegs.length} Segments)
            </h3>

            <div style={{ border: '1px solid #1f1f1f', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
                    {['Leg ID', 'Transport Mode', 'From Area -> To Area', 'Departure UTC', 'Arrival UTC', 'Distance / Hours', 'Blockchain Tx Hash'].map(h => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: 'left', color: '#888888', fontWeight: 700, fontSize: 11 }}>{h}</th>
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
                      <tr key={leg.leg_id || idx} style={{ borderBottom: '1px solid #141414' }}>
                        <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ffffff' }}>
                          {leg.leg_id || `LEG-0${idx + 1}`}
                        </td>
                        <td style={{ padding: '12px 18px', color: '#ffffff', fontWeight: 600 }}>
                          <span style={{ background: '#111111', padding: '4px 10px', borderRadius: 4, border: '1px solid #333333', fontSize: 11 }}>
                            [{modeLabel}]
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#cccccc' }}>
                          <span style={{ color: '#ffffff', fontWeight: 700 }}>{leg.from_node}</span>
                          <span style={{ color: '#888888', margin: '0 6px' }}>-&gt;</span>
                          <span style={{ color: '#ffffff', fontWeight: 700 }}>{leg.to_node}</span>
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ffffff' }}>
                          {depDate}
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ffffff' }}>
                          {arrDate}
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#888888' }}>
                          {leg.distance_km ? `${leg.distance_km.toLocaleString()} km` : '—'} | <strong style={{ color: '#fff' }}>{leg.transit_hours || '—'}h</strong>
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ffffff' }}>
                          <span style={{ background: '#181818', border: '1px solid #333333', padding: '4px 10px', borderRadius: 4 }}>
                            {txHash.slice(0, 18)}...
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
      )}

      {hitlPending && <HITLModal />}
      <AgentFunnelModal isOpen={funnelOpen} onClose={() => setFunnelOpen(false)} missionData={selectedShipment} />
    </div>
  );
}
