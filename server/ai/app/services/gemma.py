import base64
import json
import urllib.request
import urllib.error
import io
from PIL import Image
from typing import Dict, Any
from app.core.logger import logger

import os

class GemmaService:
    _instance = None
    # Use OLLAMA_HOST env var if available, otherwise default to localhost
    OLLAMA_BASE_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip('/')
    OLLAMA_URL = f"{OLLAMA_BASE_URL}/api/generate"
    MODEL_NAME = "gemma3:4b"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = GemmaService()
        return cls._instance

    def analyze_image_with_ollama(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Send image to local Ollama instance running gemma3:4b
        and expect a structured JSON response.
        """
        # Optimize image to maximize inference speed
        try:
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            # Resize image maintaining aspect ratio (max 768px limit for speed)
            img.thumbnail((768, 768), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=85)
            optimized_bytes = output.getvalue()
        except Exception as e:
            logger.warning(f"Failed to optimize image, falling back to original: {e}")
            optimized_bytes = image_bytes

        logger.info(f"Sending image to Ollama ({self.MODEL_NAME})...")

        # Convert image bytes to base64
        base64_image = base64.b64encode(optimized_bytes).decode('utf-8')

        prompt = (
            "Analyze this image and return a strictly formatted JSON object with these keys:\n"
            "- \"filename\": Exactly ONE lowercase word representing the main object (e.g., 'sneaker', 'logo', 'fashion').\n"
            "- \"alt_text\": A very short, crisp, and clean description (max 10 words). No 'Image of' or 'This is'.\n"
            "- \"cta\": Only the text from a Call-to-Action button if visible. Otherwise empty string.\n\n"
            "Respond ONLY with valid JSON."
        )

        data = {
            "model": self.MODEL_NAME,
            "prompt": prompt,
            "images": [base64_image],
            "stream": False,
            "format": "json", # Ollama supports structured JSON output
            "options": {
                "temperature": 0.1, # Keep it deterministic
                "num_predict": 64,  # Optimize speed: Stop generating after 64 tokens
                "num_ctx": 1024     # Optimize memory: Reduce KV cache context window limits
            }
        }

        req = urllib.request.Request(
            self.OLLAMA_URL,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
                response_text = result.get('response', '')

                # Try to parse the LLM JSON response
                try:
                    parsed = json.loads(response_text)
                    return {
                        "alt_text": str(parsed.get("alt_text", "Image")),
                        "filename": str(parsed.get("filename", "image")),
                        "cta": str(parsed.get("cta", ""))
                    }
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse Gemma output as JSON: {response_text}")
                    return {
                        "alt_text": "Image",
                        "filename": "image",
                        "cta": ""
                    }
        except urllib.error.URLError as e:
            # Re-raise so the API handler can catch connection refused
            raise ConnectionError(f"Could not connect to Ollama at {self.OLLAMA_URL}. Is it running?") from e

gemma_service = GemmaService.get_instance()
