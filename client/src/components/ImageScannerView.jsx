import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadianceIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpaIcon from '@mui/icons-material/Spa';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

const SCAN_STAGES = [
  {
    titleEn: 'Preprocessing & Normalizing Image',
    titleSi: 'ඡායාරූපය විශ්ලේෂණය සඳහා සකස් කිරීම',
    descEn: 'Scaling pixels & optimizing leaf clarity',
    descSi: 'පත්‍රයේ පැහැදිලිකම ප්‍රශස්ත කිරීම',
  },
  {
    titleEn: 'Scanning Foliage Patterns (35 Disease Classes)',
    titleSi: 'පත්‍ර ලක්ෂණ සහ රෝග රටා 35ක් පරීක්ෂා කිරීම',
    descEn: 'MobileNetV2 neural network inspecting lesions & texture',
    descSi: 'කෘතිම බුද්ධි ආකෘතිය මඟින් රෝග ලක්ෂණ සෙවීම',
  },
  {
    titleEn: 'Formulating Sri Lankan Pathology Advisory',
    titleSi: 'දේශීය කෘෂිකාර්මික උපදෙස් සහ ප්‍රතිකාර සකස් කිරීම',
    descEn: 'Matching recommended treatments, dosages & recovery plan',
    descSi: 'නිර්දේශිත රසායනික/කාබනික ප්‍රතිකාර සහ මාත්‍රා තහවුරු කිරීම',
  },
];

