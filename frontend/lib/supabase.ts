import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type DisruptionEvent = {
  id: string;
  incident_id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  affected_node: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

export type ActiveRoute = {
  id: string;
  route_id: string;
  cargo_id: string;
  origin: string;
  destination: string;
  current_status: string;
  polyline_geojson: Record<string, unknown>;
  cost_usd: number;
  co2_emissions_kg: number;
  updated_at: string;
};

export type BlockchainAudit = {
  id: string;
  tx_hash: string;
  block_number: number;
  cargo_id: string;
  action_type: string;
  financial_impact_usd: number;
  reasoning_markdown: string;
  contract_address: string;
  created_at: string;
};
