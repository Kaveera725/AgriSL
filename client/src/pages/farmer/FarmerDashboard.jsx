// Farmer dashboard — profile card with inline edit, and three tabs:
//   Chat History   — past chatbot sessions with a link to read the transcript.
//   Disease Reports — detection results with view-detail and share-with-officer dialogs.
//   Bookmarks       — saved advisory articles with language toggle and remove action.
import { useEffect, useState, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
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
import DevicesIcon from '@mui/icons-material/Devices';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Navbar';
import DiseaseResultCard from '../../components/DiseaseResultCard';

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
  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);

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

  // Delete-chat confirmation dialog
  const [deleteChatId, setDeleteChatId] = useState(null);
  const [deletingChat, setDeletingChat] = useState(false);

  // Delete-report confirmation dialog
  const [deleteReportId, setDeleteReportId] = useState(null);
  const [deletingReport, setDeletingReport] = useState(false);

  // Active sessions (for security panel)
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Fetch active sessions from the server.
  async function fetchSessions() {
    setSessionsLoading(true);
    try {
      const { data } = await api.get('/auth/sessions');
      setSessions(data.sessions || []);
    } catch {
      // silently ignore — sessions panel is non-critical
    } finally {
      setSessionsLoading(false);
    }
  }

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
        // Also load full history with parsed_result if available
        api
          .get('/disease/history')
          .then((res) => {
            if (active && res.data?.reports) {
              setDiseaseReports(res.data.reports);
            }
          })
          .catch(() => {});
      })
      .catch(() => active && setError(t('farmerDash.errLoadDashboard')))
      .finally(() => active && setLoading(false));
    // Load sessions in parallel (non-blocking)
    fetchSessions();
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

  // Revoke all refresh tokens except the current one, then refresh session list.
  async function logoutAllDevices() {
    setLogoutAllLoading(true);
    try {
      await api.post('/auth/logout-all');
      setToast('Logged out from all other devices successfully');
      // Re-fetch sessions so the list reflects only the current session
      await fetchSessions();
    } catch {
      setToast('Could not logout other devices. Please try again.');
    } finally {
      setLogoutAllLoading(false);
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
      setProfile(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile picture');
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  // ---- Delete chat session ----
  // Asks for confirmation via deleteChatId state, then deletes on confirm.
  async function confirmDeleteChat() {
    if (!deleteChatId) return;
    setDeletingChat(true);
    try {
      await api.delete(`/chat/session/${deleteChatId}`);
      setChatSessions((prev) => prev.filter((s) => s.id !== deleteChatId));
      setToast(t('farmerDash.toastChatDeleted') || 'Chat deleted successfully');
    } catch {
      setToast(t('farmerDash.toastChatDeleteErr') || 'Could not delete chat. Please try again.');
    } finally {
      setDeletingChat(false);
      setDeleteChatId(null);
    }
  }

  // ---- Delete disease report ----
  async function confirmDeleteReport() {
    if (!deleteReportId) return;
    setDeletingReport(true);
    try {
      await api.delete(`/disease/${deleteReportId}`);
      setDiseaseReports((prev) => prev.filter((r) => r.id !== deleteReportId));
      setToast(t('farmerDash.toastReportDeleted') || '✅ Report deleted successfully');
    } catch {
      setToast(t('farmerDash.toastReportDeleteErr') || 'Could not delete report. Please try again.');
    } finally {
      setDeletingReport(false);
      setDeleteReportId(null);
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
                  spacing={3}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar 
                        src={profile?.profile_picture ? `${UPLOADS_BASE}/${profile.profile_picture}` : undefined}
                        sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main' }}
                      >
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <IconButton 
                        size="small" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPic}
                        sx={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          bgcolor: 'background.paper',
                          border: '1px solid #ddd',
                          '&:hover': { bgcolor: 'grey.100' }
                        }}
                      >
                        {uploadingPic ? <CircularProgress size={16} /> : <EditIcon fontSize="small" />}
                      </IconButton>
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png"
                        hidden 
                        ref={fileInputRef} 
                        onChange={handleProfilePicChange} 
                      />
                    </Box>
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
                </Stack>
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

            {/* Active Sessions security panel */}
            <Card elevation={2} sx={{ mb: 3, borderLeft: 4, borderColor: 'info.main' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DevicesIcon color="info" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Active Sessions
                    </Typography>
                    {sessions.length > 0 && (
                      <Chip
                        size="small"
                        label={`${sessions.length} device${sessions.length > 1 ? 's' : ''}`}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={logoutAllLoading ? <CircularProgress size={14} color="inherit" /> : <LockOpenIcon />}
                    disabled={logoutAllLoading || sessions.length <= 1}
                    onClick={logoutAllDevices}
                  >
                    Logout All Other Devices
                  </Button>
                </Stack>

                {sessionsLoading ? (
                  <Stack spacing={1}>
                    <Skeleton variant="rounded" height={40} />
                    <Skeleton variant="rounded" height={40} />
                  </Stack>
                ) : sessions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No active sessions found.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {sessions.map((s, idx) => (
                      <Box
                        key={s.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: idx === 0 ? 'rgba(2,136,209,0.06)' : 'grey.50',
                          border: '1px solid',
                          borderColor: idx === 0 ? 'info.light' : 'grey.200',
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <DevicesIcon fontSize="small" color={idx === 0 ? 'info' : 'disabled'} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {s.device_info ? s.device_info.substring(0, 60) + (s.device_info.length > 60 ? '…' : '') : 'Unknown device'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Logged in {formatDate(s.created_at)} · Expires {formatDate(s.expires_at)}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          size="small"
                          label={idx === 0 ? 'Current' : 'Active'}
                          color={idx === 0 ? 'success' : 'default'}
                          variant={idx === 0 ? 'filled' : 'outlined'}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
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
                            <Stack direction="row" spacing={0.5} alignItems="center">
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
                              <Tooltip title={t('farmerDash.deleteChat') || 'Delete chat'}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteChatId(s.id)}
                                  sx={{ ml: 0.5 }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
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
                            {s.days_remaining !== undefined && (
                              <Chip
                                size="small"
                                variant="outlined"
                                color={s.is_expired ? 'default' : 'warning'}
                                label={
                                  s.is_expired
                                    ? t('farmerDash.sessionExpired') || 'Expired'
                                    : fmt(t('farmerDash.daysRemaining') || '{n}d left', { n: s.days_remaining })
                                }
                                sx={{ fontFamily: BILINGUAL_FONT }}
                              />
                            )}
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
                            <Stack direction="row" spacing={1}>
                              {s.can_continue !== false && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<PlayArrowIcon fontSize="small" />}
                                  onClick={() => navigate(`/chatbot?session=${s.id}`)}
                                  sx={{ fontFamily: BILINGUAL_FONT, fontSize: '0.78rem', py: 0.25 }}
                                >
                                  {t('farmerDash.continueChat') || 'Continue'}
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                onClick={() => navigate(`/chatbot/session/${s.id}`)}
                                sx={{ fontFamily: BILINGUAL_FONT, fontSize: '0.78rem', py: 0.25 }}
                              >
                                {t('farmerDash.view')}
                              </Button>
                            </Stack>
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
                    {diseaseReports.map((r) => {
                      const parsed = r.parsed_result || (() => {
                        try {
                          return r.full_result ? JSON.parse(r.full_result) : null;
                        } catch {
                          return null;
                        }
                      })();
                      const dangerLevel = parsed?.danger_level || 'Medium';
                      const recoveryChance =
                        parsed?.recovery_chance?.level ||
                        parsed?.recovery_chance ||
                        (r.confidence_level === 'High' ? 'Good' : 'Fair');
                      const firstSymptom =
                        parsed?.visible_symptoms?.en?.[0] ||
                        (r.symptoms ? r.symptoms.split(/[,.\n]+/)[0]?.trim() : '') ||
                        'No symptom preview available';

                      const DANGER_COLOR = { High: 'error', Medium: 'warning', Low: 'success' };
                      const RECOVERY_COLOR = { Good: 'success', Fair: 'warning', Poor: 'error' };

                      return (
                        <Grid size={{ xs: 12, md: 6 }} key={r.id}>
                          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Stack direction="row" sx={{ flex: 1 }}>
                              {(r.image_url || r.image_path) && (
                                <CardMedia
                                  component="img"
                                  image={r.image_url || `${UPLOADS_BASE}/${r.image_path}`}
                                  alt={r.crop_type}
                                  sx={{ width: 120, objectFit: 'cover' }}
                                />
                              )}
                              <CardContent sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box>
                                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Typography
                                      variant="subtitle1"
                                      sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}
                                    >
                                      {r.disease_name || parsed?.disease_name_en || t('farmerDash.unknownDisease')}
                                    </Typography>
                                    <Tooltip title={t('farmerDash.deleteReport') || 'Delete report'}>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => setDeleteReportId(r.id)}
                                        sx={{ p: 0.5, ml: 0.5 }}
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>

                                  {/* Danger level badge & Recovery chance badge */}
                                  <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }} flexWrap="wrap" useFlexGap>
                                    <Chip
                                      size="small"
                                      label={`Danger: ${dangerLevel}`}
                                      color={DANGER_COLOR[dangerLevel] || 'default'}
                                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                    />
                                    <Chip
                                      size="small"
                                      label={`Recovery: ${recoveryChance}`}
                                      color={RECOVERY_COLOR[recoveryChance] || 'default'}
                                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                    />
                                  </Stack>

                                  {/* First symptom preview */}
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      fontStyle: 'italic',
                                      fontSize: '0.8rem',
                                      lineHeight: 1.3,
                                      mb: 1,
                                    }}
                                  >
                                    "{firstSymptom}"
                                  </Typography>
                                </Box>

                                <Box sx={{ mt: 1 }}>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(r.created_at)}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5}>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<VisibilityIcon fontSize="small" />}
                                        onClick={() => openReport(r.id)}
                                        sx={{ fontFamily: BILINGUAL_FONT, fontSize: '0.75rem', py: 0.25, px: 1 }}
                                      >
                                        View Full Report
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ShareIcon fontSize="small" />}
                                        onClick={() => openShare(r.id)}
                                        sx={{ fontFamily: BILINGUAL_FONT, fontSize: '0.75rem', py: 0.25, px: 0.75 }}
                                      >
                                        {t('farmerDash.share')}
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </CardContent>
                            </Stack>
                          </Card>
                        </Grid>
                      );
                    })}
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
        maxWidth="md"
      >
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('farmerDash.reportTitle') || 'Disease Diagnosis Report'}</span>
          <Button size="small" onClick={() => setReportOpen(false)} sx={{ fontFamily: BILINGUAL_FONT }}>
            {t('farmerDash.close')}
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
          {reportLoading ? (
            <DiseaseResultCard loading={true} />
          ) : reportError ? (
            <Alert severity="error">{reportError}</Alert>
          ) : report ? (
            <DiseaseResultCard
              aiResult={report.parsed_result || report}
              mlResult={
                report.ml_prediction
                  ? {
                      className: report.ml_prediction,
                      confidence: report.ml_confidence,
                      classIndex: report.ml_class_index,
                    }
                  : null
              }
              imageUrl={report.image_url || (report.image_path ? `${UPLOADS_BASE}/${report.image_path}` : null)}
              onShare={() => {
                setReportOpen(false);
                openShare(report.id);
              }}
              showActions={true}
            />
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

      {/* Delete chat confirmation dialog */}
      <Dialog
        open={!!deleteChatId}
        onClose={() => !deletingChat && setDeleteChatId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 700 }}>
          🗑️ {t('farmerDash.deleteChatTitle') || 'Delete Chat'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: BILINGUAL_FONT }}>
            {t('farmerDash.deleteChatConfirm') ||
              'Are you sure you want to delete this chat permanently? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteChatId(null)}
            disabled={deletingChat}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.cancel') || 'Cancel'}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteChat}
            disabled={deletingChat}
            startIcon={deletingChat ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.deleteConfirmBtn') || 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete disease report confirmation dialog */}
      <Dialog
        open={!!deleteReportId}
        onClose={() => !deletingReport && setDeleteReportId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 700 }}>
          🗑️ {t('farmerDash.deleteReportTitle') || 'Delete Report'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: BILINGUAL_FONT }}>
            {t('farmerDash.deleteReportConfirm') ||
              'Are you sure you want to delete this disease report permanently? The uploaded image will also be removed. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteReportId(null)}
            disabled={deletingReport}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.cancel') || 'Cancel'}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteReport}
            disabled={deletingReport}
            startIcon={deletingReport ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ fontFamily: BILINGUAL_FONT }}
          >
            {t('farmerDash.deleteConfirmBtn') || 'Delete Permanently'}
          </Button>
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
