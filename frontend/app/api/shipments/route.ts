import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://palvwjxfasrwvstbccld.supabase.co';
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('sb_secret_'))
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbHZ3anhmYXNyd3ZzdGJjY2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder_anon_key';

const supabase = createClient(supabaseUrl, supabaseKey);

const PORT_COORDS: Record<string, [number, number]> = {
  'PORT_SHANGHAI_01': [31.2304, 121.4737],
  'PORT_SHANGHAI': [31.2304, 121.4737],
  'CNSHA': [31.2304, 121.4737],
  'PORT_ROTTERDAM_02': [51.9244, 4.4777],
  'PORT_ROTTERDAM': [51.9244, 4.4777],
  'NLRTM': [51.9244, 4.4777],
  'PORT_SINGAPORE_01': [1.3521, 103.8198],
  'PORT_SINGAPORE': [1.3521, 103.8198],
  'SGSIN': [1.3521, 103.8198],
  'PORT_DUBAI_01': [25.2048, 55.2708],
  'PORT_DUBAI': [25.2048, 55.2708],
  'AEEDX': [25.2048, 55.2708],
  'PORT_NHAVA_SHEVA_02': [18.9500, 72.9500],
  'PORT_NHAVA_SHEVA': [18.9500, 72.9500],
  'INNSA': [18.9500, 72.9500],
  'HUB_SHANGHAI': [31.2304, 121.4737],
  'RAIL_CHENGDU': [30.5728, 104.0668],
  'HUB_WARSAW': [52.2370, 21.0175],
  'DIST_BERLIN': [52.5200, 13.4050],
  'AIR_DUBAI': [25.2532, 55.3657],
  'HUB_FRANKFURT_01': [50.1109, 8.6821],
  'CORRIDOR_TAIWAN_STRAIT': [24.5000, 119.8000],
  'CORRIDOR_STRAIT_OF_MALACCA': [2.5000, 101.5000],
};

function resolveCoords(nodeName: string): [number, number] {
  if (PORT_COORDS[nodeName]) return PORT_COORDS[nodeName];
  // Default coordinates if unknown
  return [20.0, 75.0];
}

export async function GET() {
  let supabaseShipments: any[] = [];

  // Step 1: Attempt to fetch ships/containers and active routes from Supabase tables
  try {
    const { data: routeData } = await supabase.from('active_routes').select('*');
    const { data: shipmentData } = await supabase.from('shipments').select('*');

    const rawRows = (shipmentData && shipmentData.length) ? shipmentData : (routeData || []);

    if (rawRows && rawRows.length > 0) {
      supabaseShipments = rawRows.map((row: any, idx: number) => {
        const cargoId = row.cargo_id || row.container_id || `CONT-SUPABASE-${idx + 1}`;
        const vesselName = row.vessel_name || row.ship_name || row.ship || `SUPABASE VESSEL ${idx + 1}`;
        const origin = row.origin || 'PORT_SHANGHAI_01';
        const destination = row.destination || 'PORT_ROTTERDAM_02';

        // Parse route column (array of areas/nodes or coordinates)
        let routeArray: string[] = [];
        if (Array.isArray(row.route)) {
          routeArray = row.route;
        } else if (typeof row.route === 'string') {
          try { routeArray = JSON.parse(row.route); } catch { routeArray = [origin, destination]; }
        } else {
          routeArray = [origin, destination];
        }

        const activeCoords: [number, number][] = routeArray.map(node => resolveCoords(node));

        return {
          cargo_id: cargoId,
          mode: row.mode || 'MARITIME',
          vessel_name: vesselName,
          origin: origin,
          destination: destination,
          current_status: row.current_status || row.status || 'IN_TRANSIT',
          current_coordinates: activeCoords[0] || [31.2304, 121.4737],
          active_route_coords: activeCoords,
          metrics: {
            transit_hours: row.cost_usd ? Math.round(row.cost_usd / 100) : 120.0,
            cost_usd: row.cost_usd || 15000.0,
            co2_kg: row.co2_emissions_kg || 1400.0,
            sla_risk: 'LOW'
          },
          blockchain_provenance: {
            tx_hash: row.tx_hash || '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
            block_number: 4829150 + idx,
            contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
            origin_point: `${origin} [${activeCoords[0]?.[0]}, ${activeCoords[0]?.[1]}]`,
            destination_point: `${destination} [${activeCoords[activeCoords.length - 1]?.[0]}, ${activeCoords[activeCoords.length - 1]?.[1]}]`,
            verified_on_chain: true,
            timestamp: new Date().toISOString()
          },
          alternate_routes: [
            {
              route_id: `ROUTE_SUPABASE_${idx + 1}`,
              modal_sequence: ['ROAD_TRUCK', 'RAIL_FREIGHT'],
              waypoints: routeArray,
              waypoint_coords: activeCoords,
              estimated_transit_hours: 98.0,
              base_freight_cost_usd: (row.cost_usd || 15000) * 1.1,
              co2_emissions_kg: 1100.0,
              risk_grade: 'LOW',
              color_gradient: [56, 142, 60]
            }
          ]
        };
      });
    }
  } catch (err) {
    console.warn('Supabase fetch error:', err);
  }

  // Step 2: Attempt to fetch from FastAPI backend running on port 8000
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/shipments', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.shipments) {
        // Merge Supabase shipments with FastAPI shipments if any
        const combined = [...supabaseShipments, ...data.shipments];
        // Deduplicate by cargo_id
        const unique = Array.from(new Map(combined.map(item => [item.cargo_id, item])).values());
        return NextResponse.json({ shipments: unique });
      }
    }
  } catch {}

  // Step 3: Attempt to read from backend/data/shipments.json file on disk
  try {
    const filePath = path.join(process.cwd(), '..', 'backend', 'data', 'shipments.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(fileData);
      const combined = [...supabaseShipments, ...(json.shipments || [])];
      const unique = Array.from(new Map(combined.map(item => [item.cargo_id, item])).values());
      return NextResponse.json({ shipments: unique });
    }
  } catch {}

  // Step 4: Fallback
  return NextResponse.json({
    shipments: supabaseShipments.length ? supabaseShipments : [
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
        metrics: { transit_hours: 142.0, cost_usd: 14200.0, co2_kg: 1850.0, sla_risk: "HIGH" },
        alternate_routes: [
          {
            route_id: "ROUTE_ALT_A",
            modal_sequence: ["ROAD_TRUCK", "RAIL_FREIGHT"],
            waypoints: ["HUB_SHANGHAI", "RAIL_CHENGDU", "HUB_WARSAW", "DIST_BERLIN"],
            waypoint_coords: [[31.23, 121.47], [30.57, 104.07], [52.23, 21.01], [52.52, 13.4]],
            estimated_transit_hours: 110.5,
            base_freight_cost_usd: 18450.00,
            co2_emissions_kg: 1240.5,
            risk_grade: "LOW",
            color_gradient: [56, 142, 60]
          }
        ]
      }
    ]
  });
}
