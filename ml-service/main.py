import json
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io

app = FastAPI()

model = tf.keras.models.load_model("model/disease_model.keras")
with open("model/class_names.json") as f:
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
