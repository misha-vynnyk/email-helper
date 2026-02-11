from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import io

class CaptionService:
    _instance = None
    _processor = None
    _model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = CaptionService()
        return cls._instance

    def _get_model(self):
        """Lazy load the BLIP model"""
        if self._model is None:
            print("Loading BLIP model... (Salesforce/blip-image-captioning-base)")
            self._processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self._model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
            print("BLIP model loaded.")
        return self._processor, self._model

    def generate_caption_from_pil(self, image: Image.Image) -> str:
        """
        Generate a caption from PIL Image directly (avoids re-decode).
        """
        try:
            processor, model = self._get_model()

            # Ensure RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')

            inputs = processor(image, return_tensors="pt")
            out = model.generate(**inputs, max_new_tokens=50)
            caption = processor.decode(out[0], skip_special_tokens=True)
            return caption
        except Exception as e:
            print(f"Caption Generation Error: {e}")
            return ""

    # Legacy method for backward compatibility
    def generate_caption(self, image_bytes: bytes) -> str:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return self.generate_caption_from_pil(image)

caption_service = CaptionService.get_instance()
