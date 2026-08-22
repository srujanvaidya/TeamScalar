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

  // Initialize Leaflet Map exactly as in provided spec template
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Initialize map view
      const map = L.map(mapContainerRef.current, {
        center: [20.0, 30.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      // OpenStreetMap tile layer (inverted via CSS .leaflet-tile-pane for black monochromatic look)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Controls
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

  // Update map features when selected shipment or alternate route changes
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

    // 1. Draw Active Route Line (Monochromatic White / Red)
    const activeCoords = shipment.active_route_coords.map(([lat, lon]) => [lat, lon] as [number, number]);
    if (activeCoords.length > 1) {
      const activePolyline = L.polyline(activeCoords, {
        color: isBlocked ? '#ef4444' : '#ffffff',
        weight: 4,
        opacity: 0.9,
      }).addTo(layerGroup);

      activeCoords.forEach(c => bounds.extend(c));
    }

    // 2. Draw Selected Alternate Route Line (Dashed)
    if (altRouteId && shipment.alternate_routes) {
      const alt = shipment.alternate_routes.find((r) => r.route_id === altRouteId);
      if (alt && alt.waypoint_coords && alt.waypoint_coords.length > 1) {
        const altCoords = alt.waypoint_coords.map(([lat, lon]) => [lat, lon] as [number, number]);

        L.polyline(altCoords, {
          color: alt.risk_grade === 'HIGH' ? '#ef4444' : alt.risk_grade === 'MODERATE' ? '#f59e0b' : '#22c55e',
          weight: 3,
          dashArray: '8, 6',
          opacity: 0.9,
        }).addTo(layerGroup);

        altCoords.forEach(c => bounds.extend(c));
      }
    }

    // 3. Draw Vehicle Circle Marker (Red if blocked, White if active)
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

    // Auto-fit map view to bounds
    try {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
      }
    } catch {}
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000000' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Invert OpenStreetMap Tile Pane into Monochromatic Black Map (Exact template CSS) */}
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
