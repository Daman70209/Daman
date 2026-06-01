'use client';

import { useEffect, useRef } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  thinking: boolean;
}

export default function ChatWindow({ messages, thinking }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '10px 4px 10px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {messages.length === 0 && (
        <div style={{
          textAlign: 'center', color: 'rgba(0,212,255,0.3)',
          fontSize: 11, marginTop: 40, letterSpacing: 2,
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⬡</div>
          JARVIS INTERFACE READY<br />
          <span style={{ fontSize: 9 }}>AWAITING INPUT, SIR.</span>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          animation: 'fadeSlideIn 0.3s ease-out',
        }}>
          <div style={{
            fontSize: 8, letterSpacing: 2, marginBottom: 3,
            color: msg.role === 'user' ? 'rgba(255,215,0,0.5)' : 'rgba(0,212,255,0.5)',
          }}>
            {msg.role === 'user' ? 'YOU' : 'J.A.R.V.I.S'} · {formatTime(msg.timestamp)}
          </div>
          <div style={{
            maxWidth: '85%',
            padding: '8px 12px',
            borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
            background: msg.role === 'user'
              ? 'rgba(255,215,0,0.08)'
              : 'rgba(0,212,255,0.07)',
            border: msg.role === 'user'
              ? '1px solid rgba(255,215,0,0.25)'
              : '1px solid rgba(0,212,255,0.25)',
            fontSize: 12,
            lineHeight: 1.6,
            color: msg.role === 'user' ? 'rgba(255,215,0,0.9)' : 'rgba(0,212,255,0.9)',
            boxShadow: msg.role === 'user'
              ? 'inset 0 0 8px rgba(255,215,0,0.04)'
              : 'inset 0 0 8px rgba(0,212,255,0.04)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg.content}
          </div>
        </div>
      ))}

      {thinking && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(0,212,255,0.5)', marginBottom: 3 }}>
            J.A.R.V.I.S · PROCESSING
          </div>
          <div style={{
            padding: '8px 14px',
            borderRadius: '8px 8px 8px 2px',
            background: 'rgba(0,212,255,0.07)',
            border: '1px solid rgba(0,212,255,0.25)',
            display: 'flex', gap: 5, alignItems: 'center',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#00d4ff',
                animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          from { transform: scale(0.7); opacity: 0.4; }
          to { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
