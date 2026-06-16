// Single chat bubble — user messages are right-aligned (primary colour), assistant
// messages are left-aligned (grey). The flat corner points toward the sender.
import { Box, Paper, Typography } from '@mui/material';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

// Formats a UTC timestamp as a locale HH:MM string for the bubble caption.
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessage({ role, content, created_at }) {
  const isUser = role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Box sx={{ maxWidth: '78%' }}>
        <Paper
          elevation={1}
          sx={{
            px: 2,
            py: 1.25,
            bgcolor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? '#fff' : 'text.primary',
            borderRadius: 2,
            borderTopRightRadius: isUser ? 0 : 8,
            borderTopLeftRadius: isUser ? 8 : 0,
          }}
        >
          <Typography
            variant="body1"
            sx={{ fontFamily: BILINGUAL_FONT, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {content}
          </Typography>
        </Paper>
        {created_at && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.25, textAlign: isUser ? 'right' : 'left' }}
          >
            {formatTime(created_at)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
