'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, Role } from '@/store/useStore';
import { signUpUser, signInUser } from '@/lib/supabase';
import {
  Globe, Anchor, Smartphone, Shield, Zap, ArrowRight,
  ChevronUp, ChevronDown, Lock, UserCheck, LogIn, AlertCircle
} from 'lucide-react';

const ROLES: {
  id: Role;
  title: string;
  defaultRoute: string;
}[] = [
  { id: 'master_coordinator', title: 'Master Coordinator (Full Access)', defaultRoute: '/command-center' },
  { id: 'port_manager', title: 'Port Terminal Manager (Port Ops)', defaultRoute: '/port-operations' },
  { id: 'field_agent', title: 'Field Agent (Mobile Scanner)', defaultRoute: '/mobile-scanner' },
  { id: 'compliance_officer', title: 'Compliance Officer (Audit Explorer)', defaultRoute: '/audit-explorer' },
  { id: 'judge', title: 'Judge / Demo Mode (Chaos Panel)', defaultRoute: '/chaos-panel' },
];

const CAPABILITIES = [
  {
    id: 0,
    title: 'Agent 2: Autonomous Multimodal Graph-RL Rerouting',
    description: 'Harness NetworkX directed weighted graphs and dynamic Dijkstra pathfinding to calculate optimal multimodal alternative routes (Road, Rail, Maritime, Air) when global maritime chokepoints or ports are disrupted — eliminating SLA delay penalties.',
    tags: ['Graph-RL Dijkstra', 'Multimodal Rerouting', 'Dynamic Edge Weights', 'Demurrage Minimization', 'Hazard Risk Penalty', 'Zero Hallucinations'],
    image: '/ship.jpg',
  },
  {
    id: 1,
    title: 'Agent 3: Pydantic Tool & Constraint Validator',
    description: 'Executes strict Pydantic REST validation queries against real warehouse stock, quay berth availability, and HazMat safety rules to guarantee zero-hallucination agent execution.',
    tags: ['Pydantic Schemas', 'Quay Berth Constraints', 'Spot Rate Querying', 'HazMat Rule Validation', 'Tool Execution'],
    image: '/ship.jpg',
  },
  {
    id: 2,
    title: 'Agent 4: Immutable Blockchain Location Provenance',
    description: 'Anchors every cargo status update, transfer node event, and agent decision onto Polygon/Ethereum smart contracts to produce cryptographic dispute-proof audit trails.',
    tags: ['On-Chain Provenance', 'Polygon / Ethereum', 'Cryptographic Proof', 'Audit Explorer', 'Dispute Settlement'],
    image: '/ship.jpg',
  },
  {
    id: 3,
    title: 'Agents 5-7: Real-Time Maritime & Port Telemetry',
    description: 'Continuous AIS vessel tracking, canal congestion monitoring (Suez, Panama, Strait of Malacca), and automated strike disruption triggers across global trade lanes.',
    tags: ['AIS Vessel Tracking', 'Chokepoint Telemetry', 'Weather & Strike Feeds', 'FastAPI WebSockets'],
    image: '/ship.jpg',
  },
  {
    id: 4,
    title: 'Agent 8: Automated Carrier Spot Rate Negotiation',
    description: 'Dynamic spot rate bidding microservice that queries real carrier APIs to secure emergency freight capacity within budget constraints.',
    tags: ['Carrier Bidding', 'Spot Rate Microservice', 'SLA Budget Guardrails', 'Automated Dispatch'],
    image: '/ship.jpg',
  },
  {
    id: 5,
    title: 'Agent 9: ESG Carbon Footprint & SLA Financial Tracking',
    description: 'Calculates CO2 emissions per ton-kilometer across sea vs rail vs road legs while tracking avoided SLA financial penalties in real-time.',
    tags: ['ESG Carbon Tracking', 'SLA Penalty Calculation', 'CO2 Emission Metrics', 'Financial Audit'],
    image: '/ship.jpg',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { setRole } = useStore();

  // Active capability accordion state
  const [activeCapability, setActiveCapability] = useState<number>(0);

  // Monochromatic Supabase Auth Modal State
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('master_coordinator');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Supabase Auth Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter a valid email address and password.');
      setAuthLoading(false);
      return;
    }

    if (authMode === 'SIGNUP') {
      const { user, error } = await signUpUser(email, password, selectedRole, fullName || 'Logistics Operator');
      if (error) {
        setAuthError(error);
        setAuthLoading(false);
        return;
      }
    } else {
      const { user, error } = await signInUser(email, password);
      if (error) {
        setAuthError(error);
        setAuthLoading(false);
        return;
      }
    }

    // Set authenticated role & transition to workspace
    setRole(selectedRole);
    const roleObj = ROLES.find(r => r.id === selectedRole);
    setAuthLoading(false);
    setAuthOpen(false);
    router.push(roleObj?.defaultRoute || '/command-center');
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#ffffff', fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', overflowY: 'auto', margin: 0, padding: 0 }}>

      {/* 1. Sleek Floating Centered Black Navigation Pill */}
      <nav style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        background: 'rgba(0, 0, 0, 0.95)', borderRadius: 9999, border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 36,
        boxShadow: '0 16px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)'
      }}>
        {/* Brand Name */}
        <span style={{ fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Reroute.
        </span>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13, fontWeight: 500 }}>
          <a href="#capabilities" style={{ color: '#ffffff', textDecoration: 'none' }}>Services</a>
          <a href="#capabilities" style={{ color: '#ffffff', textDecoration: 'none' }}>Capabilities</a>
          <a href="#capabilities" style={{ color: '#ffffff', textDecoration: 'none' }}>Resources</a>
        </div>

        {/* Right CTA Button Pill */}
        <button
          onClick={() => { setAuthMode('LOGIN'); setAuthOpen(true); }}
          style={{
            background: '#ffffff', color: '#000000', border: 'none',
            borderRadius: 9999, padding: '7px 18px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          Sign In
        </button>
      </nav>

      {/* 2. Full-Screen Hero Section (ship.jpg Background & Bottom-Left Text Alignment) */}
      <section style={{
        position: 'relative', width: '100%', minHeight: '100vh', display: 'flex',
        flexDirection: 'column', justifyContent: 'flex-end', padding: '0 64px 80px',
        backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.98) 100%), url("/ship.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        margin: 0
      }}>
        <div style={{ maxWidth: 840, position: 'relative', zIndex: 10 }}>
          <h1 style={{
            fontSize: 54, fontWeight: 800, color: '#ffffff', lineHeight: 1.1,
            letterSpacing: '-1.5px', marginBottom: 20
          }}>
            Autonomous & GIS-Based Supply Chain Disruption Control System
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, marginBottom: 32, maxWidth: 640 }}>
            Multi-agent AI graph optimization, real-time maritime tracking, and on-chain location provenance — enabling accurate, real-time logistics rerouting.
          </p>

          <button
            onClick={() => { setAuthMode('SIGNUP'); setAuthOpen(true); }}
            style={{
              background: '#ffffff', color: '#000000', border: 'none',
              borderRadius: 9999, padding: '14px 28px', fontSize: 15, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)', transition: 'all 0.2s ease'
            }}
          >
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 3. "Our Platform Capabilities" Accordion Section (Pure Black & White Theme) */}
      <section id="capabilities" style={{ background: '#000000', padding: '80px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 38, fontWeight: 700, color: '#ffffff', textAlign: 'center',
            letterSpacing: '-0.8px', marginBottom: 48
          }}>
            Our Platform Capabilities
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {CAPABILITIES.map((cap) => {
              const isExpanded = activeCapability === cap.id;
              return (
                <div
                  key={cap.id}
                  style={{
                    background: '#0a0a0a',
                    borderRadius: 8,
                    border: isExpanded ? '1px solid #ffffff' : '1px solid #222222',
                    boxShadow: isExpanded ? '0 0 24px rgba(255, 255, 255, 0.1)' : 'none',
                    overflow: 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div
                    onClick={() => setActiveCapability(isExpanded ? -1 : cap.id)}
                    style={{
                      padding: '24px 28px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {cap.title}
                    </h3>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isExpanded ? '#ffffff' : '#1a1a1a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {isExpanded ? (
                        <ChevronUp size={18} color="#000000" />
                      ) : (
                        <ChevronDown size={18} color="#ffffff" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: '0 28px 28px', display: 'grid',
                      gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'center',
                      borderTop: '1px solid #1f1f1f', paddingTop: 20
                    }}>
                      <div>
                        <p style={{ fontSize: 14, color: '#888888', lineHeight: 1.6, marginBottom: 20 }}>
                          {cap.description}
                        </p>

                        <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em', marginBottom: 10 }}>
                          KEY CAPABILITIES
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                          {cap.tags.map((t) => (
                            <span key={t} style={{
                              fontSize: 11, fontWeight: 600, color: '#ffffff',
                              background: '#1a1a1a', padding: '4px 10px',
                              borderRadius: 9999, border: '1px solid #333333'
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => { setAuthMode('LOGIN'); setAuthOpen(true); }}
                          style={{
                            background: 'transparent', border: 'none', color: '#ffffff',
                            fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center',
                            gap: 6, cursor: 'pointer', padding: 0
                          }}
                        >
                          Learn more & Launch <ArrowRight size={14} />
                        </button>
                      </div>

                      <div style={{
                        width: '100%', height: 180, borderRadius: 8, overflow: 'hidden',
                        backgroundImage: `url(${cap.image})`, backgroundSize: 'cover',
                        backgroundPosition: 'center', border: '1px solid #333333'
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. MONOCHROMATIC SUPABASE AUTHENTICATION MODAL */}
      {authOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0, 0, 0, 0.92)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#0a0a0a', width: '100%', maxWidth: 440, borderRadius: 12,
            padding: 36, border: '1px solid #262626',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  SECURITY VERIFICATION // SUPABASE AUTH
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                  {authMode === 'LOGIN' ? 'Sign In to Reroute' : 'Register Operator Account'}
                </h3>
              </div>
              <button
                onClick={() => setAuthOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888888' }}
              >
                ✕
              </button>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444', padding: '10px 14px', borderRadius: 6, fontSize: 12,
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {authMode === 'SIGNUP' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 6, background: '#000000',
                      border: '1px solid #333333', color: '#ffffff', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@reroute.com"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 6, background: '#000000',
                    border: '1px solid #333333', color: '#ffffff', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 6, background: '#000000',
                    border: '1px solid #333333', color: '#ffffff', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
                  ASSIGNED OPERATING ROLE
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 6, background: '#000000',
                    border: '1px solid #333333', color: '#ffffff', fontSize: 13, outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: '100%', background: '#ffffff', color: '#000000', fontWeight: 800,
                  padding: '14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  marginTop: 10, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {authLoading ? (
                  <span>Verifying Credentials...</span>
                ) : authMode === 'LOGIN' ? (
                  <><span>Sign In & Verify Access</span> <ArrowRight size={16} /></>
                ) : (
                  <><span>Create Account & Verify</span> <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888888' }}>
              {authMode === 'LOGIN' ? (
                <>Need an operator account? <span onClick={() => { setAuthMode('SIGNUP'); setAuthError(null); }} style={{ color: '#ffffff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Register now</span></>
              ) : (
                <>Already registered? <span onClick={() => { setAuthMode('LOGIN'); setAuthError(null); }} style={{ color: '#ffffff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign in here</span></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer */}
      <footer style={{ background: '#000000', borderTop: '1px solid #1a1a1a', padding: '40px 24px', fontSize: 13, color: '#888888' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong style={{ color: '#ffffff' }}>Reroute</strong> — Supply Chain Disruption Control Agent (HOP 2026 Submission)
          </div>
          <div>
            Built by TeamScalar · Powered by Next.js, FastAPI, NetworkX, Leaflet, and Supabase.
          </div>
        </div>
      </footer>
    </div>
  );
}
