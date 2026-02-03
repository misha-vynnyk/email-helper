from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes

app = FastAPI(
    title="Email Helper AI Service",
    description="Local AI Backend for Advanced Image Analysis (OCR, Captioning, Tagging)",
    version="0.1.0"
)

# CORS - Allow requests from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Add your frontend ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-backend"}
