// Admin panel — platform overview stat cards plus three management tabs:
//   Users    — search/filter, approve officers, change roles, deactivate accounts.
//   Articles — every advisory article in all statuses with a link to read it.
//   Reports  — every disease report with a detail dialog showing the image.
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatIcon from '@mui/icons-material/Chat';
import BugReportIcon from '@mui/icons-material/BugReport';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import BadgeIcon from '@mui/icons-material/Badge';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

const CATEGORY_LABEL = {
  crop_management: 'Crop Management',
  pest_control: 'Pest Control',
  seasonal_planting: 'Seasonal Planting',
  disease_treatment: 'Disease Treatment',
  market_advice: 'Market Advice',
  general: 'General',
};

const ARTICLE_STATUS_CHIP = {
  published: { color: 'success', label: 'Published' },
  draft: { color: 'warning', label: 'Draft' },
  archived: { color: 'default', label: 'Archived' },
};

const ROLE_CHIP = {
  admin: 'error',
  officer: 'primary',
  farmer: 'default',
};

const CONFIDENCE_COLOR = { High: 'success', Medium: 'warning', Low: 'error' };

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

function StatCard({ icon, label, value, color = 'primary.main' }) {
  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderLeft: 4, borderColor: color }}
    >
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

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');

  // Users tab state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actioningId, setActioningId] = useState(null);

  // Deactivate confirm dialog
  const [confirmUser, setConfirmUser] = useState(null);

  // Articles tab state (lazy-loaded on first visit)
  const [articles, setArticles] = useState([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);

  // Reports tab state (lazy-loaded on first visit)
  const [reports, setReports] = useState([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [reportView, setReportView] = useState(null);
  const [reportLang, setReportLang] = useState(0); // 0 = EN, 1 = SI

  // ---- Stats ----
  function loadStats() {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load platform statistics.'));
  }

  useEffect(() => {
    loadStats();
  }, []);

  // ---- Users ----
  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    const params = {};
    if (roleFilter !== 'all') params.role = roleFilter;
    if (search.trim()) params.search = search.trim();
    api
      .get('/admin/users', { params })
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => setError('Could not load users.'))
      .finally(() => setUsersLoading(false));
  }, [roleFilter, search]);

  // Debounce search + role filter so we don't fire a request on every keystroke.
  useEffect(() => {
    if (tab !== 0) return undefined;
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [tab, loadUsers]);

  async function handleApprove(id) {
    setActioningId(id);
    try {
      await api.patch(`/admin/users/${id}/approve`);
      loadUsers();
      loadStats();
    } catch {
      setError('Could not approve officer.');
    } finally {
      setActioningId(null);
    }
  }

  async function handleRoleChange(id, role) {
    setActioningId(id);
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change role.');
    } finally {
      setActioningId(null);
    }
  }

  async function handleDeactivate() {
    if (!confirmUser) return;
    const id = confirmUser.id;
    setActioningId(id);
    try {
      await api.patch(`/admin/users/${id}/deactivate`);
      setConfirmUser(null);
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not deactivate user.');
    } finally {
      setActioningId(null);
    }
  }

  // ---- Articles (fetch once, on first visit to the tab) ----
  useEffect(() => {
    if (tab !== 1 || articlesLoaded) return undefined;
    let active = true;
    api
      .get('/admin/articles')
      .then(({ data }) => active && setArticles(data.articles || []))
      .catch(() => active && setError('Could not load articles.'))
      .finally(() => active && setArticlesLoaded(true));
    return () => {
      active = false;
    };
  }, [tab, articlesLoaded]);

  // ---- Reports (fetch once, on first visit to the tab) ----
  useEffect(() => {
    if (tab !== 2 || reportsLoaded) return undefined;
    let active = true;
    api
      .get('/admin/reports')
      .then(({ data }) => active && setReports(data.reports || []))
      .catch(() => active && setError('Could not load disease reports.'))
      .finally(() => active && setReportsLoaded(true));
    return () => {
      active = false;
    };
  }, [tab, reportsLoaded]);

  function openReport(r) {
    setReportLang(0);
    setReportView(r);
  }

  const reportDiseaseFound =
    reportView &&
    reportView.disease_name &&
    reportView.disease_name !== 'No disease detected';

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
              Admin Panel
            </Typography>
            {user?.name && (
              <Typography variant="body2" color="text.secondary">
                Welcome, {user.name}
              </Typography>
            )}
          </Box>
          <Chip
            icon={<AdminPanelSettingsIcon />}
            label="Administrator"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stat cards — row 1: users */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<PeopleIcon fontSize="large" />}
              label="Total Users"
              value={stats?.total_users}
              color="primary.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<AgricultureIcon fontSize="large" />}
              label="Total Farmers"
              value={stats?.total_farmers}
              color="success.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<BadgeIcon fontSize="large" />}
              label="Total Officers"
              value={stats?.total_officers}
              color="info.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<WarningAmberIcon fontSize="large" />}
              label="Pending Approvals"
              value={stats?.pending_officers}
              color="warning.main"
            />
          </Grid>
        </Grid>

        {/* Stat cards — row 2: activity */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<ChatIcon fontSize="large" />}
              label="Total Chat Sessions"
              value={stats?.total_chat_sessions}
              color="secondary.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<BugReportIcon fontSize="large" />}
              label="Disease Reports"
              value={stats?.total_disease_reports}
              color="error.main"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<ArticleIcon fontSize="large" />}
              label="Total Articles"
              value={stats?.total_articles}
              color="primary.dark"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<CheckCircleIcon fontSize="large" />}
              label="Published Articles"
              value={stats?.published_articles}
              color="success.dark"
            />
          </Grid>
        </Grid>

        {/* Pending approvals alert */}
        {stats?.pending_officers > 0 && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => setTab(0)}>
                Review
              </Button>
            }
          >
            {stats.pending_officers} officer account
            {stats.pending_officers === 1 ? '' : 's'} awaiting approval
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Users" />
          <Tab label="Articles" />
          <Tab label="Disease Reports" />
        </Tabs>

        {/* --- Users tab --- */}
        {tab === 0 && (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 2 }}
              alignItems={{ sm: 'center' }}
            >
              <TextField
                size="small"
                label="Search name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="role-filter-label">Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  label="Role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="farmer">Farmer</MenuItem>
                  <MenuItem value="officer">Officer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Card} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>District</TableCell>
                      <TableCell>Approved</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No users found.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => {
                        const pending = u.role === 'officer' && u.is_approved === 0;
                        const busy = actioningId === u.id;
                        const isSelf = Number(u.id) === Number(user?.id);
                        return (
                          <TableRow
                            key={u.id}
                            sx={pending ? { bgcolor: 'rgba(245, 127, 23, 0.12)' } : undefined}
                          >
                            <TableCell>{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={u.role}
                                color={ROLE_CHIP[u.role] || 'default'}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell>{u.district || '—'}</TableCell>
                            <TableCell>{u.is_approved ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{formatDate(u.created_at)}</TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="flex-end"
                                alignItems="center"
                              >
                                {pending && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    disabled={busy}
                                    onClick={() => handleApprove(u.id)}
                                  >
                                    Approve
                                  </Button>
                                )}
                                {u.role !== 'admin' && (
                                  <FormControl size="small" sx={{ minWidth: 110 }}>
                                    <Select
                                      value={u.role}
                                      disabled={busy}
                                      onChange={(e) =>
                                        handleRoleChange(u.id, e.target.value)
                                      }
                                    >
                                      <MenuItem value="farmer">Farmer</MenuItem>
                                      <MenuItem value="officer">Officer</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                                {u.role !== 'admin' && !isSelf && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    disabled={busy}
                                    onClick={() => setConfirmUser(u)}
                                  >
                                    Deactivate
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* --- Articles tab --- */}
        {tab === 1 &&
          (!articlesLoaded ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title (EN)</TableCell>
                    <TableCell>Officer</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Views</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No articles yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((a) => {
                      const chip = ARTICLE_STATUS_CHIP[a.status] || {
                        color: 'default',
                        label: a.status,
                      };
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{a.title_en}</TableCell>
                          <TableCell>{a.officer_name}</TableCell>
                          <TableCell>{CATEGORY_LABEL[a.category] || a.category}</TableCell>
                          <TableCell>
                            <Chip size="small" label={chip.label} color={chip.color} />
                          </TableCell>
                          <TableCell align="right">{a.views}</TableCell>
                          <TableCell>
                            {a.average_rating ? (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Rating
                                  size="small"
                                  value={Number(a.average_rating)}
                                  precision={0.1}
                                  readOnly
                                />
                                <Typography variant="caption" color="text.secondary">
                                  ({a.total_ratings})
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No ratings
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(a.created_at)}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              component={RouterLink}
                              to={`/advisory/${a.id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ))}

        {/* --- Reports tab --- */}
        {tab === 2 &&
          (!reportsLoaded ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Farmer</TableCell>
                    <TableCell>Crop</TableCell>
                    <TableCell>District</TableCell>
                    <TableCell>Disease Found</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No reports yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.farmer_name}</TableCell>
                        <TableCell>{r.crop_type}</TableCell>
                        <TableCell>{r.district}</TableCell>
                        <TableCell>{r.disease_name || 'Unknown'}</TableCell>
                        <TableCell>
                          {r.confidence_level ? (
                            <Chip
                              size="small"
                              label={r.confidence_level}
                              color={CONFIDENCE_COLOR[r.confidence_level] || 'default'}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                            color={r.status === 'reviewed' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{formatDate(r.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => openReport(r)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ))}
      </Container>

      {/* Deactivate confirm dialog */}
      <Dialog open={!!confirmUser} onClose={() => setConfirmUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Deactivate user</DialogTitle>
        <DialogContent>
          <Typography>
            Deactivate <strong>{confirmUser?.name}</strong>? Their account will be demoted
            to an unapproved farmer and lose officer/admin access.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUser(null)} disabled={actioningId === confirmUser?.id}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivate}
            disabled={actioningId === confirmUser?.id}
          >
            {actioningId === confirmUser?.id ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Deactivate'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report detail dialog */}
      <Dialog
        open={!!reportView}
        onClose={() => setReportView(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT }}>Disease Report</DialogTitle>
        <DialogContent dividers>
          {reportView && (
            <Box>
              {reportView.image_url && (
                <Box
                  component="img"
                  src={reportView.image_url}
                  alt={reportView.crop_type}
                  sx={{
                    width: '100%',
                    maxHeight: 240,
                    objectFit: 'cover',
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
              )}
              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontWeight: 700,
                  fontFamily: BILINGUAL_FONT,
                  color: reportDiseaseFound ? 'error.main' : 'success.main',
                }}
              >
                {reportView.disease_name || 'Unknown'}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ my: 1.5 }} flexWrap="wrap">
                <Chip variant="outlined" label={`Farmer: ${reportView.farmer_name}`} />
                <Chip
                  variant="outlined"
                  label={`${reportView.crop_type} · ${reportView.district}`}
                />
                {reportView.confidence_level && (
                  <Chip
                    label={`Confidence: ${reportView.confidence_level}`}
                    color={CONFIDENCE_COLOR[reportView.confidence_level] || 'default'}
                  />
                )}
                <Chip
                  size="small"
                  label={reportView.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                  color={reportView.status === 'reviewed' ? 'success' : 'warning'}
                />
              </Stack>

              <Divider sx={{ my: 1 }} />

              {reportView.symptoms && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Symptoms
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                    {reportView.symptoms}
                  </Typography>
                </Box>
              )}

              <Tabs
                value={reportLang}
                onChange={(_, v) => setReportLang(v)}
                centered
                sx={{ mb: 1 }}
              >
                <Tab label="English" />
                <Tab label="සිංහල" sx={{ fontFamily: BILINGUAL_FONT }} />
              </Tabs>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {reportLang === 0 ? 'Treatment' : 'ප්‍රතිකාරය'}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                {reportLang === 0 ? reportView.treatment_en : reportView.treatment_si}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportView(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
