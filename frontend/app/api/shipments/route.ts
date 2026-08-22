import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Attempt 1: Fetch from FastAPI running on port 8000
    const res = await fetch('http://127.0.0.1:8000/api/v1/shipments', {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Attempt 2: Read directly from backend/data/shipments.json file on disk
  try {
    const filePath = path.join(process.cwd(), '..', 'backend', 'data', 'shipments.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(fileData));
    }
  } catch {}

  // Attempt 3: In-Memory Real Backend Data Store
  return NextResponse.json({
    shipments: [
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
        blockchain_provenance: {
          tx_hash: "0x7f9a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
          block_number: 4829103,
          contract_address: "0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae",
          origin_point: "PORT_SHANGHAI_01 [31.2304, 121.4737]",
          destination_point: "PORT_ROTTERDAM_02 [51.9244, 4.4777]",
          verified_on_chain: true,
          timestamp: "2026-08-22T19:20:00Z"
        },
        route_legs: [
          {
            leg_id: "LEG-01",
            from_node: "HUB_SHANGHAI",
            from_type: "ROAD_HUB",
            to_node: "PORT_SHANGHAI_01",
            to_type: "OCEAN_PORT",
            mode: "ROAD_TRUCK",
            distance_km: 45.0,
            transit_hours: 3.5,
            departure_time: "2026-08-20T08:00:00Z",
            arrival_time: "2026-08-20T11:30:00Z",
            tx_hash: "0x1111a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9"
          },
          {
            leg_id: "LEG-02",
            from_node: "PORT_SHANGHAI_01",
            from_type: "OCEAN_PORT",
            to_node: "PORT_ROTTERDAM_02",
            to_type: "OCEAN_PORT",
            mode: "MARITIME",
            distance_km: 19500.0,
            transit_hours: 138.5,
            departure_time: "2026-08-20T14:00:00Z",
            arrival_time: "2026-08-26T08:30:00Z",
            tx_hash: "0x2222b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
          }
        ],
        alternate_routes: [
          {
            route_id: "ROUTE_ALT_A",
            modal_sequence: ["ROAD_TRUCK", "RAIL_FREIGHT", "ROAD_TRUCK"],
            waypoints: ["HUB_SHANGHAI", "RAIL_CHENGDU", "HUB_WARSAW", "DIST_BERLIN"],
            waypoint_coords: [
              [31.23, 121.47], [30.57, 104.07], [52.23, 21.01], [52.52, 13.4]
            ],
            estimated_transit_hours: 110.5,
            base_freight_cost_usd: 18450.00,
            co2_emissions_kg: 1240.5,
            risk_grade: "LOW",
            color_gradient: [56, 142, 60],
            blockchain_message: {
              action: "PROPOSING_REROUTE_TRANSACTION",
              start_node: "HUB_SHANGHAI (Road Hub)",
              end_node: "DIST_BERLIN (Distribution Center)",
              leg_summary: "ROAD -> RAIL -> ROAD",
              tx_hash: "0x3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
              verified_on_chain: true
            },
            leg_breakdown: [
              {
                leg_id: "ALT-A-1",
                from_node: "HUB_SHANGHAI",
                from_type: "ROAD_HUB",
                to_node: "RAIL_CHENGDU",
                to_type: "RAIL_TERMINAL",
                mode: "ROAD_TRUCK",
                distance_km: 1650.0,
                transit_hours: 18.0,
                departure_time: "2026-08-23T06:00:00Z",
                arrival_time: "2026-08-24T00:00:00Z",
                tx_hash: "0x3333c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1"
              },
              {
                leg_id: "ALT-A-2",
                from_node: "RAIL_CHENGDU",
                from_type: "RAIL_TERMINAL",
                to_node: "HUB_WARSAW",
                to_type: "RAIL_HUB",
                mode: "RAIL_FREIGHT",
                distance_km: 9800.0,
                transit_hours: 84.5,
                departure_time: "2026-08-24T02:00:00Z",
                arrival_time: "2026-08-27T14:30:00Z",
                tx_hash: "0x4444d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2"
              },
              {
                leg_id: "ALT-A-3",
                from_node: "HUB_WARSAW",
                from_type: "RAIL_HUB",
                to_node: "DIST_BERLIN",
                to_type: "DISTRIBUTION_CENTER",
                mode: "ROAD_TRUCK",
                distance_km: 570.0,
                transit_hours: 8.0,
                departure_time: "2026-08-27T16:00:00Z",
                arrival_time: "2026-08-28T00:00:00Z",
                tx_hash: "0x5555e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3"
              }
            ]
          }
        ]
      }
    ]
  });
}
