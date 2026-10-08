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
async function classifyDisease(imagePath, mimetype, cropType) {
  if (!enabled()) return null;

  try {
    const d = await callMicroservice(imagePath, 'leaf.jpg', cropType);
    if (!d || !d.class_name) return null;

    // Parse class_name: e.g. "Bell_Pepper_Bacterial_Spot" -> crop: "Bell Pepper", disease: "Bacterial Spot"
    const CROPS = ['Bell_Pepper', 'Banana', 'Corn', 'Potato', 'Rice', 'Tea', 'Tomato'];
    const prefix = CROPS.find((p) => d.class_name.startsWith(p + '_'));
    const crop = prefix ? prefix.replace('_', ' ') : d.class_name.split('_')[0];
    const diseaseName = prefix
      ? d.class_name.slice(prefix.length + 1).replace(/_/g, ' ')
      : d.class_name.replace(/_/g, ' ');
    const isHealthy = d.class_name.toLowerCase().includes('healthy');

    return {
      crop,
      disease: isHealthy ? 'Healthy' : diseaseName,
      isHealthy,
      probability: typeof d.confidence === 'number' ? d.confidence : null,
      classIndex: null,
      class_name: d.class_name,
      className: d.class_name,
      raw_class_name: d.raw_class_name,
      raw_confidence: d.raw_confidence,
    };
  } catch (err) {
    console.warn('[diseaseModelClient] Error calling ML microservice:', err.message);
    return null;
  }
}

module.exports = { classifyDisease, enabled };
