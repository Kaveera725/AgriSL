import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../api/axios';
import ChatMessage from '../components/ChatMessage';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

const CROP_OPTIONS = [
  { value: 'Rice', label: 'Rice (වී)' },
  { value: 'Tea', label: 'Tea (තේ)' },
  { value: 'Coconut', label: 'Coconut (පොල්)' },
  { value: 'Rubber', label: 'Rubber (රබර්)' },
  { value: 'Vegetables', label: 'Vegetables (එළවළු)' },
  { value: 'Fruits', label: 'Fruits (පලතුරු)' },
  { value: 'Spices', label: 'Spices (කුළුබඩු)' },
  { value: 'Maize', label: 'Maize (ඉරිඟු)' },
  { value: 'Onions', label: 'Onions (ළූණු)' },
  { value: 'Chilli', label: 'Chilli (මිරිස්)' },
  { value: 'Other', label: 'Other (වෙනත්)' },
];

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

export default function Chatbot() {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'chat'
  const [form, setForm] = useState({ crop_type: '', district: '', language: 'en' });
  const [session, setSession] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleStart(e) {
    e.preventDefault();
    setError('');
    if (!form.crop_type || !form.district) {
      setError('Please select a crop type and district');
      return;
    }
    setStarting(true);
    try {
      const { data } = await api.post('/chat/start', form);
      setSession(data);
      setPhase('chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the chat session');
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || completed) return;

    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat/message', {
        session_id: session.session_id,
        message: text,
      });
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.message, created_at: new Date().toISOString() },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not get a response, please try again');
    } finally {
      setSending(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError('');
    try {
      await api.post('/chat/complete', { session_id: session.session_id });
      setCompleted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete the session');
    } finally {
      setCompleting(false);
    }
  }

  // ---- Setup form ----
  if (phase === 'setup') {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              align="center"
              sx={{ fontWeight: 700, color: 'primary.main', mb: 3, fontFamily: BILINGUAL_FONT }}
            >
              AgriSL Chatbot / AgriSL චැට්බොට්
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleStart}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="crop-label">Crop Type</InputLabel>
                <Select
                  labelId="crop-label"
                  label="Crop Type"
                  value={form.crop_type}
                  onChange={(e) => setField('crop_type', e.target.value)}
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  {CROP_OPTIONS.map((c) => (
                    <MenuItem key={c.value} value={c.value} sx={{ fontFamily: BILINGUAL_FONT }}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel id="district-label">District</InputLabel>
                <Select
                  labelId="district-label"
                  label="District"
                  value={form.district}
                  onChange={(e) => setField('district', e.target.value)}
                >
                  {DISTRICTS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Language / භාෂාව
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  color="primary"
                  value={form.language}
                  onChange={(e, val) => val && setField('language', val)}
                >
                  <ToggleButton value="en">English</ToggleButton>
                  <ToggleButton value="si" sx={{ fontFamily: BILINGUAL_FONT }}>
                    සිංහල
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={starting}
                sx={{ mt: 4, fontFamily: BILINGUAL_FONT }}
              >
                {starting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Start Chat / චැට් ආරම්භ කරන්න'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ---- Chat interface ----
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
        {/* Session info bar */}
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
          <Chip size="small" label={session.crop_type} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
          <Chip size="small" label={session.district} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
          <Chip
            size="small"
            label={session.language === 'si' ? 'සිංහල' : 'English'}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: BILINGUAL_FONT }}
          />
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
          {messages.length === 0 && !sending && (
            <Typography
              align="center"
              color="text.secondary"
              sx={{ mt: 4, fontFamily: BILINGUAL_FONT }}
            >
              {session.language === 'si'
                ? 'ඔබගේ ප්‍රශ්නය ටයිප් කර ආරම්භ කරන්න.'
                : 'Type your question below to begin.'}
            </Typography>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} created_at={m.created_at} />
          ))}
          {sending && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mt: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                {session.language === 'si' ? 'පිළිතුරු සකසමින්...' : 'AgriSL is typing...'}
              </Typography>
            </Box>
          )}
          <div ref={scrollRef} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {error}
          </Alert>
        )}

        {completed ? (
          <Alert severity="success" sx={{ borderRadius: 0, fontFamily: BILINGUAL_FONT }}>
            {session.language === 'si'
              ? 'සැසිය සම්පූර්ණයි. ඔබගේ උපකරණ පුවරුවට සුරැකින ලදී.'
              : 'Session complete and saved to your dashboard.'}
          </Alert>
        ) : (
          <Paper component="form" onSubmit={handleSend} elevation={0} sx={{ p: 1.5, borderTop: '1px solid #eee' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder={session.language === 'si' ? 'ඔබගේ ප්‍රශ්නය මෙහි ටයිප් කරන්න...' : 'Type your question...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
                }}
                disabled={sending}
                slotProps={{ input: { sx: { fontFamily: BILINGUAL_FONT } } }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={sending || !input.trim()}
                sx={{ minWidth: 56, height: 56 }}
              >
                <SendIcon />
              </Button>
            </Stack>
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleComplete}
                disabled={completing}
                sx={{ fontFamily: BILINGUAL_FONT }}
              >
                {completing ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  'Complete & Save Session'
                )}
              </Button>
            </Box>
          </Paper>
        )}
      </Card>
    </Container>
  );
}
