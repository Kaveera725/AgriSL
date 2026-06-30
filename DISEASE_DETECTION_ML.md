# Adding a Custom AI/ML Disease Classifier to AgriSL

This guide walks through building **your own** crop-disease classification model
(a CNN trained on a labelled disease dataset) and wiring it into the existing
AgriSL disease-detection pipeline so that, when a farmer uploads a photo, the app
returns the **disease type for each crop** from your model.

> **Where this fits.** Today `/api/disease` (see `server/controllers/diseaseController.js`)
> diagnoses with **Kindwise crop.health** (primary) and falls back to the **AI
> vision model** (Gemini/OpenAI). PlantNet only identifies the *species*. This
> guide adds a **third detector — your own trained model — served by a small
> Python microservice** that the Node server calls. It slots in exactly like
> `cropHealthClient.js`, so the rest of the app (DB insert, bilingual fields,
> client UI) is unchanged.

---

## Architecture at a glance

```
                  ┌─────────────────────────────────────────────┐
  Farmer uploads  │  Node/Express server  (existing)            │
  crop photo  ──► │  POST /api/disease → diseaseController.detect│
                  │                                             │
                  │   1. PlantNet  → species (existing)         │
                  │   2. YOUR MODEL → disease type  ◄── NEW     │
                  │   3. crop.health / Gemini (fallback)        │
                  └───────────────┬─────────────────────────────┘
                                  │  HTTP (multipart image)
                                  ▼
                  ┌─────────────────────────────────────────────┐
                  │  Python ML microservice (FastAPI)  ◄── NEW  │
                  │  loads model.keras → returns                │
                  │  { crop, disease, confidence }              │
                  └─────────────────────────────────────────────┘
```

**Why a separate Python service** instead of running the model inside Node:
deep-learning models (TensorFlow/Keras, PyTorch) run in Python. Keeping the model
in its own service means (a) the Node app stays unchanged in spirit — it just
makes one more HTTP call, exactly like it already does for crop.health, and (b)
you can train/retrain and deploy the model independently.

---

## Part 1 — Choose and download a dataset

You need labelled images: `image → (crop, disease)`.

| Dataset | Coverage | Link |
|---|---|---|
| **PlantVillage** (recommended start) | 38 classes, 14 crops, ~54k images | Kaggle: `abdallahalidev/plantvillage-dataset` |
| PlantDoc | Real-field (noisier) photos | github.com/pratikkayal/PlantDoc-Dataset |
| Rice/Paddy disease sets | Sri-Lanka-relevant crops | Kaggle (search "rice leaf disease") |

> **Academic tip for AgriSL:** PlantVillage is clean and gets a working model fast,
> but its images are lab photos on plain backgrounds. For a Sri-Lankan field app,
> add some PlantDoc / local field photos so the model generalises to real uploads.

Download (example,` PlantVillage` from Kaggle):

```bash
# Folder layout we want:  data/<ClassName>/<image>.jpg
# e.g. data/Tomato___Late_blight/0a1b....jpg
pip install kaggle
kaggle datasets download -d abdallahalidev/plantvillage-dataset
unzip plantvillage-dataset.zip -d data_raw
```

Class folder names encode **crop___disease** (e.g. `Tomato___Late_blight`,
`Potato___healthy`). We rely on that convention later to split crop vs. disease.

---

## Part 2 — Set up the Python training environment

Create a new top-level folder `ml/` (kept separate from `server/` and `client/`).

```bash
mkdir ml && cd ml
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# (Git Bash / macOS / Linux:  source .venv/bin/activate)

pip install tensorflow==2.16.*  pillow  numpy  scikit-learn  matplotlib  fastapi  "uvicorn[standard]"  python-multipart
pip freeze > requirements.txt
```

> No GPU? Training still works on CPU with the transfer-learning approach below
> (MobileNetV2 is light). Expect ~10–20 min/epoch on CPU for PlantVillage; a
> Colab/Kaggle GPU notebook is much faster and free.

---

## Part 3 — Train the model (transfer learning)

