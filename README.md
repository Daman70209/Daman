# J.A.R.V.I.S — Just A Rather Very Intelligent System

A complete Iron Man JARVIS AI replica with holographic HUD interface, voice recognition, and Claude AI brain.

## Features

- **Holographic HUD Interface** — Full-screen cyan-on-black Iron Man aesthetic with scan lines, vignette, and glowing borders
- **Arc Reactor Animation** — Animated canvas-based arc reactor that reacts to listening/thinking states
- **AI Brain** — Powered by Claude (Anthropic) with full JARVIS persona and system context
- **Voice Input** — Web Speech API for hands-free voice commands
- **Text-to-Speech** — JARVIS speaks back with a British accent
- **Real-time System Stats** — Live CPU, memory, disk, battery via WebSocket
- **Radar Scanner** — Animated proximity radar with sweep and blips
- **Weather Widget** — Live atmospheric data (OpenWeatherMap API)
- **Boot Sequence** — Authentic JARVIS startup animation
- **Quick Actions** — One-click commands for status reports, diagnostics, etc.

## Quick Start

### 1. Configure API Keys

```bash
# Edit jarvis/backend/.env
ANTHROPIC_API_KEY=your_anthropic_key_here
WEATHER_API_KEY=your_openweathermap_key_here  # optional
WEATHER_CITY=New York
```

### 2. Start Everything

```bash
cd jarvis
./start.sh
```

Then open **http://localhost:3000**

### 3. Manual Start

**Backend (Python FastAPI):**
```bash
cd jarvis/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend (Next.js):**
```bash
cd jarvis/frontend
npm install
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Animations | Canvas API, CSS animations |
| AI | Claude (Anthropic SDK) — JARVIS persona |
| Backend | Python FastAPI |
| Voice I/O | Web Speech API (browser native) |
| System Info | psutil |
| Real-time | WebSocket |
| Weather | OpenWeatherMap API |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/system` | System stats |
| GET | `/api/weather` | Weather data |
| POST | `/api/chat` | Chat with JARVIS |
| DELETE | `/api/chat` | Clear conversation |
| WS | `/ws/system` | Live system stats stream |

## Voice Commands (Examples)

- *"Run a full system diagnostic"*
- *"What's the weather like?"*
- *"Give me a threat assessment"*
- *"What can you do, JARVIS?"*
- *"Calculate the trajectory for Mach 3 flight"*
