'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ArcReactor from './ArcReactor';
import ChatWindow, { Message } from './ChatWindow';
import HUDOverlay from './HUDOverlay';
import SystemStats from './SystemStats';
import WeatherWidget from './WeatherWidget';

const RadarScanner = dynamic(() => import('./RadarScanner'), { ssr: false });
const VoiceVisualizer = dynamic(() => import('./VoiceVisualizer'), { ssr: false });

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

type SpeechRecognitionInstance = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { transcript: string; confidence: number }[][] }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

export default function JarvisInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [bootComplete, setBootComplete] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Boot sequence
  useEffect(() => {
    const lines = [
      'INITIALIZING J.A.R.V.I.S v4.1.2...',
      'LOADING NEURAL NETWORK MODULES...',
      'CONNECTING TO STARK TOWER MAINFRAME...',
      'CALIBRATING HOLOGRAPHIC INTERFACE...',
      'LOADING THREAT ASSESSMENT PROTOCOLS...',
      'INITIALIZING VOICE SYNTHESIS ENGINE...',
      'RUNNING DIAGNOSTIC CHECKS...',
      'ALL SYSTEMS NOMINAL.',
      'GOOD DAY, SIR. HOW MAY I ASSIST YOU?',
    ];

    let idx = 0;
    const show = () => {
      if (idx < lines.length) {
        setBootLines((prev) => [...prev, lines[idx++]]);
        setTimeout(show, idx === lines.length ? 600 : 200 + Math.random() * 200);
      } else {
        setTimeout(() => setBootComplete(true), 800);
      }
    };
    show();

    // Check backend
    fetch(`${BACKEND}/`)
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));

    // Init speech synthesis
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Focus input when boot completes
  useEffect(() => {
    if (bootComplete) inputRef.current?.focus();
  }, [bootComplete]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    // Try to find a nice British voice (like JARVIS)
    const voices = synthRef.current.getVoices();
    const britishMale = voices.find(
      (v) => v.lang.includes('en-GB') && v.name.toLowerCase().includes('male')
    ) || voices.find((v) => v.lang.includes('en-GB'))
      || voices.find((v) => v.lang.includes('en'));
    if (britishMale) utterance.voice = britishMale;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    synthRef.current.speak(utterance);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      const reply = data.response || 'I apologize, Sir. I encountered an error processing your request.';

      const assistantMsg: Message = { role: 'assistant', content: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
      speak(reply.slice(0, 300));
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content: 'I apologize, Sir. I\'m unable to reach my core systems at this moment. Please ensure the backend server is running on port 8000.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setThinking(false);
    }
  }, [thinking, speak]);

  const toggleVoice = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognitionInstance)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [listening, sendMessage]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    fetch(`${BACKEND}/api/chat`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Boot screen
  if (!bootComplete) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        fontFamily: 'Courier New', zIndex: 1000,
      }}>
        <div style={{ marginBottom: 40, opacity: 0.8 }}>
          <ArcReactor size={120} />
        </div>
        <div style={{
          fontSize: 11, color: '#00d4ff', letterSpacing: 2,
          maxWidth: 500, width: '100%', padding: '0 20px',
        }}>
          {bootLines.map((line, i) => (
            <div key={i} style={{
              marginBottom: 6, opacity: i === bootLines.length - 1 ? 1 : 0.6,
              textShadow: i === bootLines.length - 1 ? '0 0 8px #00d4ff' : 'none',
            }}>
              {i === bootLines.length - 1 && '> '}
              {line}
              {i === bootLines.length - 1 && <span className="animate-blink">_</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      fontFamily: 'Courier New', overflow: 'hidden',
    }} className="hud-grid">
      <HUDOverlay />

      {/* Main layout grid */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 220px',
        gridTemplateRows: '1fr',
        padding: '44px 32px 32px',
        gap: 16,
      }}>
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          <SystemStats />
          <WeatherWidget />
          <RadarWidget />
        </div>

        {/* CENTER PANEL */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
          overflow: 'hidden',
        }}>
          {/* Title bar */}
          <div style={{
            width: '100%', textAlign: 'center', marginBottom: 8,
            fontSize: 11, letterSpacing: 6, color: 'rgba(0,212,255,0.7)',
            textShadow: '0 0 10px rgba(0,212,255,0.5)',
          }}>
            J.A.R.V.I.S — STARK INDUSTRIES AI
          </div>

          {/* Chat area */}
          <div style={{
            flex: 1, width: '100%',
            background: 'rgba(0,5,15,0.85)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(0,212,255,0.12), inset 0 0 20px rgba(0,212,255,0.04)',
          }}>
            {/* Chat header */}
            <div style={{
              padding: '8px 14px', borderBottom: '1px solid rgba(0,212,255,0.15)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: backendOnline ? '#00ff88' : '#ff3333',
                  boxShadow: `0 0 8px ${backendOnline ? '#00ff88' : '#ff3333'}`,
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', letterSpacing: 2 }}>
                  {backendOnline ? 'AI CORE ONLINE' : 'AI CORE OFFLINE'}
                </span>
              </div>
              <button
                onClick={clearConversation}
                style={{
                  fontSize: 8, color: 'rgba(0,212,255,0.4)', background: 'none',
                  border: '1px solid rgba(0,212,255,0.15)', borderRadius: 2,
                  padding: '2px 8px', cursor: 'pointer', letterSpacing: 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(0,212,255,0.9)';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(0,212,255,0.4)';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)';
                }}
              >
                CLEAR
              </button>
            </div>

            <ChatWindow messages={messages} thinking={thinking} />

            {/* Input bar */}
            <div style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(0,212,255,0.15)',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 6,
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: 3, padding: '4px 10px',
              }}>
                <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.4)' }}>›</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ENTER COMMAND, SIR..."
                  disabled={thinking}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#00d4ff', fontSize: 12, fontFamily: 'Courier New',
                    caretColor: '#00d4ff',
                  }}
                />
                {thinking && (
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{
                        width: 4, height: 4, borderRadius: '50%', background: '#00d4ff',
                        animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Voice button */}
              <button
                onClick={toggleVoice}
                style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: listening ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.08)',
                  border: listening ? '1px solid #00ff88' : '1px solid rgba(0,212,255,0.3)',
                  color: listening ? '#00ff88' : '#00d4ff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: listening ? '0 0 15px rgba(0,255,136,0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                🎤
              </button>

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={thinking || !input.trim()}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.35)',
                  borderRadius: 3,
                  color: '#00d4ff', fontSize: 10, letterSpacing: 2,
                  cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
                  opacity: thinking || !input.trim() ? 0.4 : 1,
                  transition: 'all 0.2s',
                  fontFamily: 'Courier New',
                }}
              >
                SEND
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          {/* Arc Reactor */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(0,5,15,0.85)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 4, padding: '14px 14px 10px',
            width: '100%',
            boxShadow: '0 0 15px rgba(0,212,255,0.12)',
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,255,0.5)',
              marginBottom: 10, borderBottom: '1px solid rgba(0,212,255,0.15)',
              width: '100%', textAlign: 'center', paddingBottom: 6,
            }}>
              ARC REACTOR CORE
            </div>
            <ArcReactor size={160} listening={listening} thinking={thinking} />
            <div style={{
              marginTop: 8, fontSize: 9, letterSpacing: 2,
              color: thinking ? '#aa44ff' : listening ? '#00ff88' : 'rgba(0,212,255,0.6)',
              textShadow: thinking ? '0 0 8px #aa44ff' : listening ? '0 0 8px #00ff88' : 'none',
              textAlign: 'center',
            }}>
              {thinking ? 'PROCESSING...' : listening ? 'LISTENING...' : speaking ? 'SPEAKING...' : 'STANDBY'}
            </div>
          </div>

          {/* Voice visualizer */}
          <div style={{
            width: '100%',
            background: 'rgba(0,5,15,0.85)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 4, padding: '10px 14px',
            boxShadow: '0 0 12px rgba(0,212,255,0.1)',
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,255,0.5)',
              marginBottom: 8, borderBottom: '1px solid rgba(0,212,255,0.15)', paddingBottom: 5,
            }}>
              VOICE ANALYSIS
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <VoiceVisualizer active={listening} />
            </div>
          </div>

          {/* Quick actions */}
          <div style={{
            width: '100%',
            background: 'rgba(0,5,15,0.85)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 4, padding: '10px 14px',
            boxShadow: '0 0 12px rgba(0,212,255,0.1)',
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,255,0.5)',
              marginBottom: 8, borderBottom: '1px solid rgba(0,212,255,0.15)', paddingBottom: 5,
            }}>
              QUICK ACCESS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { label: 'STATUS REPORT', cmd: 'Give me a full system status report' },
                { label: 'WEATHER BRIEF', cmd: 'What is the current weather analysis?' },
                { label: 'THREAT SCAN', cmd: 'Run a threat assessment and security analysis' },
                { label: 'DIAGNOSTICS', cmd: 'Run full diagnostics on all systems' },
              ].map(({ label, cmd }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(cmd)}
                  disabled={thinking}
                  style={{
                    padding: '5px 8px',
                    background: 'rgba(0,212,255,0.04)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: 2,
                    color: 'rgba(0,212,255,0.7)',
                    fontSize: 9, letterSpacing: 1.5,
                    cursor: thinking ? 'not-allowed' : 'pointer',
                    opacity: thinking ? 0.4 : 1,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    fontFamily: 'Courier New',
                  }}
                  onMouseEnter={(e) => {
                    if (!thinking) {
                      e.currentTarget.style.background = 'rgba(0,212,255,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)';
                      e.currentTarget.style.color = '#00d4ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,212,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)';
                    e.currentTarget.style.color = 'rgba(0,212,255,0.7)';
                  }}
                >
                  › {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes typingBounce {
          from { transform: scale(0.7); opacity: 0.4; }
          to { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function RadarWidget() {
  return (
    <div style={{
      background: 'rgba(0,5,15,0.85)',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 4, padding: '10px 14px',
      boxShadow: '0 0 12px rgba(0,212,255,0.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,255,0.5)',
        marginBottom: 8, borderBottom: '1px solid rgba(0,212,255,0.15)',
        paddingBottom: 5, width: '100%', textAlign: 'center',
      }}>
        PROXIMITY SCAN
      </div>
      <RadarScanner size={150} />
      <div style={{
        marginTop: 6, fontSize: 8, color: 'rgba(0,212,255,0.4)', letterSpacing: 1,
        textAlign: 'center',
      }}>
        5 OBJECTS TRACKED
      </div>
    </div>
  );
}
