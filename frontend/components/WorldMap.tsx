'use client';

import { useEffect, useRef, useState } from 'react';
import { DisruptionEvent, ActiveRoute } from '@/lib/supabase';

// Port/hub coordinates for visualization
const MAJOR_NODES: Record<string, { lat: number; lon: number; name: string; type: string }> = {
  PORT_SHANGHAI_01: { lat: 31.23, lon: 121.47, name: 'Shanghai', type: 'port' },
  PORT_ROTTERDAM_02: { lat: 51.9, lon: 4.47, name: 'Rotterdam', type: 'port' },
  PORT_SINGAPORE_01: { lat: 1.35, lon: 103.82, name: 'Singapore', type: 'port' },
  PORT_HAMBURG_01: { lat: 53.55, lon: 9.99, name: 'Hamburg', type: 'port' },
  PORT_DUBAI_01: { lat: 25.2, lon: 55.27, name: 'Dubai (Jebel Ali)', type: 'port' },
  PORT_LOSANGELES_01: { lat: 33.74, lon: -118.27, name: 'Los Angeles', type: 'port' },
  PORT_ANTWERP_01: { lat: 51.26, lon: 4.4, name: 'Antwerp', type: 'port' },
  PORT_BUSAN_01: { lat: 35.17, lon: 129.07, name: 'Busan', type: 'port' },
  HUB_FRANKFURT_01: { lat: 50.11, lon: 8.68, name: 'Frankfurt Hub', type: 'hub' },
  HUB_CHICAGO_01: { lat: 41.88, lon: -87.63, name: 'Chicago Hub', type: 'hub' },
  HUB_MUMBAI_01: { lat: 19.08, lon: 72.88, name: 'Mumbai Hub', type: 'hub' },
  RAIL_CHENGDU: { lat: 30.57, lon: 104.07, name: 'Chengdu Rail', type: 'rail' },
  RAIL_WARSAW: { lat: 52.23, lon: 21.01, name: 'Warsaw Rail', type: 'rail' },
  DIST_BERLIN: { lat: 52.52, lon: 13.4, name: 'Berlin Dist', type: 'dist' },
};

// Mercator projection helper
function project(lat: number, lon: number, w: number, h: number): [number, number] {
  const x = ((lon + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = h / 2 - (h * mercN) / (2 * Math.PI);
  return [x, y];
}

// Sample routes for visualization
const SAMPLE_ROUTES = [
  { from: 'PORT_SHANGHAI_01', to: 'PORT_ROTTERDAM_02', mode: 'ocean', status: 'active' },
  { from: 'PORT_SINGAPORE_01', to: 'PORT_DUBAI_01', mode: 'ocean', status: 'active' },
  { from: 'PORT_BUSAN_01', to: 'PORT_LOSANGELES_01', mode: 'ocean', status: 'active' },
  { from: 'PORT_ROTTERDAM_02', to: 'HUB_FRANKFURT_01', mode: 'road', status: 'active' },
  { from: 'HUB_FRANKFURT_01', to: 'DIST_BERLIN', mode: 'road', status: 'active' },
  { from: 'PORT_SHANGHAI_01', to: 'RAIL_CHENGDU', mode: 'rail', status: 'reroute' },
  { from: 'RAIL_CHENGDU', to: 'RAIL_WARSAW', mode: 'rail', status: 'reroute' },
  { from: 'RAIL_WARSAW', to: 'DIST_BERLIN', mode: 'road', status: 'reroute' },
  { from: 'PORT_DUBAI_01', to: 'HUB_MUMBAI_01', mode: 'ocean', status: 'active' },
  { from: 'PORT_ANTWERP_01', to: 'HUB_CHICAGO_01', mode: 'air', status: 'active' },
];

const MODE_COLORS: Record<string, string> = {
  ocean: '#60a5fa',
  rail: '#4ade80',
  road: '#fb923c',
  air: '#e2e8f0',
};

type Props = {
  disruptions: DisruptionEvent[];
  routes: ActiveRoute[];
  width: number;
  height: number;
};

export default function WorldMap({ disruptions, routes, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [tick, setTick] = useState(0);

  // Animate
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 50);
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

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
    bg.addColorStop(0, '#080c14');
    bg.addColorStop(1, '#04060a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (latitude/longitude)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
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

    // Draw animated arcs (routes)
    const t = tick * 0.02;
    SAMPLE_ROUTES.forEach((route, i) => {
      const from = MAJOR_NODES[route.from];
      const to = MAJOR_NODES[route.to];
      if (!from || !to) return;

      const [x1, y1] = project(from.lat, from.lon, W, H);
      const [x2, y2] = project(to.lat, to.lon, W, H);

      const color = MODE_COLORS[route.mode];
      const isReroute = route.status === 'reroute';

      // Control point for arc
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18;

      // Draw the arc path
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.strokeStyle = isReroute
        ? `rgba(250, 204, 21, 0.25)`
        : `${color}22`;
      ctx.lineWidth = isReroute ? 1.5 : 1;
      ctx.setLineDash(isReroute ? [6, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated particle along the arc
      const phase = (t + i * 0.3) % 1;
      const px = (1 - phase) * (1 - phase) * x1 + 2 * (1 - phase) * phase * mx + phase * phase * x2;
      const py = (1 - phase) * (1 - phase) * y1 + 2 * (1 - phase) * phase * my + phase * phase * y2;

      ctx.beginPath();
      ctx.arc(px, py, isReroute ? 3 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isReroute ? 'rgba(250, 204, 21, 0.9)' : color;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(px, py, isReroute ? 7 : 5, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(px, py, 0, px, py, isReroute ? 7 : 5);
      glow.addColorStop(0, isReroute ? 'rgba(250,204,21,0.4)' : `${color}60`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fill();
    });

    // Draw nodes
    Object.entries(MAJOR_NODES).forEach(([key, node]) => {
      const [x, y] = project(node.lat, node.lon, W, H);

      // Check if disrupted
      const isDisrupted = disruptions.some(d => d.affected_node === key);
      const isPredicted = key === 'PORT_ROTTERDAM_02'; // demo prediction

      const color = isDisrupted
        ? '#ef4444'
        : isPredicted
          ? '#eab308'
          : '#94a3b8';

      const radius = isDisrupted ? 5 : isPredicted ? 4 : 3;

      // Pulse ring for disrupted/predicted
      if (isDisrupted || isPredicted) {
        const pulse = Math.abs(Math.sin(t * 2 + (isDisrupted ? 0 : 1)));
        ctx.beginPath();
        ctx.arc(x, y, radius + pulse * (isDisrupted ? 18 : 12), 0, Math.PI * 2);
        ctx.strokeStyle = isDisrupted ? `rgba(239,68,68,${0.4 * (1 - pulse)})` : `rgba(234,179,8,${0.4 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Node dot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Glow
      const nodeGlow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      nodeGlow.addColorStop(0, `${color}50`);
      nodeGlow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = nodeGlow;
      ctx.fill();

      // Label for major nodes
      if (node.type === 'port') {
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = isDisrupted ? '#ef4444' : 'rgba(255,255,255,0.45)';
        ctx.fillText(node.name, x + radius + 3, y + 3);
      }
    });

  }, [tick, disruptions, routes, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
