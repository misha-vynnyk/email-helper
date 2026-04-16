from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from typing import Optional
import asyncio
import traceback
from hashlib import md5
from PIL import Image
import io
import numpy as np
import cv2

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

from app.services.ocr import ocr_service
from app.services.caption import caption_service
from app.services.clip import clip_service
from app.services.merge import merge_service
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

def _decode_image(content: bytes):
    """Decode image once, return both PIL and numpy formats"""
    # PIL Image for BLIP/CLIP
    pil_image = Image.open(io.BytesIO(content)).convert('RGB')

    # Numpy array for OCR
    nparr = np.frombuffer(content, np.uint8)
    cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    return pil_image, cv_image

def _resize_pil(image: Image.Image, max_dim: int) -> Image.Image:
    """Resize PIL image if larger than max_dim"""
    w, h = image.size
    if max(w, h) <= max_dim:
        return image

    if w > h:
        new_w = max_dim
        new_h = int(h * max_dim / w)
    else:
        new_h = max_dim
        new_w = int(w * max_dim / h)

    return image.resize((new_w, new_h), Image.LANCZOS)

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    mode: str = Form("fast"), # 'fast' or 'detailed'
):
    """
    Main endpoint for image analysis.
    Optimized: Parallel processing, single decode, caching.
    """
    # Read content once
    content = await file.read()

    # Check cache based on both image content and the requested mode
    content_hash = md5(content).hexdigest()
    cache_key = f"{content_hash}_{mode}"
    
    if cache_key in _response_cache:
        cached = _response_cache[cache_key].copy()
        cached["cached"] = True
        return cached

    # Gemma 3 mode completely bypasses ensemble loading
    if mode == "gemma3":
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
            _response_cache[cache_key] = response
            
            return response
            
        except Exception as e:
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail=f"Gemma 3 Analysis Failed: {str(e)}. Make sure Ollama is running.")

    # Decode image once (pass to all services)
    pil_image, cv_image = await run_in_threadpool(_decode_image, content)

    # Prepare resized versions for each service
    pil_for_blip = _resize_pil(pil_image, 512)   # BLIP doesn't need high res
    pil_for_clip = _resize_pil(pil_image, 224)   # CLIP native size

    # Run OCR, Caption, CLIP in PARALLEL
    async def run_ocr():
        try:
            if mode == "detailed":
                result = await run_in_threadpool(ocr_service.process_image_from_cv, cv_image)
                return result, "\n".join([item["text"] for item in result])
            else:
                text = await run_in_threadpool(ocr_service.process_image_from_cv, cv_image, detailed=False)
                return [{"text": line} for line in text.split('\n') if line], text
        except Exception as e:
            logger.error(f"OCR Error: {e}")
            traceback.print_exc()
            return [], ""

    async def run_caption():
        try:
            return await run_in_threadpool(caption_service.generate_caption_from_pil, pil_for_blip)
        except Exception as e:
            logger.error(f"Caption Error: {e}")
            return ""

    async def run_clip():
        try:
            return await run_in_threadpool(clip_service.generate_tags_from_pil, pil_for_clip)
        except Exception as e:
            logger.error(f"CLIP Error: {e}")
            return []

    # Execute all in parallel!
    (ocr_result, ocr_text), caption, tags = await asyncio.gather(
        run_ocr(),
        run_caption(),
        run_clip()
    )

    # Semantic Merge
    ocr_data = ocr_result if isinstance(ocr_result, list) else [{"text": ocr_text}]
    result = await run_in_threadpool(merge_service.merge_signals, ocr_data, caption, tags)

    response = {
        "filename": result["filename_candidates"][0],
        "alt_text": result["alt_text_candidates"][0],
        "candidates": {
            "filenames": result["filename_candidates"],
            "alt_texts": result["alt_text_candidates"]
        },
        "cta": result.get("cta", ""),
        "raw": {
            "ocr": ocr_text,
            "caption": caption,
            "tags": tags
        },
        "cached": False
    }

    # Cache response (evict oldest if full)
    if len(_response_cache) >= _CACHE_MAX_SIZE:
        oldest_key = next(iter(_response_cache))
        del _response_cache[oldest_key]
    _response_cache[cache_key] = response

    return response
