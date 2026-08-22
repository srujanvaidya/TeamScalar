'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import WorldMap, { Shipment } from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import { Shield, ChevronRight, RefreshCw, AlertTriangle, CheckCircle, Clock, Link as LinkIcon, Cpu, Navigation, FileCode } from 'lucide-react';

const FALLBACK_SHIPMENTS: Shipment[] = [
  {
    cargo_id: "CONT-99482-SH",
    mode: "MARITIME",
    vessel_name: "COSCO SHIPPING GEMINI",
    origin: "PORT_SHANGHAI_01",
    destination: "PORT_ROTTERDAM_02",
    current_status: "BLOCKED_BY_STRIKE",
    current_coordinates: [31.2304, 121.4737],
    active_route_coords: [
      [31.23, 121.47], [22.31, 114.16], [1.29, 103.85],
      [26.6, 56.3], [12.5, 43.3], [29.9, 32.5], [51.9, 4.47]
    ],
    metrics: {
      transit_hours: 142.0,
      cost_usd: 14200.0,
      co2_kg: 1850.0,
      sla_risk: "HIGH"
    },
    blockchain_provenance: {
      tx_hash: "0x7f9a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
      block_number: 4829103,
      contract_address: "0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae",
      origin_point: "PORT_SHANGHAI_01 [31.2304, 121.4737]",
      destination_point: "PORT_ROTTERDAM_02 [51.9244, 4.4777]",
      verified_on_chain: true,
      timestamp: "2026-08-22T19:20:00Z"
    },
    alternate_routes: [
      {
        route_id: "ROUTE_ALT_A",
        modal_sequence: ["ROAD_TRUCK", "RAIL_FREIGHT", "ROAD_TRUCK"],
        waypoints: ["HUB_SHANGHAI", "RAIL_CHENGDU", "HUB_WARSAW", "DIST_BERLIN"],
        waypoint_coords: [
          [31.23, 121.47], [30.57, 104.07], [52.23, 21.01], [52.52, 13.4]
        ],
        estimated_transit_hours: 110.5,
        base_freight_cost_usd: 18450.00,
        co2_emissions_kg: 1240.5,
        risk_grade: "LOW",
        color_gradient: [56, 142, 60],
        blockchain_message: {
          action: "PROPOSING_REROUTE_TRANSACTION",
          start_node: "HUB_SHANGHAI (Road Hub)",
          end_node: "DIST_BERLIN (Distribution Center)",
          leg_summary: "ROAD -> RAIL -> ROAD",
          tx_hash: "0x3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
          verified_on_chain: true
        },
        leg_breakdown: [
          { from_node: "HUB_SHANGHAI", from_type: "ROAD", to_node: "RAIL_CHENGDU", to_type: "RAIL", mode: "ROAD_TRUCK", transit_hours: 18.0 },
          { from_node: "RAIL_CHENGDU", from_type: "RAIL", to_node: "HUB_WARSAW", to_type: "HUB", mode: "RAIL_FREIGHT", transit_hours: 84.5 },
          { from_node: "HUB_WARSAW", from_type: "HUB", to_node: "DIST_BERLIN", to_type: "DIST", mode: "ROAD_TRUCK", transit_hours: 8.0 }
        ]
      },
      {
        route_id: "ROUTE_ALT_B",
        modal_sequence: ["MARITIME", "AIR_FREIGHT"],
        waypoints: ["PORT_SHANGHAI", "AIR_DUBAI", "PORT_ROTTERDAM"],
        waypoint_coords: [
          [31.23, 121.47], [25.2, 55.27], [51.9, 4.47]
        ],
        estimated_transit_hours: 165.0,
        base_freight_cost_usd: 29100.00,
        co2_emissions_kg: 3400.0,
        risk_grade: "HIGH",
        color_gradient: [239, 68, 68],
        blockchain_message: {
          action: "EXPRESS_AIR_REROUTE_CONTRACT",
          start_node: "PORT_SHANGHAI (Port)",
          end_node: "PORT_ROTTERDAM (Port)",
          leg_summary: "PORT -> AIRPORT -> PORT",
          tx_hash: "0x9d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
          verified_on_chain: true
        },
        leg_breakdown: [
          { from_node: "PORT_SHANGHAI", from_type: "PORT", to_node: "AIR_DUBAI", to_type: "AIR", mode: "MARITIME", transit_hours: 120.0 },
          { from_node: "AIR_DUBAI", from_type: "AIR", to_node: "PORT_ROTTERDAM", to_type: "PORT", mode: "AIR_FREIGHT", transit_hours: 45.0 }
        ]
      }
    ]
  },
  {
    cargo_id: "CONT-48192-DXB",
    mode: "MARITIME",
    vessel_name: "MAERSK MC-KINNEY MOLLER",
    origin: "PORT_SINGAPORE_01",
    destination: "PORT_DUBAI_01",
    current_status: "IN_TRANSIT",
    current_coordinates: [1.3521, 103.8198],
    active_route_coords: [
      [1.35, 103.82], [5.9, 80.2], [19.08, 72.88], [25.2, 55.27]
    ],
    metrics: {
      transit_hours: 72.0,
      cost_usd: 8400.0,
      co2_kg: 980.0,
      sla_risk: "LOW"
    },
    blockchain_provenance: {
      tx_hash: "0x8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f",
      block_number: 4828990,
      contract_address: "0x48B0DB4e87D280AFB3fDC572f61A641E7261D74D",
      origin_point: "PORT_SINGAPORE_01 [1.3521, 103.8198]",
      destination_point: "PORT_DUBAI_01 [25.2048, 55.2708]",
      verified_on_chain: true,
      timestamp: "2026-08-22T18:45:00Z"
    },
    alternate_routes: [
      {
        route_id: "ROUTE_ALT_C",
        modal_sequence: ["MARITIME", "ROAD_TRUCK"],
        waypoints: ["PORT_SINGAPORE", "HUB_MUMBAI", "PORT_DUBAI"],
        waypoint_coords: [
          [1.35, 103.82], [19.08, 72.88], [25.2, 55.27]
        ],
        estimated_transit_hours: 68.0,
        base_freight_cost_usd: 9200.00,
        co2_emissions_kg: 850.0,
        risk_grade: "LOW",
        color_gradient: [56, 142, 60],
        blockchain_message: {
          action: "PORT_TO_PORT_TRANSFER_ESCROW",
          start_node: "PORT_SINGAPORE (Port)",
          end_node: "PORT_DUBAI (Port)",
          leg_summary: "PORT -> HUB -> PORT",
          tx_hash: "0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d",
          verified_on_chain: true
        },
        leg_breakdown: [
          { from_node: "PORT_SINGAPORE", from_type: "PORT", to_node: "HUB_MUMBAI", to_type: "HUB", mode: "MARITIME", transit_hours: 48.0 },
          { from_node: "HUB_MUMBAI", from_type: "HUB", to_node: "PORT_DUBAI", to_type: "PORT", mode: "MARITIME", transit_hours: 20.0 }
        ]
      }
    ]
  }
];

