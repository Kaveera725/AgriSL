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
import { useLanguage } from '../../context/LanguageContext';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { t } = useLanguage();

  const CATEGORIES = [
    { value: 'crop_management', label: t('articleEditor.catCropManagement') },
    { value: 'pest_control', label: t('articleEditor.catPestControl') },
    { value: 'seasonal_planting', label: t('articleEditor.catSeasonalPlanting') },
    { value: 'disease_treatment', label: t('articleEditor.catDiseaseTreatment') },
    { value: 'market_advice', label: t('articleEditor.catMarketAdvice') },
    { value: 'general', label: t('articleEditor.catGeneral') },
  ];

  const STATUSES = [
    { value: 'draft', label: t('articleEditor.statusDraft') },
    { value: 'published', label: t('articleEditor.statusPublished') },
  ];

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
          setError(t('articleEditor.errNotFound'));
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
      .catch(() => active && setError(t('articleEditor.errLoad')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  // Saves or publishes the article. targetStatus is passed explicitly because the
  // "Publish" button hardcodes 'published' without waiting for the dropdown state update.
  async function save(targetStatus) {
    setError('');
    // Valid if there is a complete title + content pair in at least one language,
    // so an officer can publish English-only, Sinhala-only, or bilingual articles.
    const hasEn = titleEn.trim() && contentEn.trim();
    const hasSi = titleSi.trim() && contentSi.trim();
    const isPublished = targetStatus === 'published';
    if (isPublished) {
      if (!hasEn && !hasSi) {
        setError(t('articleEditor.errRequired'));
        setTab(titleSi.trim() || contentSi.trim() ? 1 : 0);
        return;
      }
    } else {
      if (!titleEn.trim() && !titleSi.trim()) {
        setError(t('articleEditor.errDraftTitleRequired') || 'A title in at least one language is required to save a draft.');
        setTab(titleSi.trim() ? 1 : 0);
        return;
      }
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
      setError(err.response?.data?.message || t('articleEditor.errSave'));
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
            {t('nav.myArticles')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
          {isEdit ? t('articleEditor.editTitle') : t('articleEditor.createTitle')}
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
              <Tab label={t('articleEditor.tabEnglish')} />
              <Tab label={t('articleEditor.tabSinhala')} sx={{ fontFamily: BILINGUAL_FONT }} />
            </Tabs>

            {tab === 0 ? (
              <Stack spacing={2}>
                <TextField
                  label={t('articleEditor.titleEn')}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label={t('articleEditor.contentEn')}
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
                  label={t('articleEditor.titleSi')}
                  value={titleSi}
                  onChange={(e) => setTitleSi(e.target.value)}
                  fullWidth
                  slotProps={{
                    input: { sx: { fontFamily: BILINGUAL_FONT } },
                    inputLabel: { sx: { fontFamily: BILINGUAL_FONT } },
                  }}
                />
                <TextField
                  label={t('articleEditor.contentSi')}
                  value={contentSi}
                  onChange={(e) => setContentSi(e.target.value)}
                  fullWidth
                  multiline
                  minRows={10}
                  slotProps={{
                    input: { sx: { fontFamily: BILINGUAL_FONT } },
                    inputLabel: { sx: { fontFamily: BILINGUAL_FONT } },
                  }}
                />
              </Stack>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="category-label">{t('articleEditor.category')}</InputLabel>
                <Select
                  labelId="category-label"
                  label={t('articleEditor.category')}
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
                <InputLabel id="status-label">{t('articleEditor.status')}</InputLabel>
                <Select
                  labelId="status-label"
                  label={t('articleEditor.status')}
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
              label={t('articleEditor.tags')}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              placeholder={t('articleEditor.tagsPlaceholder')}
            />

            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              {/* Single submit button — its label and icon reflect the selected status.
                  This avoids the old confusion where the "Publish" button always
                  overrode the status dropdown to 'published'. */}
              <Button
                variant="contained"
                color={status === 'published' ? 'primary' : 'warning'}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : status === 'published' ? <PublishIcon /> : <SaveIcon />}
                onClick={() => save(status)}
                disabled={saving}
              >
                {saving
                  ? (status === 'published' ? 'Publishing…' : 'Saving…')
                  : status === 'published'
                  ? t('articleEditor.publish')
                  : t('articleEditor.save') + ' as Draft'}
              </Button>
              <Button component={RouterLink} to="/officer/dashboard" disabled={saving}>
                {t('articleEditor.cancel')}
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