export default function ImageScannerView({
  imagePreview,
  cropType,
  district,
}) {
  const [activeStage, setActiveStage] = useState(0);

  // Progressive simulated stages for smooth farmer feedback
  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStage(1), 1400);
    const timer2 = setTimeout(() => setActiveStage(2), 3400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'primary.light',
        bgcolor: '#ffffff',
      }}
    >
      {/* Top Banner Status — AgriSL Brand Primary Green */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: '#ffffff',
          px: { xs: 2, sm: 3 },
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <BiotechIcon sx={{ fontSize: 24 }} />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, fontFamily: BILINGUAL_FONT, letterSpacing: '0.01em' }}
          >
            AI Image Recognition Active / පරීක්ෂණ ක්‍රියාවලිය ක්‍රියාත්මකයි
          </Typography>
        </Stack>
        <Chip
          icon={<RadianceIcon sx={{ '&&': { color: '#ffffff' } }} />}
          label="Neural Scanner"
          size="small"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.22)',
            color: '#ffffff',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        />
      </Box>

      {/* Selected Crop & District context pill strip */}
      <Box
        sx={{
          bgcolor: 'grey.50',
          px: { xs: 2, sm: 3 },
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
          >
            Target:
          </Typography>
          {cropType && (
            <Chip
              icon={<SpaIcon sx={{ fontSize: 16 }} />}
              label={`Crop: ${cropType}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontFamily: BILINGUAL_FONT }}
            />
          )}
          {district && (
            <Chip
              icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
              label={`District: ${district}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500, fontFamily: BILINGUAL_FONT }}
            />
          )}
          <Chip
            label="35-Class Model"
            size="small"
            color="secondary"
            sx={{ fontWeight: 700, ml: 'auto' }}
          />
        </Stack>
      </Box>

      {/* Image Scanner Viewport with Laser Beam Overlay */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: '#132516',
          minHeight: 280,
          maxHeight: 380,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          p: 1.5,
        }}
      >
        {imagePreview ? (
          <Box
            component="img"
            src={imagePreview}
            alt="Scanning Leaf"
            sx={{
              maxHeight: 340,
              maxWidth: '100%',
              borderRadius: 2,
              objectFit: 'contain',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          />
        ) : (
          <Box sx={{ py: 8, color: 'grey.400', textAlign: 'center' }}>
            <SpaIcon sx={{ fontSize: 60, opacity: 0.5, mb: 1, color: 'primary.light' }} />
            <Typography variant="body2">Processing image buffer...</Typography>
          </Box>
        )}

        {/* Reticle Corner Brackets in Theme Primary Light (#4caf50) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 16,
            pointerEvents: 'none',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              width: 26,
              height: 26,
              borderColor: '#4caf50',
            },
            '&::before': {
              top: 0,
              left: 0,
              borderTop: '3px solid',
              borderLeft: '3px solid',
            },
            '&::after': {
              top: 0,
              right: 0,
              borderTop: '3px solid',
              borderRight: '3px solid',
            },
          }}
        >
          {/* Bottom Corners */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 26,
              height: 26,
              borderBottom: '3px solid #4caf50',
              borderLeft: '3px solid #4caf50',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 26,
              height: 26,
              borderBottom: '3px solid #4caf50',
              borderRight: '3px solid #4caf50',
            }}
          />
        </Box>

        {/* Sweeping Laser Scan Line in Theme Green */}
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            right: 16,
            height: '3px',
            background: 'linear-gradient(90deg, rgba(76,175,80,0) 0%, #4caf50 50%, rgba(76,175,80,0) 100%)',
            boxShadow: '0 0 14px 3px rgba(76, 175, 80, 0.65)',
            animation: 'scannerSweep 2.2s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Floating Scanner Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            bgcolor: 'rgba(19, 37, 22, 0.88)',
            color: '#a5d6a7',
            border: '1px solid rgba(76, 175, 80, 0.4)',
            borderRadius: 5,
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backdropFilter: 'blur(8px)',
            zIndex: 3,
          }}
        >
          <CircularProgress size={14} thickness={6} sx={{ color: '#81c784' }} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, letterSpacing: '0.02em', fontFamily: BILINGUAL_FONT }}
          >
            Foliage Scanner Active / පටක සහ පැල්ලම් විශ්ලේෂණය...
          </Typography>
        </Box>
      </Box>

      {/* Progress Bar — Theme Primary Gradient */}
      <LinearProgress
        color="primary"
        sx={{
          height: 5,
          bgcolor: 'rgba(46, 125, 50, 0.15)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #1b5e20 0%, #2E7D32 50%, #4caf50 100%)',
          },
        }}
      />

      {/* Diagnostic Steps & Farmer Reassurance */}
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 2,
            fontFamily: BILINGUAL_FONT,
          }}
        >
          Diagnostic Progress / රෝග විනිශ්චය පියවර
        </Typography>

        <Stack spacing={2}>
          {SCAN_STAGES.map((stg, idx) => {
            const isCompleted = activeStage > idx;
            const isCurrent = activeStage === idx;

            return (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isCurrent ? 'rgba(46, 125, 50, 0.06)' : 'transparent',
                  border: '1px solid',
                  borderColor: isCurrent ? 'primary.light' : 'transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <Box sx={{ mt: 0.25 }}>
                  {isCompleted ? (
                    <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                  ) : isCurrent ? (
                    <CircularProgress size={20} color="primary" thickness={5} />
                  ) : (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'grey.300',
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500,
                      color: isCurrent ? 'primary.main' : isCompleted ? 'text.primary' : 'text.disabled',
                      fontFamily: BILINGUAL_FONT,
                    }}
                  >
                    {stg.titleEn}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: isCurrent ? 'primary.dark' : 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {stg.titleSi}
                    </Typography>
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.25, display: 'block' }}
                  >
                    {stg.descEn} • {stg.descSi}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>

        {/* Farmer Reassurance Banner */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontFamily: BILINGUAL_FONT, lineHeight: 1.6 }}
          >
            Please wait a few moments while our agricultural system analyzes the leaf.
            <br />
            <strong>කරුණාකර රැඳී සිටින්න.</strong> කෘතිම බුද්ධි ආකෘතිය මඟින් බෝග රෝග රටා 35ක් සමඟ සසඳා නිවැරදි ප්‍රතිකාර සකස් කරමින් පවතී.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
