'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import WorldMap, { Shipment } from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import { Shield, ChevronRight, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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
    alternate_routes: [
      {
        route_id: "ROUTE_ALT_A",
        modal_sequence: ["ROAD_TRUCK", "RAIL_FREIGHT"],
        waypoints: ["HUB_SHANGHAI", "HUB_WARSAW", "DIST_BERLIN"],
        waypoint_coords: [
          [31.23, 121.47], [30.57, 104.07], [52.23, 21.01], [52.52, 13.4]
        ],
        estimated_transit_hours: 110.5,
        base_freight_cost_usd: 18450.00,
        co2_emissions_kg: 1240.5,
        risk_grade: "LOW",
        color_gradient: [56, 142, 60]
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
        color_gradient: [239, 68, 68]
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
    alternate_routes: [
      {
        route_id: "ROUTE_ALT_C",
        modal_sequence: ["MARITIME"],
        waypoints: ["PORT_SINGAPORE", "HUB_MUMBAI", "PORT_DUBAI"],
        waypoint_coords: [
          [1.35, 103.82], [19.08, 72.88], [25.2, 55.27]
        ],
        estimated_transit_hours: 68.0,
        base_freight_cost_usd: 9200.00,
        co2_emissions_kg: 850.0,
        risk_grade: "LOW",
        color_gradient: [56, 142, 60]
      }
    ]
  },
  {
    cargo_id: "CONT-33109-LAX",
    mode: "MARITIME",
    vessel_name: "EVER GIVEN",
    origin: "PORT_BUSAN_01",
    destination: "PORT_LOSANGELES_01",
    current_status: "WEATHER_DELAY",
    current_coordinates: [35.1796, 129.0756],
    active_route_coords: [
      [35.17, 129.07], [35.0, 160.0], [33.74, -118.27]
    ],
    metrics: {
      transit_hours: 210.0,
      cost_usd: 19500.0,
      co2_kg: 2400.0,
      sla_risk: "MODERATE"
    },
    alternate_routes: [
      {
        route_id: "ROUTE_ALT_D",
        modal_sequence: ["MARITIME", "RAIL_FREIGHT"],
        waypoints: ["PORT_BUSAN", "PORT_VANCOUVER", "HUB_CHICAGO"],
        waypoint_coords: [
          [35.17, 129.07], [49.28, -123.12], [41.88, -87.63]
        ],
        estimated_transit_hours: 195.0,
        base_freight_cost_usd: 21200.00,
        co2_emissions_kg: 2100.0,
        risk_grade: "MODERATE",
        color_gradient: [245, 158, 11]
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

  // Fetch shipments from API
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

  const selectedShipment = shipments.find(s => s.cargo_id === selectedCargoId) || shipments[0];

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden' }}>
      {/* Monochromatic Header */}
      <header style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #1a1a1a',
        background: '#090909', flexShrink: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em' }}>COMMAND CENTER // LIVE TRACKER</span>
        </div>

        {/* Shipment Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#888888', fontSize: 10 }}>SELECT SHIPMENT:</span>
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

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000000' }}>
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
      <div style={{
        height: 180, borderTop: '1px solid #1a1a1a',
        background: '#090909', display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Selected Cargo Summary Header */}
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

          <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            <span>Transit: <strong style={{ color: '#ffffff' }}>{selectedShipment.metrics.transit_hours}h</strong></span>
            <span>Cost: <strong style={{ color: '#ffffff' }}>${selectedShipment.metrics.cost_usd.toLocaleString()}</strong></span>
            <span>CO₂: <strong style={{ color: '#ffffff' }}>{selectedShipment.metrics.co2_kg} kg</strong></span>
            <span>SLA Risk: <strong style={{ color: selectedShipment.metrics.sla_risk === 'HIGH' ? '#ef4444' : '#ffffff' }}>{selectedShipment.metrics.sla_risk}</strong></span>
          </div>
        </div>

        {/* Alternate Route Matrix Table */}
        <div className="scroll-y" style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a', background: '#090909' }}>
                {['Route ID', 'Modal Sequence', 'Waypoints', 'Est. Hours', 'Cost (USD)', 'CO₂ (kg)', 'Risk Grade', 'Action'].map(h => (
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
                    <td style={{ padding: '6px 16px', color: '#cccccc' }}>
                      {alt.modal_sequence.join(' → ')}
                    </td>
                    <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888888' }}>
                      {alt.waypoints.join(' → ')}
                    </td>
                    <td style={{ padding: '6px 16px', color: '#ffffff' }}>
                      {alt.estimated_transit_hours}h
                    </td>
                    <td style={{ padding: '6px 16px', color: '#ffffff' }}>
                      ${alt.base_freight_cost_usd.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 16px', color: '#ffffff' }}>
                      {alt.co2_emissions_kg} kg
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
                        {isActive ? '✓ Active Route' : 'Select Route'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HITL Modal if triggered */}
      {hitlPending && <HITLModal />}
    </div>
  );
}
