// Farmer dashboard — profile card with inline edit, and three tabs:
//   Chat History   — past chatbot sessions with a link to read the transcript.
//   Disease Reports — detection results with view-detail and share-with-officer dialogs.
//   Bookmarks       — saved advisory articles with language toggle and remove action.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Stack } from '../../components/muiSystem';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import BugReportIcon from '@mui/icons-material/BugReport';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatIcon from '@mui/icons-material/Chat';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Navbar';

// Fill {placeholders} in a translated string, e.g. fmt('Show ({n})', { n: 3 }).
function fmt(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';
// Uploads are served from the API origin (not under /api), so build URLs directly.
const UPLOADS_BASE = 'http://localhost:5000/uploads';

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const CATEGORY_LABEL = {
  crop_management: { en: 'Crop Management', si: 'බෝග කළමනාකරණය' },
  pest_control: { en: 'Pest Control', si: 'පළිබෝධ පාලනය' },
  seasonal_planting: { en: 'Seasonal Planting', si: 'සෘතුමය වගාව' },
  disease_treatment: { en: 'Disease Treatment', si: 'රෝග ප්‍රතිකාර' },
  market_advice: { en: 'Market Advice', si: 'වෙළඳපොළ උපදෙස්' },
  general: { en: 'General', si: 'සාමාන්‍ය' },
};

const CONFIDENCE_COLOR = { High: 'success', Medium: 'warning', Low: 'error' };

// Converts a UTC timestamp to the browser's local date string (e.g. "6/17/2026").
// Returns empty string for null/invalid values so JSX renders nothing.
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  // Chat sessions older than chatArchiveDays are hidden by default; the farmer
  // can pull them in on demand. archivedChatCount is how many are tucked away.
  const [archivedChatCount, setArchivedChatCount] = useState(0);
  const [chatArchiveDays, setChatArchiveDays] = useState(30);
  const [showAllChats, setShowAllChats] = useState(false);
  const [loadingAllChats, setLoadingAllChats] = useState(false);
  const [diseaseReports, setDiseaseReports] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState('');

  // Edit-profile dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  // Disease-report view dialog
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportLang, setReportLang] = useState(0); // 0 = EN, 1 = SI

  // Share dialog
  const [shareOpen, setShareOpen] = useState(false);
  const [shareReportId, setShareReportId] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shared, setShared] = useState(false);

  // Bookmarks language toggle
  const [bmLang, setBmLang] = useState('en');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/dashboard/farmer')
      .then(({ data }) => {
        if (!active) return;
        setProfile(data.profile);
        setChatSessions(data.chat_sessions || []);
        setArchivedChatCount(data.archived_chat_count || 0);
        setChatArchiveDays(data.chat_archive_days || 30);
        setDiseaseReports(data.disease_reports || []);
        setBookmarks(data.bookmarks || []);
        setError('');
      })
      .catch(() => active && setError(t('farmerDash.errLoadDashboard')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [t]);

  // ---- Older chat sessions ----
  // Pulls the full chat history (including sessions older than the archive
  // window) and switches the Chat History tab to show everything.
  async function loadOlderChats() {
    setLoadingAllChats(true);
    try {
      const { data } = await api.get('/chat/history');
      setChatSessions(data.sessions || []);
      setShowAllChats(true);
    } catch {
      setToast(t('farmerDash.loadOlderError'));
    } finally {
      setLoadingAllChats(false);
    }
  }

  // ---- Profile editing ----
  // Pre-populates the dialog fields with the current profile values before opening.
  function openEdit() {
    setEditName(profile?.name || '');
    setEditDistrict(profile?.district || '');
    setEditError('');
    setEditOpen(true);
  }

  // Saves the profile edit. The server re-issues a JWT containing the new name;
  // calling login() swaps in the fresh token so the Navbar avatar updates immediately.
  async function saveProfile() {
    if (!editName.trim() || !editDistrict) {
      setEditError(t('farmerDash.errNameDistrict'));
      return;
    }
    setSavingProfile(true);
    setEditError('');
    try {
      const { data } = await api.put('/auth/profile', {
        name: editName.trim(),
        district: editDistrict,
      });
      // Refresh the decoded session so the navbar reflects the new name.
      if (data.token) login(data.token);
      setProfile((p) => ({ ...p, name: data.user.name, district: data.user.district }));
      setEditOpen(false);
      setToast(t('farmerDash.toastProfileUpdated'));
    } catch (err) {
      setEditError(err.response?.data?.message || t('farmerDash.errUpdateProfile'));
    } finally {
      setSavingProfile(false);
    }
  }

  // ---- Disease report view ----
  // Opens the report dialog and clears previous content before fetching the new one,
  // so the loading spinner is shown instead of stale data from the last opened report.
  async function openReport(id) {
    setReportOpen(true);
    setReport(null);
    setReportError('');
    setReportLang(0);
    setReportLoading(true);
    try {
      const { data } = await api.get(`/disease/${id}`);
      setReport(data.report);
    } catch (err) {
      setReportError(err.response?.data?.message || t('farmerDash.errLoadReport'));
    } finally {
      setReportLoading(false);
    }
  }

  // ---- Share with officer ----
  // Opens the share dialog immediately (no loading spinner needed) while fetching
  // the officers list in parallel so the dialog feels responsive.
  async function openShare(id) {
    setShareReportId(id);
    setSelectedOfficer('');
    setShareError('');
    setShared(false);
    setShareOpen(true);
    try {
      const { data } = await api.get('/users/officers');
      setOfficers(data.officers || []);
    } catch {
      setOfficers([]);
    }
  }

  // Submits the share request and auto-closes the dialog after a 1.5 s success display.
  async function handleShare() {
    if (!selectedOfficer) {
      setShareError(t('farmerDash.errSelectOfficer'));
      return;
    }
    setSharing(true);
    setShareError('');
    try {
      await api.post('/disease/share', {
        report_id: shareReportId,
        officer_id: selectedOfficer,
      });
      setShared(true);
      setTimeout(() => setShareOpen(false), 1500);
    } catch (err) {
      setShareError(err.response?.data?.message || t('farmerDash.errShareReport'));
    } finally {
      setSharing(false);
    }
  }

  // ---- Remove bookmark ----
  // Removes the bookmark and immediately filters it out of local state so the
  // card disappears without waiting for a re-fetch.
  async function removeBookmark(articleId) {
    setRemovingId(articleId);
    try {
      await api.delete(`/advisory/${articleId}/bookmark`);
      setBookmarks((list) => list.filter((b) => b.id !== articleId));
      setToast(t('farmerDash.toastBookmarkRemoved'));
    } catch {
      setToast(t('farmerDash.toastBookmarkErr'));
    } finally {
      setRemovingId(null);
    }
  }

  const diseaseFound =
    report && report.disease_name && report.disease_name !== 'No disease detected';

  // Translate a stored High/Medium/Low confidence value for display while keeping
  // the original English value as the colour-map key.
  const confidenceLabel = (level) =>
    fmt(t('farmerDash.confidence'), { level: t(`farmerDash.conf${level}`) });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={3}>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={120} />
          </Stack>
        ) : (
          <>
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
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'primary.main', fontFamily: BILINGUAL_FONT }}
                >
                  {t('farmerDash.title')}
                </Typography>
                {profile?.name && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: BILINGUAL_FONT }}
                  >
                    {fmt(t('farmerDash.welcome'), { name: profile.name })}
                  </Typography>
                )}
              </Box>
              <Chip
                icon={<AgricultureIcon />}
                label={t('farmerDash.roleFarmer')}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600, fontFamily: BILINGUAL_FONT }}
              />
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Profile card */}
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                >
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {profile?.name}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      sx={{ mt: 1, color: 'text.secondary' }}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <EmailIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{profile?.email}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PlaceIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                          {profile?.district || t('farmerDash.noDistrict')}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CalendarMonthIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                          {fmt(t('farmerDash.memberSince'), {
                            date: formatDate(profile?.created_at),
                          })}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={openEdit}
                    sx={{ fontFamily: BILINGUAL_FONT }}
                  >
                    {t('farmerDash.editProfile')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  icon={<ChatIcon fontSize="large" />}
                  label={t('farmerDash.statChats')}
                  value={chatSessions.length}
                  color="secondary.main"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  icon={<BugReportIcon fontSize="large" />}
                  label={t('farmerDash.statReports')}
                  value={diseaseReports.length}
                  color="error.main"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  icon={<BookmarkIcon fontSize="large" />}
                  label={t('farmerDash.statBookmarks')}
                  value={bookmarks.length}
                  color="warning.main"
                />
              </Grid>
            </Grid>

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 2, '& .MuiTab-root': { fontFamily: BILINGUAL_FONT } }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<ChatIcon />} iconPosition="start" label={t('farmerDash.tabChats')} />
              <Tab
                icon={<BugReportIcon />}
                iconPosition="start"
                label={t('farmerDash.tabReports')}
              />
              <Tab
                icon={<BookmarkIcon />}
                iconPosition="start"
                label={t('farmerDash.tabBookmarks')}
              />
            </Tabs>

            {/* --- Chat History tab --- */}
            {tab === 0 && (
              <>
                {/* Explain that older chats are tucked away, not lost. */}
                {!showAllChats && (
                  <Alert
                    severity="info"
                    icon={<ChatIcon />}
                    sx={{ mb: 2, fontFamily: BILINGUAL_FONT }}
                  >
                    {fmt(t('farmerDash.chatArchiveNote'), { days: chatArchiveDays })}
                  </Alert>
                )}

                {chatSessions.length === 0 ? (
                  <EmptyState
                    text={
                      archivedChatCount > 0 && !showAllChats
                        ? fmt(t('farmerDash.noRecentChats'), {
                            days: chatArchiveDays,
                            n: archivedChatCount,
                          })
                        : t('farmerDash.noChatsYet')
                    }
                  />
                ) : (
                  <Grid container spacing={2}>
                    {chatSessions.map((s) => (
                    <Grid size={{ xs: 12, md: 6 }} key={s.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AgricultureIcon color="primary" />
                              <Typography sx={{ fontWeight: 600 }}>{s.crop_type}</Typography>
                            </Stack>
                            <Chip
                              size="small"
                              label={
                                s.status === 'completed'
                                  ? t('farmerDash.statusCompleted')
                                  : t('farmerDash.statusActive')
                              }
                              color={s.status === 'completed' ? 'success' : 'info'}
                              sx={{ fontFamily: BILINGUAL_FONT }}
                            />
                          </Stack>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                            <Chip size="small" variant="outlined" label={s.district} />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={s.language === 'si' ? 'SI' : 'EN'}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={fmt(t('farmerDash.messagesCount'), {
                                n: s.message_count,
                              })}
                              sx={{ fontFamily: BILINGUAL_FONT }}
                            />
                          </Stack>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mt: 1.5 }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(s.created_at)}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate(`/chatbot/session/${s.id}`)}
                              sx={{ fontFamily: BILINGUAL_FONT }}
                            >
                              {t('farmerDash.view')}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Reopen archived (older) conversations on demand. */}
                {archivedChatCount > 0 && !showAllChats && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={
                        loadingAllChats ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <ChatIcon />
                        )
                      }
                      disabled={loadingAllChats}
                      onClick={loadOlderChats}
                      sx={{ fontFamily: BILINGUAL_FONT }}
                    >
                      {fmt(t('farmerDash.showOlderChats'), { n: archivedChatCount })}
                    </Button>
                  </Box>
                )}
              </>
            )}

            {/* --- Disease Reports tab --- */}
            {tab === 1 && (
              <>
                <Alert
                  severity="success"
                  icon={<BugReportIcon />}
                  sx={{ mb: 2, fontFamily: BILINGUAL_FONT }}
                >
                  {t('farmerDash.diseaseKeptNote')}
                </Alert>
                {diseaseReports.length === 0 ? (
                  <EmptyState text={t('farmerDash.noReportsYet')} />
                ) : (
                  <Grid container spacing={2}>
                    {diseaseReports.map((r) => (
                    <Grid size={{ xs: 12, md: 6 }} key={r.id}>
                      <Card variant="outlined">
                        <Stack direction="row">
                          {r.image_path && (
                            <CardMedia
                              component="img"
                              image={`${UPLOADS_BASE}/${r.image_path}`}
                              alt={r.crop_type}
                              sx={{ width: 110, objectFit: 'cover' }}
                            />
                          )}
                          <CardContent sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <Typography sx={{ fontWeight: 600 }}>{r.crop_type}</Typography>
                              <Chip
                                size="small"
                                label={
                                  r.status === 'reviewed'
                                    ? t('farmerDash.statusReviewed')
                                    : t('farmerDash.statusPending')
                                }
                                color={r.status === 'reviewed' ? 'success' : 'warning'}
                                sx={{ fontFamily: BILINGUAL_FONT }}
                              />
                            </Stack>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: 'error.main',
                                mt: 0.5,
                                fontFamily: BILINGUAL_FONT,
                              }}
                            >
                              {r.disease_name || t('farmerDash.unknownDisease')}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                              {r.confidence_level && (
                                <Chip
                                  size="small"
                                  label={confidenceLabel(r.confidence_level)}
                                  color={CONFIDENCE_COLOR[r.confidence_level] || 'default'}
                                  sx={{ fontFamily: BILINGUAL_FONT }}
                                />
                              )}
                              <Chip size="small" variant="outlined" label={r.district} />
                            </Stack>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mt: 1.5 }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(r.created_at)}
                              </Typography>
                              <Stack direction="row" spacing={0.5}>
                                <Button
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => openReport(r.id)}
                                  sx={{ fontFamily: BILINGUAL_FONT }}
                                >
                                  {t('farmerDash.view')}
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<ShareIcon />}
                                  onClick={() => openShare(r.id)}
                                  sx={{ fontFamily: BILINGUAL_FONT }}
                                >
                                  {t('farmerDash.share')}
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {/* --- Bookmarks tab --- */}
            {tab === 2 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <ToggleButtonGroup
                    value={bmLang}
                    exclusive
                    size="small"
                    color="primary"
                    onChange={(_, v) => v && setBmLang(v)}
                  >
                    <ToggleButton value="en">English</ToggleButton>
                    <ToggleButton value="si" sx={{ fontFamily: BILINGUAL_FONT }}>
                      සිංහල
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {bookmarks.length === 0 ? (
                  <EmptyState text={t('farmerDash.noBookmarksYet')} />
                ) : (
                  <Grid container spacing={2}>
                    {bookmarks.map((b) => {
                      const title =
                        bmLang === 'si' ? b.title_si || b.title_en : b.title_en || b.title_si;
                      const cat = CATEGORY_LABEL[b.category];
                      const categoryLabel = cat ? cat[bmLang] || cat.en : b.category;
                      return (
                        <Grid size={{ xs: 12, md: 6 }} key={b.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                spacing={1}
                              >
                                <Typography
                                  sx={{ fontWeight: 600, fontFamily: BILINGUAL_FONT }}
                                >
                                  {title}
                                </Typography>
                                <Tooltip title={t('farmerDash.removeBookmark')}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={removingId === b.id}
                                      onClick={() => removeBookmark(b.id)}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                                <Chip
                                  size="small"
                                  color="secondary"
                                  label={categoryLabel}
                                  sx={{ fontFamily: BILINGUAL_FONT }}
                                />
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={b.officer_name}
                                />
                              </Stack>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mt: 1.5 }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontFamily: BILINGUAL_FONT }}
                                >
                                  {fmt(t('farmerDash.saved'), {
                                    date: formatDate(b.bookmarked_at),
                                  })}
                                </Typography>
                                <Button
                                  size="small"
                                  component={RouterLink}
                                  to={`/advisory/${b.id}`}
                                  sx={{ fontFamily: BILINGUAL_FONT }}
                                >
                                  {t('farmerDash.readArticle')}
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT }}>
          {t('farmerDash.editProfile')}
        </DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2, fontFamily: BILINGUAL_FONT }}>
              {editError}
            </Alert>
          )}
          <TextField
            label={t('farmerDash.name')}
            fullWidth
            margin="normal"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="edit-district-label">{t('farmerDash.districtLabel')}</InputLabel>
            <Select
              labelId="edit-district-label"
              label={t('farmerDash.districtLabel')}
              value={editDistrict}
              onChange={(e) => setEditDistrict(e.target.value)}
            >
              {DISTRICTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditOpen(false)}
            disabled={savingProfile}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={saveProfile}
            disabled={savingProfile}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {savingProfile ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('farmerDash.save')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disease report view dialog */}
      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT }}>
          {t('farmerDash.reportTitle')}
        </DialogTitle>
        <DialogContent dividers>
          {reportLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reportError ? (
            <Alert severity="error">{reportError}</Alert>
          ) : report ? (
            <Box>
              {report.image_url && (
                <Box
                  component="img"
                  src={report.image_url}
                  alt={report.crop_type}
                  sx={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 1, mb: 2 }}
                />
              )}
              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontWeight: 700,
                  fontFamily: BILINGUAL_FONT,
                  color: diseaseFound ? 'error.main' : 'success.main',
                }}
              >
                {report.disease_name}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ my: 1.5 }}>
                {report.confidence_level && (
                  <Chip
                    label={confidenceLabel(report.confidence_level)}
                    color={CONFIDENCE_COLOR[report.confidence_level] || 'default'}
                    sx={{ fontFamily: BILINGUAL_FONT }}
                  />
                )}
                <Chip variant="outlined" label={`${report.crop_type} · ${report.district}`} />
                <Chip
                  size="small"
                  label={
                    report.status === 'reviewed'
                      ? t('farmerDash.statusReviewed')
                      : t('farmerDash.statusPending')
                  }
                  color={report.status === 'reviewed' ? 'success' : 'warning'}
                  sx={{ fontFamily: BILINGUAL_FONT }}
                />
              </Stack>

              <Divider sx={{ my: 1 }} />

              {report.symptoms && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontFamily: BILINGUAL_FONT }}
                  >
                    {t('farmerDash.symptoms')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                    {report.symptoms}
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
                {reportLang === 0 ? report.treatment_en : report.treatment_si}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReportOpen(false)}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT }}>
          {t('farmerDash.shareTitle')}
        </DialogTitle>
        <DialogContent>
          {shared ? (
            <Alert severity="success" sx={{ fontFamily: BILINGUAL_FONT }}>
              {t('farmerDash.shareSuccess')}
            </Alert>
          ) : (
            <>
              {shareError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {shareError}
                </Alert>
              )}
              {officers.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontFamily: BILINGUAL_FONT }}>
                  {t('farmerDash.noOfficers')}
                </Typography>
              ) : (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel id="share-officer-label">
                    {t('farmerDash.selectOfficer')}
                  </InputLabel>
                  <Select
                    labelId="share-officer-label"
                    label={t('farmerDash.selectOfficer')}
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                  >
                    {officers.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name} — {o.district}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShareOpen(false)}
            disabled={sharing}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.cancel')}
          </Button>
          {!shared && (
            <Button
              variant="contained"
              onClick={handleShare}
              disabled={sharing || officers.length === 0}
              sx={{ fontFamily: BILINGUAL_FONT }}
            >
              {sharing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                t('farmerDash.share')
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: BILINGUAL_FONT }}
            >
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Shared placeholder card shown when a tab has no data yet.
function EmptyState({ text }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">{text}</Typography>
      </CardContent>
    </Card>
  );
}
