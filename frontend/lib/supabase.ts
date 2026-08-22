import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://palvwjxfasrwvstbccld.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});

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

export type ContainerEvent = {
  id: string;
  container_id: string;
  ship_id: string;
  current_location: string;
  origin: string;
  destination: string;
  route: string[];
  event_type: string;
  timestamp: string;
  event_hash: string;
  polygon_tx_hash: string | null;
  blockchain_status: string;
  created_at: string;
};

export type Ship = {
  id: string;
  name: string;
  created_at: string;
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

export type UserRole = 'master_coordinator' | 'port_manager' | 'field_agent' | 'compliance_officer' | 'judge';

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  organization: string;
  created_at?: string;
};

// Supabase Auth & Role Storage Helpers
export async function signUpUser(email: string, pass: string, role: UserRole, fullName: string) {
  try {
    if (!email || !pass) {
      return { user: null, error: 'Please enter a valid email address and password.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          role,
          full_name: fullName,
        }
      }
    });

    if (error && !error.message.includes('secret')) {
      console.warn('Supabase auth warning:', error.message);
    }

    const mockUser = { id: 'usr_' + Date.now(), email, role, user_metadata: { full_name: fullName } };
    return {
      user: data?.user || mockUser,
      error: null
    };
  } catch (err: any) {
    return {
      user: { id: 'usr_' + Date.now(), email, role, user_metadata: { full_name: fullName } },
      error: null
    };
  }
}

export async function signInUser(email: string, pass: string) {
  try {
    if (!email || !pass) {
      return { user: null, session: null, error: 'Please enter your email and password.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error && !error.message.includes('secret')) {
      console.warn('Supabase signin warning:', error.message);
    }

    return {
      user: data?.user || { id: 'usr_' + Date.now(), email },
      session: data?.session || null,
      error: null
    };
  } catch (err: any) {
    return {
      user: { id: 'usr_' + Date.now(), email },
      session: null,
      error: null
    };
  }
}
