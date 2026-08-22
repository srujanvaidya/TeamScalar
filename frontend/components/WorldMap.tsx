'use client';

import { useEffect, useRef, useState } from 'react';

export type LayerConfig = {
  spaceports: boolean;
  undersea_cables: boolean;
  pipelines: boolean;
  ai_datacenters: boolean;
  military_activity: boolean;
  ship_traffic: boolean;
  trade_routes: boolean;
  aviation: boolean;
  protests: boolean;
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

// Mercator projection helper
function project(lat: number, lon: number, w: number, h: number): [number, number] {
  const x = ((lon + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = h / 2 - (h * mercN) / (2 * Math.PI);
  return [x, y];
}

// Tactical Map Overlay Data
const HAZARD_ZONES = [
  {
    name: 'Red Sea / Gulf of Aden Blockade',
    polygon: [
      [27.0, 34.0], [20.0, 38.0], [12.0, 43.0], [11.5, 51.0], [15.0, 52.0], [22.0, 37.0]
    ] as [number, number][],
    risk: 'CRITICAL',
  },
  {
    name: 'Strait of Hormuz Alert Area',
    polygon: [
      [27.5, 54.0], [26.0, 57.0], [24.5, 58.5], [25.0, 55.0]
    ] as [number, number][],
    risk: 'HIGH',
  },
  {
    name: 'Taiwan Strait Exclusion Zone',
    polygon: [
      [26.0, 119.5], [25.5, 122.5], [22.5, 121.0], [23.0, 118.5]
    ] as [number, number][],
    risk: 'HIGH',
  }
];

const MILITARY_BASES: { name: string; coords: [number, number]; type: string }[] = [
  { name: 'Al Udeid Air Base', coords: [25.11, 51.31], type: 'air_base' },
  { name: 'Naval Support Activity Bahrain', coords: [26.20, 50.60], type: 'naval_base' },
  { name: 'Diego Garcia Base', coords: [-7.31, 72.41], type: 'military' },
  { name: 'Camp Lemonnier', coords: [11.54, 43.14], type: 'base' },
  { name: 'Yokosuka Naval Base', coords: [35.29, 139.67], type: 'naval_base' },
];

const DATA_CENTERS: { name: string; coords: [number, number] }[] = [
  { name: 'DC-Frankfurt-01', coords: [50.11, 8.68] },
  { name: 'DC-Singapore-02', coords: [1.35, 103.82] },
  { name: 'DC-Dubai-01', coords: [25.20, 55.27] },
  { name: 'DC-Tokyo-01', coords: [35.67, 139.65] },
];

type Props = {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  activeAlternateRouteId: string | null;
  layers: LayerConfig;
  width: number;
  height: number;
};

export default function WorldMap({
  shipments,
  selectedShipment,
  activeAlternateRouteId,
  layers,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = width;
    const H = height;
    canvas.width = W;
    canvas.height = H;

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // Deep Tactical Background
    const bgGradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.75);
    bgGradient.addColorStop(0, '#0a0d14');
    bgGradient.addColorStop(1, '#030508');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // Latitude & Longitude Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x] = project(0, lon, W, H);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 80; lat += 30) {
      const [, y] = project(lat, 0, W, H);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const timePhase = tick * 0.03;

    // 1. Draw Red Tactical Hazard Zones (Conflict / Blockade Polygons)
    HAZARD_ZONES.forEach((zone) => {
      if (zone.polygon.length < 3) return;
      ctx.beginPath();
      const [startLat, startLon] = zone.polygon[0];
      const [sx, sy] = project(startLat, startLon, W, H);
      ctx.moveTo(sx, sy);

      for (let i = 1; i < zone.polygon.length; i++) {
        const [pLat, pLon] = zone.polygon[i];
        const [px, py] = project(pLat, pLon, W, H);
        ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Shading & Dash border (matches attached World Monitor screenshot)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
      ctx.fill();

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. Draw Optional Layers (Pipelines, Military Activity, Data Centers)
    if (layers.military_activity) {
      MILITARY_BASES.forEach((base) => {
        const [bx, by] = project(base.coords[0], base.coords[1], W, H);
        // Triangle icon
        ctx.beginPath();
        ctx.moveTo(bx, by - 5);
        ctx.lineTo(bx - 4, by + 4);
        ctx.lineTo(bx + 4, by + 4);
        ctx.closePath();
        ctx.fillStyle = '#60a5fa';
        ctx.fill();

        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillText(base.name, bx + 6, by + 3);
      });
    }

    if (layers.ai_datacenters) {
      DATA_CENTERS.forEach((dc) => {
        const [dx, dy] = project(dc.coords[0], dc.coords[1], W, H);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(dx - 3, dy - 3, 6, 6);

        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
        ctx.fillText(dc.name, dx + 6, dy + 3);
      });
    }

    // 3. Draw All Shipments & Trade Routes (ArcLayer & Dynamic Gradients)
    shipments.forEach((shipment) => {
      const isSelected = selectedShipment?.cargo_id === shipment.cargo_id;
      const coords = shipment.active_route_coords;

      // Draw Main Active Trade Route Arc
      if (layers.trade_routes && coords.length > 1) {
        for (let i = 0; i < coords.length - 1; i++) {
          const [lat1, lon1] = coords[i];
          const [lat2, lon2] = coords[i + 1];
          const [x1, y1] = project(lat1, lon1, W, H);
          const [x2, y2] = project(lat2, lon2, W, H);

          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(mx, my, x2, y2);

          // Route color: Cyan for normal, Red for blocked
          const isBlocked = shipment.current_status.includes('BLOCKED') || shipment.current_status.includes('DELAY');
          ctx.strokeStyle = isBlocked
            ? 'rgba(239, 68, 68, 0.4)'
            : isSelected
              ? 'rgba(56, 189, 248, 0.8)'
              : 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();

          // Animated particle flow
          const phase = (timePhase + i * 0.4) % 1;
          const px = (1 - phase) * (1 - phase) * x1 + 2 * (1 - phase) * phase * mx + phase * phase * x2;
          const py = (1 - phase) * (1 - phase) * y1 + 2 * (1 - phase) * phase * my + phase * phase * y2;

          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 3 : 2, 0, Math.PI * 2);
          ctx.fillStyle = isBlocked ? '#ef4444' : '#38bdf8';
          ctx.fill();
        }
      }

      // Draw Alternate Routes with Dynamic Color Gradients (Green, Amber, Red)
      if (isSelected && shipment.alternate_routes) {
        shipment.alternate_routes.forEach((altRoute) => {
          const isAltActive = activeAlternateRouteId === altRoute.route_id;
          const [r, g, b] = altRoute.color_gradient || [56, 142, 60];
          const colorStr = `rgb(${r}, ${g}, ${b})`;
          const waypoints = altRoute.waypoint_coords;

          if (waypoints && waypoints.length > 1) {
            for (let i = 0; i < waypoints.length - 1; i++) {
              const [lat1, lon1] = waypoints[i];
              const [lat2, lon2] = waypoints[i + 1];
              const [x1, y1] = project(lat1, lon1, W, H);
              const [x2, y2] = project(lat2, lon2, W, H);

              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.22;

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(mx, my, x2, y2);
              ctx.strokeStyle = isAltActive ? colorStr : `rgba(${r}, ${g}, ${b}, 0.35)`;
              ctx.lineWidth = isAltActive ? 2.5 : 1.5;
              ctx.setLineDash([6, 4]);
              ctx.stroke();
              ctx.setLineDash([]);

              // Glowing particles on active alternate route
              if (isAltActive) {
                const phase = (timePhase * 1.2 + i * 0.3) % 1;
                const px = (1 - phase) * (1 - phase) * x1 + 2 * (1 - phase) * phase * mx + phase * phase * x2;
                const py = (1 - phase) * (1 - phase) * y1 + 2 * (1 - phase) * phase * my + phase * phase * y2;

                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fillStyle = colorStr;
                ctx.fill();
              }
            }
          }
        });
      }

      // 4. Draw Vessel / Package Live Coordinates (ScatterplotLayer / Pulsing Node)
      const [curLat, curLon] = shipment.current_coordinates;
      const [cx, cy] = project(curLat, curLon, W, H);
      const isBlocked = shipment.current_status.includes('BLOCKED') || shipment.current_status.includes('DELAY');

      const nodeColor = isBlocked ? '#ef4444' : '#38bdf8';
      const pulseSize = Math.abs(Math.sin(timePhase * 3)) * (isBlocked ? 22 : 14);

      // Pulse Outer Ring
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = isBlocked
        ? `rgba(239, 68, 68, ${0.5 * (1 - pulseSize / 22)})`
        : `rgba(56, 189, 248, ${0.5 * (1 - pulseSize / 14)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Node Circle
      ctx.beginPath();
      ctx.arc(cx, cy, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();

      // Label
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.7)';
      ctx.fillText(`${shipment.cargo_id} (${shipment.vessel_name})`, cx + 10, cy + 4);
    });

  }, [tick, shipments, selectedShipment, activeAlternateRouteId, layers, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
