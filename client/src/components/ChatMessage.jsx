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

// Strips unwanted markdown symbols like **, ###, --- that look broken in chat
function formatMessageContent(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s*(.+)$/gm, '📌 $1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/^\s*\*\s+/gm, '• ')
    .replace(/^[-_]{3,}\s*$/gm, '')
    .replace(/`{1,3}/g, '')
    .trim();
}

export default function ChatMessage({ role, content, created_at }) {
  const isUser = role === 'user';
  const displayContent = isUser ? content : formatMessageContent(content);

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
            {displayContent}
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
