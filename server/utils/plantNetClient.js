const fs = require('fs');

// PlantNet plant-species identification client.
//
// PlantNet tells you WHICH plant is in a photo (species + a match score); it does
// NOT diagnose diseases. We use it to *ground* the AI disease diagnosis: the
// identified species is fed into the vision model so its analysis targets the
// right plant, and the match score is surfaced to the user as an identification
// confidence.
//
// API: POST https://my-api.plantnet.org/v2/identify/all?api-key=KEY
//   multipart form: images=<file>, organs=auto
// Docs: https://my.plantnet.org/account/doc
//
// Node 22+ provides global fetch / FormData / Blob, so no extra dependency.

const API_KEY = process.env.PLANTNET_API_KEY;
const BASE_URL = 'https://my-api.plantnet.org/v2/identify/all';

// Whether PlantNet is wired up. Disabled when no key is set, and always skipped
// under tests so the suite never makes a live network call.
function enabled() {
  return Boolean(API_KEY) && process.env.NODE_ENV !== 'test';
}

// Identify the plant in an image file. Returns null when identification is
// unavailable — no key, tests, no plant matched (PlantNet 404), or any network/
// API error — so the caller can gracefully fall back to AI-only analysis.
async function identifyPlant(imagePath, mimetype) {
  if (!enabled()) return null;

  try {
    const buffer = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append('organs', 'auto');
    form.append('images', new Blob([buffer], { type: mimetype || 'image/jpeg' }), 'plant');

    const res = await fetch(`${BASE_URL}?api-key=${API_KEY}`, {
      method: 'POST',
      body: form,
    });

    // 404 "Species not found" is a normal outcome for unclear photos, not an
    // error — treat any non-2xx as "could not identify" and fall back.
    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`PlantNet identify returned HTTP ${res.status}`);
      }
      return null;
    }

    const data = await res.json();
    const top = data?.results?.[0];
    if (!top) return null;

    const commonName = top.species?.commonNames?.[0] || null;
    const scientificName =
      top.species?.scientificNameWithoutAuthor || top.species?.scientificName || null;
    if (!commonName && !scientificName) return null;

    const organ = data?.predictedOrgans?.[0]?.organ || null;
    const score = typeof top.score === 'number' ? top.score : null;

    return {
      commonName,
      scientificName,
      organ,
      scorePct: score != null ? Math.round(score * 100) : null,
      // Readable label, e.g. "Coconut palm (Cocos nucifera)".
      label: commonName
        ? `${commonName}${scientificName ? ` (${scientificName})` : ''}`
        : scientificName,
    };
  } catch (err) {
    console.error('PlantNet identify error:', err.message);
    return null;
  }
}

module.exports = { identifyPlant, enabled };
