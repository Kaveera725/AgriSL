// useTFClassifier — Stage 1 in-browser crop disease pre-classification.
//
// Loads TensorFlow.js + MobileNetV2 from CDN globals (window.tf / window.mobilenet)
// which are injected via <script> tags in index.html.  The model runs entirely in the
// browser — no server round-trip — and returns an instant first-pass classification
// that is shown to the farmer as a "Stage 1" chip and passed as a hint to the
// GPT-4o Vision API (Stage 2) on the server to enrich the bilingual diagnosis.
//
// Usage:
//   const { tfLabel, tfConfidence, tfLoading, tfError } = useTFClassifier(imageElement);
//
// imageElement — an HTMLImageElement (or null). Pass the preview <img> ref.value.

import { useState, useEffect, useRef } from 'react';

// How long to wait for the CDN scripts to set window.mobilenet before giving up.
const CDN_TIMEOUT_MS = 15_000;

// MobileNet returns raw ImageNet labels like "Granny Smith, apple".
// We map the top-level word to friendlier crop / disease language where possible.
// Anything not in this map is shown as-is (the model still adds useful context).
const LABEL_CLEANUP_RE = /,.*$/; // drop the secondary label after the comma

function cleanLabel(raw) {
  return (raw || '').replace(LABEL_CLEANUP_RE, '').replace(/_/g, ' ').trim();
}

export default function useTFClassifier(imageElement) {
  const modelRef = useRef(null);
  const [tfLabel, setTfLabel] = useState('');
  const [tfConfidence, setTfConfidence] = useState(null); // 0–100 integer
  const [tfLoading, setTfLoading] = useState(false);
  const [tfError, setTfError] = useState('');

  // Load the MobileNetV2 model once — re-used across image changes.
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      // Wait for window.mobilenet (CDN) to be available.
      const start = Date.now();
      while (!window.mobilenet) {
        if (Date.now() - start > CDN_TIMEOUT_MS) {
          if (!cancelled) setTfError('TF model timed out loading');
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      try {
        const m = await window.mobilenet.load({ version: 2, alpha: 1.0 });
        if (!cancelled) modelRef.current = m;
      } catch (err) {
        if (!cancelled) setTfError(`Model load error: ${err.message}`);
      }
    }

    loadModel();
    return () => { cancelled = true; };
  }, []);

  // Re-classify whenever the image element changes.
  useEffect(() => {
    if (!imageElement || !imageElement.src || imageElement.src.startsWith('blob:') === false) {
      // No image yet, or not a blob URL (means preview not set).
      setTfLabel('');
      setTfConfidence(null);
      setTfError('');
      return;
    }

    let cancelled = false;

    async function classify() {
      setTfLoading(true);
      setTfLabel('');
      setTfConfidence(null);
      setTfError('');

      // Wait for model to be ready (may still be loading on first image).
      const start = Date.now();
      while (!modelRef.current) {
        if (Date.now() - start > CDN_TIMEOUT_MS) {
          if (!cancelled) {
            setTfError('Model not ready');
            setTfLoading(false);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      try {
        // MobileNetV2 classify returns [{ className, probability }] sorted desc.
        const predictions = await modelRef.current.classify(imageElement, 3);
        if (cancelled) return;

        if (!predictions || predictions.length === 0) {
          setTfLabel('Unrecognised');
          setTfConfidence(0);
          return;
        }

        const top = predictions[0];
        setTfLabel(cleanLabel(top.className));
        setTfConfidence(Math.round(top.probability * 100));
      } catch (err) {
        if (!cancelled) setTfError(`Classification error: ${err.message}`);
      } finally {
        if (!cancelled) setTfLoading(false);
      }
    }

    classify();
    return () => { cancelled = true; };
  }, [imageElement]);

  return { tfLabel, tfConfidence, tfLoading, tfError };
}
