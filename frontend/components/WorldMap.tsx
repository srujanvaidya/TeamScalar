'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export type RouteLeg = {
  leg_id?: string;
  from_node: string;
  from_type: string;
  to_node: string;
  to_type: string;
  mode: string;
  distance_km?: number;
  transit_hours?: number;
  departure_time?: string;
  arrival_time?: string;
  tx_hash?: string;
  coords?: [number, number][];
};

export type BlockchainProvenance = {
  tx_hash: string;
  block_number: number;
  contract_address: string;
  origin_point: string;
  destination_point: string;
  verified_on_chain: boolean;
  timestamp?: string;
};

export type AlternateRoute = {
  route_id: string;
  modal_sequence: string[];
  waypoints: string[];
  waypoint_coords: [number, number][];
  estimated_transit_hours: number;
  base_freight_cost_usd: number;
  co2_emissions_kg: number;
  risk_grade: 'LOW' | 'MODERATE' | 'HIGH';
  color_gradient: [number, number, number];
  blockchain_message?: {
    action: string;
    start_node: string;
    end_node: string;
    leg_summary: string;
    tx_hash: string;
    verified_on_chain: boolean;
  };
  leg_breakdown?: RouteLeg[];
};

export type Shipment = {
  cargo_id: string;
  mode: string;
  vessel_name: string;
  origin: string;
  destination: string;
  current_status: string;
  current_coordinates: [number, number];
  active_route_coords: [number, number][];
  metrics: {
    transit_hours: number;
    cost_usd: number;
    co2_kg: number;
    sla_risk: string;
  };
  blockchain_provenance?: BlockchainProvenance;
  route_legs?: RouteLeg[];
  alternate_routes: AlternateRoute[];
};

type Props = {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  activeAlternateRouteId: string | null;
  width: number;
  height: number;
};

// Transport mode rates & labels (NO EMOJIS)
const MODE_TEXT: Record<string, string> = {
  ROAD_TRUCK: '[ROAD TRUCK]',
  MARITIME: '[OCEAN FREIGHT]',
  OCEAN_FREIGHT: '[OCEAN FREIGHT]',
  RAIL_FREIGHT: '[RAIL FREIGHT]',
  AIR_FREIGHT: '[AIR CARGO]',
};

const MODE_RATES: Record<string, string> = {
  ROAD_TRUCK: '$2.80 / km',
  MARITIME: '$0.65 / km',
  OCEAN_FREIGHT: '$0.65 / km',
  RAIL_FREIGHT: '$1.25 / km',
  AIR_FREIGHT: '$8.50 / km',
};

// REAL-WORLD GEOPOLITICAL DANGER & TEMPORARILY BLOCKED MARITIME ZONES
const DANGER_ZONES = [
  {
    name: 'Strait of Hormuz',
    coord: [26.5667, 56.2500] as [number, number],
    radiusMeters: 450000,
    riskLevel: 'CRITICAL DANGER',
    status: 'TEMPORARILY BLOCKED / NAVAL INTERDICTION',
    description: 'High geopolitical conflict zone & vessel seizure risk in Persian Gulf corridor.',
    color: '#ef4444'
  },
  {
    name: 'Bab el-Mandeb & Red Sea',
    coord: [12.5833, 43.3333] as [number, number],
    radiusMeters: 550000,
    riskLevel: 'CRITICAL DANGER',
    status: 'ARMED ATTACK ZONE / REROUTE MANDATORY',
    description: 'Active Houthi anti-ship missile strikes. Vessels rerouted via Cape of Good Hope (+12 days).',
    color: '#ef4444'
  },
  {
    name: 'Panama Canal Locks',
    coord: [9.0800, -79.6800] as [number, number],
    radiusMeters: 420000,
    riskLevel: 'HIGH BOTTLENECK',
    status: 'SEVERE DROUGHT / DRAFT RESTRICTIONS',
    description: 'Gatun Lake freshwater shortage. Daily vessel transits restricted by 45%.',
    color: '#f97316'
  },
  {
    name: 'Taiwan Strait Exclusion Zone',
    coord: [24.0000, 119.5000] as [number, number],
    radiusMeters: 400000,
    riskLevel: 'MODERATE-HIGH DANGER',
    status: 'NAVAL DRILLS & TYPHOON SURGE',
    description: 'Military exclusion zone & seasonal super typhoon maritime disruption.',
    color: '#eab308'
  },
  {
    name: 'Black Sea & Kerch Strait',
    coord: [45.2500, 36.5500] as [number, number],
    radiusMeters: 480000,
    riskLevel: 'CRITICAL DANGER',
    status: 'ACTIVE WARZONE & NAVAL MINE HAZARD',
    description: 'Grain corridor closure & high floating naval mine hazard area.',
    color: '#ef4444'
  },
  {
    name: 'Malacca Strait Chokepoint',
    coord: [2.5000, 101.5000] as [number, number],
    radiusMeters: 350000,
    riskLevel: 'MODERATE CONGESTION',
    status: 'HEAVY DENSITY & PIRACY ALERT',
    description: 'Ultra-high maritime vessel density & armed boarding alert zone.',
    color: '#eab308'
  }
];

