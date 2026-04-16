# Local AI Backend

This directory contains the Python FastAPI backend responsible for processing images to generate SEO-friendly filenames, Alt Text, and extract Call-to-Action (CTA) text.

## Architecture

The AI module supports two different approaches (Providers):
1. **Gemma 3 4B (Recommended)**: Uses a local Ollama instance to analyze the image completely in a single multimodal pass. It's faster, uses less memory, and generates context-aware, human-like descriptions.
2. **Ensemble (Legacy)**: Uses a combination of PaddleOCR (for text), BLIP (for captioning), and CLIP (for tagging), and then uses a heuristics engine to merge the signals.

## Setup Requirements

### 1. Python Environment
You must have Python 3.10+ installed.
```bash
cd server/ai
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Ollama & Gemma 3 (Required for Recommended Mode)
To use the primary Gemma 3 integration, you must install Ollama and the model:

#### Installation on Mac (via Terminal):
1. Install [Ollama](https://ollama.com/) (using Homebrew):
   ```bash
   brew install --cask ollama
   ```
2. Start the Ollama application from your Applications folder.
3. Download the multimodal model:
   ```bash
   ollama run gemma3:4b
   ```

#### 📂 Model Storage & Maintenance (Mac):
On macOS, Ollama stores its models in a hidden folder in your user directory:
- **Path:** `/Users/<username>/.ollama/models` (or `~/.ollama/models`)
- **Size:** Gemma 3 4B займає приблизно **3.2 GB** на диску.
- **Як перенести (Storage management):** Якщо на диску мало місця, ви можете змінити шлях завантаження за допомогою змінної середовища:
  `export OLLAMA_MODELS="/Volumes/ExternalSSD/ollama_models"`
- **Як видалити:** Ви можете видалити модель через термінал: `ollama rm gemma3:4b` або просто очистити папку `~/.ollama/models`.


## Running the Server

You can run the AI server alongside the main Node.js backend using the root NPM scripts:

```bash
# From the project root
npm run dev:ai
```
This will start the FastAPI server on `http://localhost:8000`.

## API Endpoints

- `GET /health` - Returns the status of the AI server (used by the frontend to show the green indicator).
- `POST /api/analyze` - Analyzes an image.
  - Form Data: `file` (Image Blob), `mode` ("gemma3" or "detailed"/"fast").
  - Returns a JSON object containing `filename`, `alt_text`, `cta`, and raw candidates.

## Troubleshooting

- **Server starts but frontend says "offline"**: Ensure the server is actually running on port 8000 and not blocked by CORS or another application using the port.
- **Gemma 3 Analysis Failed**: This means the Python server cannot reach Ollama. Check if Ollama is running (`http://localhost:11434`) and that you have pulled `gemma3:4b`.
- **PaddleOCR installation fails on Mac**: The legacy ensemble mode requires `paddlepaddle` and `paddleocr`, which can sometimes fail to compile on Apple Silicon. It is highly recommended to use the Gemma 3 provider instead.
