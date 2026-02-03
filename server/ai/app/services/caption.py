from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import io
# import torch # Not strictly needed if relying on default device (CPU)

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
            # This triggers download on first run (~1GB)
            self._processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self._model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
            print("BLIP model loaded.")
        return self._processor, self._model

    def generate_caption(self, image_bytes: bytes) -> str:
        """
        Generate a caption for the image bytes.
        """
        try:
            processor, model = self._get_model()

            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

            # Unconditional image captioning
            inputs = processor(image, return_tensors="pt")

            # Generate output
            out = model.generate(**inputs, max_new_tokens=50)
            caption = processor.decode(out[0], skip_special_tokens=True)

            return caption
        except Exception as e:
            print(f"Caption Generation Error: {e}")
            return ""

caption_service = CaptionService.get_instance()
