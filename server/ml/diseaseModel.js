const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.DISEASE_MODEL_URL || 'http://127.0.0.1:8000';

/**
 * Classify a plant disease image via the FastAPI ML microservice.
 *
 * @param {Buffer|string} imageBuffer - Image file buffer or path to image on disk
 * @param {string} [filename='leaf.jpg'] - Filename for form-data upload
 * @returns {Promise<{class_name: string, confidence: number, top_3: Array<{class_name: string, confidence: number}>}>}
 */
async function classifyDisease(imageBuffer, filename = 'leaf.jpg') {
  let buf = imageBuffer;
  if (typeof imageBuffer === 'string') {
    buf = fs.readFileSync(imageBuffer);
  }

  const form = new FormData();
  form.append('file', buf, filename);

  const response = await axios.post(`${ML_SERVICE_URL}/predict`, form, {
    headers: form.getHeaders(),
    timeout: 15000,
  });
  return response.data; // { class_name, confidence, top_3 }
}

/**
 * Stage 1 inference wrapper for diseaseController.
 * Returns null gracefully if microservice is offline or in test mode.
 */
async function predict(imagePath) {
  if (process.env.NODE_ENV === 'test') return null;
  try {
    const data = await classifyDisease(imagePath);
    if (!data) return null;
    return {
      className: data.class_name,
      confidence: Math.round(data.confidence * 10000) / 100, // 0-100 percentage
      top_3: data.top_3,
    };
  } catch (err) {
    console.warn('[disease-ml] ML microservice not reachable or error:', err.message);
    return null;
  }
}

module.exports = { classifyDisease, predict };
