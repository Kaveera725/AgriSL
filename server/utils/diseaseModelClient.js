// diseaseModelClient — Node.js client adapter for the custom-trained disease
// classification microservice (Python FastAPI, ml-service/main.py).
//
// Calls the FastAPI /predict endpoint with the uploaded image and returns a normalised
// { crop, disease, isHealthy, probability, top_3 } object, or null so the caller
// (diseaseController.js) can fall back gracefully to crop.health / GPT-4o.

const { classifyDisease: callMicroservice } = require('../ml/diseaseModel');

function enabled() {
  const url = process.env.ML_SERVICE_URL || process.env.DISEASE_MODEL_URL;
  return Boolean(url) && process.env.NODE_ENV !== 'test';
}

/**
 * Send the image to the Python FastAPI /predict endpoint and return normalized result.
 *
 * @param {string} imagePath  — absolute path on disk (from multer)
 * @param {string} [mimetype] — e.g. "image/jpeg"
 * @returns {Promise<{crop:string|null, disease:string, isHealthy:boolean, probability:number|null, top_3:Array}|null>}
 */
async function classifyDisease(imagePath, mimetype) {
  if (!enabled()) return null;

  try {
    const d = await callMicroservice(imagePath, 'leaf.jpg');
    if (!d || !d.class_name) return null;

    // Parse class_name: e.g. "Tomato_Late_Blight" -> crop: "Tomato", disease: "Late Blight"
    const parts = d.class_name.split(/[_]+/);
    const crop = parts[0] || null;
    const diseaseName = parts.slice(1).join(' ') || d.class_name;
    const isHealthy = d.class_name.toLowerCase().includes('healthy');

    return {
      crop,
      disease: isHealthy ? 'Healthy' : diseaseName,
      isHealthy,
      probability: typeof d.confidence === 'number' ? d.confidence : null,
      classIndex: null,
      top_3: d.top_3 || [],
    };
  } catch (err) {
    console.warn('[diseaseModelClient] Error calling ML microservice:', err.message);
    return null;
  }
}

module.exports = { classifyDisease, enabled };
