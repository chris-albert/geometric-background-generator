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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { BackgroundConfig, RGB, ShapeType } from '@geometric-bg/types';
import { shapeTypes } from '@geometric-bg/types';

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
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Parameters
      </Typography>

      <Button
        variant="contained"
        fullWidth
        size="small"
        startIcon={<RefreshIcon />}
        onClick={onRegenerate}
        sx={{ mb: 1.5 }}
      >
        Regenerate
      </Button>

      <Accordion defaultExpanded disableGutters sx={{ '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent', mb: 0.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight="medium">Canvas Size</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1, py: 1 }}>
          <Stack spacing={1.5}>
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

      <Accordion defaultExpanded disableGutters sx={{ '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent', mb: 0.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight="medium">Shape Settings</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1, py: 1 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Shape Type
              </Typography>
              <ToggleButtonGroup
                value={config.shapeType}
                exclusive
                onChange={(_, value) => value && onChange({ shapeType: value as ShapeType })}
                size="small"
                fullWidth
                sx={{ flexWrap: 'wrap' }}
              >
                {shapeTypes.map((shape) => (
                  <ToggleButton key={shape} value={shape} sx={{ textTransform: 'capitalize', flex: '1 1 45%' }}>
                    {shape}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Shape Size: {config.shapeSize}px
              </Typography>
              <Slider
                value={config.shapeSize}
                onChange={(_, value) => onChange({ shapeSize: value as number })}
                min={10}
                max={100}
                step={1}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Uniformity: {config.uniformity.toFixed(2)}
              </Typography>
              <Slider
                value={config.uniformity}
                onChange={(_, value) => onChange({ uniformity: value as number })}
                min={0}
                max={1}
                step={0.01}
                size="small"
              />
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters sx={{ '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent', mb: 0.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight="medium">Colors</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1, py: 1 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Base Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="color"
                  value={rgbToHex(config.baseColor)}
                  onChange={(e) => onChange({ baseColor: hexToRgb(e.target.value) })}
                  style={{
                    width: 36,
                    height: 36,
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
              <Typography variant="caption" color="text.secondary">
                Color Variation: {config.colorVariation}
              </Typography>
              <Slider
                value={config.colorVariation}
                onChange={(_, value) => onChange({ colorVariation: value as number })}
                min={0}
                max={100}
                step={1}
                size="small"
              />
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={useAccentColor}
                  onChange={(e) => handleAccentToggle(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Enable Accent Color</Typography>}
            />

            {useAccentColor && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Accent Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={config.accentColor ? rgbToHex(config.accentColor) : '#5078c8'}
                      onChange={(e) => onChange({ accentColor: hexToRgb(e.target.value) })}
                      style={{
                        width: 36,
                        height: 36,
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
                  <Typography variant="caption" color="text.secondary">
                    Accent Frequency: {(config.accentFrequency * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={config.accentFrequency}
                    onChange={(_, value) => onChange({ accentFrequency: value as number })}
                    min={0}
                    max={0.5}
                    step={0.01}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Accent Strength: {config.accentStrength.toFixed(2)}
                  </Typography>
                  <Slider
                    value={config.accentStrength}
                    onChange={(_, value) => onChange({ accentStrength: value as number })}
                    min={0}
                    max={1}
                    step={0.01}
                    size="small"
                  />
                </Box>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters sx={{ '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent', mb: 0.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight="medium">Effects</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1, py: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Vignette Strength: {config.vignetteStrength.toFixed(2)}
            </Typography>
            <Slider
              value={config.vignetteStrength}
              onChange={(_, value) => onChange({ vignetteStrength: value as number })}
              min={0}
              max={1}
              step={0.01}
              size="small"
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
