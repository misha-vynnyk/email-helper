from fastapi import APIRouter, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from typing import Optional
import time
import traceback

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "AI Service is running"}

from app.services.ocr import ocr_service
from app.services.caption import caption_service
from app.services.clip import clip_service
from app.services.merge import merge_service

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    mode: str = Form("fast"), # 'fast' or 'detailed'
):
    """
    Main endpoint for image analysis.
    Current: OCR (PaddleOCR) + Caption (BLIP) + Tags (CLIP) -> Merged Result
    """
    # Read content once (awaitable I/O)
    content = await file.read()

    # 1. OCR (Lazy)
    # We must run this in threadpool because Paddle is blocking/synchronous
    ocr_text = ""
    ocr_result = [] # List of dicts
    try:
        if mode == "detailed":
            ocr_result = await run_in_threadpool(ocr_service.process_image_detailed, content)
            ocr_text = "\n".join([item["text"] for item in ocr_result])
        else:
            # Fast mode returns string
            ocr_text = await run_in_threadpool(ocr_service.process_image, content)
            ocr_result = [{"text": line} for line in ocr_text.split('\n') if line]
    except Exception as e:
        print(f"OCR Error: {e}")
        traceback.print_exc()

    # 2. Captioning (Lazy)
    caption = ""
    try:
        # BLIP is also blocking
        caption = await run_in_threadpool(caption_service.generate_caption, content)
    except Exception as e:
        print(f"Caption Error: {e}")

    # 3. CLIP Tags (Lazy)
    tags = []
    try:
        # CLIP is also blocking
        tags = await run_in_threadpool(clip_service.generate_tags, content)
    except Exception as e:
        print(f"CLIP Error: {e}")

    # 4. Semantic Merge
    # Pass structured OCR data (list of dicts) if available, otherwise mock it
    ocr_data = ocr_result if isinstance(ocr_result, list) else [{"text": ocr_text}]

    # Run merge logic in threadpool too
    result = await run_in_threadpool(merge_service.merge_signals, ocr_data, caption, tags)

    return {
        "filename": result["filename_candidates"][0], # Default best (legacy field)
        "alt_text": result["alt_text_candidates"][0], # Default best (legacy field)
        "candidates": {
            "filenames": result["filename_candidates"],
            "alt_texts": result["alt_text_candidates"]
        },
        "cta": result.get("cta", ""),
        "raw": {
            "ocr": ocr_text,
            "caption": caption,
            "tags": tags
        }
    }
