'use client';

import { useEffect, useState } from 'react';

interface Stats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  battery_percent: number | null;
  battery_charging: boolean | null;
  platform: string;
  bytes_sent_mb: number;
  bytes_recv_mb: number;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function GaugeBar({ value, label, color = '#00d4ff' }: { value: number; label: string; color?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.7)', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color, fontWeight: 'bold' }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{
        height: 4,
        background: 'rgba(0,212,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(0,212,255,0.15)',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(value, 100)}%`,
          background: value > 85 ? '#ff3333' : value > 60 ? '#ffd700' : color,
          boxShadow: `0 0 6px ${value > 85 ? '#ff3333' : value > 60 ? '#ffd700' : color}`,
          transition: 'width 0.8s ease',
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

export default function SystemStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallback: ReturnType<typeof setInterval> | null = null;

    const wsUrl = BACKEND.replace(/^http/, 'ws') + '/ws/system';
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => setStats(JSON.parse(e.data));
      ws.onerror = () => {
        ws?.close();
        startFallback();
      };
    } catch {
      startFallback();
    }

    function startFallback() {
      const fetch_ = () =>
        fetch(`${BACKEND}/api/system`)
          .then((r) => r.json())
          .then(setStats)
          .catch(() => {});
      fetch_();
      fallback = setInterval(fetch_, 3000);
    }

    return () => {
      ws?.close();
      if (fallback) clearInterval(fallback);
    };
  }, []);

  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ss = time.getSeconds().toString().padStart(2, '0');

  return (
    <div style={{
      background: 'rgba(0,8,20,0.85)',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 4,
      padding: '12px 14px',
      minWidth: 200,
      boxShadow: '0 0 12px rgba(0,212,255,0.15), inset 0 0 10px rgba(0,212,255,0.04)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,255,0.5)',
        borderBottom: '1px solid rgba(0,212,255,0.15)', paddingBottom: 6, marginBottom: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>SYSTEM STATUS</span>
        <span style={{ fontSize: 9, color: '#00d4ff', opacity: 0.7 }}>
          <span className="animate-status-blink" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00ff88', marginRight: 4, verticalAlign: 'middle' }} />
          ONLINE
        </span>
      </div>

      {/* Clock */}
      <div style={{
        textAlign: 'center', marginBottom: 12,
        fontSize: 28, fontWeight: 'bold', letterSpacing: 4,
        color: '#00d4ff',
        textShadow: '0 0 10px #00d4ff, 0 0 25px #00f5ff',
        fontFamily: 'Courier New',
      }}>
        {hh}:{mm}:{ss}
      </div>
      <div style={{
        textAlign: 'center', fontSize: 9, letterSpacing: 2,
        color: 'rgba(0,212,255,0.5)', marginBottom: 14,
      }}>
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
      </div>

      {stats ? (
        <>
          <GaugeBar value={stats.cpu_percent} label="CPU LOAD" />
          <GaugeBar value={stats.memory_percent} label="MEMORY" />
          <GaugeBar value={stats.disk_percent} label="STORAGE" />
          {stats.battery_percent !== null && (
            <GaugeBar
              value={stats.battery_percent}
              label={`BATTERY ${stats.battery_charging ? '⚡' : ''}`}
              color="#ffd700"
            />
          )}

          <div style={{
            borderTop: '1px solid rgba(0,212,255,0.12)', paddingTop: 8, marginTop: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', letterSpacing: 1 }}>MEM USED</span>
              <span style={{ fontSize: 9, color: '#00d4ff' }}>{stats.memory_used_gb}GB / {stats.memory_total_gb}GB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', letterSpacing: 1 }}>DISK USED</span>
              <span style={{ fontSize: 9, color: '#00d4ff' }}>{stats.disk_used_gb}GB / {stats.disk_total_gb}GB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', letterSpacing: 1 }}>NET ↑</span>
              <span style={{ fontSize: 9, color: '#00d4ff' }}>{stats.bytes_sent_mb} MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', letterSpacing: 1 }}>NET ↓</span>
              <span style={{ fontSize: 9, color: '#00d4ff' }}>{stats.bytes_recv_mb} MB</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(0,212,255,0.4)', padding: '10px 0' }}>
          CONNECTING TO BACKEND...
        </div>
      )}
    </div>
  );
}
