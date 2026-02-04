from fastapi import APIRouter, UploadFile, File, Form
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

from app.services.ocr import ocr_service
from app.services.caption import caption_service
from app.services.clip import clip_service
from app.services.merge import merge_service

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

    # Check cache
    content_hash = md5(content).hexdigest()
    if content_hash in _response_cache:
        cached = _response_cache[content_hash]
        cached["cached"] = True
        return cached

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
            print(f"OCR Error: {e}")
            traceback.print_exc()
            return [], ""

    async def run_caption():
        try:
            return await run_in_threadpool(caption_service.generate_caption_from_pil, pil_for_blip)
        except Exception as e:
            print(f"Caption Error: {e}")
            return ""

    async def run_clip():
        try:
            return await run_in_threadpool(clip_service.generate_tags_from_pil, pil_for_clip)
        except Exception as e:
            print(f"CLIP Error: {e}")
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
    _response_cache[content_hash] = response

    return response
