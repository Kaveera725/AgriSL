# Applying Machine Learning to Crop Disease Detection — Project Report

**Project:** AgriSL — Smart Agriculture Advisory Platform for Sri Lanka
**Module:** Crop Disease Detection (`/api/disease`)
**Author:** _<your name>_
**Date:** _<submission date>_

---

## 1. Introduction

AgriSL lets a farmer upload a photo of a crop leaf and receive a disease
diagnosis with treatment advice in English and Sinhala. This report documents the
**machine-learning (AI/ML) component** behind that feature: how it works today,
and a complete step-by-step plan for **training and integrating our own deep
learning model** so the diagnosis no longer depends solely on third-party APIs.

The goal of the ML part is a function:

```
input:  a crop-leaf image (JPEG/PNG)
output: { disease_name, confidence, symptoms, treatment }
```

This is an **image classification** problem: given a leaf photo, predict which of
N disease classes it belongs to (e.g. `Tomato___Late_blight`,
`Potato___healthy`, …).

---

## 2. Two ways to deliver the ML feature

| Approach | What it is | Pros | Cons |
|---|---|---|---|
| **A. API-based (current)** | Call a hosted ML model (Kindwise crop.health) over HTTP | No training, no GPU, production-grade accuracy, treatment text included | Needs internet + API key, free-tier limits, not "our" model |
| **B. Custom CNN (this report's focus)** | Train our own Convolutional Neural Network on a labelled disease dataset | Fully owned, works offline, demonstrable ML skill for the academic report | Needs a dataset, training time, lower accuracy than commercial models |

> **Recommended for the academic report:** build **Approach B** to demonstrate the
> ML pipeline (data → train → evaluate → deploy), and keep **Approach A** as the
> production fallback. The existing code already supports a "primary detector +
> fallback" pattern, so our trained model slots in as a new primary detector.

The rest of this report is the **step-by-step plan for Approach B** plus how to
wire it into the existing AgriSL backend.

---

## 3. How disease detection works in AgriSL today (baseline)

Understanding the current pipeline tells us exactly where our model plugs in.

```
                ┌─────────────────────────────────────────────┐
 farmer photo → │  POST /api/disease  (diseaseController.js)   │
                └─────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼─────────────────────────┐
          ▼                        ▼                          ▼
   PlantNet (species)     crop.health (PRIMARY)        AI vision (FALLBACK)
   identifyPlant()        assessHealth()               detectWithAI()  Gemini
   → "what plant"         → "what disease" + Rx        → "what disease" + Rx
          │                        │                          │
          └──────────────► normalise to bilingual JSON ◄──────┘
                                   │
                     save to disease_reports table → return to client
```

- **PlantNet** (`server/utils/plantNetClient.js`) — identifies the plant
  *species* only (ML, but not disease).
- **Kindwise crop.health** (`server/utils/cropHealthClient.js`) — the current
  primary disease ML model (hosted API).
- **Gemini vision** (`server/utils/openaiClient.js`) — fallback diagnosis.

**Where our model fits:** we add a *Detector C* — a local trained CNN — and make
it the primary, with crop.health/Gemini as fallback. The controller already does
`if (primary) result = ...; if (!result) result = fallback;`, so the change is
small and low-risk.

---

## 4. The ML pipeline — step by step

### Step 1 — Define the problem and classes

- **Task:** multi-class image classification.
- **Classes:** start with the crops relevant to Sri Lanka (rice, tomato, chilli,
  potato, maize) and their common diseases + a `healthy` class per crop.
- **Output contract:** must produce the same fields the app already stores —
  `disease_name`, `confidence`, `symptoms`, `treatment` (EN + SI). The model
  predicts the *class*; symptoms/treatment come from a lookup table we maintain
  (one row per class), then Sinhala is filled by the existing translator.

### Step 2 — Get a dataset

The standard, free benchmark for this task:

| Dataset | Size | Notes |
|---|---|---|
| **PlantVillage** | ~54,000 images, 38 classes (14 crops) | Most-used academic dataset; clean lab images |
| **PlantDoc** | ~2,600 images | Real-world field photos (harder, more realistic) |
| **Rice Leaf Diseases** (UCI/Kaggle) | small | Useful for Sri Lankan paddy focus |

- Download from Kaggle (e.g. *"PlantVillage Dataset"*).
- **Recommendation:** train on PlantVillage for accuracy, then validate on a few
  PlantDoc/field images to show real-world behaviour in the report.
- Organise as one folder per class:

```
dataset/
  train/
    Tomato___Late_blight/        img001.jpg ...
    Tomato___healthy/            ...
    Potato___Early_blight/       ...
  val/
    Tomato___Late_blight/        ...
  test/
    ...
```

### Step 3 — Preprocess the data

- **Resize** every image to the model input size (e.g. 224×224 for MobileNetV2).
- **Normalise** pixel values (model-specific `preprocess_input`).
- **Split** ~70% train / 15% validation / 15% test (keep test untouched until the end).
- **Data augmentation** on the training set only — random flips, rotation, zoom,
  brightness — to reduce overfitting and simulate real photos.
- **Handle class imbalance** with class weights or by oversampling rare classes.

### Step 4 — Choose a model (transfer learning)

Training a CNN from scratch needs huge data and compute. Instead use **transfer
learning**: take a network pre-trained on ImageNet and fine-tune it on our leaves.

| Backbone | Why |
|---|---|
| **MobileNetV2 / MobileNetV3** | Small & fast — best for deploying inside a Node server or even the browser. **Recommended.** |
| **EfficientNet-B0** | Higher accuracy, slightly heavier |
| **ResNet50** | Classic baseline, well documented |

Architecture: `pretrained backbone (frozen) → GlobalAveragePooling → Dropout →
Dense(num_classes, softmax)`.

### Step 5 — Train the model (Python / TensorFlow-Keras)

Train in **Google Colab** (free GPU) so no local GPU is needed. Minimal example:

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

IMG_SIZE = (224, 224)
BATCH = 32

train_ds = tf.keras.utils.image_dataset_from_directory(
    "dataset/train", image_size=IMG_SIZE, batch_size=BATCH)
val_ds = tf.keras.utils.image_dataset_from_directory(
    "dataset/val", image_size=IMG_SIZE, batch_size=BATCH)
class_names = train_ds.class_names               # save this list!

augment = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
])

