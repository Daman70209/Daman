'use client';

import { useEffect, useRef } from 'react';

interface RadarScannerProps {
  size?: number;
  blips?: Array<{ x: number; y: number; age: number }>;
}

export default function RadarScanner({ size = 160 }: RadarScannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const sweepRef = useRef(0);
  const blipsRef = useRef<Array<{ x: number; y: number; born: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const r = cx - 6;

    // Seed some random blips
    blipsRef.current = Array.from({ length: 5 }, () => ({
      x: (Math.random() - 0.5) * 2 * r * 0.8,
      y: (Math.random() - 0.5) * 2 * r * 0.8,
      born: Math.random() * Math.PI * 2,
    }));

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const t = Date.now() / 1000;
      sweepRef.current += 0.025;

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 20, 30, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Concentric rings
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * (i / 3), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 + 0.05 * i})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Cross hairs
      ctx.strokeStyle = 'rgba(0,212,255,0.12)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

      // Sweep gradient
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepRef.current);

      // Sweep arc
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 2, -0.05, Math.PI / 2.5);
      ctx.closePath();
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, 'rgba(0,212,255,0.15)');
      grad.addColorStop(1, 'rgba(0,212,255,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r - 2, 0);
      ctx.strokeStyle = 'rgba(0,245,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f5ff';
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Blips
      blipsRef.current.forEach((blip) => {
        const dist = Math.sqrt(blip.x * blip.x + blip.y * blip.y);
        if (dist > r - 8) return;
        const blipAngle = Math.atan2(blip.y, blip.x);
        let diff = ((sweepRef.current - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const alpha = Math.max(0, 1 - diff / (Math.PI * 0.8));
        if (alpha > 0.05) {
          ctx.beginPath();
          ctx.arc(cx + blip.x, cy + blip.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,136,${alpha})`;
          ctx.shadowBlur = 10 * alpha;
          ctx.shadowColor = '#00ff88';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
      <div style={{
        position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
        fontSize: 8, color: 'rgba(0,212,255,0.6)', fontFamily: 'Courier New',
        letterSpacing: 2
      }}>RADAR</div>
    </div>
  );
}
