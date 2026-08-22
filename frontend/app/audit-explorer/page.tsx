'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import 'leaflet/dist/leaflet.css';

export type TimeSeriesEvent = {
  id: string;
  timestamp: string;
  cargo_id: string;
  vessel_name: string;
  location: string;
  coords: [number, number];
  action_type: string;
  tx_hash: string;
  block_number: number;
  financial_impact_usd: number;
  reasoning: string;
  path_so_far: [number, number][];
};

const DEMO_TIME_SERIES_JSON: TimeSeriesEvent[] = [
  {
    id: 'EVT-001',
    timestamp: '2026-08-22T08:00:00Z',
    cargo_id: 'CONT-8001',
    vessel_name: 'MAERSK MC-KINNEY MOLLER',
    location: 'Port of Los Angeles',
    coords: [33.7426, -118.2673],
    action_type: 'CARGO_TWIN_MINTED',
    tx_hash: '0x913ac360d9d7f3238605f2b9fcbc31a2bf32a5e0f1eac420964ccc4588dcc36b',
    block_number: 45612105,
    financial_impact_usd: 0.00,
    reasoning: 'Digital Cargo Twin Token minted at origin Port of Los Angeles.',
    path_so_far: [[33.7426, -118.2673]]
  },
  {
    id: 'EVT-002',
    timestamp: '2026-08-22T14:30:00Z',
    cargo_id: 'CONT-8001',
    vessel_name: 'MAERSK MC-KINNEY MOLLER',
    location: 'Panama Canal Approach',
    coords: [9.0800, -79.6800],
    action_type: 'BOTTLENECK_DETECTED',
    tx_hash: '0x3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    block_number: 45612107,
    financial_impact_usd: 12500.00,
    reasoning: 'Severe climate drought at Panama Canal Gatun Lake. 154-hour transit delay flagged.',
    path_so_far: [[33.7426, -118.2673], [9.0800, -79.6800]]
  },
  {
    id: 'EVT-003',
    timestamp: '2026-08-22T18:00:00Z',
    cargo_id: 'CONT-8001',
    vessel_name: 'MAERSK MC-KINNEY MOLLER',
    location: 'AIR_ATLANTA_01 Cargo Terminal',
    coords: [33.7490, -84.3880],
    action_type: 'AGENT2_REROUTE_APPROVED',
    tx_hash: '0x7f9a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    block_number: 45612109,
    financial_impact_usd: 28400.00,
    reasoning: 'Agent 2 Express Air Bypass approved by human operator. Saves 153.5h transit time.',
    path_so_far: [[33.7426, -118.2673], [9.0800, -79.6800], [33.7490, -84.3880]]
  },
  {
    id: 'EVT-004',
    timestamp: '2026-08-23T02:00:00Z',
    cargo_id: 'CONT-8001',
    vessel_name: 'MAERSK MC-KINNEY MOLLER',
    location: 'Port of New York/New Jersey',
    coords: [40.6681, -74.1610],
    action_type: 'DELIVERY_CHECKIN_VERIFIED',
    tx_hash: '0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae',
    block_number: 45612115,
    financial_impact_usd: 0.00,
    reasoning: 'Container CONT-8001 delivered to final destination hub. Escrow released.',
    path_so_far: [[33.7426, -118.2673], [9.0800, -79.6800], [33.7490, -84.3880], [40.6681, -74.1610]]
  }
];