export default function CommandCenterPage() {
  const { hitlPending, setPenaltyAvoided, setCarbonSaved } = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [loading, setLoading] = useState(true);

  const [shipments, setShipments] = useState<Shipment[]>(FALLBACK_SHIPMENTS);
  const [selectedCargoId, setSelectedCargoId] = useState<string>("CONT-99482-SH");
  const [activeAltRouteId, setActiveAltRouteId] = useState<string | null>("ROUTE_ALT_A");
  const [showJsonMsg, setShowJsonMsg] = useState(false);

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/v1/shipments");
        if (res.ok) {
          const json = await res.json();
          if (json.shipments && json.shipments.length) {
            setShipments(json.shipments);
          }
        }
      } catch {
        setShipments(FALLBACK_SHIPMENTS);
      }
      setLoading(false);
    };

    fetchShipments();
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

  const selectedShipment = shipments.find(s => s.cargo_id === selectedCargoId) || shipments[0];
  const selectedAltRoute = selectedShipment.alternate_routes.find(r => r.route_id === activeAltRouteId) || selectedShipment.alternate_routes[0];

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #1a1a1a',
        background: '#090909', flexShrink: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em' }}>COMMAND CENTER // BLOCKCHAIN LOCATION PROVENANCE</span>
        </div>

        {/* Shipment Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#888888', fontSize: 10 }}>SHIPMENT PROVENANCE:</span>
          <select
            value={selectedCargoId}
            onChange={(e) => {
              setSelectedCargoId(e.target.value);
              const s = shipments.find(item => item.cargo_id === e.target.value);
              if (s && s.alternate_routes.length) {
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
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000000' }}>
        {/* On-Chain Provenance Banner Overlay (Start Point to Destination) */}
        {selectedShipment.blockchain_provenance && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 30, maxWidth: 420,
            background: 'rgba(10, 10, 10, 0.92)', backdropFilter: 'blur(10px)',
            border: '1px solid #333333', borderRadius: 6, padding: '10px 14px',
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontWeight: 800 }}>
                <LinkIcon size={12} />
                <span>VERIFIED ON-CHAIN PROVENANCE</span>
              </div>
              <span style={{ color: '#888888', fontSize: 9 }}>Block #{selectedShipment.blockchain_provenance.block_number}</span>
            </div>

            <div style={{ color: '#aaaaaa', marginBottom: 4 }}>
              <strong>TX:</strong> <span style={{ color: '#ffffff' }}>{selectedShipment.blockchain_provenance.tx_hash}</span>
            </div>

            {/* Starting Point to Destination Breakdown */}
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

        {/* Map View */}
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

      {/* Monochromatic Bottom Data Drawer with Blockchain Leg Breakdown */}
      <div style={{
        height: 220, borderTop: '1px solid #1a1a1a',
        background: '#090909', display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Selected Cargo Header */}
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
              {selectedShipment.origin} → {selectedShipment.destination}
            </span>
            <span className={`badge ${selectedShipment.current_status.includes('BLOCKED') ? 'badge-critical' : 'badge-low'}`}>
              {selectedShipment.current_status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            <button
              onClick={() => setShowJsonMsg(!showJsonMsg)}
              style={{
                background: showJsonMsg ? '#ffffff' : '#141414',
                color: showJsonMsg ? '#000000' : '#ffffff',
                border: '1px solid #333', padding: '3px 8px', borderRadius: 4, cursor: 'pointer'
              }}
            >
              {showJsonMsg ? 'Hide On-Chain JSON' : '🔍 Inspect Blockchain JSON Payload'}
            </button>
          </div>
        </div>

        {/* JSON Message Inspector Modal Overlay */}
        {showJsonMsg && selectedAltRoute?.blockchain_message && (
          <div style={{ padding: 12, background: '#050505', borderBottom: '1px solid #222', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>
              ⚡ BLOCKCHAIN JSON MESSAGE (ON-CHAIN ROUTE PROVENANCE):
            </div>
            <pre style={{ margin: 0, color: '#00ffcc', background: '#000', padding: 8, borderRadius: 4, overflowX: 'auto' }}>
{JSON.stringify(selectedAltRoute.blockchain_message, null, 2)}
            </pre>
          </div>
        )}

        {/* Route Legs & Alternate Route Matrix Table */}
        <div className="scroll-y" style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a', background: '#090909' }}>
                {['Route ID', 'Modal Leg Chain (Road ➔ Port ➔ Dist)', 'Starting Point', 'Ending Point', 'Est. Hours', 'Cost (USD)', 'Risk Grade', 'Blockchain Action'].map(h => (
                  <th key={h} style={{ padding: '6px 16px', textAlign: 'left', color: '#666666', fontWeight: 500, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedShipment.alternate_routes.map((alt) => {
                const isActive = activeAltRouteId === alt.route_id;

                return (
                  <tr
                    key={alt.route_id}
                    className="table-row"
                    style={{ background: isActive ? '#141414' : undefined }}
                  >
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
      </div>

      {hitlPending && <HITLModal />}
    </div>
  );
}
