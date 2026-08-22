'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore, Role } from '@/store/useStore';
import {
  Globe, Anchor, Smartphone, Shield, Zap,
  Activity, CheckCircle, UserCheck, ArrowLeft
} from 'lucide-react';

const navItems = [
  { href: '/command-center', icon: Globe, label: 'Command Center' },
  { href: '/port-operations', icon: Anchor, label: 'Port Operations' },
  { href: '/mobile-scanner', icon: Smartphone, label: 'Field Scanner' },
  { href: '/audit-explorer', icon: Shield, label: 'Audit Explorer' },
  { href: '/chaos-panel', icon: Zap, label: 'Chaos Panel' },
];

const ROLE_LABELS: Record<Role, string> = {
  master_coordinator: 'Master Coord',
  port_manager: 'Port Manager',
  field_agent: 'Field Agent',
  compliance_officer: 'Compliance',
  judge: 'Judge Mode',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role, setRole, systemStatus, agents } = useStore();

  if (pathname === '/') return null;

  const currentRole = role || 'master_coordinator';
  const activeCount = agents.filter(a => a.status !== 'idle').length;

  const statusColor = systemStatus === 'nominal'
    ? '#22c55e'
    : systemStatus === 'disruption_active'
      ? '#ef4444'
      : '#eab308';

  const statusLabel = systemStatus === 'nominal'
    ? 'ALL SYSTEMS NOMINAL'
    : systemStatus === 'disruption_active'
      ? 'DISRUPTION ACTIVE'
      : 'REROUTING';

  return (
    <aside
      style={{
        width: 58,
        minWidth: 58,
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        zIndex: 50,
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
      className="group hover:w-56"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.width = '230px';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.width = '58px';
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          padding: '6px 12px',
          marginBottom: 6,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(200,216,240,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Activity size={18} color="var(--accent)" />
        </div>
        <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          TeamScalar
        </span>
      </Link>

      {/* Role Pill */}
      <div style={{
        width: 'calc(100% - 16px)',
        margin: '0 8px 8px',
        padding: '6px 8px',
        borderRadius: 6,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflow: 'hidden',
      }}>
        <UserCheck size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {ROLE_LABELS[currentRole]}
        </span>
      </div>

      {/* Status pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', margin: '0 8px 14px',
        background: 'var(--bg-raised)', borderRadius: 6,
        border: '1px solid var(--border-subtle)',
        width: 'calc(100% - 16px)', overflow: 'hidden',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: statusColor, flexShrink: 0,
          boxShadow: `0 0 6px ${statusColor}`,
          animation: systemStatus !== 'nominal' ? 'pulse-dot 1s ease infinite' : 'none',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700, color: statusColor,
          whiteSpace: 'nowrap', overflow: 'hidden', letterSpacing: '0.06em',
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ width: '100%', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? ' active' : ''}`}
              title={item.label}
              style={{
                textDecoration: 'none',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: active ? 700 : 500 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '0 8px', width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Switch Role Link */}
        <Link
          href="/"
          className="nav-item"
          title="Switch Role"
          style={{ textDecoration: 'none', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            Switch Role
          </span>
        </Link>

        {/* Agent monitor badge */}
        <div style={{
          padding: '8px 10px', borderRadius: 8,
          background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
        }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {activeCount > 0 ? (
              <Activity size={14} color="#60a5fa" />
            ) : (
              <CheckCircle size={14} color="var(--text-muted)" />
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {activeCount}/9 agents active
          </span>
        </div>
      </div>
    </aside>
  );
}