export default function AuditExplorerPage() {
  const { role } = useStore();
  const router = useRouter();

  const [events, setEvents] = useState<TimeSeriesEvent[]>(DEMO_TIME_SERIES_JSON);
  const [timeIndex, setTimeIndex] = useState<number>(DEMO_TIME_SERIES_JSON.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCargoId, setSelectedCargoId] = useState('CONT-8001');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!role) router.push('/');
  }, [role, router]);

  // Fetch real on-chain events from Supabase or fallback
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data: dbEvents } = await supabase.from('container_events').select('*').order('timestamp', { ascending: true });

        if (dbEvents && dbEvents.length > 0) {
          let accumulatedPath: [number, number][] = [];
          const mapped: TimeSeriesEvent[] = dbEvents.map((row: any, idx: number) => {
            const locName = row.location || row.origin || 'Port of Los Angeles';
            const coord: [number, number] = locName.includes('New York') ? [40.6681, -74.1610]
              : locName.includes('Atlanta') ? [33.7490, -84.3880]
              : locName.includes('Panama') ? [9.0800, -79.6800]
              : [33.7426, -118.2673];

            accumulatedPath.push(coord);

            return {
              id: row.id || `EVT-00${idx + 1}`,
              timestamp: row.timestamp || row.created_at || new Date().toISOString(),
              cargo_id: row.container_id || 'CONT-8001',
              vessel_name: row.ship_id || 'MAERSK VESSEL',
              location: locName,
              coords: coord,
              action_type: row.event_type || 'BLOCKCHAIN_EVENT',
              tx_hash: row.polygon_tx_hash || row.event_hash || '0x913ac360d9d7f3238605f2b9fcbc31a2bf32a5e0f1eac420964ccc4588dcc36b',
              block_number: 45612100 + idx,
              financial_impact_usd: row.event_type?.includes('REROUTE') ? 28400.0 : 0.0,
              reasoning: row.details || 'Blockchain anchored container telemetry event.',
              path_so_far: [...accumulatedPath]
            };
          });

          setEvents(mapped);
          setTimeIndex(mapped.length - 1);
        }
      } catch (err) {
        console.warn('Audit Explorer Supabase fetch notice:', err);
      }
    };

    fetchEvents();
  }, []);

  // Initialize Leaflet map inside Audit Explorer
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [25.0, -90.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;

      renderTimeMap(L, map, layerGroup, events, timeIndex);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    import('leaflet').then((L) => {
      renderTimeMap(L, mapInstanceRef.current, layerGroupRef.current, events, timeIndex);
    });
  }, [events, timeIndex]);

  // Handle Play/Pause Automatic Time Progression
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeIndex((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, events.length]);

  const currentEvent = events[timeIndex] || events[0];

  const renderTimeMap = (L: any, map: any, layerGroup: any, evtList: TimeSeriesEvent[], index: number) => {
    layerGroup.clearLayers();
    if (!evtList || evtList.length === 0) return;

    const activeEvt = evtList[index] || evtList[0];
    const pathCoords = activeEvt.path_so_far || [];

    // Draw completed historic polyline up to current selected timestamp
    if (pathCoords.length > 1) {
      L.polyline(pathCoords, {
        color: '#22c55e',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);
    }

    // Render milestone transfer node circle markers
    evtList.slice(0, index + 1).forEach((e, idx) => {
      const isCurrent = idx === index;
      const marker = L.circleMarker(e.coords, {
        radius: isCurrent ? 9 : 6,
        fillColor: isCurrent ? '#22c55e' : '#ffffff',
        color: '#000000',
        weight: 2,
        fillOpacity: 1,
      }).addTo(layerGroup);

      marker.bindPopup(
        `<div style="font-family: Inter, monospace; font-size: 11px; padding: 8px 12px; background: #000000; color: #ffffff; border: 1px solid #22c55e; border-radius: 6px;">
          <div style="font-weight: 800; color: #22c55e;">[MILESTONE #${idx + 1}]: ${e.action_type}</div>
          <div>Location: <strong>${e.location}</strong></div>
          <div>Time: <strong>${new Date(e.timestamp).toUTCString()}</strong></div>
          <div style="color: #888888; font-size: 10px; margin-top: 4px; border-top: 1px solid #222222; padding-top: 4px;">
            Polygon Tx: ${e.tx_hash.slice(0, 16)}... (Block #${e.block_number})
          </div>
        </div>`
      );
    });

    // Render Container Marker (lo.png) at Current Timestamp Coordinates
    const containerIcon = L.icon({
      iconUrl: '/lo.png',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker(activeEvt.coords, { icon: containerIcon }).addTo(layerGroup).bindPopup(
      `<div style="font-family: Inter, monospace; font-size: 11px; padding: 8px 12px; background: #000000; color: #ffffff; border: 1px solid #ffffff; border-radius: 6px;">
        <div style="font-weight: 800; color: #22c55e;">[CONTAINER POSITION AT SELECTED TIMESTAMP]</div>
        <div>Cargo ID: <strong>${activeEvt.cargo_id}</strong></div>
        <div>Location: <strong>${activeEvt.location}</strong></div>
        <div style="color: #aaaaaa; font-size: 10px;">Time: ${new Date(activeEvt.timestamp).toUTCString()}</div>
      </div>`
    );

    // Pan map to current event coordinates smoothly
    try {
      map.panTo(activeEvt.coords, { animate: true, duration: 1.0 });
    } catch {}
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', overflow: 'hidden' }}>
      
      {/* Top Monochromatic Header */}
      <header style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid #1a1a1a', background: '#000000', flexShrink: 0,
        fontSize: 12, fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', fontSize: 13 }}>AUDIT EXPLORER</span>
          <span style={{ color: '#333333' }}>|</span>
          <span style={{ color: '#888888', fontSize: 11 }}>BLOCKCHAIN CONTAINER TIME-TRAVEL PATH MAPPER</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#888888', fontSize: 11, fontWeight: 600 }}>CARGO CONTAINER:</span>
          <select
            value={selectedCargoId}
            onChange={(e) => setSelectedCargoId(e.target.value)}
            style={{
              background: '#0a0a0a', color: '#ffffff', border: '1px solid #262626',
              borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, outline: 'none'
            }}
          >
            <option value="CONT-8001">CONT-8001 (Port of LA ➔ Port of NY)</option>
          </select>
        </div>
      </header>

      {/* Main split view: Left Timeline Table | Right Live Map View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: On-Chain Event History Timeline Table */}
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1f1f1f', background: '#050505' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#ffffff' }}>Polygon Amoy On-Chain Audit Log</div>
            <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>Click any event milestone to map container location at that exact timestamp</div>
          </div>

          <div className="scroll-y" style={{ flex: 1, overflowY: 'auto' }}>
            {events.map((evt, idx) => {
              const isSelected = idx === timeIndex;
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    setTimeIndex(idx);
                    setIsPlaying(false);
                  }}
                  style={{
                    padding: '16px 20px', borderBottom: '1px solid #141414',
                    background: isSelected ? '#0f0f0f' : '#050505',
                    cursor: 'pointer', borderLeft: isSelected ? '3px solid #22c55e' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', letterSpacing: '0.05em' }}>
                      MILESTONE #{idx + 1} — [{evt.action_type}]
                    </span>
                    <span style={{ fontSize: 10, color: '#888888', fontFamily: 'JetBrains Mono, monospace' }}>
                      Block #{evt.block_number}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                    {evt.location}
                  </div>

                  <div style={{ fontSize: 11, color: '#aaaaaa', lineHeight: 1.4, marginBottom: 8 }}>
                    {evt.reasoning}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span>TIME: {new Date(evt.timestamp).toUTCString()}</span>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${evt.tx_hash}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#ffffff', textDecoration: 'underline' }}
                    >
                      TX: {evt.tx_hash.slice(0, 10)}...
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Leaflet Interactive Map View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#000000' }}>
          
          {/* Top Floating Telemetry Overlay Card */}
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 30,
            background: 'rgba(5, 5, 5, 0.92)', backdropFilter: 'blur(10px)',
            border: '1px solid #222222', borderRadius: 8, padding: '12px 18px',
            fontSize: 11, fontFamily: 'Inter, sans-serif', maxWidth: 420
          }}>
            <div style={{ fontSize: 10, color: '#888888', fontWeight: 700, letterSpacing: '0.05em' }}>
              TIME-MAPPER ACTIVE CONTAINER SNAPSHOT
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
              {currentEvent.location}
            </div>
            <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, marginTop: 4 }}>
              Status: [{currentEvent.action_type}]
            </div>
            <div style={{ fontSize: 10, color: '#888888', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
              Timestamp: {new Date(currentEvent.timestamp).toUTCString()}
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Bottom Interactive Time-Travel Slider Toolbar */}
          <div style={{
            height: 72, background: '#050505', borderTop: '1px solid #1f1f1f',
            padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0
          }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? '#ef4444' : '#ffffff',
                color: isPlaying ? '#ffffff' : '#000000',
                border: 'none', borderRadius: 20, padding: '8px 20px',
                fontWeight: 800, fontSize: 11, cursor: 'pointer', minWidth: 120
              }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play Progression'}
            </button>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888888', fontWeight: 700 }}>
                <span>SLIDER TIMELINE PROGRESSION</span>
                <span style={{ color: '#ffffff' }}>
                  Step {timeIndex + 1} of {events.length}: {currentEvent.location} ({new Date(currentEvent.timestamp).toLocaleTimeString()})
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={events.length - 1}
                value={timeIndex}
                onChange={(e) => {
                  setTimeIndex(Number(e.target.value));
                  setIsPlaying(false);
                }}
                style={{ width: '100%', accentColor: '#22c55e', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #000000 !important;
          font-family: inherit;
        }
        .leaflet-tile-pane {
          filter: grayscale(100%) invert(100%) contrast(120%) !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
