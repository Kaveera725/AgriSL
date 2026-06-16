// Read-only replay of a completed chat session — fetches messages from /chat/session/:id
// and renders them using the same ChatMessage bubble component as the live chatbot.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../api/axios';
import ChatMessage from '../../components/ChatMessage';
import Navbar from '../../components/Navbar';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

export default function SessionView() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>

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
                label={session?.status === 'completed' ? 'Completed' : 'Active'}
                color={session?.status === 'completed' ? 'success' : 'info'}
              />
            </Box>

            {/* Read-only message history */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
              {messages.length === 0 ? (
                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ mt: 4, fontFamily: BILINGUAL_FONT }}
                >
                  This session has no messages.
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

            <Alert severity="info" sx={{ borderRadius: 0, fontFamily: BILINGUAL_FONT }}>
              This is a read-only view of a saved conversation.
            </Alert>
          </Card>
        )}
      </Container>
    </Box>
  );
}
