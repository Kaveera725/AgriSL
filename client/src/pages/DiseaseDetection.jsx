// Crop disease detection page — two-stage AI diagnosis flow:
//   Stage 1: Server-side TF.js MobileNetV2 runs on the uploaded image instantly,
//            giving a classified disease name + confidence %.
//   Stage 2: GPT-4o Vision API provides a detailed bilingual (EN + SI) diagnosis
//            enriched by the Stage 1 result, with ml_agrees flag + disclaimer.
//
// Result card shows:
//   Section 1 — ML Model Classification: class name + circular confidence gauge
//   Section 2 — AI Expert Diagnosis: bilingual tabs, disclaimer, share actions
import { useRef, useState } from 'react';
import useTFClassifier from '../hooks/useTFClassifier';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import DiseaseResultCard from '../components/DiseaseResultCard';
import ImageScannerView from '../components/ImageScannerView';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

const CROP_OPTIONS = [
  { value: 'Tomato', label: 'Tomato (තක්කාලි)' },
  { value: 'Potato', label: 'Potato (අර්තාපල්)' },
  { value: 'Chilli', label: 'Chilli / Bell Pepper (මිරිස්)' },
  { value: 'Banana', label: 'Banana (කෙසෙල්)' },
  { value: 'Rice', label: 'Rice (වී)' },
  { value: 'Tea', label: 'Tea (තේ)' },
  { value: 'Maize', label: 'Corn / Maize (ඉරිඟු)' },
  { value: 'Coconut', label: 'Coconut (පොල්)' },
  { value: 'Rubber', label: 'Rubber (රබර්)' },
  { value: 'Onions', label: 'Onions (ළූණු)' },
];

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const CONFIDENCE_COLOR = { High: 'success', Medium: 'warning', Low: 'error' };

