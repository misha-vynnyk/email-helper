from fastapi import APIRouter, UploadFile, File, Form
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
    content = await file.read()

    # 1. OCR (Lazy)
    ocr_text = ""
    try:
        if mode == "detailed":
            ocr_result = ocr_service.process_image_detailed(content)
            ocr_text = "\n".join([item["text"] for item in ocr_result])
        else:
            ocr_text = ocr_service.process_image(content)
    except Exception as e:
        print(f"OCR Error: {e}")
        traceback.print_exc()

    # 2. Captioning (Lazy)
    caption = ""
    try:
        # Only run captioning if mode is detailed or specific flag is set?
        # For now, run it always to demonstrate capability, BLIP base is fast.
        caption = caption_service.generate_caption(content)
    except Exception as e:
        print(f"Caption Error: {e}")

    # 3. CLIP Tags (Lazy)
    tags = []
    try:
        tags = clip_service.generate_tags(content)
    except Exception as e:
        print(f"CLIP Error: {e}")

    # 4. Semantic Merge
    result = merge_service.merge_signals(ocr_text, caption, tags)

    return {
        "filename": result["filename"],
        "alt_text": result["alt_text"],
        "raw": {
            "ocr": ocr_text,
            "caption": caption,
            "tags": tags
        }
    }