// DENSITY CONGESTION HEATMAP DATA POINTS
const HEATMAP_POINTS = [
  { coord: [31.2304, 121.4737], intensity: 0.95, name: 'Shanghai Ocean Corridor' },
  { coord: [1.3521, 103.8198], intensity: 0.90, name: 'Singapore Straits Terminal' },
  { coord: [26.5667, 56.2500], intensity: 0.98, name: 'Strait of Hormuz Threat Zone' },
  { coord: [12.5833, 43.3333], intensity: 0.96, name: 'Bab el-Mandeb Strike Zone' },
  { coord: [9.0800, -79.6800], intensity: 0.92, name: 'Panama Bottleneck Queue' },
  { coord: [29.9753, 32.5599], intensity: 0.88, name: 'Suez Canal Approach' },
  { coord: [51.9244, 4.4777], intensity: 0.82, name: 'Rotterdam Europe Gateway' },
  { coord: [33.7426, -118.2673], intensity: 0.80, name: 'Port of Los Angeles/Long Beach' },
  { coord: [25.2048, 55.2708], intensity: 0.85, name: 'Jebel Ali Dubai Hub' },
  { coord: [40.6681, -74.1610], intensity: 0.78, name: 'NY/NJ East Coast Terminal' },
  { coord: [18.9500, 72.9500], intensity: 0.84, name: 'Nhava Sheva India Hub' },
];

