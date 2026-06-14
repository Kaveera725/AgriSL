import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  Pagination,
  Rating,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

// value '' is the "All" pseudo-category.
const CATEGORIES = [
  { value: '', en: 'All', si: 'සියල්ල' },
  { value: 'crop_management', en: 'Crop Management', si: 'බෝග කළමනාකරණය' },
  { value: 'pest_control', en: 'Pest Control', si: 'පළිබෝධ පාලනය' },
  { value: 'seasonal_planting', en: 'Seasonal Planting', si: 'සෘතුමය වගාව' },
  { value: 'disease_treatment', en: 'Disease Treatment', si: 'රෝග ප්‍රතිකාර' },
  { value: 'market_advice', en: 'Market Advice', si: 'වෙළඳපොළ උපදෙස්' },
  { value: 'general', en: 'General', si: 'සාමාන්‍ය' },
];

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

function categoryChipLabel(value, lang) {
  const c = CATEGORY_LABEL[value];
  if (!c) return value;
  return lang === 'si' ? c.si : c.en;
}

export default function AdvisoryBrowse() {
  const { isAuthenticated, user, logout } = useAuth();

  const [lang, setLang] = useState('en');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [articles, setArticles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce the search box (500ms) before it drives a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    // All setState happens in the async continuations; the initial spinner comes
    // from the loading=true default, and refetches simply swap in new results.
    api
      .get('/advisory', { params: { category, search, page, limit: 9 } })
      .then(({ data }) => {
        if (!active) return;
        setArticles(data.articles);
        setTotalPages(data.totalPages);
        setError('');
      })
      .catch(() => active && setError('Could not load articles. Please try again.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category, search, page]);

  function handleCategory(value) {
    setCategory(value);
    setPage(1);
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top bar */}
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
          {isAuthenticated ? (
            <>
              {user.role === 'officer' || user.role === 'admin' ? (
                <Button component={RouterLink} to="/officer/dashboard" color="inherit" sx={{ mr: 1 }}>
                  My Articles
                </Button>
              ) : null}
              <Button color="inherit" variant="outlined" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button component={RouterLink} to="/login" color="inherit" variant="outlined">
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: { xs: 5, md: 7 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontFamily: BILINGUAL_FONT }}>
          Agricultural Advisory
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9, fontFamily: BILINGUAL_FONT }}>
          කෘෂිකාර්මික උපදෙස්
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Language toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ToggleButtonGroup
            value={lang}
            exclusive
            size="small"
            color="primary"
            onChange={(_, v) => v && setLang(v)}
          >
            <ToggleButton value="en">English</ToggleButton>
            <ToggleButton value="si" sx={{ fontFamily: BILINGUAL_FONT }}>
              සිංහල
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder={lang === 'si' ? 'උපදෙස් සොයන්න...' : 'Search advisories...'}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ mb: 2, bgcolor: '#fff', fontFamily: BILINGUAL_FONT }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Category filter chips */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value || 'all'}
              label={lang === 'si' ? c.si : c.en}
              color={category === c.value ? 'primary' : 'default'}
              variant={category === c.value ? 'filled' : 'outlined'}
              onClick={() => handleCategory(c.value)}
              sx={{ fontFamily: BILINGUAL_FONT }}
            />
          ))}
        </Stack>

        {/* Results */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ py: 6 }}>
            {error}
          </Typography>
        ) : articles.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6, fontFamily: BILINGUAL_FONT }}>
            {lang === 'si' ? 'උපදෙස් කිසිවක් හමු නොවීය.' : 'No advisory articles found.'}
          </Typography>
        ) : (
          <>
            <Grid container spacing={3}>
              {articles.map((a) => {
                const title = lang === 'si' ? a.title_si || a.title_en : a.title_en;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
                    <Card
                      elevation={2}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: 6 },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Chip
                          size="small"
                          label={categoryChipLabel(a.category, lang)}
                          color="secondary"
                          sx={{ mb: 1.5, fontFamily: BILINGUAL_FONT }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 1, fontFamily: BILINGUAL_FONT, lineHeight: 1.3 }}
                        >
                          {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {lang === 'si' ? 'කතුවරයා: ' : 'By '}
                          {a.officer_name}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Rating
                            value={Number(a.average_rating) || 0}
                            precision={0.1}
                            readOnly
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {a.total_ratings > 0
                              ? `${a.average_rating} (${a.total_ratings})`
                              : lang === 'si'
                              ? 'තක්සේරු නැත'
                              : 'No ratings'}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {a.views}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(a.created_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          component={RouterLink}
                          to={`/advisory/${a.id}`}
                          variant="contained"
                          color="primary"
                          size="small"
                          fullWidth
                          sx={{ fontFamily: BILINGUAL_FONT }}
                        >
                          {lang === 'si' ? 'වැඩිදුර කියවන්න' : 'Read More'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
