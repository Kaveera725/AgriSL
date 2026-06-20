const fs = require('fs');

// Kindwise crop.health client — purpose-built plant DISEASE detection.
//
// Unlike PlantNet (species only) or a general-purpose vision LLM (Gemini/GPT,
// which on the free tier rate-limits hard and returns 503), crop.health is an ML
// model trained specifically on crop diseases & pests. It returns the crop
// species plus ranked disease suggestions with probabilities and ready-made
// treatment text (prevention / chemical / biological). Because the diagnosis
// comes from crop.health (not an LLM's vision endpoint), disease detection no
// longer depends on Gemini's vision quota — which was causing the 503s.
//
// Free tier + key: sign up at https://admin.kindwise.com (crop.health product),
// then set CROP_HEALTH_API_KEY in server/.env. When the key is present this
// becomes the primary detector; detection falls back to the AI vision model if
// it is not set or the call fails.
//
// API: POST https://crop.kindwise.com/api/v1/identification
//   header: Api-Key: <key>;  JSON body: { images: ["data:<mime>;base64,..."] }
//   Response: result.is_plant, result.crop.suggestions[], result.disease.suggestions[]
//   (each suggestion: { name, probability, details:{ description, severity,
//    treatment:{ prevention[], "chemical treatment"[], "biological treatment"[] }}})
//   Docs: https://crop.kindwise.com/docs
//
// Node 22+ provides global fetch, so no extra dependency.

const BASE_URL = 'https://crop.kindwise.com/api/v1/identification';

// Whether crop.health is wired up. Disabled when no key is set, and always
// skipped under tests so the suite never makes a live network call.
function enabled() {
  return Boolean(process.env.CROP_HEALTH_API_KEY) && process.env.NODE_ENV !== 'test';
}

// Capitalise the first letter for display (API returns names like "grey mold").
function titleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Flatten crop.health's treatment object into one readable paragraph. Note the
// API uses spaced keys: "chemical treatment" / "biological treatment".
function composeTreatment(treatment) {
  if (!treatment || typeof treatment !== 'object') return '';
  const sections = [
    ['Prevention', treatment.prevention],
    ['Chemical treatment', treatment['chemical treatment']],
    ['Biological treatment', treatment['biological treatment']],
  ];
  const parts = [];
  for (const [label, items] of sections) {
    const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
    if (list.length) parts.push(`${label}:\n${list.join('\n')}`);
  }
  return parts.join('\n\n');
}

// Assess crop health from an image file. Returns a normalized object
//   { isHealthy, name, probability, crop, symptoms, treatment }  (English)
// or null (no key / tests / non-2xx / network error / not a plant) so the caller
// can fall back to the AI vision model.
async function assessHealth(imagePath, mimetype) {
  if (!enabled()) return null;

  try {
    const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });
    const url = `${BASE_URL}?details=description,treatment,common_names,severity&language=en`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.CROP_HEALTH_API_KEY,
      },
      body: JSON.stringify({
        images: [`data:${mimetype || 'image/jpeg'};base64,${base64}`],
      }),
    });

    if (!res.ok) {
      console.warn(`[crop.health] identification returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const result = data?.result;
    // Bail when it isn't a plant or there are no suggestions → AI fallback.
    if (!result || result.is_plant?.binary === false) return null;

    const top = result.disease?.suggestions?.[0] || null;
    if (!top) return null;

    // crop.health ranks "healthy" as one of the disease suggestions; when it
    // tops the list, the plant has no detected disease.
    const isHealthy = String(top.name).toLowerCase() === 'healthy';

    const details = top.details || {};
    const description = typeof details.description === 'string' ? details.description : '';
    const severity = typeof details.severity === 'string' ? details.severity : '';
    const symptoms = [description, severity && `Severity: ${severity}`]
      .filter(Boolean)
      .join('\n\n');

    return {
      isHealthy,
      name: titleCase(top.name),
      probability: typeof top.probability === 'number' ? top.probability : null,
      crop: result.crop?.suggestions?.[0]?.name || null, // bonus crop ID, e.g. "tomato"
      symptoms, // English
      treatment: composeTreatment(details.treatment), // English
    };
  } catch (err) {
    console.error('[crop.health] assessHealth error:', err.message);
    return null;
  }
}

module.exports = { assessHealth, enabled };
