import uvicorn
import os
import sys

if __name__ == "__main__":
    # Disable PaddleOCR's slow connectivity check
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

    # Add the current directory to sys.path so 'app' can be imported
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

    # Run Uvicorn programmatically
    # equivalent to: uvicorn app.main:app --reload --port 8000
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