We fine-tune **MobileNetV2** (small, fast, accurate) pre-trained on ImageNet.
Save as `ml/train.py`:

```python
import json, pathlib, tensorflow as tf
from tensorflow.keras import layers, models

DATA_DIR = pathlib.Path("data_raw/plantvillage dataset/color")  # adjust to your unzip path
IMG_SIZE = (224, 224)
BATCH = 32
EPOCHS = 8

# 1. Load images, auto-label by folder name, split 80/20.
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="training", seed=42,
    image_size=IMG_SIZE, batch_size=BATCH)
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="validation", seed=42,
    image_size=IMG_SIZE, batch_size=BATCH)

class_names = train_ds.class_names           # ['Tomato___Late_blight', ...]
num_classes = len(class_names)
print(f"{num_classes} classes")

# Save the label list — the inference service needs it to name predictions.
pathlib.Path("model").mkdir(exist_ok=True)
with open("model/labels.json", "w") as f:
    json.dump(class_names, f, indent=2)

# 2. Performance: cache + prefetch.
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().shuffle(1000).prefetch(AUTOTUNE)
val_ds = val_ds.cache().prefetch(AUTOTUNE)

# 3. Data augmentation (helps generalise to real field photos).
augment = models.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
])

# 4. Base model — frozen ImageNet weights.
base = tf.keras.applications.MobileNetV2(
    input_shape=IMG_SIZE + (3,), include_top=False, weights="imagenet")
base.trainable = False

inputs = layers.Input(shape=IMG_SIZE + (3,))
x = augment(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)   # scales to [-1,1]
x = base(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(num_classes, activation="softmax")(x)
model = models.Model(inputs, outputs)

model.compile(optimizer="adam",
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])

# 5. Train the new classifier head.
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS)

# 6. (Optional) fine-tune: unfreeze top layers for a few low-LR epochs.
base.trainable = True
for l in base.layers[:-30]:
    l.trainable = False
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
              loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(train_ds, validation_data=val_ds, epochs=4)

# 7. Save the model.
model.save("model/disease_model.keras")
print("Saved model/disease_model.keras and model/labels.json")
```

Run it:

```bash
python train.py
```

You now have `ml/model/disease_model.keras` and `ml/model/labels.json`.

---

## Part 4 — Evaluate (needed for your report)

Save as `ml/evaluate.py` to produce accuracy + a confusion matrix / report:

```python
import json, numpy as np, tensorflow as tf
from sklearn.metrics import classification_report

IMG_SIZE = (224, 224)
DATA_DIR = "data_raw/plantvillage dataset/color"
model = tf.keras.models.load_model("model/disease_model.keras")
class_names = json.load(open("model/labels.json"))

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="validation", seed=42,
    image_size=IMG_SIZE, batch_size=32, shuffle=False)

y_true = np.concatenate([y for _, y in val_ds])
y_pred = model.predict(val_ds).argmax(axis=1)
print(classification_report(y_true, y_pred, target_names=class_names))
```

Record overall accuracy + per-class precision/recall — these go straight into your
academic report. Aim for >90% on PlantVillage with the recipe above.

---

## Part 5 — Build the inference microservice (FastAPI)

This is what the Node server will call. Save as `ml/serve.py`:

```python
import io, json
import numpy as np, tensorflow as tf
from fastapi import FastAPI, UploadFile, File
from PIL import Image

IMG_SIZE = (224, 224)
model = tf.keras.models.load_model("model/disease_model.keras")
class_names = json.load(open("model/labels.json"))

app = FastAPI(title="AgriSL Disease Model")

def split_label(label: str):
    # "Tomato___Late_blight" -> ("Tomato", "Late blight")
    crop, _, disease = label.partition("___")
    return crop.replace("_", " "), disease.replace("_", " ")

@app.get("/health")
def health():
    return {"status": "ok", "classes": len(class_names)}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    raw = await image.read()
    img = Image.open(io.BytesIO(raw)).convert("RGB").resize(IMG_SIZE)
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(
        np.expand_dims(np.array(img, dtype="float32"), 0))
    probs = model.predict(arr, verbose=0)[0]
    idx = int(probs.argmax())
    crop, disease = split_label(class_names[idx])
    is_healthy = disease.lower() == "healthy"
    return {
        "crop": crop,
        "disease": "No disease detected" if is_healthy else disease,
        "is_healthy": is_healthy,
        "confidence": float(probs[idx]),          # 0..1
        "raw_label": class_names[idx],
    }
```

