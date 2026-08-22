import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Supply Chain Control Agent | TeamScalar — HOP 2026',
  description: 'Autonomous multi-agent AI system for real-time supply chain disruption detection, dynamic re-routing, blockchain provenance, and ESG tracking.',
  keywords: 'supply chain, AI agents, blockchain, logistics, disruption detection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-void)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
