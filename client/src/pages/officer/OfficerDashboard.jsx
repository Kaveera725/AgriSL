// Officer dashboard — shows article statistics, an editable article table with
// archive/edit actions, and a list of disease reports shared by farmers that are
// awaiting the officer's review.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Rating,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Stack } from '../../components/muiSystem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import ArticleIcon from '@mui/icons-material/Article';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

const CATEGORY_LABEL = {
  crop_management: 'Crop Management',
  pest_control: 'Pest Control',
  seasonal_planting: 'Seasonal Planting',
  disease_treatment: 'Disease Treatment',
  market_advice: 'Market Advice',
  general: 'General',
};

const STATUS_CHIP = {
  published: { color: 'success', label: 'Published' },
  draft: { color: 'warning', label: 'Draft' },
  archived: { color: 'default', label: 'Archived' },
};

function StatCard({ icon, label, value, color = 'primary.main' }) {
  return (
    <Card elevation={2} sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              color,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              p: 1.2,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {value ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [articles, setArticles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Refreshes the articles list after a mutation (archive). Called separately
  // from the initial load so the mutation path does not need to re-fetch reports.
  async function loadArticles() {
    const { data } = await api.get('/advisory/officer/mine');
    setArticles(data.articles || []);
  }

  // Refreshes pending disease reports after one is marked reviewed.
  async function loadReports() {
    try {
      const { data } = await api.get('/advisory/officer/pending-reports');
      setReports(data.reports || []);
    } catch {
      setReports([]);
    }
  }

  useEffect(() => {
    let active = true;
    // Fetch inline so every setState lands in an async continuation.
    Promise.all([
      api.get('/advisory/officer/mine'),
      api.get('/advisory/officer/pending-reports').catch(() => ({ data: { reports: [] } })),
    ])
      .then(([articlesRes, reportsRes]) => {
        if (!active) return;
        setArticles(articlesRes.data.articles || []);
        setReports(reportsRes.data.reports || []);
      })
      .catch(() => active && setError('Could not load your dashboard.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Soft-deletes the article via the DELETE route (sets status to 'archived').
  // A confirm dialog guards against accidental clicks since this is not easily reversible from the UI.
  async function archiveArticle(id) {
    if (!window.confirm('Archive this article? It will no longer be visible to farmers.')) return;
    setBusyId(id);
    try {
      await api.delete(`/advisory/${id}`);
      await loadArticles();
    } catch {
      setError('Could not archive the article.');
    } finally {
      setBusyId(null);
    }
  }

  // Restores an archived article back to 'draft' so the officer can edit and republish it.
  async function unarchiveArticle(id) {
    if (!window.confirm('Restore this article to Draft? You can then edit and republish it.')) return;
    setBusyId(id);
    try {
      await api.put(`/advisory/${id}`, { status: 'draft' });
      await loadArticles();
    } catch {
      setError('Could not restore the article.');
    } finally {
      setBusyId(null);
    }
  }

  // Marks a disease report as reviewed. busyId is prefixed with 'r' so article
  // busy state and report busy state don't collide when both use the same busyId slot.
  async function markReviewed(reportId) {
    setBusyId(`r${reportId}`);
    try {
      await api.patch(`/disease/${reportId}/reviewed`);
      await loadReports();
    } catch {
      setError('Could not mark the report as reviewed.');
    } finally {
      setBusyId(null);
    }
  }

  // Stats
  const total = articles.length;
  const published = articles.filter((a) => a.status === 'published').length;
  const draft = articles.filter((a) => a.status === 'draft').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Officer Dashboard
            </Typography>
            {user?.name && (
              <Typography variant="body2" color="text.secondary">
                Welcome, {user.name}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<EditIcon />}
              label="Officer"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/officer/articles/new')}
            >
              Create New Article
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid key={i} size={{ xs: 6, md: 3 }}>
                  <Skeleton variant="rounded" height={100} />
                </Grid>
              ))}
            </Grid>
            <Skeleton variant="rounded" height={320} />
            <Skeleton variant="rounded" height={200} />
          </Stack>
        ) : (
          <>
            {/* Stats row */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard icon={<ArticleIcon />} label="Total Articles" value={total} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard
                  icon={<PublishedWithChangesIcon />}
                  label="Published"
                  value={published}
                  color="success.main"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard icon={<EditIcon />} label="Draft" value={draft} color="warning.main" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard
                  icon={<VisibilityIcon />}
                  label="Total Views"
                  value={totalViews}
                  color="secondary.main"
                />
              </Grid>
            </Grid>

            {/* Articles table */}
            <Paper elevation={2} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, p: 2 }}>
                My Articles
              </Typography>
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title (EN)</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell>Avg Rating</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {articles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No articles yet. Click “Create New Article” to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      articles.map((a) => {
                        const chip = STATUS_CHIP[a.status] || { color: 'default', label: a.status };
                        return (
                          <TableRow key={a.id} hover>
                            <TableCell sx={{ maxWidth: 260 }}>{a.title_en || a.title_si}</TableCell>
                            <TableCell>{CATEGORY_LABEL[a.category] || a.category}</TableCell>
                            <TableCell>
                              <Chip size="small" label={chip.label} color={chip.color} />
                            </TableCell>
                            <TableCell align="right">{a.views}</TableCell>
                            <TableCell>
                              {a.total_ratings > 0 ? (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Rating
                                    value={Number(a.average_rating) || 0}
                                    precision={0.1}
                                    readOnly
                                    size="small"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ({a.total_ratings})
                                  </Typography>
                                </Stack>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(a.updated_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/officer/articles/${a.id}/edit`)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {a.status === 'archived' ? (
                                <Tooltip title="Unarchive (restore to Draft)">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      disabled={busyId === a.id}
                                      onClick={() => unarchiveArticle(a.id)}
                                    >
                                      <UnarchiveIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Archive">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={busyId === a.id}
                                      onClick={() => archiveArticle(a.id)}
                                    >
                                      <ArchiveIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Pending disease reports shared with this officer */}
            <Paper elevation={2}>
              <Typography variant="h6" sx={{ fontWeight: 700, p: 2 }}>
                Disease Reports Awaiting Your Review
              </Typography>
              <Divider />
              <Box sx={{ p: 2 }}>
                {reports.length === 0 ? (
                  <Typography color="text.secondary">
                    No disease reports are currently awaiting your review.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {reports.map((r) => (
                      <Card key={r.id} variant="outlined">
                        <CardContent>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center">
                              {r.image_url && (
                                <Box
                                  component="img"
                                  src={r.image_url}
                                  alt={r.crop_type}
                                  sx={{ width: 64, height: 64, borderRadius: 1, objectFit: 'cover' }}
                                />
                              )}
                              <Box>
                                <Typography sx={{ fontWeight: 600 }}>
                                  {r.disease_name || 'Pending diagnosis'} — {r.crop_type}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {r.farmer_name} · {r.district} ·{' '}
                                  {new Date(r.created_at).toLocaleDateString()}
                                </Typography>
                                {r.confidence_level && (
                                  <Chip
                                    size="small"
                                    label={`Confidence: ${r.confidence_level}`}
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Stack>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={busyId === `r${r.id}`}
                              onClick={() => markReviewed(r.id)}
                            >
                              {busyId === `r${r.id}` ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                'Mark Reviewed'
                              )}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}
