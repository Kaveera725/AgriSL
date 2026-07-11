// Article detail page — fetches a single advisory article by ID and increments its
// view count server-side. Authenticated farmers can rate (requires a prior chat or
// disease-report activity) and bookmark the article.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Rating,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Stack } from '../components/muiSystem';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

const CATEGORY_LABEL = {
  crop_management: { en: 'Crop Management', si: 'බෝග කළමනාකරණය' },
  pest_control: { en: 'Pest Control', si: 'පළිබෝධ පාලනය' },
  seasonal_planting: { en: 'Seasonal Planting', si: 'සෘතුමය වගාව' },
  disease_treatment: { en: 'Disease Treatment', si: 'රෝග ප්‍රතිකාර' },
  market_advice: { en: 'Market Advice', si: 'වෙළඳපොළ උපදෙස්' },
  general: { en: 'General', si: 'සාමාන්‍ය' },
};

export default function AdvisoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  // Article language follows the global UI toggle (floating EN/සිං switcher).
  const { lang } = useLanguage();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [average, setAverage] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [eligible, setEligible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get(`/advisory/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setArticle(data.article);
        setAverage(Number(data.article.average_rating) || 0);
        setTotalRatings(data.article.total_ratings || 0);
        setError('');
      })
      .catch(() => active && setError('Could not load this article.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  // For logged-in users, work out whether they are allowed to rate (a completed
  // chat session or at least one disease report). Drives the rating tooltip/state.
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.all([
      api.get('/chat/history').catch(() => ({ data: { sessions: [] } })),
      api.get('/disease/history').catch(() => ({ data: { reports: [] } })),
    ]).then(([chat, disease]) => {
      if (!active) return;
      const completedChats = (chat.data.sessions || []).filter(
        (s) => s.status === 'completed'
      ).length;
      const reports = (disease.data.reports || []).length;
      setEligible(completedChats > 0 || reports > 0);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Posts the user's star rating and updates the displayed average with the
  // server-returned recalculated value so the sidebar reflects the new mean immediately.
  async function submitRating(value) {
    if (!value) return;
    try {
      const { data } = await api.post(`/advisory/${id}/rate`, { rating: value });
      setMyRating(value);
      setAverage(Number(data.new_average) || value);
      setToast(lang === 'si' ? 'ඔබේ තක්සේරුව සුරැකිණි' : 'Your rating was saved');
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not save your rating');
    }
  }

  // Toggles bookmark state — DELETEs the bookmark when already saved, POSTs to create it.
  // Feedback is surfaced via the bottom Snackbar toast.
  async function toggleBookmark() {
    try {
      if (bookmarked) {
        await api.delete(`/advisory/${id}/bookmark`);
        setBookmarked(false);
        setToast(lang === 'si' ? 'පිටු සලකුණ ඉවත් කරන ලදී' : 'Bookmark removed');
      } else {
        await api.post(`/advisory/${id}/bookmark`);
        setBookmarked(true);
        setToast(lang === 'si' ? 'පිටු සලකුණු කරන ලදී' : 'Bookmarked');
      }
    } catch {
      setToast('Could not update bookmark');
    }
  }

  async function handleDelete() {
    const confirmMsg =
      lang === 'si'
        ? 'මෙම ලිපිය ස්ථිරවම මකා දැමීමට ඔබට විශ්වාසද? මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.'
        : 'Are you sure you want to permanently delete this article? This action cannot be undone.';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/advisory/${id}`);
      setToast(
        lang === 'si'
          ? 'ලිපිය සාර්ථකව මකා දමන ලදී'
          : 'Article deleted successfully'
      );
      setTimeout(() => {
        navigate(user?.role === 'admin' ? '/admin' : '/advisory');
      }, 1500);
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not delete article');
    }
  }

  const title =
    article && (lang === 'si' ? article.title_si || article.title_en : article.title_en || article.title_si);
  const content =
    article &&
    (lang === 'si'
      ? article.content_si || article.content_en
      : article.content_en || article.content_si);
  const categoryLabel =
    article && CATEGORY_LABEL[article.category]
      ? CATEGORY_LABEL[article.category][lang] || CATEGORY_LABEL[article.category].en
      : article?.category;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <AgricultureIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
          >
            AgriSL
          </Typography>
          <Button
            component={RouterLink}
            to="/advisory"
            color="inherit"
            startIcon={<ArrowBackIcon />}
          >
            {lang === 'si' ? 'උපදෙස් වෙත' : 'Back to Advisory'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 4 }}>
            {error}
          </Alert>
        ) : article ? (
          <Grid container spacing={3}>
            {/* Main article */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={2} sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={categoryLabel}
                    color="secondary"
                    sx={{ fontFamily: BILINGUAL_FONT }}
                  />
                  {user?.role === 'admin' && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={handleDelete}
                    >
                      {lang === 'si' ? 'මකන්න' : 'Delete Article'}
                    </Button>
                  )}
                </Box>

                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, mb: 2, fontFamily: BILINGUAL_FONT, lineHeight: 1.3 }}
                >
                  {title}
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Rating value={average} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {totalRatings > 0 ? `${average} (${totalRatings})` : ''}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <VisibilityIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {article.views}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(article.created_at).toLocaleDateString()}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: BILINGUAL_FONT, lineHeight: 1.8 }}
                >
                  {content}
                </Typography>
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                {/* Officer info */}
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {lang === 'si' ? 'කතුවරයා' : 'Author'}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {article.officer_name}
                      </Typography>
                    </Stack>
                    {article.officer_district && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PlaceIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {article.officer_district}
                        </Typography>
                      </Stack>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {lang === 'si'
                        ? 'කෘෂිකාර්මික නිලධාරී'
                        : 'Agricultural Officer'}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Rate + bookmark */}
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {lang === 'si' ? 'මෙම ලිපිය තක්සේරු කරන්න' : 'Rate this article'}
                    </Typography>

                    {!isAuthenticated ? (
                      <Box>
                        <Rating value={average} precision={0.1} readOnly />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <RouterLink to="/login">
                            {lang === 'si' ? 'තක්සේරු කිරීමට පිවිසෙන්න' : 'Login to rate'}
                          </RouterLink>
                        </Typography>
                      </Box>
                    ) : (
                      <Tooltip
                        title={
                          eligible
                            ? ''
                            : lang === 'si'
                            ? 'පළමුව චැට්බොට් හෝ රෝග හඳුනාගැනීම භාවිතා කරන්න'
                            : 'Use chatbot or disease detection first'
                        }
                        arrow
                      >
                        <Box sx={{ display: 'inline-block' }}>
                          <Rating
                            value={myRating || average}
                            disabled={!eligible}
                            onChange={(_, v) => submitRating(v)}
                          />
                        </Box>
                      </Tooltip>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Button
                      fullWidth
                      variant={bookmarked ? 'contained' : 'outlined'}
                      color="secondary"
                      startIcon={bookmarked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      onClick={toggleBookmark}
                      disabled={!isAuthenticated}
                      sx={{ fontFamily: BILINGUAL_FONT }}
                    >
                      {bookmarked
                        ? lang === 'si'
                          ? 'සුරකින ලදී'
                          : 'Bookmarked'
                        : lang === 'si'
                        ? 'පිටු සලකුණු කරන්න'
                        : 'Bookmark'}
                    </Button>
                    {!isAuthenticated && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {lang === 'si' ? 'සුරැකීමට පිවිසෙන්න' : 'Login to bookmark'}
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Button
                  component={RouterLink}
                  to="/advisory"
                  variant="text"
                  startIcon={<ArrowBackIcon />}
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  {lang === 'si' ? 'උපදෙස් ලැයිස්තුවට' : 'Back to advisory list'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        ) : null}
      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
