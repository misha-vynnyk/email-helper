from paddleocr import PaddleOCR
import numpy as np
import cv2
from typing import List, Dict, Any

class OCRService:
    _instance = None
    _model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = OCRService()
        return cls._instance

    def _get_model(self):
        """Lazy load the PaddleOCR model"""
        if self._model is None:
            print("Loading PaddleOCR model... (this may take a moment)")
            # use_angle_cls=False: faster
            # lang='en': standard
            # ocr_version='PP-OCRv4': explicitly request v4 (usually defaults to mobile)
            # det_model_dir to None will force default download if not set, but we want to hint 'mobile'
            # Actually, just passing ocr_version='PP-OCRv4' often defaults to mobile.
            # To be safe, we can try structure_version or similar, but let's try standard v4 first.
            self._model = PaddleOCR(
                use_angle_cls=False,
                lang='en',
                ocr_version='PP-OCRv4'
            )
            print("PaddleOCR model loaded.")
        return self._model

    def _resize_if_needed(self, img):
        """Resize image if it's too large to speed up processing"""
        height, width = img.shape[:2]
        max_dim = 2000 # Increased from 1200 for better OCR quality

        if max(height, width) > max_dim:
            scaling_factor = max_dim / float(max(height, width))
            new_width = int(width * scaling_factor)
            new_height = int(height * scaling_factor)
            return cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
        return img

    def process_image(self, image_bytes: bytes) -> str:
        """
        Process image bytes and return full text.
        """
        # Convert bytes to numpy array for cv2
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Could not decode image")

        img = self._resize_if_needed(img)

        ocr = self._get_model()
        result = ocr.ocr(img)

        if not result or result[0] is None:
            return ""

        # PaddleOCR returns a list of lists (one per line)
        # Each line is [[coords], [text, confidence]]
        # We just want the text for now

        # result structure: [ [ [ [[x1,y1],[x2,y2],[x3,y3],[x4,y4]], ("text", conf) ], ... ] ]
        # Usually result[0] is the list of lines for the first page/image

        full_text = []
        if result and len(result) > 0:
            res_obj = result[0]
            # PaddleX dict support
            if isinstance(res_obj, dict) and 'rec_texts' in res_obj:
                return "\n".join(res_obj['rec_texts'])

            # Classic list support
            for line in res_obj:
                if isinstance(line, list) and len(line) >= 2:
                    text_part = line[1][0]
                    full_text.append(text_part)

        return "\n".join(full_text)

    def process_image_detailed(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Return detailed result with bounding boxes and confidence
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Could not decode image")

        img = self._resize_if_needed(img)

        ocr = self._get_model()
        result = ocr.ocr(img)

        output = []
        if not result or result[0] is None:
            return output

        if result and len(result) > 0:
            res_obj = result[0]
            # Check for PaddleX dict-like structure
            if isinstance(res_obj, dict) and 'rec_texts' in res_obj:
                texts = res_obj.get('rec_texts', [])
                scores = res_obj.get('rec_scores', [])
                boxes = res_obj.get('dt_polys', [])

                # Zip them safely
                for i in range(len(texts)):
                    text = texts[i]
                    conf = scores[i] if i < len(scores) else 0.0
                    box = boxes[i].tolist() if hasattr(boxes[i], 'tolist') else boxes[i]

                    output.append({
                        "text": text,
                        "confidence": float(conf),
                        "box": box
                    })
                return output

            # Fallback for classic list-of-lists format
            for line in res_obj:
                if isinstance(line, list) and len(line) >= 2:
                    # Classic: [[box], [text, conf]]
                    box = line[0]
                    text, conf = line[1]
                    output.append({
                        "text": text,
                        "confidence": float(conf),
                        "box": box
                    })

        return output

ocr_service = OCRService.get_instance()
