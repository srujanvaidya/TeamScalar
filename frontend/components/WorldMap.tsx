'use client';

import { useEffect, useRef } from 'react';
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

// Transport mode per-km freight cost rates & clean professional text labels (NO EMOJIS)
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
  }, [selectedShipment, activeAlternateRouteId]);

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

    // 1. Draw Normal / Default Route Polyline (Shows Cost of Normal Route & Ocean per-km rate on Hover)
    const activeCoords = shipment.active_route_coords.map(([lat, lon]) => [lat, lon] as [number, number]);
    if (activeCoords.length > 1) {
      const activePolyline = L.polyline(activeCoords, {
        color: isBlocked ? '#ef4444' : '#888888',
        weight: 5,
        opacity: 0.85,
      }).addTo(layerGroup);

      const modeLabel = MODE_TEXT[shipment.mode] || `[${shipment.mode}]`;
      const modeRate = MODE_RATES[shipment.mode] || '$0.65 / km';
      const normalCostFormatted = `$${shipment.metrics.cost_usd.toLocaleString()}`;

      activePolyline.bindTooltip(
        `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid #ef4444; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.9);">
          <div style="font-weight: 800; color: #ef4444; margin-bottom: 4px; letter-spacing: 0.05em;">[NORMAL ROUTE - BOTTLENECK AFFECTED]</div>
          <div style="margin-bottom: 2px;">Mode: <strong>${modeLabel}</strong> (${modeRate})</div>
          <div>Path: <strong>${shipment.origin}</strong> ➔ <strong>${shipment.destination}</strong></div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #222222; color: #cccccc;">
            Cost of Normal Route: <strong style="color: #ef4444; font-size: 13px;">${normalCostFormatted}</strong>
          </div>
          <div style="color: #aaaaaa; margin-top: 2px;">Transit Duration: <strong>${shipment.metrics.transit_hours} hours</strong></div>
          <div style="color: #666666; font-size: 9px; margin-top: 4px;">Vessel: ${shipment.vessel_name} (${shipment.cargo_id})</div>
        </div>`,
        { sticky: true }
      );

      activeCoords.forEach(c => bounds.extend(c));
    }

    // 2. Draw Agent 2 / 3 Optimized Alternate Route Polyline (Shows Cost of Optimized Route & per-km rate breakdown on Hover)
    if (altRouteId && shipment.alternate_routes) {
      const alt = shipment.alternate_routes.find((r) => r.route_id === altRouteId) || shipment.alternate_routes[0];
      if (alt && alt.waypoint_coords && alt.waypoint_coords.length > 1) {
        const altCoords = alt.waypoint_coords.map(([lat, lon]) => [lat, lon] as [number, number]);

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

        // Hover tooltip over Agent-Optimized Path showing exact Cost of Optimized Route & per-km transport rates
        altPolyline.bindTooltip(
          `<div style="font-family: Inter, monospace; font-size: 11px; padding: 10px 14px; background: #000000; color: #ffffff; border: 1px solid #ffffff; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.9);">
            <div style="font-weight: 800; color: #22c55e; margin-bottom: 4px; letter-spacing: 0.05em;">[AGENT OPTIMIZED ROAD / MULTIMODAL ROUTE]</div>
            <div style="margin-bottom: 2px;">Route ID: <strong>${alt.route_id}</strong></div>
            <div>Modal Chain: <strong>${seqText}</strong></div>
            <div style="margin-top: 4px; color: #888888; font-size: 10px;">
              Per-KM Rates: Ocean ($0.65/km) | Rail ($1.25/km) | Road ($2.80/km) | Air ($8.50/km)
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #222222; color: #cccccc;">
              Cost of Optimized Route: <strong style="color: #22c55e; font-size: 13px;">${optCostFormatted}</strong>
            </div>
            <div style="color: #aaaaaa; margin-top: 2px;">
              Est. Transit: <strong>${alt.estimated_transit_hours} hours</strong>
              ${timeSavings > 0 ? `<span style="color: #22c55e; margin-left: 6px;">(Saves ${timeSavings}h!)</span>` : ''}
            </div>
            <div style="color: #ffffff; font-size: 9px; margin-top: 4px; font-weight: 700;">
              POLYGON PROVENANCE: VERIFIED ON-CHAIN
            </div>
          </div>`,
          { sticky: true }
        );

        // Draw Waypoint Leg Transfer Nodes on Map with clean professional labels (NO EMOJIS)
        alt.waypoint_coords.forEach((coord, idx) => {
          const nodeName = alt.waypoints[idx] || `Node ${idx + 1}`;
          const isOrigin = idx === 0;
          const isDest = idx === alt.waypoint_coords.length - 1;
          const modeType = alt.modal_sequence[Math.min(idx, alt.modal_sequence.length - 1)];

          const waypointMarker = L.circleMarker([coord[0], coord[1]], {
            radius: isOrigin || isDest ? 8 : 6,
            fillColor: isOrigin ? '#ffffff' : isDest ? '#ffffff' : '#aaaaaa',
            color: '#000000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95,
          }).addTo(layerGroup);

          waypointMarker.bindTooltip(
            `<div style="font-family: monospace; font-size: 10px; padding: 4px 8px; background: #000000; color: #ffffff; border: 1px solid #333333; border-radius: 4px;">
              ${isOrigin ? '[ORIGIN NODE]: ' : isDest ? '[DESTINATION NODE]: ' : '[TRANSFER HUB]: '} <strong>${nodeName}</strong><br/>
              <span style="color: #888888;">Mode: ${MODE_TEXT[modeType] || modeType} (${MODE_RATES[modeType] || '$2.80 / km'})</span>
            </div>`,
            { permanent: false, direction: 'top' }
          );
        });
      }
    }

    // 3. Draw Vehicle Circle Marker (NO EMOJIS)
    const vehicleMarker = L.circleMarker([curLat, curLon], {
      radius: 9,
      fillColor: isBlocked ? '#ef4444' : '#ffffff',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(layerGroup);

    bounds.extend([curLat, curLon]);

    // Popup Tooltip on Ship Vehicle Marker (NO EMOJIS)
    vehicleMarker.bindTooltip(
      `<div style="font-family: monospace; font-size: 11px; padding: 6px 10px; background: #000000; color: #ffffff; border: 1px solid #333333; border-radius: 4px;">
        <strong>${shipment.vessel_name}</strong> (${shipment.cargo_id})<br/>
        Status: <span style="color: ${isBlocked ? '#ef4444' : '#22c55e'}; font-weight: 700;">[${shipment.current_status}]</span><br/>
        <span style="color: #aaaaaa; font-size: 10px;">Normal Route Cost: $${shipment.metrics.cost_usd.toLocaleString()}</span>
      </div>`,
      { permanent: true, direction: 'top', offset: [0, -10] }
    );

    // Auto-fit map view
    try {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
      }
    } catch {}
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000000' }}>
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
