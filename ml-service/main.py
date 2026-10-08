import os
# Suppress oneDNN and verbose TF logging warnings
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import json
from pathlib import Path
from typing import Optional
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, Form
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

CROP_PREFIX = {
    "bell pepper": "Bell_Pepper_", "pepper": "Bell_Pepper_",
    "chilli": "Bell_Pepper_", "chili": "Bell_Pepper_", "capsicum": "Bell_Pepper_",
    "tomato": "Tomato_", "potato": "Potato_",
    "banana": "Banana_", "corn": "Corn_", "maize": "Corn_",
    "tea": "Tea_", "rice": "Rice_",
}

def crop_mask(crop: Optional[str]):
    if not crop:
        return None
    c = crop.lower()
    for key, prefix in CROP_PREFIX.items():
        if key in c:
            mask = np.array([n.startswith(prefix) for n in CLASS_NAMES], dtype=np.float32)
            return mask if mask.sum() > 0 else None
    return None

def preprocess(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)
    # Note: disease_model.keras already contains true_divide and subtract layers
    # (mobilenet_v2 preprocessing built-in). Passing raw [0, 255] float32 avoids double-normalization.
    return np.expand_dims(arr, axis=0)

@app.post("/predict")
async def predict(file: UploadFile = File(...), crop: Optional[str] = Form(None)):
    image_bytes = await file.read()
    x = preprocess(image_bytes)
    raw = model.predict(x, verbose=0)[0]

    preds = raw.copy()
    mask = crop_mask(crop)
    if mask is not None:
        preds = preds * mask
        total = preds.sum()
        if total > 0:
            preds = preds / total

    top_idx = int(np.argmax(preds))
    top3_idx = preds.argsort()[-3:][::-1]
    raw_idx = int(np.argmax(raw))
    result = {
        "class_name": CLASS_NAMES[top_idx],
        "confidence": float(preds[top_idx]),
        "top_3": [{"class_name": CLASS_NAMES[i], "confidence": float(preds[i])} for i in top3_idx],
        "raw_class_name": CLASS_NAMES[raw_idx],
        "raw_confidence": float(raw[raw_idx]),
    }
    print(f"[predict] crop={crop} -> {result['class_name']} ({result['confidence']:.3f}), raw={result['raw_class_name']} ({result['raw_confidence']:.3f})")
    return result

@app.get("/health")
async def health():
    return {"status": "ok"}
