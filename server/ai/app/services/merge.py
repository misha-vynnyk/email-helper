import re

class MergeService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MergeService()
        return cls._instance

    def merge_signals(self, ocr_data: list, caption: str, tags: list) -> dict:
        """
        Synthesize OCR, Caption, and Tags into multiple candidates for ALT text and Filename.
        """
        clean_caption = caption.strip() if caption else ""

        # Extract plain text lines from OCR data
        ocr_lines_raw = [item['text'] for item in ocr_data if item and 'text' in item]

        # Filter out garbage OCR text
        ocr_lines = [line for line in ocr_lines_raw if not self._is_garbage_text(line)]

        full_ocr_text = " ".join(ocr_lines)

        # 1. CTA
        cta_text = self._extract_cta(ocr_lines)

        # 2. ALT Text Candidates
        alt_candidates = self._generate_alt_candidates(clean_caption, ocr_lines, tags)

        # 3. Filename Candidates (Strict 1-2 words)
        filename_candidates = self._generate_filename_candidates(tags, clean_caption, ocr_lines)

        # Ensure we have at least one fallback
        if not filename_candidates:
            filename_candidates = ["image"]
        if not alt_candidates:
            alt_candidates = ["Image"]

        return {
            "alt_text_candidates": alt_candidates,
            "filename_candidates": filename_candidates,
            "cta": cta_text
        }

    def _generate_alt_candidates(self, caption: str, ocr_lines: list, tags: list) -> list:
        candidates = []

        meaningful_lines = [l for l in ocr_lines if len(l) > 2]

        # Option A: Each meaningful text line as separate candidate
        for line in meaningful_lines[:5]:  # Limit to top 5 lines
            if line not in candidates:
                candidates.append(line)

        # Option B: Caption Only
        if caption and caption not in candidates:
            candidates.append(caption)

        # Option C: Combined (Caption + Main Text) - only if we have both
        if caption and meaningful_lines:
            combined = f"{caption}. Text: '{meaningful_lines[0]}'."
            if combined not in candidates:
                candidates.append(combined)

        # Option D: Tags based fallback
        if not candidates and tags:
            candidates.append(f"Image of {', '.join(tags[:3])}")

        return candidates

    def _generate_filename_candidates(self, tags: list, caption: str, ocr_lines: list) -> list:
        candidates = []

        # Helper to clean and validate 1-2 words
        def validate(s):
            slug = self._slugify(s)
            parts = slug.split('-')
            if not slug: return None
            return "-".join(parts[:2]) # Force max 2 words

        # Source 1: Tags (Best source for single words)
        if tags:
            # First tag
            c1 = validate(tags[0])
            if c1 and c1 not in candidates: candidates.append(c1)

            # First + Second tag
            if len(tags) > 1:
                c2 = validate(f"{tags[0]} {tags[1]}")
                if c2 and c2 not in candidates: candidates.append(c2)

        # Source 2: Caption (Subject)
        if caption:
            # "Woman holding bag" -> "woman-holding"
            c3 = validate(caption)
            if c3 and c3 not in candidates: candidates.append(c3)

        # Source 3: OCR (Brand name or headline)
        for line in ocr_lines[:2]: # Check first 2 lines
            # Assume short lines might be brands/titles
            if 3 < len(line) < 20:
                c4 = validate(line)
                if c4 and c4 not in candidates: candidates.append(c4)

        return candidates

    def _extract_cta(self, ocr_lines: list) -> str:
        # Heuristic: Short lines with imperative verbs often indicate buttons
        cta_keywords = ["shop", "buy", "learn", "click", "order", "get", "sign", "register", "book"]

        for line in ocr_lines:
            # Clean and lower
            text = line.strip().lower()
            # Check length (CTAs are usually short: "Shop Now", "Get 50% Off")
            if 3 < len(text) < 25:
                # Check for keywords
                if any(kw in text for kw in cta_keywords):
                    return line.strip() # Return original case
        return ""

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

    def _is_garbage_text(self, text: str) -> bool:
        """
        Detect garbage OCR output like 'RPEEREPe', 'TeEEEeD', 'nu', etc.
        Returns True if the text looks like garbage.
        """
        if not text or len(text) < 2:
            return True

        text_clean = text.strip()

        # Skip if it's a multi-word phrase (they're usually valid)
        if ' ' in text_clean and len(text_clean) > 10:
            return False

        # 1. Too short single "words" that aren't common
        if len(text_clean) <= 2 and text_clean.lower() not in ['ok', 'go', 'we', 'us', 'no', 'so', 'on', 'or', 'an', 'at', 'by', 'to', 'up', 'is', 'it', 'be', 'do', 'if', 'in', 'my', 'he', 'as', 'of', 'am']:
            return True

        # 2. Check for repeated consecutive letters (2+ in a row like EE, PP)
        if re.search(r'(.)\1{1,}', text_clean, re.IGNORECASE):
            # Allow common doubled letters in real words
            allowed_doubles = ['ll', 'ss', 'ee', 'oo', 'tt', 'ff', 'rr', 'nn', 'mm', 'pp', 'cc', 'dd', 'gg', 'bb', 'zz']
            matches = re.findall(r'(.)\1+', text_clean, re.IGNORECASE)
            for match in matches:
                doubled = match.lower() * 2
                # If the doubled letter appears more than once OR it's 3+ in a row, it's garbage
                if text_clean.lower().count(doubled) > 1 or re.search(r'(.)\1{2,}', text_clean, re.IGNORECASE):
                    return True

        # 3. Check for weird case patterns (random mix like "TeEEeD", "RPEEREPe")
        # Count case transitions - too many is suspicious
        transitions = 0
        for i in range(1, len(text_clean)):
            if text_clean[i].isalpha() and text_clean[i-1].isalpha():
                if text_clean[i].isupper() != text_clean[i-1].isupper():
                    transitions += 1

        # More than 2 case transitions in a short word is garbage (lowered from 3)
        if len(text_clean) < 12 and transitions > 2:
            return True

        # 4. Detect nonsense patterns like "RPEEREPe" - mixed case with no clear pattern
        if len(text_clean) > 4:
            # Check if it looks like random letters (has both upper and lower, but not proper case)
            has_upper = any(c.isupper() for c in text_clean)
            has_lower = any(c.islower() for c in text_clean)
            # If it has mixed case but doesn't start with capital (like normal words), suspicious
            if has_upper and has_lower:
                # Normal: "Hello", "HELLO", "hello"
                # Garbage: "heLLo", "RPEEREPe"
                if not (text_clean[0].isupper() and text_clean[1:].islower()):
                    if text_clean != text_clean.upper():  # Not ALL CAPS
                        return True

        # 5. Check vowel ratio - real words have vowels
        vowels = sum(1 for c in text_clean.lower() if c in 'aeiou')
        letters = sum(1 for c in text_clean if c.isalpha())

        if letters > 3:
            vowel_ratio = vowels / letters
            # Too few vowels (< 10%) or too many (> 80%) is suspicious
            if vowel_ratio < 0.1 or vowel_ratio > 0.8:
                return True

        return False

merge_service = MergeService.get_instance()
