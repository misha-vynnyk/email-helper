from paddleocr import PaddleOCR
import numpy as np
import cv2
from typing import List, Dict, Any, Union

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
        max_dim = 2000

        if max(height, width) > max_dim:
            scaling_factor = max_dim / float(max(height, width))
            new_width = int(width * scaling_factor)
            new_height = int(height * scaling_factor)
            return cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
        return img

    def process_image_from_cv(self, img: np.ndarray, detailed: bool = True) -> Union[List[Dict[str, Any]], str]:
        """
        Process numpy array directly (avoids double decode).
        If detailed=True, returns list of dicts with boxes.
        If detailed=False, returns plain text string.
        """
        if img is None:
            raise ValueError("Could not decode image")

        img = self._resize_if_needed(img)
        ocr = self._get_model()
        result = ocr.ocr(img)

        if not result or result[0] is None:
            return [] if detailed else ""

        if detailed:
            return self._parse_detailed(result)
        else:
            return self._parse_text(result)

    def _parse_text(self, result) -> str:
        """Parse OCR result to plain text"""
        full_text = []
        if result and len(result) > 0:
            res_obj = result[0]
            if isinstance(res_obj, dict) and 'rec_texts' in res_obj:
                return "\n".join(res_obj['rec_texts'])
            for line in res_obj:
                if isinstance(line, list) and len(line) >= 2:
                    full_text.append(line[1][0])
        return "\n".join(full_text)

    def _parse_detailed(self, result) -> List[Dict[str, Any]]:
        """Parse OCR result to detailed format with boxes"""
        output = []
        if result and len(result) > 0:
            res_obj = result[0]
            if isinstance(res_obj, dict) and 'rec_texts' in res_obj:
                texts = res_obj.get('rec_texts', [])
                scores = res_obj.get('rec_scores', [])
                boxes = res_obj.get('dt_polys', [])
                for i in range(len(texts)):
                    output.append({
                        "text": texts[i],
                        "confidence": float(scores[i]) if i < len(scores) else 0.0,
                        "box": boxes[i].tolist() if hasattr(boxes[i], 'tolist') else boxes[i]
                    })
                return output
            for line in res_obj:
                if isinstance(line, list) and len(line) >= 2:
                    output.append({
                        "text": line[1][0],
                        "confidence": float(line[1][1]),
                        "box": line[0]
                    })
        return output

    # Legacy methods for backward compatibility
    def process_image(self, image_bytes: bytes) -> str:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return self.process_image_from_cv(img, detailed=False)

    def process_image_detailed(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return self.process_image_from_cv(img, detailed=True)

ocr_service = OCRService.get_instance()
