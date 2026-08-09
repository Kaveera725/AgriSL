// server/ml/diseaseModel.js
//
// Stage 1 server-side disease classifier using a locally-saved TensorFlow.js
// SavedModel (MobileNetV2 base, transfer-learned on a Sri Lankan crop disease
// dataset).
//
// The model is loaded once at server start and cached in memory. If the model
// files are absent (e.g. model not yet trained / not committed), the module
// logs a warning and all predict() calls return null so the rest of the
// pipeline (crop.health → GPT-4o) continues unaffected.
//
// Model files expected at:
//   server/ml/model/model.json       ← TF.js graph model manifest
//   server/ml/model/weights.bin      ← (or shard files alongside model.json)
//
// Training: see DISEASE_DETECTION_ML.md / ml/train.py

const fs = require('fs');
const path = require('path');

// Sri Lankan crop disease classes — must match the label order used during
// training (the index in this array == the argmax class index from the model).
const DISEASE_CLASSES = [
  'Healthy',
  'Rice Blast',
  'Rice Brown Spot',
  'Rice Sheath Blight',
  'Coconut Leaf Blight',
  'Coconut Bud Rot',
  'Tea Blister Blight',
  'Tea Gray Blight',
  'Tomato Early Blight',
  'Tomato Late Blight',
  'Chilli Leaf Curl',
  'Banana Panama Wilt',
];

const MODEL_PATH = path.join(__dirname, 'model', 'model.json');

// Singleton — loaded once, reused for every request.
let _model = null;
// Whether we already attempted (and failed) to load, so we don't spam the log.
let _loadAttempted = false;

/**
 * Load the TF.js model from disk. Safe to call multiple times — returns the
 * cached model after the first successful load. Returns null when model files
 * are absent so callers can fall back gracefully.
 */
async function loadModel() {
  if (_model) return _model;
  if (_loadAttempted) return null;
  _loadAttempted = true;

  if (!fs.existsSync(MODEL_PATH)) {
    console.warn(
      '[disease-ml] model/model.json not found — server-side ML disabled. ' +
        'Train the model (see DISEASE_DETECTION_ML.md) and place the output in server/ml/model/.'
    );
    return null;
  }

  try {
    // Require tfjs-node lazily so the server starts normally even if the
    // native binding compile fails on this machine (it will just return null).
    const tf = require('@tensorflow/tfjs-node');
    _model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
    console.log(
      `[disease-ml] Model loaded — ${DISEASE_CLASSES.length} disease classes`
    );
    return _model;
  } catch (err) {
    console.warn('[disease-ml] Failed to load model:', err.message);
    return null;
  }
}

/**
 * Run a single-image inference.
 *
 * @param {string} imagePath  Absolute path to the uploaded image file.
 * @returns {Promise<{className:string, confidence:number, classIndex:number}|null>}
 *   Returns null when the model is unavailable or inference fails.
 */
async function predict(imagePath) {
  const model = await loadModel();
  if (!model) return null;

  try {
    const tf = require('@tensorflow/tfjs-node');

    // Read raw image bytes and decode to a 3-channel tensor.
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    let imageTensor;
    if (ext === '.png') {
      imageTensor = tf.node.decodePng(imageBuffer, 3);
    } else {
      // Default: treat as JPEG (covers .jpg, .jpeg and unknown extensions).
      imageTensor = tf.node.decodeJpeg(imageBuffer, 3);
    }

    // Resize → [224, 224, 3], normalize to [0, 1], add batch dimension → [1, 224, 224, 3].
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalized = resized.div(255.0);
    const batched = normalized.expandDims(0);

    // Run inference.
    const predictions = model.predict(batched);
    const probabilities = await predictions.data();

    // Clean up tensors.
    tf.dispose([imageTensor, resized, normalized, batched, predictions]);

    // Find the winning class.
    let classIndex = 0;
    let maxProb = probabilities[0];
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        classIndex = i;
      }
    }

    const className = DISEASE_CLASSES[classIndex] || `Class ${classIndex}`;
    // Round to 2 decimal places (matches DECIMAL(5,2) column).
    const confidence = Math.round(maxProb * 10000) / 100;

    return { className, confidence, classIndex };
  } catch (err) {
    console.error('[disease-ml] predict() error:', err.message);
    return null;
  }
}

// Eagerly start loading the model when this module is first required, so the
// first real request doesn't pay the load penalty.
loadModel().catch(() => {});

module.exports = { loadModel, predict, DISEASE_CLASSES };
