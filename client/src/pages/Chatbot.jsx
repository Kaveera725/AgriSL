import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemText, ListItemIcon, Divider, useMediaQuery, useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import api from '../api/axios';
import ChatMessage from '../components/ChatMessage';
import Navbar from '../components/Navbar';

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

  // Sidebar history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/chat/history');
      setHistory(data.sessions || []);
    } catch (err) {
      console.error('Could not fetch chat history', err);
    } finally {
      setHistoryLoading(false);
    }
  }

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
      setCompleted(false);
      setMessages([]);
      fetchHistory(); // refresh history
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the chat session');
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    // Reactivate locally if it was completed
    if (completed) setCompleted(false);

    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat/message', {
        session_id: session.session_id || session.id,
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
      await api.post('/chat/complete', { session_id: session.session_id || session.id });
      setCompleted(true);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete the session');
    } finally {
      setCompleting(false);
    }
  }

  function handleNewChat() {
    setPhase('setup');
    setSession(null);
    setMessages([]);
    setError('');
    setCompleted(false);
    if (isMobile) setSidebarOpen(false);
  }

  async function loadSession(sessionId) {
    if (session && (session.session_id === sessionId || session.id === sessionId)) {
      if (isMobile) setSidebarOpen(false);
      return;
    }
    
    setPhase('chat');
    setMessages([]);
    setStarting(true);
    setError('');
    
    try {
      const { data } = await api.get(`/chat/session/${sessionId}`);
      setSession(data.session);
      setMessages(data.messages || []);
      setCompleted(data.session.status === 'completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the session');
      setPhase('setup');
    } finally {
      setStarting(false);
      if (isMobile) setSidebarOpen(false);
    }
  }

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewChat}
          sx={{ fontFamily: BILINGUAL_FONT, py: 1 }}
        >
          New Chat
        </Button>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : history.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ p: 2, fontFamily: BILINGUAL_FONT, fontSize: '0.9rem' }}>
            No recent chats.
          </Typography>
        ) : (
          <List>
            {history.map((h) => {
              const isActive = session && (session.session_id === h.id || session.id === h.id);
              return (
                <ListItem key={h.id} disablePadding>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => loadSession(h.id)}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ChatIcon color={isActive ? "primary" : "inherit"} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${h.crop_type} - ${h.district}`}
                      secondary={new Date(h.created_at).toLocaleDateString()}
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: isActive ? 600 : 400,
                        noWrap: true
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop Sidebar */}
        <Box sx={{ width: 280, borderRight: '1px solid #e0e0e0', display: { xs: 'none', md: 'block' } }}>
          {sidebarContent}
        </Box>
        
        {/* Mobile Sidebar */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box' } }}
        >
          {sidebarContent}
        </Drawer>
        
        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', overflow: 'hidden' }}>
          {/* Mobile History Toggle */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, p: 1, borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}>
            <Button onClick={() => setSidebarOpen(true)} startIcon={<MenuIcon />} sx={{ fontFamily: BILINGUAL_FONT }}>
              History
            </Button>
          </Box>
          
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {phase === 'setup' ? (
              <Container maxWidth="sm" sx={{ py: 6 }}>
                <Card elevation={3}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" align="center" sx={{ fontWeight: 700, color: 'primary.main', mb: 3, fontFamily: BILINGUAL_FONT }}>
                      AgriSL Chatbot / AgriSL චැට්බොට්
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Language / භාෂාව</Typography>
                        <ToggleButtonGroup
                          exclusive
                          color="primary"
                          value={form.language}
                          onChange={(e, val) => val && setField('language', val)}
                        >
                          <ToggleButton value="en">English</ToggleButton>
                          <ToggleButton value="si" sx={{ fontFamily: BILINGUAL_FONT }}>සිංහල</ToggleButton>
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
                        {starting ? <CircularProgress size={24} color="inherit" /> : 'Start Chat / චැට් ආරම්භ කරන්න'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Container>
            ) : (
              <Container maxWidth="md" sx={{ py: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', flex: 1, maxHeight: { xs: 'calc(100vh - 130px)', md: 'calc(100vh - 100px)' } }}>
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
                    {session?.crop_type && <Chip size="small" label={session.crop_type} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />}
                    {session?.district && <Chip size="small" label={session.district} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />}
                    {session?.language && (
                      <Chip
                        size="small"
                        label={session.language === 'si' ? 'සිංහල' : 'English'}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: BILINGUAL_FONT }}
                      />
                    )}
                  </Box>

                  {/* Messages */}
                  <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
                    {starting && (
                       <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                         <CircularProgress />
                       </Box>
                    )}
                    {!starting && messages.length === 0 && !sending && (
                      <Typography
                        align="center"
                        color="text.secondary"
                        sx={{ mt: 4, fontFamily: BILINGUAL_FONT }}
                      >
                        {session?.language === 'si'
                          ? 'ඔබගේ ප්‍රශ්නය ටයිප් කර ආරම්භ කරන්න.'
                          : 'Type your question below to begin.'}
                      </Typography>
                    )}
                    {!starting && messages.map((m, i) => (
                      <ChatMessage key={i} role={m.role} content={m.content} created_at={m.created_at} />
                    ))}
                    {sending && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mt: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                          {session?.language === 'si' ? 'පිළිතුරු සකසමින්...' : 'AgriSL is typing...'}
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

                  {completed && (
                    <Alert severity="success" sx={{ borderRadius: 0, mb: 1, mx: 2, fontFamily: BILINGUAL_FONT }}>
                      {session?.language === 'si'
                        ? 'සැසිය සම්පූර්ණයි. (පණිවිඩයක් යැවීමෙන් චැට් එක අලුත් වේ)'
                        : 'Session marked as complete. (Sending a message will resume it)'}
                    </Alert>
                  )}

                  <Paper component="form" onSubmit={handleSend} elevation={0} sx={{ p: 1.5, borderTop: '1px solid #eee' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder={session?.language === 'si' ? 'ඔබගේ ප්‍රශ්නය මෙහි ටයිප් කරන්න...' : 'Type your question...'}
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
                        disabled={completing || completed}
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
                </Card>
              </Container>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
