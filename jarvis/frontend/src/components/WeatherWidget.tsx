'use client';

import { useEffect, useState } from 'react';

interface Weather {
  city: string;
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  wind_speed: number;
  icon: string;
  demo: boolean;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const weatherIcons: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌦️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/api/weather`)
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => {});
    const id = setInterval(() => {
      fetch(`${BACKEND}/api/weather`)
        .then((r) => r.json())
        .then(setWeather)
        .catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (!weather) return (
    <div style={{
      background: 'rgba(0,8,20,0.85)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 4,
      padding: '10px 14px', fontSize: 10, color: 'rgba(0,212,255,0.4)',
    }}>
      WEATHER LOADING...
    </div>
  );

  return (
    <div style={{
      background: 'rgba(0,8,20,0.85)',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 4,
      padding: '10px 14px',
      boxShadow: '0 0 12px rgba(0,212,255,0.15), inset 0 0 10px rgba(0,212,255,0.04)',
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,255,0.5)',
        borderBottom: '1px solid rgba(0,212,255,0.15)', paddingBottom: 5, marginBottom: 8,
      }}>
        ATMOSPHERIC DATA {weather.demo && <span style={{ color: '#ffd700' }}>[DEMO]</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>{weatherIcons[weather.icon] || '🌡️'}</span>
        <div>
          <div style={{ fontSize: 26, fontWeight: 'bold', color: '#00d4ff', textShadow: '0 0 10px #00d4ff', lineHeight: 1 }}>
            {weather.temp}°C
          </div>
          <div style={{ fontSize: 9, color: 'rgba(0,212,255,0.6)', letterSpacing: 1 }}>
            {weather.city.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(0,212,255,0.7)', marginBottom: 8 }}>
        {weather.description.toUpperCase()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <Stat label="FEELS" val={`${weather.feels_like}°C`} />
        <Stat label="HUMID" val={`${weather.humidity}%`} />
        <Stat label="WIND" val={`${weather.wind_speed} m/s`} />
      </div>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ background: 'rgba(0,212,255,0.04)', borderRadius: 2, padding: '4px 6px' }}>
      <div style={{ fontSize: 8, color: 'rgba(0,212,255,0.4)', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 10, color: '#00d4ff' }}>{val}</div>
    </div>
  );
}