export default function WorldMap({
  shipments,
  selectedShipment,
  activeAlternateRouteId,
  width,
  height,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  // Map Interactive Controls State
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showMaritimeHubs, setShowMaritimeHubs] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [20.0, 30.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;

      renderMapElements(L, map, layerGroup, selectedShipment, activeAlternateRouteId);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    import('leaflet').then((L) => {
      renderMapElements(L, mapInstanceRef.current, layerGroupRef.current, selectedShipment, activeAlternateRouteId);
    });
  }, [selectedShipment, activeAlternateRouteId, showHeatmap, showDangerZones, showMaritimeHubs]);

  const renderMapElements = (
    L: any,
    map: any,
    layerGroup: any,
    shipment: Shipment | null,
    altRouteId: string | null
  ) => {
    layerGroup.clearLayers();
    if (!shipment) return;

    const isBlocked = shipment.current_status.includes('BLOCKED') || shipment.current_status.includes('BOTTLENECK') || shipment.current_status.includes('DELAY');
    const [curLat, curLon] = shipment.current_coordinates;
    const bounds = L.latLngBounds();

    // 1. RENDER CONGESTION & RISK HEATMAP LAYER
    if (showHeatmap) {
      HEATMAP_POINTS.forEach(pt => {
        const baseRadius = 300000 + pt.intensity * 250000;
        const color = pt.intensity > 0.9 ? '#ef4444' : pt.intensity > 0.84 ? '#f97316' : '#eab308';

        // Outer heat aura ring
        L.circle(pt.coord as [number, number], {
          radius: baseRadius,
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 0,
        }).addTo(layerGroup);

        // Core high density ring (Info on Click / Hover)
        L.circle(pt.coord as [number, number], {
          radius: baseRadius * 0.45,
          color: color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1,
        }).addTo(layerGroup).bindPopup(
          `<div style="font-family: Inter, monospace; font-size: 10px; padding: 6px 10px; background: #000000; color: ${color}; border: 1px solid ${color}; border-radius: 4px;">
            [GLOBAL LOGISTICS HEATMAP]: <strong>${pt.name}</strong><br/>
            Congestion & Risk Density Index: <strong>${Math.round(pt.intensity * 100)}%</strong>
          </div>`
        );
      });
    }

    // 2. RENDER DANGER & TEMPORARILY BLOCKED ZONES (INFO SHOWN ONLY ON CLICK)
    if (showDangerZones) {
      DANGER_ZONES.forEach(zone => {
        // Pulsing Threat Danger Zone Circle
        const dangerCircle = L.circle(zone.coord, {
          radius: zone.radiusMeters,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.25,
          weight: 2,
          dashArray: '6, 6'
        }).addTo(layerGroup);

        dangerCircle.bindPopup(
          `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid ${zone.color}; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.9);">
            <div style="font-weight: 800; color: ${zone.color}; margin-bottom: 4px; letter-spacing: 0.05em;">[${zone.riskLevel}]: ${zone.name.toUpperCase()}</div>
            <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">Status: ${zone.status}</div>
            <div style="color: #aaaaaa; font-size: 10px; margin-top: 4px; border-top: 1px solid #222222; padding-top: 4px;">
              ${zone.description}
            </div>
          </div>`
        );

        // Danger Center Warning Node Marker (Info Shown ONLY ON CLICK)
        const dangerMarker = L.circleMarker(zone.coord, {
          radius: 8,
          fillColor: zone.color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1
        }).addTo(layerGroup);

        dangerMarker.bindPopup(
          `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid ${zone.color}; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.9);">
            <div style="font-weight: 800; color: ${zone.color}; margin-bottom: 4px; letter-spacing: 0.05em;">[${zone.riskLevel}]: ${zone.name.toUpperCase()}</div>
            <div style="color: #ffffff; font-weight: 700; margin-bottom: 2px;">Status: ${zone.status}</div>
            <div style="color: #aaaaaa; font-size: 10px; margin-top: 4px; border-top: 1px solid #222222; padding-top: 4px;">
              ${zone.description}
            </div>
          </div>`
        );
      });
    }

    // 3. Render Global Maritime Hub Node Markers (Info Shown ONLY ON CLICK / HOVER)
    if (showMaritimeHubs) {
      const hubs = [
        { name: 'Shanghai Port', coords: [31.2304, 121.4737] },
        { name: 'Port of Singapore', coords: [1.3521, 103.8198] },
        { name: 'Suez Canal', coords: [29.9753, 32.5599] },
        { name: 'Port of Rotterdam', coords: [51.9244, 4.4777] },
        { name: 'Port of Los Angeles', coords: [33.7426, -118.2673] },
        { name: 'Panama Canal', coords: [9.0800, -79.6800] },
        { name: 'Port of New York/New Jersey', coords: [40.6681, -74.1610] }
      ];

      hubs.forEach(h => {
        L.circleMarker([h.coords[0], h.coords[1]], {
          radius: 4,
          fillColor: '#ffffff',
          color: '#000000',
          weight: 1,
          fillOpacity: 0.8
        }).addTo(layerGroup).bindPopup(
          `<div style="font-family: monospace; font-size: 10px; padding: 4px 8px; background: #000000; color: #ffffff; border: 1px solid #ffffff; border-radius: 4px;">[MARITIME HUB]: <strong>${h.name}</strong></div>`
        );
      });
    }

    // 4. Draw Completed Past Trajectory (Solid Line from Origin ➔ Current Position)
    const activeCoords = shipment.active_route_coords.map(([lat, lon]) => [lat, lon] as [number, number]);
    if (activeCoords.length > 0) {
      const pastPath = [activeCoords[0], [curLat, curLon] as [number, number]];
      const pastPolyline = L.polyline(pastPath, {
        color: '#22c55e',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);

      pastPolyline.bindPopup(
        `<div style="font-family: Inter, monospace; font-size: 11px; padding: 8px 12px; background: #000000; color: #ffffff; border: 1px solid #22c55e; border-radius: 6px;">
          <div style="font-weight: 800; color: #22c55e; margin-bottom: 2px;">[COMPLETED PAST TRANSIT TRACK]</div>
          <div>Origin: <strong>${shipment.origin}</strong> ➔ Current Telemetry Position</div>
          <div style="color: #888888; font-size: 10px; margin-top: 2px;">Status: VERIFIED ON-CHAIN</div>
        </div>`
      );
    }

    // 5. Draw Future Remaining Default Route (Dotted Dashed Line from Current Position ➔ Destination)
    if (activeCoords.length > 1) {
      const futurePath = [[curLat, curLon] as [number, number], ...activeCoords.slice(1)];
      const futurePolyline = L.polyline(futurePath, {
        color: isBlocked ? '#ef4444' : '#888888',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.85,
      }).addTo(layerGroup);

      const modeLabel = MODE_TEXT[shipment.mode] || `[${shipment.mode}]`;
      const normalCostFormatted = `$${shipment.metrics.cost_usd.toLocaleString()}`;

      futurePolyline.bindPopup(
        `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid #ef4444; border-radius: 6px;">
          <div style="font-weight: 800; color: #ef4444; margin-bottom: 4px;">[FUTURE REMAINING DEFAULT PATH - BOTTLENECK AFFECTED]</div>
          <div>Mode: <strong>${modeLabel}</strong> (${MODE_RATES[shipment.mode] || '$0.65 / km'})</div>
          <div>Path: Current Position ➔ <strong>${shipment.destination}</strong></div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #222222; color: #cccccc;">
            Cost of Normal Route: <strong style="color: #ef4444; font-size: 13px;">${normalCostFormatted}</strong>
          </div>
        </div>`
      );

      activeCoords.forEach(c => bounds.extend(c));
    }

    // 6. Draw Agent 2 / 3 Agent-Optimized Alternate Bypass Polylines (Branching from Current Position)
    if (altRouteId && shipment.alternate_routes) {
      const alt = shipment.alternate_routes.find((r) => r.route_id === altRouteId) || shipment.alternate_routes[0];
      if (alt && alt.waypoint_coords && alt.waypoint_coords.length > 1) {
        const altCoords = [[curLat, curLon] as [number, number], ...alt.waypoint_coords.map(([lat, lon]) => [lat, lon] as [number, number])];

        const altPolyline = L.polyline(altCoords, {
          color: '#ffffff',
          weight: 5,
          dashArray: '8, 6',
          opacity: 0.95,
        }).addTo(layerGroup);

        altCoords.forEach(c => bounds.extend(c));

        const seqText = alt.modal_sequence.map(m => MODE_TEXT[m] || `[${m}]`).join(' ➔ ');
        const optCostFormatted = `$${alt.base_freight_cost_usd.toLocaleString()}`;
        const timeSavings = Math.round(shipment.metrics.transit_hours - alt.estimated_transit_hours);

        altPolyline.bindPopup(
          `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid #ffffff; border-radius: 6px;">
            <div style="font-weight: 800; color: #22c55e; margin-bottom: 4px;">[AGENT OPTIMIZED ROAD / MULTIMODAL ROUTE]</div>
            <div>Route ID: <strong>${alt.route_id}</strong></div>
            <div>Modal Chain: <strong>${seqText}</strong></div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #222222; color: #cccccc;">
              Cost of Optimized Route: <strong style="color: #22c55e; font-size: 13px;">${optCostFormatted}</strong>
            </div>
            <div style="color: #aaaaaa; margin-top: 2px;">
              Est. Transit: <strong>${alt.estimated_transit_hours} hours</strong> (Saves ${timeSavings}h!)
            </div>
          </div>`
        );
      }
    }

    // 7. RENDER CUSTOM CONTAINER VESSEL MARKER ICON (lo.png) AT CURRENT POSITION (INFO SHOWN ONLY ON CLICK)
    const containerIcon = L.icon({
      iconUrl: '/lo.png',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -19]
    });

    const loMarker = L.marker([curLat, curLon], { icon: containerIcon }).addTo(layerGroup);
    bounds.extend([curLat, curLon]);

    loMarker.bindPopup(
      `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid #ffffff; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.9);">
        <div style="font-weight: 800; color: #22c55e; margin-bottom: 4px;">[LIVE CONTAINER CURRENT TELEMETRY POSITION]</div>
        <div>Vessel: <strong>${shipment.vessel_name}</strong></div>
        <div>Container ID: <strong>${shipment.cargo_id}</strong></div>
        <div style="color: #aaaaaa; font-size: 10px; margin-top: 2px;">Coords: [${curLat}, ${curLon}]</div>
        <div style="color: #eab308; font-size: 9px; margin-top: 4px; font-weight: 700;">Status: ${shipment.current_status}</div>
      </div>`
    );

    // Auto-fit bounds
    try {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
      }
    } catch {}
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000000' }}>
      
      {/* Top Floating Map Controls Pill Bar */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(5, 5, 5, 0.92)', backdropFilter: 'blur(10px)',
        border: '1px solid #222222', borderRadius: 20, padding: '4px 10px',
        fontSize: 10, fontFamily: 'Inter, sans-serif'
      }}>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{
            background: showHeatmap ? '#181818' : 'transparent',
            color: showHeatmap ? '#22c55e' : '#888888',
            border: 'none', borderRadius: 14, padding: '3px 8px', cursor: 'pointer', fontWeight: 700
          }}
        >
          {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
        </button>

        <div style={{ width: 1, height: 12, background: '#222222' }} />

        <button
          onClick={() => setShowDangerZones(!showDangerZones)}
          style={{
            background: showDangerZones ? '#181818' : 'transparent',
            color: showDangerZones ? '#ef4444' : '#888888',
            border: 'none', borderRadius: 14, padding: '3px 8px', cursor: 'pointer', fontWeight: 700
          }}
        >
          {showDangerZones ? 'Danger Zones: ON' : 'Danger Zones: OFF'}
        </button>

        <div style={{ width: 1, height: 12, background: '#222222' }} />

        <button
          onClick={() => setShowMaritimeHubs(!showMaritimeHubs)}
          style={{
            background: showMaritimeHubs ? '#181818' : 'transparent',
            color: showMaritimeHubs ? '#ffffff' : '#888888',
            border: 'none', borderRadius: 14, padding: '3px 8px', cursor: 'pointer', fontWeight: 700
          }}
        >
          {showMaritimeHubs ? 'Hubs: ON' : 'Hubs: OFF'}
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      <style jsx global>{`
        .leaflet-container {
          background: #000000 !important;
          font-family: inherit;
        }
        .leaflet-tile-pane {
          filter: grayscale(100%) invert(100%) contrast(120%) !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
