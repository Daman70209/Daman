'use client';

import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  active: boolean;
  color?: string;
}

export default function VoiceVisualizer({ active, color = '#00d4ff' }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current);
      drawIdle();
      return;
    }

    let stream: MediaStream | null = null;
    let ctx_: AudioContext | null = null;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        ctx_ = new AudioContext();
        const source = ctx_.createMediaStreamSource(s);
        const analyser = ctx_.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
        drawActive();
      })
      .catch(() => {
        drawIdle();
      });

    return () => {
      cancelAnimationFrame(animRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      ctx_?.close();
    };
  }, [active]);

  function drawIdle() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const mid = canvas.height / 2;
    const bars = 24;
    const bw = 3;
    const gap = 2;
    const total = bars * (bw + gap) - gap;
    const startX = (canvas.width - total) / 2;
    for (let i = 0; i < bars; i++) {
      const h = 2 + Math.random() * 3;
      ctx.fillStyle = 'rgba(0,212,255,0.2)';
      ctx.fillRect(startX + i * (bw + gap), mid - h / 2, bw, h);
    }
  }

  function drawActive() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bars = 24;
    const bw = 3;
    const gap = 2;
    const total = bars * (bw + gap) - gap;
    const startX = (canvas.width - total) / 2;
    const mid = canvas.height / 2;

    for (let i = 0; i < bars; i++) {
      const dataIdx = Math.floor((i / bars) * data.length);
      const val = data[dataIdx] / 255;
      const h = 3 + val * (canvas.height - 10);
      const alpha = 0.4 + val * 0.6;
      ctx.fillStyle = `rgba(0,212,255,${alpha})`;
      ctx.shadowBlur = val * 10;
      ctx.shadowColor = color;
      ctx.fillRect(startX + i * (bw + gap), mid - h / 2, bw, h);
    }
    ctx.shadowBlur = 0;
    animRef.current = requestAnimationFrame(drawActive);
  }

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={40}
      style={{ display: 'block' }}
    />
  );
}