Run the service:

```bash
uvicorn serve:app --host 0.0.0.0 --port 8000
# Test:
#   curl -F "image=@some_leaf.jpg" http://localhost:8000/predict
```

Add to AgriSL `.env` (server) a switch + URL:

```
DISEASE_MODEL_URL=http://localhost:8000
```

---

## Part 6 — Add a Node client for your model

Create `server/utils/diseaseModelClient.js` — mirrors `cropHealthClient.js`:

```javascript
const fs = require('fs');

// Custom-trained disease classifier served by the Python FastAPI service (ml/serve.py).
// Returns { crop, disease, isHealthy, probability } or null so the caller can fall back.
const BASE_URL = process.env.DISEASE_MODEL_URL;

function enabled() {
  return Boolean(BASE_URL) && process.env.NODE_ENV !== 'test';
}

async function classifyDisease(imagePath, mimetype) {
  if (!enabled()) return null;
  try {
    const buffer = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append('image', new Blob([buffer], { type: mimetype || 'image/jpeg' }), 'leaf');

    const res = await fetch(`${BASE_URL}/predict`, { method: 'POST', body: form });
    if (!res.ok) {
      console.warn(`[disease-model] predict returned HTTP ${res.status}`);
      return null;
    }
    const d = await res.json();
    return {
      crop: d.crop || null,
      disease: d.disease,
      isHealthy: Boolean(d.is_healthy),
      probability: typeof d.confidence === 'number' ? d.confidence : null,
    };
  } catch (err) {
    console.error('[disease-model] classify error:', err.message);
    return null;
  }
}

module.exports = { classifyDisease, enabled };
```

---

## Part 7 — Wire it into the detect pipeline

In `server/controllers/diseaseController.js`:

**1. Import it** near the other detector imports (top of file):

```javascript
const { classifyDisease, enabled: diseaseModelEnabled } = require('../utils/diseaseModelClient');
```

**2. Add a builder** that turns the model output into the bilingual shape the rest
of the pipeline expects. Your model predicts a *disease name*, not treatment text,
so reuse the existing Sinhala translator and generate guidance. Place beside
`buildResultFromCropHealth`:

```javascript
// Detector C: your custom-trained model. It returns a disease label only, so we
// add generic guidance + Sinhala translation to match the bilingual UI shape.
async function buildResultFromModel(pred) {
  const disease_name_en = pred.isHealthy ? 'No disease detected' : pred.disease;
  const symptoms_en = pred.isHealthy
    ? 'No visible signs of disease were detected.'
    : `The trained model identified "${pred.disease}"${pred.crop ? ` on ${pred.crop}` : ''}.`;
  const treatment_en = pred.isHealthy
    ? 'No treatment needed. Continue good agricultural practices.'
    : 'Consult a local agricultural officer to confirm and obtain a treatment plan.';

  let disease_name_si = pred.isHealthy ? 'රෝගයක් හඳුනාගත නොහැකි විය' : disease_name_en;
  let symptoms_si = symptoms_en;
  let treatment_si = treatment_en;
  try {
    const si = await translateToSinhala({ disease_name_en, symptoms_en, treatment_en });
    disease_name_si = si.disease_name_si || disease_name_si;
    symptoms_si = si.symptoms_si || symptoms_si;
    treatment_si = si.treatment_si || treatment_si;
  } catch (err) {
    console.warn('[disease-model] Sinhala translation failed, using English fallback:', err.message);
  }

  return {
    disease_name_en, disease_name_si,
    confidence: toConfidence(pred.probability),
    symptoms_en, symptoms_si,
    treatment_en, treatment_si,
  };
}
```

**3. Call it first** inside `detect()`, before the crop.health block:

