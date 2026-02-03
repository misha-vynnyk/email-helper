import re

class MergeService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MergeService()
        return cls._instance

    def merge_signals(self, ocr_text: str, caption: str, tags: list) -> dict:
        """
        Synthesize OCR, Caption, and Tags into final ALT text and Filename.
        """

        # 1. Clean Inputs
        clean_ocr = self._clean_ocr(ocr_text)
        clean_caption = caption.strip() if caption else ""

        # 2. Generate ALT Text
        alt_text = clean_caption

        if clean_ocr:
            # Heuristic: If caption is short/empty, prioritize OCR?
            # Or always append?
            # Pattern: "[Caption]. Text says: '[OCR]'"
            if alt_text:
                if alt_text.endswith('.'):
                    alt_text = alt_text[:-1]
                alt_text = f"{alt_text}. Text says: '{clean_ocr}'."
            else:
                alt_text = f"Image containing text: '{clean_ocr}'."

        if not alt_text:
            # Fallback to tags if absolutely nothing else
            if tags:
                alt_text = f"Image related to {', '.join(tags[:3])}."
            else:
                alt_text = "Image"

        # 3. Generate SEO Filename
        # Use caption + top tag + ocr keyword?
        # Let's just slugify the ALT text, but keep it short.
        base_for_filename = clean_caption if clean_caption else clean_ocr
        if not base_for_filename and tags:
            base_for_filename = "-".join(tags[:3])

        filename = self._slugify(base_for_filename)

        return {
            "alt_text": alt_text,
            "filename": filename # Client should append extension (e.g. .jpg)
        }

    def _clean_ocr(self, text: str) -> str:
        if not text:
            return ""
        # Remove excess whitespace, newlines
        text = re.sub(r'\s+', ' ', text).strip()
        # Maybe limit length if massive dump?
        if len(text) > 100:
            text = text[:97] + "..."
        return text

    def _slugify(self, text: str) -> str:
        if not text:
            return "image"
        # Lowercase
        text = text.lower()
        # Remove non-alphanumeric (except hyphen/space)
        text = re.sub(r'[^a-z0-9\s-]', '', text)
        # Replace spaces with hyphens
        text = re.sub(r'\s+', '-', text)
        # Trim hyphens
        text = text.strip('-')
        # Limit length
        if len(text) > 50:
            text = text[:50].strip('-')
        return text

merge_service = MergeService.get_instance()
