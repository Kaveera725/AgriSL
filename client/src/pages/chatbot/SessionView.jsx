// Read-only replay of a completed chat session — fetches messages from /chat/session/:id
// and renders them using the same ChatMessage bubble component as the live chatbot.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import api from '../../api/axios';
import ChatMessage from '../../components/ChatMessage';
import Navbar from '../../components/Navbar';
import { useLanguage } from '../../context/LanguageContext';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

export default function SessionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSinhala } = useLanguage();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get(`/chat/session/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setMessages(data.messages || []);
        setError('');
      })
      .catch((err) =>
        active &&
        setError(err.response?.data?.message || 'Could not load this chat session.')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleContinue() {
    setContinuing(true);
    try {
      await api.post('/chat/continue', { session_id: id });
    } catch (err) {
      console.warn('Could not reactivate session', err);
    } finally {
      setContinuing(false);
      navigate(`/chatbot?session=${id}`);
    }
  }

  const canContinue = session?.can_continue !== false && !session?.is_expired;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
          >
            {isSinhala ? 'පාලක පුවරුවට' : 'Back to Dashboard'}
          </Button>

          {canContinue && (
            <Button
              variant="contained"
              color="primary"
              startIcon={continuing ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              disabled={continuing}
              onClick={handleContinue}
              sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 700 }}
            >
              {isSinhala ? 'මෙම චැට් එක ඉදිරියට ගෙන යන්න' : 'Continue Chat Session'}
            </Button>
          )}
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '78vh' }}>
            {/* Session info bar — mirrors the live chatbot header */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }}>
                AgriSL Advisor
              </Typography>
              {session?.crop_type && (
                <Chip
                  size="small"
                  label={session.crop_type}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                />
              )}
              {session?.district && (
                <Chip
                  size="small"
                  label={session.district}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                />
              )}
              {session?.language && (
                <Chip
                  size="small"
                  label={session.language === 'si' ? 'සිංහල' : 'English'}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontFamily: BILINGUAL_FONT,
                  }}
                />
              )}
              <Chip
                size="small"
                label={session?.status === 'completed' ? (isSinhala ? 'අවසන්' : 'Completed') : (isSinhala ? 'ක්‍රියාකාරී' : 'Active')}
                color={session?.status === 'completed' ? 'success' : 'info'}
              />
              {session?.days_remaining !== undefined && (
                <Chip
                  size="small"
                  label={
                    session.is_expired
                      ? (isSinhala ? 'කල් ඉකුත් විය' : 'Expired (>30d)')
                      : isSinhala
                      ? `තව දින ${session.days_remaining}ක් ඇත`
                      : `${session.days_remaining}d left to continue`
                  }
                  sx={{
                    bgcolor: session.is_expired ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                />
              )}
            </Box>

            {/* Message history */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
              {messages.length === 0 ? (
                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ mt: 4, fontFamily: BILINGUAL_FONT }}
                >
                  {isSinhala ? 'මෙම සැසියේ පණිවිඩ නොමැත.' : 'This session has no messages.'}
                </Typography>
              ) : (
                messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    created_at={m.created_at}
                  />
                ))
              )}
            </Box>

            {/* Bottom action banner */}
            {canContinue ? (
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#fff',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: BILINGUAL_FONT }}>
                  {isSinhala
                    ? `මෙම සංවාදය දින 30ක් ඇතුළත ඕනෑම වේලාවක නැවත ඉදිරියට ගෙන යා හැක (තව දින ${session?.days_remaining ?? 30}ක් ඇත).`
                    : `You can continue this chat anytime within 30 days (${session?.days_remaining ?? 30} days remaining).`}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={continuing ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                  disabled={continuing}
                  onClick={handleContinue}
                  sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 700 }}
                >
                  {isSinhala ? 'චැට් එක ඉදිරියට ගෙන යන්න' : 'Continue Chat Session'}
                </Button>
              </Box>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 0, fontFamily: BILINGUAL_FONT }}>
                {isSinhala
                  ? 'මෙම සංවාදය දින 30ක් ඉක්මවා ඇති බැවින් කල් ඉකුත් වී ඇත. එය කියවීමට පමණක් හැකිය.'
                  : 'This chat session is older than 30 days and has expired. It is read-only.'}
              </Alert>
            )}
          </Card>
        )}
      </Container>
    </Box>
  );
}
