'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

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
  alternate_routes: AlternateRoute[];
};

type Props = {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  activeAlternateRouteId: string | null;
  width: number;
  height: number;
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Import Leaflet dynamically on client
    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [25.0, 45.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      // Add CartoDB Dark Matter Tile Layer (Monochromatic Dark World Map)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add Zoom Control at bottom right
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

  // Update Map layers when selected shipment or route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    import('leaflet').then((L) => {
      renderMapElements(L, mapInstanceRef.current, layerGroupRef.current, selectedShipment, activeAlternateRouteId);
    });
  }, [selectedShipment, activeAlternateRouteId]);

  // Render ONLY the selected vehicle location and its route (strictly monochromatic, NO blue)
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

    // 1. Draw Active Route Line (Monochromatic Silver/White, NO BLUE)
    const activeCoords = shipment.active_route_coords.map(([lat, lon]) => [lat, lon] as [number, number]);
    if (activeCoords.length > 1) {
      const routePolyline = L.polyline(activeCoords, {
        color: isBlocked ? '#ef4444' : '#ffffff',
        weight: 3,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);

      // Fit map bounds to show full route cleanly
      try {
        map.fitBounds(routePolyline.getBounds(), { padding: [50, 50], maxZoom: 6 });
      } catch {}
    }

    // 2. Draw Selected Alternate Route Line (if active)
    if (altRouteId && shipment.alternate_routes) {
      const alt = shipment.alternate_routes.find((r) => r.route_id === altRouteId);
      if (alt && alt.waypoint_coords && alt.waypoint_coords.length > 1) {
        const altCoords = alt.waypoint_coords.map(([lat, lon]) => [lat, lon] as [number, number]);

        L.polyline(altCoords, {
          color: alt.risk_grade === 'HIGH' ? '#ef4444' : alt.risk_grade === 'MODERATE' ? '#f59e0b' : '#22c55e',
          weight: 3,
          opacity: 0.9,
          dashArray: '8, 6',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup);
      }
    }

    // 3. Draw Vehicle Marker (Strictly Monochromatic White/Red pulsing circle, NO BLUE)
    const vehicleIcon = L.divIcon({
      className: 'vehicle-marker',
      html: `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
            animation: pulse-ring 1.5s ease-out infinite;
          "></div>
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${isBlocked ? '#ef4444' : '#ffffff'};
            box-shadow: 0 0 10px ${isBlocked ? '#ef4444' : '#ffffff'};
          "></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([curLat, curLon], { icon: vehicleIcon }).addTo(layerGroup);

    // Vehicle Tooltip
    marker.bindTooltip(
      `<div style="font-family: monospace; font-size: 11px; padding: 2px 4px; background: #000; color: #fff; border: 1px solid #333; border-radius: 4px;">
        <strong>${shipment.cargo_id}</strong> (${shipment.vessel_name})<br/>
        Status: <span style="color: ${isBlocked ? '#ef4444' : '#22c55e'}">${shipment.current_status}</span>
      </div>`,
      { permanent: true, direction: 'top', offset: [0, -10] }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Pulse ring keyframe CSS */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          background: #000000 !important;
          font-family: inherit;
        }
        .leaflet-tile {
          filter: brightness(85%) contrast(110%) !important;
        }
      `}</style>
    </div>
  );
}
