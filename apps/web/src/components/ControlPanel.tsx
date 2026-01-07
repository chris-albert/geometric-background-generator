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
import type { BackgroundConfig, RGB, ShapeType, GradientDirection } from '@geometric-bg/types';
import { shapeTypes, gradientDirections } from '@geometric-bg/types';

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

const accordionSx = { '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent', mb: 0.5 };
const accordionSummarySx = { minHeight: 36, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } };
const accordionDetailsSx = { px: 1, py: 1 };

export function ControlPanel({ config, onChange, onRegenerate }: ControlPanelProps) {
  const [useAccentColor, setUseAccentColor] = useState(!!config.accentColor);
  const [useSecondaryColor, setUseSecondaryColor] = useState(!!config.secondaryColor);
  const [useStroke, setUseStroke] = useState(config.strokeWidth > 0);

  const handleAccentToggle = (enabled: boolean) => {
    setUseAccentColor(enabled);
    if (enabled) {
      onChange({ accentColor: { r: 80, g: 120, b: 200 }, accentFrequency: 0.05 });
    } else {
      onChange({ accentColor: undefined, accentFrequency: 0, glowStrength: 0 });
    }
  };

  const handleSecondaryToggle = (enabled: boolean) => {
    setUseSecondaryColor(enabled);
    if (enabled) {
      onChange({ secondaryColor: { r: 60, g: 60, b: 80 }, secondaryColorBlend: 0.5 });
    } else {
      onChange({ secondaryColor: undefined, secondaryColorBlend: 0 });
    }
  };

  const handleStrokeToggle = (enabled: boolean) => {
    setUseStroke(enabled);
    if (enabled) {
      onChange({ strokeWidth: 1, strokeColor: { r: 255, g: 255, b: 255 } });
    } else {
      onChange({ strokeWidth: 0, strokeColor: undefined });
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

      {/* Canvas Size */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Canvas Size</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
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

      {/* Shape Settings */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Shape Settings</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
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
                Density: {config.density.toFixed(2)}x
              </Typography>
              <Slider
                value={config.density}
                onChange={(_, value) => onChange({ density: value as number })}
                min={0.5}
                max={2}
                step={0.1}
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

      {/* Shape Variation */}
      <Accordion disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Shape Variation</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Size Variation: {(config.sizeVariation * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={config.sizeVariation}
                onChange={(_, value) => onChange({ sizeVariation: value as number })}
                min={0}
                max={0.8}
                step={0.01}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rotation: {(config.rotation * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={config.rotation}
                onChange={(_, value) => onChange({ rotation: value as number })}
                min={0}
                max={1}
                step={0.01}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Opacity Variation: {(config.opacityVariation * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={config.opacityVariation}
                onChange={(_, value) => onChange({ opacityVariation: value as number })}
                min={0}
                max={1}
                step={0.01}
                size="small"
              />
            </Box>
            {config.opacityVariation > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Min Opacity: {(config.minOpacity * 100).toFixed(0)}%
                </Typography>
                <Slider
                  value={config.minOpacity}
                  onChange={(_, value) => onChange({ minOpacity: value as number })}
                  min={0.1}
                  max={1}
                  step={0.01}
                  size="small"
                />
              </Box>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Colors */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Colors</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
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

            <Box>
              <Typography variant="caption" color="text.secondary">
                Saturation Variation: {config.saturationVariation}
              </Typography>
              <Slider
                value={config.saturationVariation}
                onChange={(_, value) => onChange({ saturationVariation: value as number })}
                min={0}
                max={50}
                step={1}
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Brightness Variation: {config.brightnessVariation}
              </Typography>
              <Slider
                value={config.brightnessVariation}
                onChange={(_, value) => onChange({ brightnessVariation: value as number })}
                min={0}
                max={50}
                step={1}
                size="small"
              />
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={useSecondaryColor}
                  onChange={(e) => handleSecondaryToggle(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Secondary Color</Typography>}
            />

            {useSecondaryColor && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Secondary Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={config.secondaryColor ? rgbToHex(config.secondaryColor) : '#3c3c50'}
                      onChange={(e) => onChange({ secondaryColor: hexToRgb(e.target.value) })}
                      style={{
                        width: 36,
                        height: 36,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    />
                    {config.secondaryColor && (
                      <Typography variant="caption" color="text.secondary">
                        RGB({config.secondaryColor.r}, {config.secondaryColor.g}, {config.secondaryColor.b})
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Blend: {(config.secondaryColorBlend * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={config.secondaryColorBlend}
                    onChange={(_, value) => onChange({ secondaryColorBlend: value as number })}
                    min={0}
                    max={1}
                    step={0.01}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Gradient Direction
                  </Typography>
                  <ToggleButtonGroup
                    value={config.gradientDirection}
                    exclusive
                    onChange={(_, value) => value && onChange({ gradientDirection: value as GradientDirection })}
                    size="small"
                    fullWidth
                    sx={{ flexWrap: 'wrap' }}
                  >
                    {gradientDirections.map((dir) => (
                      <ToggleButton key={dir} value={dir} sx={{ textTransform: 'capitalize', flex: '1 1 45%' }}>
                        {dir}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              </>
            )}

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={useAccentColor}
                  onChange={(e) => handleAccentToggle(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Accent Color</Typography>}
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
                    Frequency: {(config.accentFrequency * 100).toFixed(0)}%
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
                    Strength: {config.accentStrength.toFixed(2)}
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

      {/* Stroke */}
      <Accordion disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Stroke</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={useStroke}
                  onChange={(e) => handleStrokeToggle(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Enable Stroke</Typography>}
            />

            {useStroke && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Stroke Width: {config.strokeWidth}px
                  </Typography>
                  <Slider
                    value={config.strokeWidth}
                    onChange={(_, value) => onChange({ strokeWidth: value as number })}
                    min={0.5}
                    max={5}
                    step={0.5}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Stroke Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={config.strokeColor ? rgbToHex(config.strokeColor) : '#ffffff'}
                      onChange={(e) => onChange({ strokeColor: hexToRgb(e.target.value) })}
                      style={{
                        width: 36,
                        height: 36,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    />
                    {config.strokeColor && (
                      <Typography variant="caption" color="text.secondary">
                        RGB({config.strokeColor.r}, {config.strokeColor.g}, {config.strokeColor.b})
                      </Typography>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Effects */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Effects</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Vignette: {config.vignetteStrength.toFixed(2)}
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

            {useAccentColor && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Accent Glow: {config.glowStrength.toFixed(2)}
                  </Typography>
                  <Slider
                    value={config.glowStrength}
                    onChange={(_, value) => onChange({ glowStrength: value as number })}
                    min={0}
                    max={1}
                    step={0.01}
                    size="small"
                  />
                </Box>

                {config.glowStrength > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Glow Size: {config.glowSize}px
                    </Typography>
                    <Slider
                      value={config.glowSize}
                      onChange={(_, value) => onChange({ glowSize: value as number })}
                      min={2}
                      max={30}
                      step={1}
                      size="small"
                    />
                  </Box>
                )}
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
