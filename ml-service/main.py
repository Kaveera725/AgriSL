import os
# Suppress oneDNN and verbose TF logging warnings
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "disease_model.keras"
CLASS_NAMES_PATH = BASE_DIR / "model" / "class_names.json"

app = FastAPI()

model = tf.keras.models.load_model(str(MODEL_PATH))
with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    CLASS_NAMES = json.load(f)

IMG_SIZE = (224, 224)

def preprocess(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)
    # Note: disease_model.keras already contains true_divide and subtract layers
    # (mobilenet_v2 preprocessing built-in). Passing raw [0, 255] float32 avoids double-normalization.
    return np.expand_dims(arr, axis=0)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    print(f"[predict] received file: {file.filename}, size: {len(image_bytes)} bytes, content_type: {file.content_type}")
    x = preprocess(image_bytes)
    preds = model.predict(x, verbose=0)[0]
    top_idx = int(np.argmax(preds))
    top3_idx = preds.argsort()[-3:][::-1]
    result = {
        "class_name": CLASS_NAMES[top_idx],
        "confidence": float(preds[top_idx]),
        "top_3": [
            {"class_name": CLASS_NAMES[i], "confidence": float(preds[i])}
            for i in top3_idx
        ],
    }
    print(f"[predict] result: {result['class_name']} ({result['confidence']:.4f})")
    return result

@app.get("/health")
async def health():
    return {"status": "ok"}
