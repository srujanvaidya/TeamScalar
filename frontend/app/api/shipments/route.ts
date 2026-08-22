import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://palvwjxfasrwvstbccld.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const AREA_COORDS: Record<string, [number, number]> = {
  'Shanghai Port': [31.2304, 121.4737],
  'PORT_SHANGHAI_01': [31.2304, 121.4737],
  'PORT_SHANGHAI': [31.2304, 121.4737],
  'Port of Singapore': [1.3521, 103.8198],
  'PORT_SINGAPORE_01': [1.3521, 103.8198],
  'PORT_SINGAPORE': [1.3521, 103.8198],
  'Suez Canal': [29.9753, 32.5599],
  'Port of Rotterdam': [51.9244, 4.4777],
  'PORT_ROTTERDAM_02': [51.9244, 4.4777],
  'PORT_ROTTERDAM': [51.9244, 4.4777],
  'Port of Los Angeles': [33.7426, -118.2673],
  'Panama Canal': [9.0800, -79.6800],
  'Port of New York/New Jersey': [40.6681, -74.1610],
  'Port of Nhava Sheva': [18.9500, 72.9500],
  'PORT_NHAVA_SHEVA_02': [18.9500, 72.9500],
  'Port of Dubai': [25.2048, 55.2708],
  'PORT_DUBAI_01': [25.2048, 55.2708],
  'HUB_SHANGHAI': [31.2304, 121.4737],
  'RAIL_CHENGDU': [30.5728, 104.0668],
  'HUB_WARSAW': [52.2370, 21.0175],
  'DIST_BERLIN': [52.5200, 13.4050],
  'AIR_DUBAI': [25.2532, 55.3657],
  'HUB_FRANKFURT_01': [50.1109, 8.6821],
};

function resolveAreaCoords(areaName: string): [number, number] {
  if (AREA_COORDS[areaName]) return AREA_COORDS[areaName];
  for (const [key, coords] of Object.entries(AREA_COORDS)) {
    if (areaName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(areaName.toLowerCase())) {
      return coords;
    }
  }
  return [20.0, 75.0];
}

export async function GET() {
  let supabaseShipments: any[] = [];

  // Step 1: Query Supabase container_events and ships tables directly
  try {
    const { data: ships } = await supabase.from('ships').select('*');
    const shipNameMap: Record<string, string> = {};
    if (ships && ships.length) {
      ships.forEach((s: any) => {
        shipNameMap[s.id] = s.name;
      });
    }

    const { data: containerEvents } = await supabase.from('container_events').select('*');

    if (containerEvents && containerEvents.length > 0) {
      supabaseShipments = containerEvents.map((row: any, idx: number) => {
        const cargoId = row.container_id || `CONT-SUPABASE-${idx + 1}`;
        const shipName = shipNameMap[row.ship_id] || row.ship_id || 'SUPABASE VESSEL';
        const origin = row.origin || 'Shanghai Port';
        const destination = row.destination || 'Port of Rotterdam';

        // Parse route column (array of area strings)
        let routeArray: string[] = [];
        if (Array.isArray(row.route)) {
          routeArray = row.route;
        } else if (typeof row.route === 'string') {
          try { routeArray = JSON.parse(row.route); } catch { routeArray = [origin, destination]; }
        } else {
          routeArray = [origin, destination];
        }

        const activeCoords: [number, number][] = routeArray.map(area => resolveAreaCoords(area));

        const legBreakdown = [];
        for (let i = 0; i < routeArray.length - 1; i++) {
          legBreakdown.push({
            leg_id: `SUPABASE-LEG-0${i + 1}`,
            from_node: routeArray[i],
            from_type: 'OCEAN_PORT',
            to_node: routeArray[i + 1],
            to_type: 'OCEAN_PORT',
            mode: 'MARITIME',
            distance_km: 1200.0 * (i + 1),
            transit_hours: 24.0 * (i + 1),
            departure_time: row.timestamp || new Date().toISOString(),
            arrival_time: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
            tx_hash: row.polygon_tx_hash || row.event_hash || '0x' + Math.random().toString(16).slice(2)
          });
        }

        return {
          cargo_id: cargoId,
          mode: 'MARITIME',
          vessel_name: `${shipName} (${row.ship_id || 'SHIP'})`,
          origin: origin,
          destination: destination,
          current_status: row.blockchain_status === 'CONFIRMED' ? 'ON_CHAIN_VERIFIED' : 'IN_TRANSIT',
          current_coordinates: activeCoords[0] || [31.2304, 121.4737],
          active_route_coords: activeCoords,
          metrics: {
            transit_hours: 96.0,
            cost_usd: 14500.0,
            co2_kg: 1200.0,
            sla_risk: 'LOW'
          },
          blockchain_provenance: {
            tx_hash: row.polygon_tx_hash || row.event_hash,
            block_number: 4829200 + idx,
            contract_address: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
            origin_point: `${origin} [${activeCoords[0]?.[0]}, ${activeCoords[0]?.[1]}]`,
            destination_point: `${destination} [${activeCoords[activeCoords.length - 1]?.[0]}, ${activeCoords[activeCoords.length - 1]?.[1]}]`,
            verified_on_chain: row.blockchain_status === 'CONFIRMED',
            timestamp: row.timestamp || row.created_at
          },
          route_legs: legBreakdown,
          alternate_routes: [
            {
              route_id: `ROUTE_SUPABASE_${cargoId}`,
              modal_sequence: ['MARITIME', 'OCEAN_FREIGHT'],
              waypoints: routeArray,
              waypoint_coords: activeCoords,
              estimated_transit_hours: 96.0,
              base_freight_cost_usd: 14500.0,
              co2_emissions_kg: 1200.0,
              risk_grade: 'LOW',
              color_gradient: [56, 142, 60],
              leg_breakdown: legBreakdown
            }
          ]
        };
      });
    }
  } catch (err) {
    console.warn('Supabase fetch error in route API:', err);
  }

  // Step 2: Attempt to fetch from FastAPI backend running on port 8000
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/shipments', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.shipments) {
        const combined = [...supabaseShipments, ...data.shipments];
        const unique = Array.from(new Map(combined.map(item => [item.cargo_id, item])).values());
        return NextResponse.json({ shipments: unique });
      }
    }
  } catch {}

  // Step 3: Read from backend/data/shipments.json file on disk
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
        cargo_id: "CONT-9010",
        mode: "MARITIME",
        vessel_name: "EVERGREEN (SHIP-001)",
        origin: "Shanghai Port",
        destination: "Port of Rotterdam",
        current_status: "ON_CHAIN_VERIFIED",
        current_coordinates: [31.2304, 121.4737],
        active_route_coords: [[31.2304, 121.4737], [1.3521, 103.8198], [29.9753, 32.5599], [51.9244, 4.4777]],
        metrics: { transit_hours: 96.0, cost_usd: 14500.0, co2_kg: 1200.0, sla_risk: "LOW" },
        alternate_routes: [
          {
            route_id: "ROUTE_EVERGREEN_01",
            modal_sequence: ["MARITIME", "OCEAN_FREIGHT"],
            waypoints: ["Shanghai Port", "Port of Singapore", "Suez Canal", "Port of Rotterdam"],
            waypoint_coords: [[31.2304, 121.4737], [1.3521, 103.8198], [29.9753, 32.5599], [51.9244, 4.4777]],
            estimated_transit_hours: 96.0,
            base_freight_cost_usd: 14500.0,
            co2_emissions_kg: 1200.0,
            risk_grade: "LOW",
            color_gradient: [56, 142, 60]
          }
        ]
      }
    ]
  });
}