```javascript
    let result = null;

    // Detector C: your own trained model (preferred when configured).
    if (diseaseModelEnabled()) {
      const pred = await classifyDisease(req.file.path, req.file.mimetype);
      if (pred) result = await buildResultFromModel(pred);
    }

    // Detector A: crop.health (existing fallback).
    if (!result && cropHealthEnabled()) {
      const health = await assessHealth(req.file.path, req.file.mimetype);
      if (health) result = await buildResultFromCropHealth(health);
    }

    // Detector B: AI vision model (existing final fallback).
    if (!result) {
      result = await detectWithAI(req, plant, crop_type, district);
    }
```

That's the only change to the controller — the DB insert, notification, and
client response below it are untouched. Your model becomes the primary detector,
with crop.health and Gemini as graceful fallbacks if the Python service is down.

---

## Part 8 — Map raw labels to clean crop/disease names (optional polish)

PlantVillage labels like `Tomato___Tomato_Yellow_Leaf_Curl_Virus` are ugly. Add a
lookup in `ml/serve.py` (or a JSON file) to return friendly English **and** prewritten
Sinhala/treatment text, so you don't depend on the live translator for every
prediction:

```python
# ml/label_map.json  (excerpt)
{
  "Tomato___Late_blight": {
    "crop": "Tomato",
    "disease_en": "Late blight",
    "disease_si": "පසු අගුණ රෝගය",
    "treatment_en": "Remove infected leaves; apply chlorothalonil or mancozeb..."
  }
}
```

Load it in `serve.py` and prefer its entries over the split-on-`___` fallback.
This makes results faster and consistent, and gives you full control over the
Sinhala wording for your report/demo.

---

## Part 9 — Run everything together

```bash
# Terminal 1 — ML service
cd ml && .\.venv\Scripts\Activate.ps1 && uvicorn serve:app --port 8000

# Terminal 2 — Node server (with DISEASE_MODEL_URL set in server/.env)
cd server && npm run dev

# Terminal 3 — Client
cd client && npm run dev
```

Upload a diseased-leaf photo on the Disease Detection page → the result now comes
from **your model**. Check the server log: no crop.health/Gemini call is made when
the model returns a prediction.

---

## Part 10 — Testing

- **Model service:** `curl -F "image=@test_leaf.jpg" http://localhost:8000/predict`
  and confirm sensible `crop`/`disease`/`confidence`.
- **Server tests:** the existing Jest suite skips network calls under
  `NODE_ENV=test` (see `enabled()` guards), so `classifyDisease` returns `null` in
  tests and the suite is unaffected. Run `cd server && npm test` to confirm green.
- **Add a unit test** for `buildResultFromModel` with a stub prediction object to
  cover the new branch.

---

## Part 11 — Deployment notes

- **Model size:** `disease_model.keras` (MobileNetV2) is ~10–15 MB — commit it with
  Git LFS, or download it on deploy. Do **not** commit `data_raw/`.
- **Hosting the Python service:** any container host (Render, Railway, Fly.io,
  a small VM). Set `DISEASE_MODEL_URL` on the Node host to its public URL.
- **Cold start:** load the model once at module import (as in `serve.py`), not per
  request.
- **CPU is fine** for inference — MobileNetV2 predicts in well under a second.
- **`.gitignore` additions:** `ml/.venv/`, `ml/data_raw/`, `ml/__pycache__/`.

---

## Summary checklist

- [ ] Download & organise dataset into `data/<Crop___Disease>/`
- [ ] `ml/` venv + dependencies installed
- [ ] `train.py` → `model/disease_model.keras` + `labels.json`
- [ ] `evaluate.py` → record accuracy + classification report (for the report)
- [ ] `serve.py` FastAPI service running on `:8000`
- [ ] `server/utils/diseaseModelClient.js` added
- [ ] `diseaseController.js` imports + `buildResultFromModel` + detector-C branch
- [ ] `DISEASE_MODEL_URL` in `server/.env`
- [ ] End-to-end upload returns your model's prediction
- [ ] `npm test` still green; new branch covered
- [ ] Deployment: model committed (LFS), Python service hosted, env var set
