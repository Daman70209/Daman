import os
import asyncio
import json
import psutil
import platform
import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

load_dotenv()

app = FastAPI(title="JARVIS AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI provider config ──────────────────────────────────────────────────────
# Set AI_PROVIDER in .env to: groq | gemini | anthropic | ollama
AI_PROVIDER        = os.getenv("AI_PROVIDER", "groq").lower()
GROQ_API_KEY       = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY  = os.getenv("ANTHROPIC_API_KEY", "")
OLLAMA_HOST        = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL       = os.getenv("OLLAMA_MODEL", "llama3")

WEATHER_API_KEY    = os.getenv("WEATHER_API_KEY", "")
WEATHER_CITY       = os.getenv("WEATHER_CITY", "New York")
# ────────────────────────────────────────────────────────────────────────────

JARVIS_SYSTEM_PROMPT = """You are JARVIS (Just A Rather Very Intelligent System), Tony Stark's legendary AI assistant from Iron Man. You are:

- Supremely intelligent, witty, and sophisticated
- Calm, precise, and highly capable
- Loyal and protective of your user
- Known for dry humor and occasional sarcasm when appropriate
- Always addressing the user as "Sir" or "Ma'am" unless told otherwise
- Proactive in offering solutions and insights

Respond concisely but thoroughly. Be sophisticated and precise. Maintain the JARVIS persona at all times.

Current date and time: {datetime}
System: {system_info}
"""

conversation_history: list[dict] = []


class ChatRequest(BaseModel):
    message: str


def get_system_info() -> dict:
    cpu     = psutil.cpu_percent(interval=0.1)
    mem     = psutil.virtual_memory()
    disk    = psutil.disk_usage("/")
    battery = psutil.sensors_battery() if hasattr(psutil, "sensors_battery") else None
    net     = psutil.net_io_counters()
    return {
        "cpu_percent":     cpu,
        "memory_percent":  mem.percent,
        "memory_used_gb":  round(mem.used  / 1024**3, 2),
        "memory_total_gb": round(mem.total / 1024**3, 2),
        "disk_percent":    disk.percent,
        "disk_used_gb":    round(disk.used  / 1024**3, 2),
        "disk_total_gb":   round(disk.total / 1024**3, 2),
        "battery_percent": battery.percent      if battery else None,
        "battery_charging":battery.power_plugged if battery else None,
        "platform":        platform.system(),
        "bytes_sent_mb":   round(net.bytes_sent / 1024**2, 2),
        "bytes_recv_mb":   round(net.bytes_recv / 1024**2, 2),
    }


async def get_weather(city: str | None = None) -> dict:
    target = city or WEATHER_CITY
    if not WEATHER_API_KEY:
        return {"city": target, "temp": 22, "feels_like": 20, "humidity": 60,
                "description": "Clear skies", "wind_speed": 5.2, "icon": "01d", "demo": True}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": target, "appid": WEATHER_API_KEY, "units": "metric"},
                timeout=5.0,
            )
            d = r.json()
            return {
                "city":        d["name"],
                "temp":        round(d["main"]["temp"]),
                "feels_like":  round(d["main"]["feels_like"]),
                "humidity":    d["main"]["humidity"],
                "description": d["weather"][0]["description"].title(),
                "wind_speed":  d["wind"]["speed"],
                "icon":        d["weather"][0]["icon"],
                "demo":        False,
            }
    except Exception:
        return {"city": target, "temp": 22, "feels_like": 20, "humidity": 60,
                "description": "Clear skies", "wind_speed": 5.2, "icon": "01d", "demo": True}


def build_system_prompt() -> str:
    now     = datetime.datetime.now().strftime("%A, %B %d, %Y at %H:%M:%S")
    sysinfo = json.dumps(get_system_info(), indent=2)
    return JARVIS_SYSTEM_PROMPT.format(datetime=now, system_info=sysinfo)


async def chat_groq(message: str) -> str:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    msgs = [{"role": "system", "content": build_system_prompt()}]
    for h in conversation_history[-20:]:
        msgs.append({"role": h["role"], "content": h["content"]})
    msgs.append({"role": "user", "content": message})
    resp = client.chat.completions.create(
        model="llama3-8b-8192",   # free & fast
        messages=msgs,
        max_tokens=1024,
    )
    return resp.choices[0].message.content


async def chat_gemini(message: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=build_system_prompt(),
    )
    history = []
    for h in conversation_history[-20:]:
        role = "user" if h["role"] == "user" else "model"
        history.append({"role": role, "parts": [h["content"]]})
    chat = model.start_chat(history=history)
    resp = chat.send_message(message)
    return resp.text


async def chat_anthropic(message: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msgs = []
    for h in conversation_history[-20:]:
        msgs.append({"role": h["role"], "content": h["content"]})
    msgs.append({"role": "user", "content": message})
    resp = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system=build_system_prompt(),
        messages=msgs,
    )
    return resp.content[0].text


async def chat_ollama(message: str) -> str:
    msgs = [{"role": "system", "content": build_system_prompt()}]
    for h in conversation_history[-20:]:
        msgs.append({"role": h["role"], "content": h["content"]})
    msgs.append({"role": "user", "content": message})
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": msgs, "stream": False},
        )
        return r.json()["message"]["content"]


async def chat_ai(message: str) -> str:
    provider = AI_PROVIDER

    # Auto-detect which key is configured if provider not explicitly set
    if not GROQ_API_KEY and not GEMINI_API_KEY and not ANTHROPIC_API_KEY and provider != "ollama":
        return (
            "Sir, I require an AI API key to function. "
            "Please add a free GROQ_API_KEY to jarvis/backend/.env — "
            "sign up free at console.groq.com."
        )

    try:
        if provider == "groq":
            return await chat_groq(message)
        elif provider == "gemini":
            return await chat_gemini(message)
        elif provider == "anthropic":
            return await chat_anthropic(message)
        elif provider == "ollama":
            return await chat_ollama(message)
        else:
            return await chat_groq(message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "JARVIS online", "provider": AI_PROVIDER}


@app.get("/api/system")
async def system_info():
    return get_system_info()


@app.get("/api/weather")
async def weather(city: str | None = None):
    return await get_weather(city)


@app.post("/api/chat")
async def chat(request: ChatRequest):
    reply = await chat_ai(request.message)
    conversation_history.append({"role": "user",      "content": request.message})
    conversation_history.append({"role": "assistant", "content": reply})
    if len(conversation_history) > 100:
        conversation_history.clear()
    return {"response": reply, "provider": AI_PROVIDER}


@app.delete("/api/chat")
async def clear_chat():
    conversation_history.clear()
    return {"status": "Conversation memory cleared, Sir."}


@app.websocket("/ws/system")
async def websocket_system(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(get_system_info())
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
