'use client';

import { useEffect, useRef } from 'react';

interface ArcReactorProps {
  size?: number;
  listening?: boolean;
  thinking?: boolean;
}

export default function ArcReactor({ size = 200, listening = false, thinking = false }: ArcReactorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;

    function drawArc() {
      ctx.clearRect(0, 0, size, size);

      const t = Date.now() / 1000;
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.5);
      const base = listening ? '#00ffaa' : thinking ? '#aa00ff' : '#00d4ff';
      const glow = listening ? '#00ffaa' : thinking ? '#cc44ff' : '#00f5ff';

      // Outer ring glow
      ctx.shadowBlur = 30 * pulse;
      ctx.shadowColor = glow;

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(base)}, ${0.5 * pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating dashed ring 1
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRef.current);
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, cx - 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(base)}, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Rotating dashed ring 2 (reverse)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angleRef.current * 1.5);
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, cx - 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(base)}, 0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.setLineDash([]);

      // 8 spoke lines
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + angleRef.current * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (cx - 30), cy + Math.sin(a) * (cx - 30));
        ctx.lineTo(cx + Math.cos(a) * (cx - 50), cy + Math.sin(a) * (cx - 50));
        ctx.strokeStyle = `rgba(${hexToRgb(base)}, ${0.3 + 0.3 * Math.sin(t * 3 + i)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Inner hexagon
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRef.current * 0.3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const r = 30;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${hexToRgb(base)}, ${0.7 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Inner glow core
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
      gradient.addColorStop(0, `rgba(${hexToRgb(glow)}, ${0.9 * pulse})`);
      gradient.addColorStop(0.5, `rgba(${hexToRgb(base)}, ${0.4 * pulse})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Ping rings when listening
      if (listening) {
        const pingScale = (t % 2) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + pingScale * 40, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,170,${0.6 * (1 - pingScale)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Thinking animation
      if (thinking) {
        for (let i = 0; i < 3; i++) {
          const a = (t * 2 + (i / 3) * Math.PI * 2) % (Math.PI * 2);
          const r = 40;
          const bx = cx + Math.cos(a) * r;
          const by = cy + Math.sin(a) * r;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${hexToRgb(glow)}, ${0.8})`;
          ctx.fill();
        }
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.shadowBlur = 20;
      ctx.shadowColor = glow;
      ctx.fill();
      ctx.shadowBlur = 0;

      angleRef.current += 0.012;
      animRef.current = requestAnimationFrame(drawArc);
    }

    drawArc();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, listening, thinking]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
