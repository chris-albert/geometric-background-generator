import { useState } from 'react';
import {
  Paper,
  Typography,
  Slider,
  TextField,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { BackgroundConfig, RGB } from '@geometric-bg/types';

interface ControlPanelProps {
  config: BackgroundConfig;
  onChange: (config: Partial<BackgroundConfig>) => void;
  onRegenerate: () => void;
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function ControlPanel({ config, onChange, onRegenerate }: ControlPanelProps) {
  const [useAccentColor, setUseAccentColor] = useState(!!config.accentColor);

  const handleAccentToggle = (enabled: boolean) => {
    setUseAccentColor(enabled);
    if (enabled) {
      onChange({ accentColor: { r: 80, g: 120, b: 200 }, accentFrequency: 0.05 });
    } else {
      onChange({ accentColor: undefined, accentFrequency: 0 });
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Parameters
      </Typography>

      <Button
        variant="contained"
        fullWidth
        startIcon={<RefreshIcon />}
        onClick={onRegenerate}
        sx={{ mb: 2 }}
      >
        Regenerate
      </Button>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Canvas Size</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Width"
              type="number"
              size="small"
              value={config.width}
              onChange={(e) => onChange({ width: Math.max(100, parseInt(e.target.value) || 100) })}
              inputProps={{ min: 100, max: 7680 }}
            />
            <TextField
              label="Height"
              type="number"
              size="small"
              value={config.height}
              onChange={(e) => onChange({ height: Math.max(100, parseInt(e.target.value) || 100) })}
              inputProps={{ min: 100, max: 4320 }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Presets:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => onChange({ width: 1920, height: 1080 })}>
                  1080p
                </Button>
                <Button size="small" variant="outlined" onClick={() => onChange({ width: 2560, height: 1440 })}>
                  1440p
                </Button>
                <Button size="small" variant="outlined" onClick={() => onChange({ width: 3840, height: 2160 })}>
                  4K
                </Button>
              </Stack>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Triangle Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Triangle Size: {config.triangleSize}px
              </Typography>
              <Slider
                value={config.triangleSize}
                onChange={(_, value) => onChange({ triangleSize: value as number })}
                min={10}
                max={100}
                step={1}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>
                Uniformity: {config.uniformity.toFixed(2)}
              </Typography>
              <Slider
                value={config.uniformity}
                onChange={(_, value) => onChange({ uniformity: value as number })}
                min={0}
                max={1}
                step={0.01}
              />
              <Typography variant="caption" color="text.secondary">
                1 = perfect grid, 0 = chaotic
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Colors</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Base Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="color"
                  value={rgbToHex(config.baseColor)}
                  onChange={(e) => onChange({ baseColor: hexToRgb(e.target.value) })}
                  style={{
                    width: 48,
                    height: 48,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  RGB({config.baseColor.r}, {config.baseColor.g}, {config.baseColor.b})
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                Color Variation: {config.colorVariation}
              </Typography>
              <Slider
                value={config.colorVariation}
                onChange={(_, value) => onChange({ colorVariation: value as number })}
                min={0}
                max={100}
                step={1}
              />
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={useAccentColor}
                  onChange={(e) => handleAccentToggle(e.target.checked)}
                />
              }
              label="Enable Accent Color"
            />

            {useAccentColor && (
              <>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Accent Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={config.accentColor ? rgbToHex(config.accentColor) : '#5078c8'}
                      onChange={(e) => onChange({ accentColor: hexToRgb(e.target.value) })}
                      style={{
                        width: 48,
                        height: 48,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    />
                    {config.accentColor && (
                      <Typography variant="caption" color="text.secondary">
                        RGB({config.accentColor.r}, {config.accentColor.g}, {config.accentColor.b})
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Accent Frequency: {(config.accentFrequency * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={config.accentFrequency}
                    onChange={(_, value) => onChange({ accentFrequency: value as number })}
                    min={0}
                    max={0.5}
                    step={0.01}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Accent Strength: {config.accentStrength.toFixed(2)}
                  </Typography>
                  <Slider
                    value={config.accentStrength}
                    onChange={(_, value) => onChange({ accentStrength: value as number })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <Typography variant="caption" color="text.secondary">
                    0 = subtle blend, 1 = full accent
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Effects</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" gutterBottom>
              Vignette Strength: {config.vignetteStrength.toFixed(2)}
            </Typography>
            <Slider
              value={config.vignetteStrength}
              onChange={(_, value) => onChange({ vignetteStrength: value as number })}
              min={0}
              max={1}
              step={0.01}
            />
            <Typography variant="caption" color="text.secondary">
              Darkens edges toward center
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