base = MobileNetV2(input_shape=IMG_SIZE + (3,),
                   include_top=False, weights="imagenet")
base.trainable = False                            # phase 1: freeze backbone

inputs = layers.Input(shape=IMG_SIZE + (3,))
x = augment(inputs)
x = preprocess_input(x)
x = base(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(len(class_names), activation="softmax")(x)
model = models.Model(inputs, outputs)

model.compile(optimizer="adam",
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])

model.fit(train_ds, validation_data=val_ds, epochs=10)

# Phase 2 (optional): unfreeze top layers and fine-tune at a low LR
base.trainable = True
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
              loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(train_ds, validation_data=val_ds, epochs=5)

model.save("crop_disease_model.keras")
import json; json.dump(class_names, open("class_names.json", "w"))
```

### Step 6 — Evaluate the model

Report these in the academic write-up — graders expect them:

- **Accuracy** on the held-out **test** set (not validation).
- **Confusion matrix** — which diseases get confused with which.
- **Precision / recall / F1 per class** (`sklearn.metrics.classification_report`).
- **Training curves** — accuracy & loss vs. epochs (to show no severe overfitting).
- A few **sample predictions** with the image + predicted vs. true label.

```python
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

y_true, y_pred = [], []
for imgs, labels in test_ds:
    preds = model.predict(imgs)
    y_pred += list(np.argmax(preds, axis=1)); y_true += list(labels.numpy())
