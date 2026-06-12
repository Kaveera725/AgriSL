import { useRef, useState } from 'react';
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
import api from '../api/axios';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

const CROP_OPTIONS = [
  { value: 'Rice', label: 'Rice (වී)' },
  { value: 'Tea', label: 'Tea (තේ)' },
  { value: 'Coconut', label: 'Coconut (පොල්)' },
  { value: 'Rubber', label: 'Rubber (රබර්)' },
  { value: 'Vegetables', label: 'Vegetables (එළවළු)' },
  { value: 'Fruits', label: 'Fruits (පලතුරු)' },
  { value: 'Spices', label: 'Spices (කුළුබඩු)' },
  { value: 'Maize', label: 'Maize (ඉරිඟු)' },
  { value: 'Onions', label: 'Onions (ළූණු)' },
  { value: 'Chilli', label: 'Chilli (මිරිස්)' },
  { value: 'Other', label: 'Other (වෙනත්)' },
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

  const diseaseFound =
    result &&
    result.disease_name_en &&
    result.disease_name_en !== 'No disease detected';

  // ---- Step 2: Result ----
  if (result) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={3}>
          {/* Uploaded image */}
          {result.image_url && (
            <CardMedia
              component="img"
              height="220"
              image={result.image_url}
              alt="Uploaded plant"
              sx={{ objectFit: 'cover' }}
            />
          )}

          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              align="center"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontFamily: BILINGUAL_FONT,
                color: diseaseFound ? 'error.main' : 'success.main',
              }}
            >
              {result.disease_name_en}
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{ fontFamily: BILINGUAL_FONT, color: diseaseFound ? 'error.main' : 'success.main', mb: 2 }}
            >
              {result.disease_name_si}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip
                label={`Confidence: ${result.confidence}`}
                color={CONFIDENCE_COLOR[result.confidence] || 'default'}
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              centered
              sx={{ mb: 2 }}
            >
              <Tab label="English" />
              <Tab label="සිංහල" sx={{ fontFamily: BILINGUAL_FONT }} />
            </Tabs>

            {tab === 0 ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Symptoms
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {result.symptoms_en}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Treatment
                </Typography>
                <Typography variant="body2">{result.treatment_en}</Typography>
              </Box>
            ) : (
              <Box sx={{ fontFamily: BILINGUAL_FONT }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  රෝග ලක්ෂණ
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontFamily: BILINGUAL_FONT }}>
                  {result.symptoms_si}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  ප්‍රතිකාරය
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                  {result.treatment_si}
                </Typography>
              </Box>
            )}

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled
                fullWidth
                sx={{ fontFamily: BILINGUAL_FONT }}
              >
                Saved to Dashboard / උපකරණ පුවරුවට සුරැකිණි
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ fontFamily: BILINGUAL_FONT }}
                onClick={openShareDialog}
              >
                Share with Agricultural Officer / කෘෂිකාර්මික නිලධාරියාට යවන්න
              </Button>
              <Button variant="text" fullWidth onClick={resetForm}>
                Detect Another / තවත් පරීක්ෂා කරන්න
              </Button>
            </Stack>
          </CardContent>
        </Card>

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
    );
  }

  // ---- Step 1: Form ----
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            align="center"
            sx={{ fontWeight: 700, color: 'primary.main', mb: 3, fontFamily: BILINGUAL_FONT }}
          >
            Crop Disease Detection / බෝග රෝග හඳුනාගැනීම
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
                borderColor: uploadError ? 'error.main' : 'primary.light',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
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
                    sx={{ maxHeight: 180, maxWidth: '100%', borderRadius: 1, mb: 1 }}
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    {imageFile.name} — click to change
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <UploadFileIcon sx={{ fontSize: 48, color: 'primary.light', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: BILINGUAL_FONT }}>
                    Click to upload plant image / රූපය උඩුගත කරන්න
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
              disabled={loading}
              sx={{ mt: 4, fontFamily: BILINGUAL_FONT }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Detect Disease / රෝගය හඳුනා ගන්න'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
