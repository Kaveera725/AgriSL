const fs = require('fs');

// diseaseModelClient — Node.js client for the optional custom-trained disease
// classification microservice (Python FastAPI, ml/serve.py).
//
// This is the "Detector C" described in DISEASE_DETECTION_ML.md. It calls the
// FastAPI /predict endpoint with the uploaded image and returns a normalised
// { crop, disease, isHealthy, probability } object, or null so the caller
// (diseaseController.js) can fall back gracefully to crop.health / GPT-4o.
//
// Enable by setting DISEASE_MODEL_URL in server/.env, e.g.:
//   DISEASE_MODEL_URL=http://localhost:8000
//
// When DISEASE_MODEL_URL is not set (default), enabled() returns false and
// classifyDisease() returns null immediately — no HTTP call is made.
// Under NODE_ENV=test the function also returns null so the Jest suite is
// unaffected (no network calls to a service that isn't running in CI).

const BASE_URL = process.env.DISEASE_MODEL_URL;

/**
 * Whether the custom ML microservice is wired up.
 * Returns false when the env var is absent or in test mode.
 */
function enabled() {
  return Boolean(BASE_URL) && process.env.NODE_ENV !== 'test';
}

/**
 * Send the image to the Python FastAPI /predict endpoint and return the result.
 *
 * @param {string} imagePath  — absolute path on disk (from multer)
 * @param {string} mimetype   — e.g. "image/jpeg"
 * @returns {Promise<{crop:string|null, disease:string, isHealthy:boolean, probability:number|null}|null>}
 */
async function classifyDisease(imagePath, mimetype) {
  if (!enabled()) return null;

  try {
    const buffer = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append(
      'image',
      new Blob([buffer], { type: mimetype || 'image/jpeg' }),
      'leaf'
    );

    const res = await fetch(`${BASE_URL}/predict`, { method: 'POST', body: form });
    if (!res.ok) {
      console.warn(`[disease-model] /predict returned HTTP ${res.status}`);
      return null;
    }

    const d = await res.json();
    return {
      crop: d.crop || null,
      disease: d.disease,
      isHealthy: Boolean(d.is_healthy),
      probability: typeof d.confidence === 'number' ? d.confidence : null,
      // class_index is the raw argmax index from the model output (0-based).
      // serve.py returns it as 'raw_label' index; expose it so the controller
      // can persist it to ml_class_index for analysis/reporting.
      classIndex: typeof d.class_index === 'number' ? d.class_index : null,
    };
  } catch (err) {
    console.error('[disease-model] classifyDisease error:', err.message);
    return null;
  }
}

module.exports = { classifyDisease, enabled };