print(classification_report(y_true, y_pred, target_names=class_names))
print(confusion_matrix(y_true, y_pred))
```

### Step 7 — Export for deployment

Pick how the Node backend will run the model:

| Option | How | Best when |
|---|---|---|
| **A. Python microservice** | Wrap the `.keras`/SavedModel in a small **Flask/FastAPI** app; Node calls it over HTTP | Easiest, keeps Python ML stack intact. **Recommended.** |
| **B. TensorFlow.js** | `tensorflowjs_converter` → load with `@tensorflow/tfjs-node` directly in Express | Pure-Node deploy, no second service |
| **C. ONNX Runtime** | Export to ONNX, run with `onnxruntime-node` | Cross-framework, fast inference |

---

## 5. Integrating the model into AgriSL

### Option A (recommended): Python inference microservice

**5.1 — Create the inference service** (`ml-service/app.py`):

```python
from fastapi import FastAPI, UploadFile
import tensorflow as tf, numpy as np, json, io
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

app = FastAPI()
model = tf.keras.models.load_model("crop_disease_model.keras")
class_names = json.load(open("class_names.json"))

@app.post("/predict")
async def predict(file: UploadFile):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB").resize((224, 224))
    x = preprocess_input(np.expand_dims(np.array(img), 0))
    probs = model.predict(x)[0]
    i = int(np.argmax(probs))
    return {"disease": class_names[i], "confidence": float(probs[i])}
```

Run it: `uvicorn app:app --port 8000`.

**5.2 — Add a client in the Node backend** (`server/utils/localModelClient.js`),
mirroring the style of `cropHealthClient.js` — same shape, returns `null` so the
existing fallback chain keeps working:

```javascript
const fs = require('fs');

// Local trained CNN detector. Calls our Python inference microservice.
// Returns { isHealthy, name, probability, symptoms, treatment } or null.
function enabled() {
  return Boolean(process.env.LOCAL_MODEL_URL) && process.env.NODE_ENV !== 'test';
}

// Per-class symptom & treatment text we maintain (one entry per model class).
const KNOWLEDGE = require('./diseaseKnowledge.json');

async function assessHealth(imagePath, mimetype) {
  if (!enabled()) return null;
  try {
    const form = new FormData();
    const buf = fs.readFileSync(imagePath);
    form.append('file', new Blob([buf], { type: mimetype || 'image/jpeg' }), 'leaf');
    const res = await fetch(`${process.env.LOCAL_MODEL_URL}/predict`, {
      method: 'POST', body: form,
    });
    if (!res.ok) return null;
    const { disease, confidence } = await res.json();

    const isHealthy = /healthy/i.test(disease);
    const info = KNOWLEDGE[disease] || {};
    return {
      isHealthy,
      name: disease.replace(/_/g, ' '),
      probability: confidence,
      symptoms: info.symptoms || '',
      treatment: info.treatment || 'Consult a local agricultural officer.',
    };
  } catch (err) {
    console.error('[local-model] error:', err.message);
    return null;
  }
}

module.exports = { assessHealth, enabled };
```

**5.3 — Wire it as the new PRIMARY detector** in
`server/controllers/diseaseController.js`. The existing block:

```javascript
let result = null;
if (cropHealthEnabled()) {
  const health = await assessHealth(req.file.path, req.file.mimetype);
  if (health) result = await buildResultFromCropHealth(health);
}
if (!result) {
  result = await detectWithAI(req, plant, crop_type, district);
}
```

becomes (local model first, crop.health second, Gemini last):

```javascript
const localModel = require('../utils/localModelClient');

