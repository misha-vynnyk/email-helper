from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import routes
from app.core.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - models will load lazily on first request (when AI is enabled in settings)
    logger.info("🚀 AI Service starting... (models will load on first use)")
    yield
    logger.info("👋 AI Service shutting down...")

app = FastAPI(
    title="Email Helper AI Service",
    description="Local AI Backend for Advanced Image Analysis (OCR, Captioning, Tagging)",
    version="0.2.1",
    lifespan=lifespan
)

# CORS - Allow requests from any origin (local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")

import urllib.request

@app.get("/health")
async def health_check():
    ollama_ok = False
    import os
    ollama_base = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip('/')
    try:
        req = urllib.request.Request(f"{ollama_base}/", method="GET")
        with urllib.request.urlopen(req, timeout=1.0) as response:
            if response.status == 200:
                ollama_ok = True
    except Exception:
        pass

    return {
        "status": "ok", 
        "service": "ai-backend", 
        "version": "0.2.1",
        "ollama_running": ollama_ok
    }
