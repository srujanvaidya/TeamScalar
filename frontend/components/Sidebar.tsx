'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore, Role } from '@/store/useStore';

const navItems = [
  { href: '/command-center', label: 'Command Center' },
  { href: '/audit-explorer', label: 'Audit Explorer' },
  { href: '/chaos-panel', label: 'Chaos Panel' },
  { href: '/workflow', label: 'Workflow' },
];

const ROLE_LABELS: Record<Role, string> = {
  master_coordinator: 'Master Coordinator',
  port_manager: 'Port Terminal Manager',
  field_agent: 'Field Agent',
  compliance_officer: 'Compliance Officer',
  judge: 'Judge / Demo Mode',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role, systemStatus, agents } = useStore();

  if (pathname === '/') return null;

  const currentRole = role || 'master_coordinator';
  const activeCount = agents.filter(a => a.status !== 'idle').length;

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: '#000000',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Section matching screenshot layout */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: '-0.03em',
          }}
        >
          Reroute<span style={{ color: '#ffffff' }}>.</span>
        </Link>
      </div>

      {/* Navigation Links matching screenshot layout & active right-side bar */}
      <nav style={{ display: 'flex', flexDirection: 'column', marginTop: 16, width: '100%' }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: 'none',
                padding: '14px 24px',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? '#ffffff' : '#888888',
                background: active ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{item.label}</span>
              
              {/* Right-hand solid active vertical indicator bar */}
              {active && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: '#ffffff',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role & System Status Information */}
      <div style={{ padding: '0 24px', marginTop: 32 }}>
        <div style={{
          padding: '12px',
          borderRadius: 6,
          background: '#0a0a0a',
          border: '1px solid #1f1f1f',
          marginBottom: 12
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#666666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            OPERATING ROLE
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
            {ROLE_LABELS[currentRole]}
          </div>
        </div>

        <div style={{
          padding: '10px 12px',
          borderRadius: 6,
          background: '#0a0a0a',
          border: '1px solid #1f1f1f',
          fontSize: 11,
          color: '#888888',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>STATUS:</span>
          <strong style={{ color: '#ffffff' }}>{systemStatus.toUpperCase()}</strong>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid #1a1a1a' }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: '#888888',
            fontSize: 13,
            fontWeight: 500,
            display: 'block',
            marginBottom: 12
          }}
        >
          Switch Role
        </Link>
        <div style={{ fontSize: 11, color: '#555555' }}>
          {activeCount}/9 agents active
        </div>
      </div>
    </aside>
  );
}
