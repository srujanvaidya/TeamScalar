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

const MODE_ICONS: Record<string, string> = {
  ROAD_TRUCK: '🚚 ROAD TRUCK',
  MARITIME: '🚢 OCEAN FREIGHT',
  OCEAN_FREIGHT: '🚢 OCEAN FREIGHT',
  RAIL_FREIGHT: '🚆 RAIL FREIGHT',
  AIR_FREIGHT: '✈️ AIR FREIGHT',
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

    const isBlocked = shipment.current_status.includes('BLOCKED') || shipment.current_status.includes('DELAY');
    const [curLat, curLon] = shipment.current_coordinates;
    const bounds = L.latLngBounds();

    // 1. Draw Active Route Segment Line with Hover Tooltip (Transport Mode, Node Names, Distance)
    const activeCoords = shipment.active_route_coords.map(([lat, lon]) => [lat, lon] as [number, number]);
    if (activeCoords.length > 1) {
      const activePolyline = L.polyline(activeCoords, {
        color: isBlocked ? '#ef4444' : '#ffffff',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);

      const modeLabel = MODE_ICONS[shipment.mode] || `🚚 ${shipment.mode}`;
      const txHash = shipment.blockchain_provenance?.tx_hash || 'Verified On-Chain';

      activePolyline.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 6px 10px; background: #0a0a0a; color: #fff; border: 1px solid #333; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
          <div style="font-weight: 800; color: #38bdf8; margin-bottom: 2px;">${modeLabel}</div>
          <div>Path: <strong>${shipment.origin}</strong> ➔ <strong>${shipment.destination}</strong></div>
          <div style="color: #aaa; margin-top: 2px;">Transit Time: <strong>${shipment.metrics.transit_hours}h</strong></div>
          <div style="color: #22c55e; font-size: 9px; margin-top: 4px;">⛓️ ON-CHAIN TX: ${txHash.slice(0, 16)}...</div>
        </div>`,
        { sticky: true }
      );

      activeCoords.forEach(c => bounds.extend(c));
    }

    // 2. Draw Selected Alternate Route Segments with Modal Transport Tooltips (Road, Rail, Maritime, Air)
    if (altRouteId && shipment.alternate_routes) {
      const alt = shipment.alternate_routes.find((r) => r.route_id === altRouteId);
      if (alt && alt.waypoint_coords && alt.waypoint_coords.length > 1) {
        const altCoords = alt.waypoint_coords.map(([lat, lon]) => [lat, lon] as [number, number]);

        const altPolyline = L.polyline(altCoords, {
          color: alt.risk_grade === 'HIGH' ? '#ef4444' : alt.risk_grade === 'MODERATE' ? '#f59e0b' : '#22c55e',
          weight: 4,
          dashArray: '8, 6',
          opacity: 0.9,
        }).addTo(layerGroup);

        altCoords.forEach(c => bounds.extend(c));

        // Hover tooltip over path showing modal transport breakdown
        const seqText = alt.modal_sequence.map(m => MODE_ICONS[m] || m).join(' ➔ ');
        const altTx = alt.blockchain_message?.tx_hash || 'Verified Reroute Contract';

        altPolyline.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 6px 10px; background: #0a0a0a; color: #fff; border: 1px solid #444; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
            <div style="font-weight: 800; color: #22c55e; margin-bottom: 2px;">ALTERNATIVE ROUTE: ${alt.route_id}</div>
            <div>Modal Chain: <strong>${seqText}</strong></div>
            <div style="color: #aaa; margin-top: 2px;">Est. Hours: <strong>${alt.estimated_transit_hours}h</strong> | Cost: <strong>$${alt.base_freight_cost_usd}</strong></div>
            <div style="color: #00ffcc; font-size: 9px; margin-top: 4px;">⛓️ REROUTE TX: ${altTx.slice(0, 16)}...</div>
          </div>`,
          { sticky: true }
        );

        // Draw Waypoint Leg Nodes on Map (Road Hub, Ocean Port, Rail Terminal, Dist Hub)
        alt.waypoint_coords.forEach((coord, idx) => {
          const nodeName = alt.waypoints[idx] || `Node ${idx + 1}`;
          const isOrigin = idx === 0;
          const isDest = idx === alt.waypoint_coords.length - 1;
          const modeType = alt.modal_sequence[Math.min(idx, alt.modal_sequence.length - 1)];

          const waypointMarker = L.circleMarker([coord[0], coord[1]], {
            radius: isOrigin || isDest ? 8 : 6,
            fillColor: isOrigin ? '#22c55e' : isDest ? '#38bdf8' : '#e2e8f0',
            color: '#000000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95,
          }).addTo(layerGroup);

          waypointMarker.bindTooltip(
            `<div style="font-family: monospace; font-size: 10px; padding: 3px 6px; background: #111; color: #fff; border: 1px solid #444; border-radius: 4px;">
              ${isOrigin ? '🏁 ORIGIN: ' : isDest ? '🎯 DESTINATION: ' : '📍 TRANSFER POINT: '} <strong>${nodeName}</strong><br/>
              <span style="color: #aaa;">Mode: ${modeType}</span>
            </div>`,
            { permanent: false, direction: 'top' }
          );
        });
      }
    }

    // 3. Draw Vehicle Circle Marker
    const vehicleMarker = L.circleMarker([curLat, curLon], {
      radius: 9,
      fillColor: isBlocked ? 'red' : '#ffffff',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(layerGroup);

    bounds.extend([curLat, curLon]);

    // Popup Tooltip
    vehicleMarker.bindTooltip(
      `<div style="font-family: monospace; font-size: 11px; padding: 4px 8px; background: #000; color: #fff; border: 1px solid #444; border-radius: 4px;">
        <strong>${shipment.cargo_id}</strong> (${shipment.vessel_name})<br/>
        Status: <span style="color: ${isBlocked ? '#ef4444' : '#22c55e'}">${shipment.current_status}</span>
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
