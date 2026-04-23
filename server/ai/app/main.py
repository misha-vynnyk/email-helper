import os
import urllib.request
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

@app.get("/health")
async def health_check():
    ollama_ok = False

    # Get host and ensure it has a proper scheme
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    if not ollama_host.startswith('http'):
        ollama_host = f"http://{ollama_host}"

    ollama_base = ollama_host.rstrip('/')

    try:
        # Simple health check to Ollama
        with urllib.request.urlopen(f"{ollama_base}/", timeout=2.0) as response:
            if response.getcode() == 200:
                ollama_ok = True
    except Exception as e:
        logger.warning(f"Ollama health check failed (expected if Ollama is off): {str(e)}")
        ollama_ok = False

    return {
        "status": "ok",
        "service": "ai-backend",
        "version": "0.2.1",
        "ollama_running": ollama_ok
    }
