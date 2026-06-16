// Registration page — supports farmer and agricultural officer sign-up.
// Officers land in a pending-approval state (is_approved=0) and cannot access
// protected routes until an admin approves their account.
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
import api from '../api/axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    district: '',
    role: 'farmer',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Immutable partial update so changing one field never clobbers the others.
  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Validates all fields and surfaces per-field error messages.
  // Password minimum is 8 characters; district is required for geo-targeted advice.
  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email || !EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password)
      errs.confirmPassword = 'Passwords do not match';
    if (!form.district) errs.district = 'District is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Registers the user and shows a role-aware success message before redirecting.
  // Officers see a pending-approval notice; farmers are sent straight to login.
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        district: form.district,
        role: form.role,
      });

      setSuccess(
        form.role === 'officer'
          ? 'Registration successful. Your officer account is pending admin approval. Redirecting to login...'
          : 'Registration successful. Redirecting to login...'
      );
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Create your account
          </Typography>

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
              label="Full Name"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              margin="normal"
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
            />

            <FormControl fullWidth margin="normal" error={!!fieldErrors.district}>
              <InputLabel id="district-label">District</InputLabel>
              <Select
                labelId="district-label"
                label="District"
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
              <FormLabel>Account Type</FormLabel>
              <RadioGroup
                row
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
              >
                <FormControlLabel value="farmer" control={<Radio />} label="Farmer" />
                <FormControlLabel
                  value="officer"
                  control={<Radio />}
                  label="Agricultural Officer"
                />
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </Box>

          <Typography align="center" sx={{ mt: 3 }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" color="primary">
              Sign In
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
