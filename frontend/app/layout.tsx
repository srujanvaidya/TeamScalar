import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Reroute — Autonomous Supply Chain Rerouting & Graph-RL Navigation',
  description: 'Autonomous multi-agent AI system for real-time supply chain disruption detection, dynamic re-routing, blockchain provenance, and ESG tracking.',
  keywords: 'supply chain, AI agents, blockchain, logistics, disruption detection, Reroute',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ background: '#040608' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#040608', margin: 0, padding: 0, overflowX: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, width: '100%', minHeight: '100vh', overflowY: 'auto', position: 'relative', background: '#040608' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
