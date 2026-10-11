// Officer dashboard — shows article statistics, an editable article table with
// archive/edit actions, and a list of disease reports shared by farmers that are
// awaiting the officer's review.
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Stack } from '../../components/muiSystem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import ArticleIcon from '@mui/icons-material/Article';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BadgeIcon from '@mui/icons-material/Badge';
import MapIcon from '@mui/icons-material/Map';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import EditProfileModal from '../../components/EditProfileModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UPLOADS_BASE = `${API_BASE.replace('/api', '')}/uploads`;
const PROFILES_BASE = `${API_BASE.replace('/api', '')}/uploads/profiles`;

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

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
  const { user, login, updateUser } = useAuth();

  const [articles, setArticles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // View full report dialog
  const [viewReport, setViewReport] = useState(null);

  // Review message dialog
  const [reviewTarget, setReviewTarget] = useState(null); // report being reviewed
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);

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

  // Soft-deletes the article by setting status back to 'draft' (hidden from
  // farmers but still editable). A confirm dialog guards against accidental clicks.
  async function archiveArticle(id) {
    if (!window.confirm('Take this article down? It will be saved as a Draft — hidden from farmers, but you can edit and re-publish it any time.')) return;
    setBusyId(id);
    try {
      await api.delete(`/advisory/${id}`);
      await loadArticles();
    } catch {
      setError('Could not take down the article.');
    } finally {
      setBusyId(null);
    }
  }

  // Opens the review dialog for a specific report.
  function openReviewDialog(report) {
    setReviewTarget(report);
    setReviewMsg('');
  }

  // Submits the review with the officer's message and notifies the farmer.
  async function submitReview() {
    if (!reviewTarget) return;
    setReviewBusy(true);
    try {
      await api.patch(`/disease/${reviewTarget.id}/reviewed`, { review_message: reviewMsg });
      setReviewTarget(null);
      setReviewMsg('');
      // Close view dialog too if same report is open
      if (viewReport?.id === reviewTarget.id) setViewReport(null);
      await loadReports();
    } catch {
      setError('Could not submit the review.');
    } finally {
      setReviewBusy(false);
    }
  }

  async function handleProfilePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await api.post('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      localStorage.setItem('agrisl_token', data.token);
      login(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile picture');
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        {/* Page header */}
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/officer/articles/new')}
          >
            Create New Article
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Profile Card */}
        {(() => {
          const photoSrc = user?.profile_photo
            ? `${PROFILES_BASE}/${user.profile_photo}`
            : (user?.profile_picture ? `${UPLOADS_BASE}/${user.profile_picture}` : undefined);

          return (
            <>
              <Card elevation={2} sx={{ mb: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          src={photoSrc}
                          sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main', cursor: 'pointer' }}
                          onClick={() => setEditOpen(true)}
                        >
                          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                        <IconButton
                          size="small"
                          onClick={() => setEditOpen(true)}
                          sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            bgcolor: 'background.paper',
                            border: '1px solid #ddd',
                            '&:hover': { bgcolor: 'grey.100' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {user?.name}
                          </Typography>
                          <Chip
                            icon={<BadgeIcon />}
                            label="Officer"
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Approved"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={(user?.preferred_language || 'en').toUpperCase()}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 700 }}
                          />
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={2}
                          flexWrap="wrap"
                          sx={{ mt: 1, color: 'text.secondary' }}
                        >
                          {user?.designation && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <BadgeIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">{user.designation}</Typography>
                            </Stack>
                          )}
                          {user?.province && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <MapIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">{user.province} Province</Typography>
                            </Stack>
                          )}
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <PlaceIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{user?.district || 'No District'}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <EmailIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{user?.email}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <PhoneIcon sx={{ fontSize: 18 }} />
                            {user?.phone ? (
                              <Typography variant="body2">{user.phone}</Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setEditOpen(true)}
                              >
                                Add phone number
                              </Typography>
                            )}
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={2} sx={{ mt: 0.8 }} flexWrap="wrap" alignItems="center">
                          {user?.gov_service_id && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <AssignmentIndIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Service ID: {user.gov_service_id}
                              </Typography>
                            </Stack>
                          )}
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">
                              Member since: {formatDate(user?.created_at)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => setEditOpen(true)}
                      sx={{ minWidth: 140 }}
                    >
                      EDIT PROFILE
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <EditProfileModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                user={user}
                onSuccess={(updatedUser) => {
                  updateUser(updatedUser);
                  setEditOpen(false);
                }}
              />
            </>
          );
        })()}

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
                              {a.status !== 'archived' && (
                                <Tooltip title="Take Down (save as Draft)">
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
                      <Card key={r.id} variant="outlined" sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
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
                                  sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
                                  onClick={() => setViewReport(r)}
                                />
                              )}
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  {r.disease_name || 'Pending diagnosis'} — {r.crop_type}
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                                  <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {r.farmer_name}{r.farmer_phone ? ` · ${r.farmer_phone}` : ''}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                  {r.district} · {formatDate(r.created_at)}
                                </Typography>
                                {r.confidence_level && (
                                  <Chip
                                    size="small"
                                    label={`Confidence: ${r.confidence_level}`}
                                    color="warning"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                color="info"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => setViewReport(r)}
                              >
                                View Report
                              </Button>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => openReviewDialog(r)}
                              >
                                Review
                              </Button>
                            </Stack>
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

      {/* ── Full Report View Dialog ── */}
      <Dialog open={!!viewReport} onClose={() => setViewReport(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          Disease Report — {viewReport?.crop_type}
        </DialogTitle>
        <DialogContent dividers>
          {viewReport && (
            <Box>
              {/* Farmer Info */}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Farmer Details</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PhoneIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="body2"><strong>{viewReport.farmer_name}</strong></Typography>
                </Stack>
                {viewReport.farmer_phone && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                    <PhoneIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{viewReport.farmer_phone}</Typography>
                  </Stack>
                )}
                {viewReport.farmer_email && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                    <EmailIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{viewReport.farmer_email}</Typography>
                  </Stack>
                )}
              </Box>

              {/* Crop image */}
              {viewReport.image_url && (
                <Box
                  component="img"
                  src={viewReport.image_url}
                  alt={viewReport.crop_type}
                  sx={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 1, mb: 2 }}
                />
              )}

              {/* Core fields */}
              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Crop</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewReport.crop_type || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">District</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewReport.district || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Disease Detected</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewReport.disease_name || 'Pending'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Confidence</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewReport.confidence_level || '—'}</Typography>
                </Grid>
                {viewReport.identified_species && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Species Identified</Typography>
                    <Typography variant="body2">{viewReport.identified_species}</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Reported On</Typography>
                  <Typography variant="body2">{formatDate(viewReport.created_at)}</Typography>
                </Grid>
              </Grid>

              {viewReport.symptoms && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Symptoms</Typography>
                  <Typography variant="body2">{viewReport.symptoms}</Typography>
                </Box>
              )}
              {viewReport.treatment_en && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Recommended Treatment</Typography>
                  <Typography variant="body2">{viewReport.treatment_en}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewReport(null)}>Close</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => {
              openReviewDialog(viewReport);
              setViewReport(null);
            }}
          >
            Review This Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Review Message Dialog ── */}
      <Dialog open={!!reviewTarget} onClose={() => !reviewBusy && setReviewTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Review Disease Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Reviewing report for <strong>{reviewTarget?.crop_type}</strong> submitted by{' '}
            <strong>{reviewTarget?.farmer_name}</strong>
            {reviewTarget?.farmer_phone && (
              <> · <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> {reviewTarget.farmer_phone}</>
            )}
          </Typography>
          <TextField
            label="Review Note (optional)"
            placeholder="e.g. Confirmed as Septoria Leaf Spot. Recommend copper-based fungicide. Contact your nearest Agrarian Service Centre for treatment kits."
            fullWidth
            multiline
            minRows={4}
            value={reviewMsg}
            onChange={(e) => setReviewMsg(e.target.value)}
            helperText="Your note will be sent to the farmer as a notification."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewTarget(null)} disabled={reviewBusy}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disabled={reviewBusy}
            startIcon={reviewBusy ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            onClick={submitReview}
          >
            Mark as Reviewed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
