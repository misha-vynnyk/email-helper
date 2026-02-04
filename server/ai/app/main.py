from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - models will load lazily on first request (when AI is enabled in settings)
    print("🚀 AI Service starting... (models will load on first use)")
    yield
    print("👋 AI Service shutting down...")

app = FastAPI(
    title="Email Helper AI Service",
    description="Local AI Backend for Advanced Image Analysis (OCR, Captioning, Tagging)",
    version="0.2.1",
    lifespan=lifespan
)

# CORS - Allow requests from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-backend", "version": "0.2.1"}
