// Login page — validates email/password client-side, posts to /auth/login, then
// redirects each role to its own home (farmer → /dashboard, officer → /officer/dashboard).
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where each role lands after a successful login.
const ROLE_HOME = {
  admin: '/admin',
  officer: '/officer/dashboard',
  farmer: '/dashboard',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Client-side validation — sets per-field errors so the UI highlights
  // each invalid input inline before making a network request.
  function validate() {
    const errs = {};
    if (!email || !EMAIL_RE.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Submits credentials, stores the JWT via AuthContext, then redirects the user
  // to the home page for their role (farmer → /dashboard, officer → /officer/dashboard).
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token);
      const dest = ROLE_HOME[data.user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
      <Card sx={{ width: '100%', maxWidth: 420, boxShadow: 3 }}>
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
            {t('auth.loginSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label={t('auth.email')}
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            <TextField
              label={t('auth.password')}
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2, fontFamily: BILINGUAL_FONT }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('nav.signIn')}
            </Button>
          </Box>

          <Typography align="center" sx={{ mt: 3, fontFamily: BILINGUAL_FONT }}>
            {t('auth.noAccount')}{' '}
            <Link component={RouterLink} to="/register" color="primary">
              {t('nav.register')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
