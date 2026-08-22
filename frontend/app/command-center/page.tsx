'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import WorldMap, { Shipment, LayerConfig, AlternateRoute } from '@/components/WorldMap';
import HITLModal from '@/components/HITLModal';
import {
  AlertTriangle, TrendingDown, Leaf, DollarSign,
  Activity, Clock, ChevronRight, RefreshCw, Layers,
  Search, Shield, Compass, Sliders, Play, CheckCircle2
} from 'lucide-react';

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
        color_gradient: [211, 47, 47]
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
  const { hitlPending, penaltyAvoided, carbonSaved, systemStatus, setPenaltyAvoided, setCarbonSaved } = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [loading, setLoading] = useState(true);

  // Shipments state from API
  const [shipments, setShipments] = useState<Shipment[]>(FALLBACK_SHIPMENTS);
  const [selectedCargoId, setSelectedCargoId] = useState<string>("CONT-99482-SH");
  const [activeAltRouteId, setActiveAltRouteId] = useState<string | null>("ROUTE_ALT_A");

  // Tactical Layers Toggle (Matching World Monitor visual)
  const [layers, setLayers] = useState<LayerConfig>({
    spaceports: false,
    undersea_cables: false,
    pipelines: true,
    ai_datacenters: false,
    military_activity: true,
    ship_traffic: true,
    trade_routes: true,
    aviation: false,
    protests: false,
  });

  const [layersOpen, setLayersOpen] = useState(true);

  // Fetch live backend shipments data
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
        // Fallback to static JSON structure if backend is restarting
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

  const toggleLayer = (key: keyof LayerConfig) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#04060a', color: '#e8edf5', overflow: 'hidden' }}>
      {/* 1. Tactical World Monitor Header Bar */}
      <header style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#070a10', flexShrink: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111827', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>🌐 WORLD</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span style={{ fontWeight: 700, color: '#e8edf5' }}>MONITOR v2.6.1</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700 }}>LIVE Global</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 8px', borderRadius: 4, color: '#ef4444', fontWeight: 700 }}>
            DEFCON 5 <span style={{ color: 'rgba(255,255,255,0.5)' }}>0%</span>
          </div>
        </div>

        {/* Clock & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
            {new Date().toUTCString().toUpperCase()}
          </span>

          <div style={{ display: 'flex', background: '#111827', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button style={{ padding: '3px 8px', background: '#1f2937', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>2D</button>
            <button style={{ padding: '3px 8px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontSize: 10 }}>3D</button>
          </div>
        </div>
      </header>

      {/* 2. Main Map Viewport & Overlay Controls */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Left Floating "LAYERS" Control Overlay (Matching Screenshot) */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 30, width: 220,
          background: 'rgba(10, 14, 23, 0.88)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8,
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)', overflow: 'hidden'
        }}>
          <div
            onClick={() => setLayersOpen(!layersOpen)}
            style={{
              padding: '8px 12px', background: 'rgba(17, 24, 39, 0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', borderBottom: layersOpen ? '1px solid rgba(255,255,255,0.08)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#e8edf5' }}>
              <Layers size={13} color="#38bdf8" />
              LAYERS
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{layersOpen ? '▼' : '▲'}</span>
          </div>

          {layersOpen && (
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <Search size={11} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 6, top: 6 }} />
                <input
                  type="text"
                  placeholder="Search layers..."
                  style={{
                    width: '100%', background: '#070a10', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4, padding: '4px 6px 4px 22px', color: '#fff', fontSize: 10
                  }}
                />
              </div>

              {[
                { key: 'spaceports', label: '🚀 SPACEPORTS' },
                { key: 'undersea_cables', label: '🌊 UNDERSEA CABLES' },
                { key: 'pipelines', label: '🛢️ PIPELINES' },
                { key: 'ai_datacenters', label: '💻 AI DATA CENTERS' },
                { key: 'military_activity', label: '⚔️ MILITARY ACTIVITY' },
                { key: 'ship_traffic', label: '🚢 SHIP TRAFFIC' },
                { key: 'trade_routes', label: '🛣️ TRADE ROUTES' },
                { key: 'aviation', label: '✈️ AVIATION' },
                { key: 'protests', label: '📢 PROTESTS' },
              ].map(l => (
                <label key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: layers[l.key as keyof LayerConfig] ? '#e8edf5' : 'rgba(255,255,255,0.4)' }}>
                  <input
                    type="checkbox"
                    checked={layers[l.key as keyof LayerConfig]}
                    onChange={() => toggleLayer(l.key as keyof LayerConfig)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  {l.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Top-Right Shipment Selector Dropdown Overlay */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(10, 14, 23, 0.88)', backdropFilter: 'blur(12px)',
          padding: '6px 12px', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
            SELECT SHIPMENT:
          </span>
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
              background: '#111827', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: 4, padding: '4px 8px', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer'
            }}
          >
            {shipments.map(s => (
              <option key={s.cargo_id} value={s.cargo_id}>
                {s.cargo_id} — {s.vessel_name} ({s.current_status})
              </option>
            ))}
          </select>
        </div>

        {/* Mapbox GL JS / Canvas Map Engine */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
          <WorldMap
            shipments={shipments}
            selectedShipment={selectedShipment}
            activeAlternateRouteId={activeAltRouteId}
            layers={layers}
            width={mapSize.w}
            height={mapSize.h}
          />
        </div>

        {/* Bottom Tactical Map Legend Bar (Matching attached screenshot) */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 30,
          background: 'rgba(10, 14, 23, 0.88)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6,
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace'
        }}>
          <span style={{ fontWeight: 800, color: '#e8edf5' }}>LEGEND</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>High Alert</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Elevated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Monitoring</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #60a5fa' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Base</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: '#a855f7' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Datacenter</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Data Drawer & Dynamic Route Gradient Matrix */}
      <div style={{
        height: 190, borderTop: '1px solid rgba(255,255,255,0.08)',
        background: '#070a10', display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Selected Cargo Summary Header */}
        <div style={{
          padding: '8px 16px', background: '#0a0e17', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
              📦 {selectedShipment.cargo_id}
            </span>
            <span style={{ color: '#e8edf5', fontWeight: 600 }}>
              {selectedShipment.vessel_name}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              {selectedShipment.origin} → {selectedShipment.destination}
            </span>
            <span className={`badge ${selectedShipment.current_status.includes('BLOCKED') ? 'badge-critical' : 'badge-low'}`}>
              {selectedShipment.current_status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            <span>Transit: <strong style={{ color: '#fff' }}>{selectedShipment.metrics.transit_hours}h</strong></span>
            <span>Cost: <strong style={{ color: '#fff' }}>${selectedShipment.metrics.cost_usd.toLocaleString()}</strong></span>
            <span>CO₂: <strong style={{ color: '#4ade80' }}>{selectedShipment.metrics.co2_kg} kg</strong></span>
            <span>SLA Risk: <strong style={{ color: selectedShipment.metrics.sla_risk === 'HIGH' ? '#ef4444' : '#22c55e' }}>{selectedShipment.metrics.sla_risk}</strong></span>
          </div>
        </div>

        {/* Dynamic Route Gradient Matrix Table */}
        <div className="scroll-y" style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Route ID', 'Modal Sequence', 'Waypoints', 'Est. Hours', 'Cost (USD)', 'CO₂ (kg)', 'Risk Grade', 'Route Gradient', 'Action'].map(h => (
                  <th key={h} style={{ padding: '6px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedShipment.alternate_routes.map((alt) => {
                const isActive = activeAltRouteId === alt.route_id;
                const [r, g, b] = alt.color_gradient || [56, 142, 60];
                const gradientStyle = `rgb(${r}, ${g}, ${b})`;

                return (
                  <tr
                    key={alt.route_id}
                    className="table-row"
                    style={{ background: isActive ? 'rgba(56, 189, 248, 0.06)' : undefined }}
                  >
                    <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: isActive ? '#38bdf8' : '#e8edf5' }}>
                      {alt.route_id}
                    </td>
                    <td style={{ padding: '6px 16px', color: 'rgba(255,255,255,0.7)' }}>
                      {alt.modal_sequence.join(' → ')}
                    </td>
                    <td style={{ padding: '6px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      {alt.waypoints.join(' → ')}
                    </td>
                    <td style={{ padding: '6px 16px', color: '#e8edf5' }}>
                      {alt.estimated_transit_hours}h
                    </td>
                    <td style={{ padding: '6px 16px', color: '#e8edf5' }}>
                      ${alt.base_freight_cost_usd.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 16px', color: '#4ade80' }}>
                      {alt.co2_emissions_kg} kg
                    </td>
                    <td style={{ padding: '6px 16px' }}>
                      <span className={`badge ${alt.risk_grade === 'LOW' ? 'badge-low' : alt.risk_grade === 'HIGH' ? 'badge-critical' : 'badge-medium'}`}>
                        {alt.risk_grade} RISK
                      </span>
                    </td>
                    {/* Gradient color preview indicator */}
                    <td style={{ padding: '6px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: gradientStyle, boxShadow: `0 0 8px ${gradientStyle}` }} />
                        <span style={{ fontSize: 10, color: gradientStyle, fontWeight: 700 }}>
                          {alt.risk_grade === 'LOW' ? '🟢 Green (Low)' : alt.risk_grade === 'HIGH' ? '🔴 Red (High)' : '🟡 Amber'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 16px' }}>
                      <button
                        className="btn btn-ghost"
                        style={{
                          padding: '3px 10px', fontSize: 10,
                          background: isActive ? 'rgba(56, 189, 248, 0.15)' : undefined,
                          borderColor: isActive ? '#38bdf8' : undefined,
                          color: isActive ? '#38bdf8' : undefined
                        }}
                        onClick={() => {
                          setActiveAltRouteId(alt.route_id);
                          setCarbonSaved(alt.co2_emissions_kg);
                          setPenaltyAvoided(180000);
                        }}
                      >
                        {isActive ? '✓ Active Path' : 'Select Path'}
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
