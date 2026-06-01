'use client';

import { useEffect, useState } from 'react';

export default function HUDOverlay() {
  const [tick, setTick] = useState(0);
  const [coords] = useState({ lat: 40.7128, lon: -74.006 });

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const hexTick = tick.toString(16).toUpperCase().padStart(4, '0');
  const binTick = (tick % 256).toString(2).padStart(8, '0');

  return (
    <>
      {/* Top-left data stream */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        fontSize: 8, color: 'rgba(0,212,255,0.35)', letterSpacing: 1,
        lineHeight: 1.6, fontFamily: 'Courier New',
        userSelect: 'none', pointerEvents: 'none',
      }}>
        <div>STARK INDUSTRIES AI v4.1.2</div>
        <div>SYS_CORE: ACTIVE</div>
        <div>NEURAL_NET: ONLINE</div>
        <div>SEC_LVL: CLEARANCE_3</div>
        <div>FRAME: 0x{hexTick}</div>
        <div>BIN: {binTick}</div>
      </div>

      {/* Top-right coordinates */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        fontSize: 8, color: 'rgba(0,212,255,0.35)', letterSpacing: 1,
        lineHeight: 1.6, textAlign: 'right', fontFamily: 'Courier New',
        userSelect: 'none', pointerEvents: 'none',
      }}>
        <div>LAT: {coords.lat.toFixed(4)}°N</div>
        <div>LON: {coords.lon.toFixed(4)}°W</div>
        <div>ALT: 0042m</div>
        <div>STATUS: NOMINAL</div>
        <div>UPLINK: SECURE</div>
      </div>

      {/* Bottom-left */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        fontSize: 8, color: 'rgba(0,212,255,0.3)', letterSpacing: 1,
        lineHeight: 1.6, fontFamily: 'Courier New',
        userSelect: 'none', pointerEvents: 'none',
      }}>
        <div>ENCRYPTION: AES-256</div>
        <div>PROTOCOL: JARVIS/2.0</div>
        <div>QUANTUM: READY</div>
      </div>

      {/* Bottom-right */}
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        fontSize: 8, color: 'rgba(0,212,255,0.3)', letterSpacing: 1,
        lineHeight: 1.6, textAlign: 'right', fontFamily: 'Courier New',
        userSelect: 'none', pointerEvents: 'none',
      }}>
        <div>STARK TOWER HQ</div>
        <div>NEW YORK, NY</div>
        <div>THREAT LEVEL: LOW</div>
      </div>

      {/* Corner brackets */}
      {/* Top-left */}
      <div style={{ position: 'absolute', top: 4, left: 4, width: 20, height: 20,
        borderTop: '2px solid rgba(0,212,255,0.5)', borderLeft: '2px solid rgba(0,212,255,0.5)',
        pointerEvents: 'none',
      }} />
      {/* Top-right */}
      <div style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20,
        borderTop: '2px solid rgba(0,212,255,0.5)', borderRight: '2px solid rgba(0,212,255,0.5)',
        pointerEvents: 'none',
      }} />
      {/* Bottom-left */}
      <div style={{ position: 'absolute', bottom: 4, left: 4, width: 20, height: 20,
        borderBottom: '2px solid rgba(0,212,255,0.5)', borderLeft: '2px solid rgba(0,212,255,0.5)',
        pointerEvents: 'none',
      }} />
      {/* Bottom-right */}
      <div style={{ position: 'absolute', bottom: 4, right: 4, width: 20, height: 20,
        borderBottom: '2px solid rgba(0,212,255,0.5)', borderRight: '2px solid rgba(0,212,255,0.5)',
        pointerEvents: 'none',
      }} />

      {/* Top center scan line accent */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)',
        pointerEvents: 'none',
      }} />
    </>
  );
}