export default function DiseaseDetection() {
  // Step 1 form state
  const [cropType, setCropType] = useState('');
  const [district, setDistrict] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Stage 1: TF.js in-browser pre-classification.
  // imgPreviewRef is attached to the <img> preview element so the hook can
  // pass it directly to MobileNetV2's classify() call.
  const imgPreviewRef = useRef(null);
  const { tfLabel, tfConfidence, tfLoading, tfError } = useTFClassifier(
    imgPreviewRef.current
  );

  // Step 2 result state
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(0);

  // Share dialog state
  const [shareOpen, setShareOpen] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shared, setShared] = useState(false);

  // Validates the selected file client-side (type and size) before storing it.
  // A blob URL is created for the local preview; the actual upload happens on submit.
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Only JPG and PNG images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Submits the image as multipart/form-data to /disease and transitions to
  // the result view. The API returns disease info in both EN and SI.
  async function handleDetect(e) {
    e.preventDefault();
    setFormError('');
    if (!cropType || !district) {
      setFormError('Please select a crop type and district');
      return;
    }
    if (!imageFile) {
      setFormError('Please upload an image of the plant');
      return;
    }

    const body = new FormData();
    body.append('crop_type', cropType);
    body.append('district', district);
    body.append('image', imageFile);
    // Pass Stage 1 TF.js result to the server so GPT-4o Vision can use it as a hint.
    if (tfLabel) body.append('tf_label', tfLabel);
    if (tfConfidence != null) body.append('tf_confidence', String(tfConfidence));

    setLoading(true);
    try {
      const { data } = await api.post('/disease', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not analyze image, please try again');
    } finally {
      setLoading(false);
    }
  }

  // Resets share-dialog state and fetches the approved officer list before opening.
  // Officers list is fetched lazily (only when the dialog opens) to avoid extra load.
  async function openShareDialog() {
    setShareError('');
    setSelectedOfficer('');
    setShared(false);
    try {
      const { data } = await api.get('/users/officers');
      setOfficers(data.officers);
    } catch {
      setOfficers([]);
    }
    setShareOpen(true);
  }

  // Posts the share request and auto-closes the dialog after a 1.5 s success display.
  async function handleShare() {
    if (!selectedOfficer) {
      setShareError('Please select an officer');
      return;
    }
    setSharing(true);
    setShareError('');
    try {
      await api.post('/disease/share', {
        report_id: result.report_id,
        officer_id: selectedOfficer,
      });
      setShared(true);
      setTimeout(() => setShareOpen(false), 1500);
    } catch (err) {
      setShareError(err.response?.data?.message || 'Could not share the report');
    } finally {
      setSharing(false);
    }
  }

  // Resets all state back to the initial upload form so the farmer can analyze another crop.
  function resetForm() {
    setCropType('');
    setDistrict('');
    setImageFile(null);
    setImagePreview(null);
    setUploadError('');
    setFormError('');
    setResult(null);
    setTab(0);
    setShared(false);
  }

  // Shortcuts: the server returns both ml_result and ai_result (new shape).
  // For backward compat the legacy flat fields are also spread at the top level.
  const mlRes = result?.ml_result || null;
  const aiRes = result?.ai_result || result || null;

  const diseaseFound =
    aiRes &&
    aiRes.disease_name_en &&
    aiRes.disease_name_en !== 'No disease detected';

  // ML section confidence colour: green >80, amber 50-80, red <50.
  function mlColor(conf) {
    if (conf == null) return 'text.secondary';
    if (conf >= 80) return 'success.main';
    if (conf >= 50) return 'warning.main';
    return 'error.main';
  }

  // ---- Render Unified Page ----
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', pb: 8 }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* ========================================================
            PERSISTENT HEADER — Always visible across all states
            ======================================================== */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: 'center', alignItems: 'center', mb: 1 }}
          >
            <LocalFloristIcon sx={{ color: 'success.main', fontSize: { xs: 28, sm: 36 } }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                color: 'primary.dark',
                fontFamily: BILINGUAL_FONT,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.35rem', sm: '1.9rem' },
              }}
            >
              Crop Disease Detection / බෝග රෝග හඳුනාගැනීම
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: BILINGUAL_FONT, maxWidth: 620, mx: 'auto', lineHeight: 1.6 }}
          >
            Instant AI pathology inspection with Sri Lankan agricultural advisory & chemical guidelines
            <br />
            කෘතිම බුද්ධිය මඟින් බෝග රෝග සහ නිර්දේශිත ප්‍රතිකාර නිවැරදිව හඳුනාගන්න
          </Typography>
        </Box>

        {/* ========================================================
            STATE 1: Loading / AI Image Recognition Scanner Active
            ======================================================== */}
        {loading && (
          <Container maxWidth="sm" disableGutters>
            <ImageScannerView
              imagePreview={imagePreview}
              cropType={cropType}
              district={district}
            />
          </Container>
        )}

        {/* ========================================================
            STATE 2: Diagnostic Result View
            ======================================================== */}
        {!loading && result && (
          <Container maxWidth="sm" disableGutters>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Button
                startIcon={<RefreshIcon />}
                variant="outlined"
                color="primary"
                onClick={resetForm}
                sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 600, textTransform: 'none' }}
              >
                Scan Another Leaf / නව පරීක්ෂණයක්
              </Button>
              <Chip
                label={`${cropType || ''}${district ? ` • ${district}` : ''}`}
                size="small"
                variant="filled"
                color="success"
                sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 600 }}
              />
            </Stack>

            <DiseaseResultCard
              aiResult={result.ai_result || result}
              mlResult={
                result.ml_result ||
                (result.ml_label
                  ? { className: result.ml_label, confidence: result.ml_confidence }
                  : null)
              }
              imageUrl={result.image_url}
              onShare={openShareDialog}
              onReset={resetForm}
              showActions={true}
            />

            {/* Share dialog */}
            <Dialog open={shareOpen} onClose={() => setShareOpen(false)} fullWidth maxWidth="xs">
              <DialogTitle sx={{ fontFamily: BILINGUAL_FONT }}>
                Share with Officer / නිලධාරියාට යවන්න
              </DialogTitle>
              <DialogContent>
                {shared ? (
                  <Alert severity="success" sx={{ fontFamily: BILINGUAL_FONT }}>
                    Report shared successfully!
                  </Alert>
                ) : (
                  <>
                    {shareError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {shareError}
                      </Alert>
                    )}
                    {officers.length === 0 ? (
                      <Typography color="text.secondary">
                        No approved officers available.
                      </Typography>
                    ) : (
                      <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel id="officer-label">Select Officer</InputLabel>
                        <Select
                          labelId="officer-label"
                          label="Select Officer"
                          value={selectedOfficer}
                          onChange={(e) => setSelectedOfficer(e.target.value)}
                        >
                          {officers.map((o) => (
                            <MenuItem key={o.id} value={o.id}>
                              {o.name} — {o.district}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShareOpen(false)} disabled={sharing}>
                  Cancel
                </Button>
                {!shared && (
                  <Button
                    variant="contained"
                    onClick={handleShare}
                    disabled={sharing || officers.length === 0}
                  >
                    {sharing ? <CircularProgress size={20} color="inherit" /> : 'Share'}
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          </Container>
        )}

        {/* ========================================================
            STATE 3: Initial Crop Selection & Image Upload Form
            ======================================================== */}
        {!loading && !result && (
          <Container maxWidth="sm" disableGutters>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 2,
                    fontFamily: BILINGUAL_FONT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LocalFloristIcon color="success" />
                  Select Crop & Upload Leaf Photo / බෝගය සහ ඡායාරූපය තෝරන්න
                </Typography>

                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleDetect}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="crop-label">Crop Type</InputLabel>
                    <Select
                      labelId="crop-label"
                      label="Crop Type"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      sx={{ fontFamily: BILINGUAL_FONT }}
                    >
                      {CROP_OPTIONS.map((c) => (
                        <MenuItem key={c.value} value={c.value} sx={{ fontFamily: BILINGUAL_FONT }}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="district-label">District</InputLabel>
                    <Select
                      labelId="district-label"
                      label="District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    >
                      {DISTRICTS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Image upload area */}
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      mt: 2,
                      border: '2px dashed',
                      borderColor: uploadError ? 'error.main' : 'success.light',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: imagePreview ? 'success.50' : 'action.hover',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'action.selected', borderColor: 'success.main' },
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    {imagePreview ? (
                      <Box>
                        <Box
                          component="img"
                          src={imagePreview}
                          alt="Preview"
                          ref={imgPreviewRef}
                          crossOrigin="anonymous"
                          sx={{ maxHeight: 200, maxWidth: '100%', borderRadius: 2, mb: 1, boxShadow: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {imageFile.name} — click to change / වෙනස් කිරීමට ක්ලික් කරන්න
                        </Typography>
                        {/* Stage 1: instant TF.js pre-classification chip */}
                        {tfLoading && (
                          <Chip
                            label="ML model analysing…"
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{ mt: 1, fontFamily: BILINGUAL_FONT }}
                          />
                        )}
                        {!tfLoading && tfLabel && !tfError && (
                          <Chip
                            label={`Pre-check: ${tfLabel}${tfConfidence != null ? ` · ${tfConfidence}%` : ''}`}
                            size="small"
                            color={tfConfidence >= 70 ? 'success' : tfConfidence >= 40 ? 'warning' : 'default'}
                            variant="filled"
                            sx={{ mt: 1, fontWeight: 600, fontFamily: BILINGUAL_FONT }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <UploadFileIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: 'text.primary', fontFamily: BILINGUAL_FONT }}
                        >
                          Click to upload plant image / පත්‍රයේ ඡායාරූපය උඩුගත කරන්න
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          JPG or PNG, max 5 MB
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {uploadError && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {uploadError}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading || !cropType || !district || !imageFile}
                    sx={{ mt: 3.5, py: 1.5, fontFamily: BILINGUAL_FONT, fontSize: '1rem', fontWeight: 700 }}
                  >
                    Detect Disease / රෝගය හඳුනා ගන්න
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Container>
        )}
      </Container>
    </Box>
  );
}
