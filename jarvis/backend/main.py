import os
import asyncio
import json
import psutil
import platform
import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic
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

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WEATHER_CITY = os.getenv("WEATHER_CITY", "New York")

JARVIS_SYSTEM_PROMPT = """You are JARVIS (Just A Rather Very Intelligent System), Tony Stark's legendary AI assistant from Iron Man. You are:

- Supremely intelligent, witty, and sophisticated
- Calm, precise, and highly capable
- Loyal and protective of your user
- Capable of controlling systems, analyzing data, and providing expert guidance
- Known for dry humor and occasional sarcasm when appropriate
- Always addressing the user formally (e.g., "Sir" or "Ma'am") unless told otherwise
- Proactive in offering solutions and insights

Your capabilities include:
- Advanced data analysis and research
- System monitoring and control
- Weather and environmental data
- Strategic planning and problem-solving
- Scientific and technical expertise
- Security and threat assessment

Respond concisely but thoroughly. Be sophisticated and precise. Reference your capabilities as a Stark Industries AI. When asked about your status, provide system data. Always maintain the JARVIS persona — never break character.

Current date and time: {datetime}
System: {system_info}
"""

conversation_history = []


class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"


class SystemInfo(BaseModel):
    pass


def get_system_info() -> dict:
    cpu = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    battery = psutil.sensors_battery() if hasattr(psutil, "sensors_battery") else None
    net_io = psutil.net_io_counters()

    return {
        "cpu_percent": cpu,
        "memory_percent": memory.percent,
        "memory_used_gb": round(memory.used / (1024**3), 2),
        "memory_total_gb": round(memory.total / (1024**3), 2),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "battery_percent": battery.percent if battery else None,
        "battery_charging": battery.power_plugged if battery else None,
        "platform": platform.system(),
        "processor": platform.processor(),
        "bytes_sent_mb": round(net_io.bytes_sent / (1024**2), 2),
        "bytes_recv_mb": round(net_io.bytes_recv / (1024**2), 2),
    }


async def get_weather(city: str = None) -> dict:
    target = city or WEATHER_CITY
    if not WEATHER_API_KEY:
        return {
            "city": target,
            "temp": 22,
            "feels_like": 20,
            "humidity": 60,
            "description": "Clear skies",
            "wind_speed": 5.2,
            "icon": "01d",
            "demo": True,
        }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": target, "appid": WEATHER_API_KEY, "units": "metric"},
                timeout=5.0,
            )
            data = resp.json()
            return {
                "city": data["name"],
                "temp": round(data["main"]["temp"]),
                "feels_like": round(data["main"]["feels_like"]),
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"].title(),
                "wind_speed": data["wind"]["speed"],
                "icon": data["weather"][0]["icon"],
                "demo": False,
            }
    except Exception:
        return {
            "city": target,
            "temp": 22,
            "feels_like": 20,
            "humidity": 60,
            "description": "Clear skies",
            "wind_speed": 5.2,
            "icon": "01d",
            "demo": True,
        }


@app.get("/")
async def root():
    return {"status": "JARVIS online", "version": "1.0.0"}


@app.get("/api/system")
async def system_info():
    return get_system_info()


@app.get("/api/weather")
async def weather(city: str = None):
    return await get_weather(city)


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not ANTHROPIC_API_KEY:
        return {
            "response": "Sir, I'm afraid my neural interface requires an Anthropic API key to be configured. Please set ANTHROPIC_API_KEY in the environment file. For now, I remain in standby mode.",
            "model": "demo",
        }

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    sysinfo = get_system_info()
    now = datetime.datetime.now().strftime("%A, %B %d, %Y at %H:%M:%S")

    system = JARVIS_SYSTEM_PROMPT.format(
        datetime=now,
        system_info=json.dumps(sysinfo, indent=2),
    )

    # Build messages list
    messages = []
    for entry in conversation_history[-20:]:
        messages.append({"role": entry["role"], "content": entry["content"]})
    messages.append({"role": "user", "content": request.message})

    try:
        response = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=1024,
            system=system,
            messages=messages,
        )
        assistant_msg = response.content[0].text

        conversation_history.append({"role": "user", "content": request.message})
        conversation_history.append({"role": "assistant", "content": assistant_msg})

        if len(conversation_history) > 100:
            conversation_history.clear()

        return {"response": assistant_msg, "model": "claude-opus-4-8"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/chat")
async def clear_chat():
    conversation_history.clear()
    return {"status": "Conversation memory cleared, Sir."}


@app.websocket("/ws/system")
async def websocket_system(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = get_system_info()
            await websocket.send_json(data)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
