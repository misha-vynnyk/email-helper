import uvicorn
import os
import sys

if __name__ == "__main__":
    # Disable PaddleOCR's slow connectivity check
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

    # Add the current directory to sys.path so 'app' can be imported
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

    # LIMIT CPU THREADS - CRITICAL for preventing Mac UI Freeze
    # These must be set BEFORE importing numpy/torch/paddle
    os.environ["OMP_NUM_THREADS"] = "1"
    os.environ["MKL_NUM_THREADS"] = "1"
    os.environ["OPENBLAS_NUM_THREADS"] = "1"
    os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
    os.environ["NUMEXPR_NUM_THREADS"] = "1"
    os.environ["PADDLE_NUM_THREADS"] = "1"

    # Run Uvicorn programmatically
    # equivalent to: uvicorn app.main:app --reload --port 8000
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
