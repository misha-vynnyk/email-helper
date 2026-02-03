from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import io
import torch

class CLIPService:
    _instance = None
    _processor = None
    _model = None

    # Default candidate tags for e-commerce/marketing context
    DEFAULT_CANDIDATES = [
        "fashion", "technology", "food", "travel", "business", "sale",
        "clothing", "electronics", "beauty", "home decor", "sports",
        "luxury", "minimalist", "bright", "dark", "vintage"
    ]

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = CLIPService()
        return cls._instance

    def _get_model(self):
        """Lazy load the CLIP model"""
        if self._model is None:
            print("Loading CLIP model... (openai/clip-vit-base-patch32)")
            self._processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self._model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            print("CLIP model loaded.")
        return self._processor, self._model

    def generate_tags(self, image_bytes: bytes, candidates: list = None) -> list:
        """
        Generate tags for the image using zero-shot classification.
        Returns a list of tags sorted by confidence.
        """
        try:
            processor, model = self._get_model()

            if candidates is None:
                candidates = self.DEFAULT_CANDIDATES

            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

            inputs = processor(
                text=candidates,
                images=image,
                return_tensors="pt",
                padding=True
            )

            outputs = model(**inputs)
            # logits_per_image: [1, len(candidates)]
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)

            # Get top tags (e.g., threshold > 20% or top 3)
            # Flatten to 1D
            probs_list = probs.detach().numpy().flatten()

            # Zip with candidates and sort
            scored_tags = list(zip(candidates, probs_list))
            scored_tags.sort(key=lambda x: x[1], reverse=True)

            # Return tags with > 0.1 confidence, or top 3 if none match
            relevant_tags = [tag for tag, score in scored_tags if score > 0.1]
            if not relevant_tags:
                relevant_tags = [tag for tag, score in scored_tags[:3]]

            return relevant_tags

        except Exception as e:
            print(f"CLIP Tagging Error: {e}")
            return []

clip_service = CLIPService.get_instance()
