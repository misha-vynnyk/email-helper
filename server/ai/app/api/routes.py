from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
import asyncio
from hashlib import md5

router = APIRouter()

# Simple in-memory cache for responses
_response_cache = {}
_CACHE_MAX_SIZE = 100

@router.get("/")
async def root():
    return {"message": "AI Service is running"}

@router.delete("/cache")
async def clear_cache():
    count = len(_response_cache)
    _response_cache.clear()
    return {"cleared": count}

from app.services.gemma import gemma_service
from app.core.logger import logger, ws_handler

@router.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    q = asyncio.Queue()
    await ws_handler.add_queue(q)
    try:
        while True:
            msg = await q.get()
            await websocket.send_text(msg)
    except WebSocketDisconnect:
        pass
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
    finally:
        await ws_handler.remove_queue(q)

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
):
    """Analyze image using Gemma 3 via Ollama."""
    content = await file.read()

    content_hash = md5(content).hexdigest()
    if content_hash in _response_cache:
        cached = _response_cache[content_hash].copy()
        cached["cached"] = True
        return cached

    try:
        logger.info("Starting Gemma 3 analysis...")
        gemma_result = await run_in_threadpool(gemma_service.analyze_image_with_ollama, content)
        logger.info(f"Gemma 3 analysis complete. Filename: {gemma_result['filename']}")

        response = {
            "filename": gemma_result["filename"],
            "alt_text": gemma_result["alt_text"],
            "candidates": {
                "filenames": [gemma_result["filename"]],
                "alt_texts": [gemma_result["alt_text"]]
            },
            "cta": gemma_result["cta"],
            "raw": {
                "ocr": gemma_result["cta"],
                "caption": gemma_result["alt_text"],
                "tags": []
            },
            "cached": False
        }

        if len(_response_cache) >= _CACHE_MAX_SIZE:
            oldest_key = next(iter(_response_cache))
            del _response_cache[oldest_key]
        _response_cache[content_hash] = response

        return response

    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Gemma 3 analysis failed: {str(e)}. Make sure Ollama is running.")
