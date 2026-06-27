// Registration page — supports farmer and agricultural officer sign-up.
// Officers must submit certification details + a document and land in a
// pending-approval state (is_approved=0); they cannot access protected routes
// until an admin reviews and approves their account.
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const DESIGNATIONS = [
  'Agricultural Instructor',
  'Field Officer',
  'Agricultural Research Officer',
  'Extension Officer',
  'Regional Agricultural Officer',
  'Other',
];

const PROVINCES = [
  'Western', 'Central', 'Southern', 'Northern', 'Eastern',
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
];

// Certification document constraints (mirror the server's certUpload middleware).
const CERT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CERT_ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    district: '',
    role: 'farmer',
    gov_service_id: '',
    designation: '',
    province: '',
  });
  const [certDocument, setCertDocument] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false); // officer submitted, awaiting approval
  const [loading, setLoading] = useState(false);

  const isOfficer = form.role === 'officer';

  // Immutable partial update so changing one field never clobbers the others.
  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Validate and store the chosen certification document (type + size).
  function handleCertChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setCertDocument(null);
      return;
    }
    if (!CERT_ALLOWED.includes(file.type)) {
      setCertDocument(null);
      setFieldErrors((errs) => ({ ...errs, cert: 'Only JPG, PNG, or PDF files accepted' }));
      return;
    }
    if (file.size > CERT_MAX_SIZE) {
      setCertDocument(null);
      setFieldErrors((errs) => ({ ...errs, cert: 'File must be under 5MB' }));
      return;
    }
    setFieldErrors((errs) => ({ ...errs, cert: undefined }));
    setCertDocument(file);
  }

  // Validates all fields and surfaces per-field error messages.
  // Password minimum is 8 characters; district is required for geo-targeted advice.
  // Officers additionally need government service ID, designation, province and a document.
  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email || !EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password)
      errs.confirmPassword = 'Passwords do not match';
    if (!form.district) errs.district = 'District is required';

    if (isOfficer) {
      if (!form.gov_service_id.trim()) errs.gov_service_id = 'Government service ID is required';
      if (!form.designation) errs.designation = 'Designation is required';
      if (!form.province) errs.province = 'Province is required';
      if (!certDocument) errs.cert = 'Certification document is required';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Registers the user. Officers submit multipart form data (with the document)
  // and see a pending-approval notice; farmers post and are sent to login.
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('district', form.district);
      formData.append('role', form.role);
      if (isOfficer) {
        formData.append('gov_service_id', form.gov_service_id.trim());
        formData.append('designation', form.designation);
        formData.append('province', form.province);
        formData.append('cert_document', certDocument);
      }

      await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (isOfficer) {
        // Stay on the page with a clear pending-approval message (no redirect).
        setPending(true);
      } else {
        setSuccess('Registration successful. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.errors?.join(' ') ||
          data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 480, boxShadow: 3, my: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}
          >
            AgriSL
          </Typography>
          <Typography
            align="center"
            color="text.secondary"
            sx={{ mb: 3, fontFamily: BILINGUAL_FONT }}
          >
            {t('auth.registerSubtitle')}
          </Typography>

          {pending ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Registration submitted successfully. Your account is pending admin
                approval. You will receive a notification once your certification has
                been reviewed.
              </Alert>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
              >
                {t('nav.signIn')}
              </Button>
            </>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  label={t('auth.fullName')}
                  fullWidth
                  margin="normal"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  error={!!fieldErrors.name}
                  helperText={fieldErrors.name}
                />
                <TextField
                  label={t('auth.email')}
                  type="email"
                  fullWidth
                  margin="normal"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                />
                <TextField
                  label={t('auth.password')}
                  type="password"
                  fullWidth
                  margin="normal"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                />
                <TextField
                  label={t('auth.confirmPassword')}
                  type="password"
                  fullWidth
                  margin="normal"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword}
                />

                <FormControl fullWidth margin="normal" error={!!fieldErrors.district}>
                  <InputLabel id="district-label">{t('auth.district')}</InputLabel>
                  <Select
                    labelId="district-label"
                    label={t('auth.district')}
                    value={form.district}
                    onChange={(e) => setField('district', e.target.value)}
                  >
                    {DISTRICTS.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.district && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {fieldErrors.district}
                    </Typography>
                  )}
                </FormControl>

                <FormControl sx={{ mt: 2 }}>
                  <FormLabel sx={{ fontFamily: BILINGUAL_FONT }}>{t('auth.accountType')}</FormLabel>
                  <RadioGroup
                    row
                    value={form.role}
                    onChange={(e) => setField('role', e.target.value)}
                  >
                    <FormControlLabel
                      value="farmer"
                      control={<Radio />}
                      label={t('auth.farmer')}
                      slotProps={{ typography: { sx: { fontFamily: BILINGUAL_FONT } } }}
                    />
                    <FormControlLabel
                      value="officer"
                      control={<Radio />}
                      label={t('auth.officer')}
                      slotProps={{ typography: { sx: { fontFamily: BILINGUAL_FONT } } }}
                    />
                  </RadioGroup>
                </FormControl>

                {/* Officer certification fields */}
                {isOfficer && (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      label="Government Service ID"
                      fullWidth
                      margin="normal"
                      placeholder="e.g. AGR/2024/001234"
                      value={form.gov_service_id}
                      onChange={(e) => setField('gov_service_id', e.target.value)}
                      error={!!fieldErrors.gov_service_id}
                      helperText={fieldErrors.gov_service_id}
                    />

                    <FormControl fullWidth margin="normal" error={!!fieldErrors.designation}>
                      <InputLabel id="designation-label">Designation</InputLabel>
                      <Select
                        labelId="designation-label"
                        label="Designation"
                        value={form.designation}
                        onChange={(e) => setField('designation', e.target.value)}
                      >
                        {DESIGNATIONS.map((d) => (
                          <MenuItem key={d} value={d}>
                            {d}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldErrors.designation && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {fieldErrors.designation}
                        </Typography>
                      )}
                    </FormControl>

                    <FormControl fullWidth margin="normal" error={!!fieldErrors.province}>
                      <InputLabel id="province-label">Province</InputLabel>
                      <Select
                        labelId="province-label"
                        label="Province"
                        value={form.province}
                        onChange={(e) => setField('province', e.target.value)}
                      >
                        {PROVINCES.map((p) => (
                          <MenuItem key={p} value={p}>
                            {p}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldErrors.province && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {fieldErrors.province}
                        </Typography>
                      )}
                    </FormControl>

                    {/* Certification document upload */}
                    <Box
                      component="label"
                      sx={{
                        mt: 2,
                        display: 'block',
                        border: '2px dashed',
                        borderColor: fieldErrors.cert ? 'error.main' : 'grey.400',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' },
                      }}
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={handleCertChange}
                      />
                      <CloudUploadIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography sx={{ fontWeight: 600 }}>
                        Upload Certification Document
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Accepted: JPG, PNG, PDF • Max size: 5MB
                      </Typography>
                      {certDocument && (
                        <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
                          {certDocument.name}
                        </Typography>
                      )}
                    </Box>
                    {fieldErrors.cert && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                        {fieldErrors.cert}
                      </Typography>
                    )}
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, fontFamily: BILINGUAL_FONT }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : t('nav.register')}
                </Button>
              </Box>

              <Typography align="center" sx={{ mt: 3, fontFamily: BILINGUAL_FONT }}>
                {t('auth.haveAccount')}{' '}
                <Link component={RouterLink} to="/login" color="primary">
                  {t('nav.signIn')}
                </Link>
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