let result = null;
if (localModel.enabled()) {
  const health = await localModel.assessHealth(req.file.path, req.file.mimetype);
  if (health) result = await buildResultFromCropHealth(health);   // reuse existing normaliser
}
if (!result && cropHealthEnabled()) {
  const health = await assessHealth(req.file.path, req.file.mimetype);
  if (health) result = await buildResultFromCropHealth(health);
}
if (!result) {
  result = await detectWithAI(req, plant, crop_type, district);
}
```

Because `buildResultFromCropHealth()` already converts the `{ isHealthy, name,
probability, symptoms, treatment }` shape into the bilingual record (and runs the
Sinhala translation), **no other code changes are needed** — DB insert,
notifications, and the client response stay the same.

**5.4 — Config.** Add to `server/.env`:

```
LOCAL_MODEL_URL=http://localhost:8000
```

Document it in `CLAUDE.md` next to the other detectors.

### Option B: in-process TensorFlow.js (no second service)

```bash
cd server && npm install @tensorflow/tfjs-node
```

Convert the model (`tensorflowjs_converter --input_format keras
crop_disease_model.keras server/model/`), then `tf.loadLayersModel()` once at
startup and run inference inside `localModelClient.js` directly — no Python.
Trade-off: heavier `node_modules`, but a single deployable.

---

## 6. The disease knowledge table

The model only predicts a *label*. Symptoms and treatment come from a small
curated file, `server/utils/diseaseKnowledge.json`, keyed by class name:

```json
{
  "Tomato___Late_blight": {
    "symptoms": "Dark, water-soaked lesions on leaves and stems; white mould on undersides in humid weather.",
    "treatment": "Remove infected plants. Apply copper-based or chlorothalonil fungicide. Avoid overhead watering; improve airflow."
  },
  "Potato___Early_blight": {
    "symptoms": "Brown concentric-ring spots on older leaves; yellowing around lesions.",
    "treatment": "Rotate crops, remove debris, apply mancozeb fungicide at first signs."
  }
}
```

Sinhala versions are produced automatically by the existing
`translateToSinhala()` in `diseaseController.js`, so we only maintain English.

---

## 7. Testing & validation

- **Unit test** the new detector with the model disabled → it must return `null`
  and fall through to the existing fallback (mirror `server/tests/disease.test.js`,
  which already runs with detectors off under `NODE_ENV=test`).
- **Manual test**: upload known-diseased and healthy leaf photos, confirm the
  diagnosis, confidence, and Sinhala text render in the UI.
- **Metrics for the report**: include the test-set accuracy, confusion matrix,
  and per-class F1 from Step 6, plus screenshots of real predictions in the app.

---

## 8. Suggested timeline

| Week | Task |
|---|---|
| 1 | Collect/clean dataset, define classes, preprocessing pipeline |
| 2 | Train MobileNetV2 (transfer learning) in Colab, tune until val-acc plateaus |
| 3 | Evaluate (accuracy, confusion matrix, F1), export model |
| 4 | Build Python inference service + `localModelClient.js`, wire into controller |
| 5 | Build `diseaseKnowledge.json`, end-to-end testing, write up results |

---

## 9. Summary

- The ML task is **leaf-image classification** → disease label → treatment.
- Use **transfer learning (MobileNetV2)** on **PlantVillage** for a strong,
  lightweight model without a GPU farm.
- Deploy it as a **Python inference microservice** and add a **`localModelClient.js`**
  that returns the same shape `buildResultFromCropHealth()` already consumes, so it
  drops into AgriSL's existing **primary→fallback** detector chain with minimal
  code change.
- Keep **crop.health + Gemini as fallbacks** for robustness.
- Report **accuracy, confusion matrix, and per-class F1** to satisfy the academic
  ML requirement.

---

### References

- PlantVillage dataset — Hughes & Salathé, 2015 (Kaggle mirror).
- TensorFlow Transfer Learning guide — https://www.tensorflow.org/tutorials/images/transfer_learning
- Sandler et al., *MobileNetV2*, 2018.
- Kindwise crop.health API docs — https://crop.kindwise.com/docs
- PlantNet API — https://my.plantnet.org/account/doc
