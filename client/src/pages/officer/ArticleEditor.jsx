// Article create/edit form for officers — same component handles both flows:
//   - No :id in the route → create new article (POST /advisory).
//   - :id present       → edit existing article (PUT /advisory/:id).
// Bilingual tabs let the officer fill English and Sinhala content independently.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import api from '../../api/axios';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

const CATEGORIES = [
  { value: 'crop_management', label: 'Crop Management' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'seasonal_planting', label: 'Seasonal Planting' },
  { value: 'disease_treatment', label: 'Disease Treatment' },
  { value: 'market_advice', label: 'Market Advice' },
  { value: 'general', label: 'General' },
];

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [tab, setTab] = useState(0);
  const [titleEn, setTitleEn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [titleSi, setTitleSi] = useState('');
  const [contentSi, setContentSi] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate when editing. Read from the officer's own list so opening the
  // editor does not inflate the public view count.
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    api
      .get('/advisory/officer/mine')
      .then(({ data }) => {
        if (!active) return;
        const article = (data.articles || []).find((a) => String(a.id) === String(id));
        if (!article) {
          setError('Article not found or you do not have access to it.');
          return;
        }
        setTitleEn(article.title_en || '');
        setContentEn(article.content_en || '');
        setTitleSi(article.title_si || '');
        setContentSi(article.content_si || '');
        setCategory(article.category || 'general');
        setTags(article.tags || '');
        setStatus(article.status || 'draft');
      })
      .catch(() => active && setError('Could not load the article.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  // Saves or publishes the article. targetStatus is passed explicitly because the
  // "Publish" button hardcodes 'published' without waiting for the dropdown state update.
  async function save(targetStatus) {
    setError('');
    if (!titleEn.trim() || !contentEn.trim()) {
      setError('English title and content are required.');
      setTab(0); // Switch back to English tab so the officer sees the required fields.
      return;
    }

    const payload = {
      title_en: titleEn,
      title_si: titleSi,
      content_en: contentEn,
      content_si: contentSi,
      category,
      tags,
      status: targetStatus,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/advisory/${id}`, payload);
      } else {
        await api.post('/advisory', payload);
      }
      navigate('/officer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the article.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <AgricultureIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            AgriSL
          </Typography>
          <Button component={RouterLink} to="/officer/dashboard" color="inherit">
            My Articles
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
          {isEdit ? 'Edit Article' : 'Create New Article'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="English Content" />
              <Tab label="Sinhala Content / සිංහල" sx={{ fontFamily: BILINGUAL_FONT }} />
            </Tabs>

            {tab === 0 ? (
              <Stack spacing={2}>
                <TextField
                  label="Title (English)"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Content (English)"
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  fullWidth
                  required
                  multiline
                  minRows={10}
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="මාතෘකාව (සිංහල)"
                  value={titleSi}
                  onChange={(e) => setTitleSi(e.target.value)}
                  fullWidth
                  InputProps={{ sx: { fontFamily: BILINGUAL_FONT } }}
                  InputLabelProps={{ sx: { fontFamily: BILINGUAL_FONT } }}
                />
                <TextField
                  label="අන්තර්ගතය (සිංහල)"
                  value={contentSi}
                  onChange={(e) => setContentSi(e.target.value)}
                  fullWidth
                  multiline
                  minRows={10}
                  InputProps={{ sx: { fontFamily: BILINGUAL_FONT } }}
                  InputLabelProps={{ sx: { fontFamily: BILINGUAL_FONT } }}
                />
              </Stack>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              placeholder="rice, irrigation, yala season"
            />

            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => save(status)}
                disabled={saving}
              >
                {saving ? <CircularProgress size={22} /> : 'Save'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PublishIcon />}
                onClick={() => {
                  setStatus('published');
                  save('published');
                }}
                disabled={saving}
              >
                Publish
              </Button>
              <Button component={RouterLink} to="/officer/dashboard" disabled={saving}>
                Cancel
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
