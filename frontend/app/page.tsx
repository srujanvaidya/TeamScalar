'use client';

import Link from 'next/link';
import { useStore, Role } from '@/store/useStore';
import { Activity, Globe, Anchor, Smartphone, Shield, Zap, ArrowRight } from 'lucide-react';

const ROLES: {
  id: Role;
  title: string;
  description: string;
  icon: React.ElementType;
  access: string[];
  defaultRoute: string;
  tag: string;
}[] = [
  {
    id: 'master_coordinator',
    title: 'Master Coordinator',
    description: 'Full system access. Oversees all agents, routes, disruptions, and approvals.',
    icon: Globe,
    access: ['Command Center', 'Port Operations', 'Field Scanner', 'Audit Explorer', 'Chaos Panel'],
    defaultRoute: '/command-center',
    tag: 'FULL ACCESS',
  },
  {
    id: 'port_manager',
    title: 'Port Terminal Manager',
    description: 'Manages berth constraints, demurrage, and carrier coordination at port level.',
    icon: Anchor,
    access: ['Command Center', 'Port Operations'],
    defaultRoute: '/port-operations',
    tag: 'PORT OPS',
  },
  {
    id: 'field_agent',
    title: 'Field Agent',
    description: 'Mobile-first warehouse handler. Scans cargo QR codes and confirms on-chain receipts.',
    icon: Smartphone,
    access: ['Field Scanner'],
    defaultRoute: '/mobile-scanner',
    tag: 'FIELD',
  },
  {
    id: 'compliance_officer',
    title: 'Compliance Officer',
    description: 'Reviews on-chain audit trails, agent reasoning logs, and regulatory compliance.',
    icon: Shield,
    access: ['Audit Explorer'],
    defaultRoute: '/audit-explorer',
    tag: 'COMPLIANCE',
  },
  {
    id: 'judge',
    title: 'Judge / Demo Mode',
    description: 'Full access for hackathon judges. Inject chaos events and watch the full AI pipeline live.',
    icon: Zap,
    access: ['All Pages', 'Chaos Panel', 'Live Agent Monitor'],
    defaultRoute: '/chaos-panel',
    tag: 'DEMO',
  },
];

export default function LandingPage() {
  const { setRole } = useStore();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-void)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '40px 20px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--accent-dim)',
            border: '1px solid rgba(200,216,240,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={22} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', fontWeight: 700 }}>
              HOP 2026 // SCALAR · TEAMSCALAR
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Supply Chain Control Agent
            </h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 520, margin: '0 auto' }}>
          Autonomous multi-agent AI system for real-time disruption detection, graph-based rerouting, and blockchain provenance.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1000 }}>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          fontWeight: 700,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          CLICK A ROLE BELOW TO ENTER ITS WORKSPACE
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.id}
                href={r.defaultRoute}
                onClick={() => setRole(r.id)}
                className="role-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 180,
                  textDecoration: 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 8,
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color="var(--accent)" />
                    </div>
                    <span className="badge badge-neutral">
                      {r.tag}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {r.title}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 14 }}>
                    {r.description}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {r.access.map((a) => (
                      <span key={a} style={{
                        fontSize: 9, color: 'var(--text-muted)',
                        background: 'var(--bg-raised)', padding: '2px 6px',
                        borderRadius: 4, border: '1px solid var(--border-subtle)',
                      }}>
                        {a}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: 12,
                  }}>
                    <span>Enter {r.title} Workspace</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 40,
        color: 'var(--text-muted)', fontSize: 11,
        letterSpacing: '0.1em',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        HACKERS OCCUPIED PUNE 2026 · BUILT BY TEAMSCALAR
      </div>
    </div>
  );
}
