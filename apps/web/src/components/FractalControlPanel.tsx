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
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { FractalConfig, RGB, FractalType, FractalColorScheme } from '@geometric-bg/types';
import { fractalTypes, fractalColorSchemes } from '@geometric-bg/types';

interface FractalControlPanelProps {
  config: FractalConfig;
  onChange: (config: Partial<FractalConfig>) => void;
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

const fractalTypeLabels: Record<FractalType, string> = {
  mandelbrot: 'Mandelbrot',
  julia: 'Julia',
  burningShip: 'Burning Ship',
  tricorn: 'Tricorn',
};

const colorSchemeLabels: Record<FractalColorScheme, string> = {
  classic: 'Classic',
  fire: 'Fire',
  ocean: 'Ocean',
  forest: 'Forest',
  sunset: 'Sunset',
  neon: 'Neon',
  grayscale: 'Grayscale',
};

export function FractalControlPanel({ config, onChange, onRegenerate }: FractalControlPanelProps) {
  const handleZoomIn = () => {
    onChange({ zoom: config.zoom * 2 });
  };

  const handleZoomOut = () => {
    onChange({ zoom: Math.max(0.1, config.zoom / 2) });
  };

  const handleReset = () => {
    onChange({
      centerX: config.fractalType === 'julia' ? 0 : -0.5,
      centerY: 0,
      zoom: 1,
    });
  };

  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Fractal Parameters
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
              inputProps={{ min: 100, max: 4096 }}
            />
            <TextField
              label="Height"
              type="number"
              size="small"
              value={config.height}
              onChange={(e) => onChange({ height: Math.max(100, parseInt(e.target.value) || 100) })}
              inputProps={{ min: 100, max: 4096 }}
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

      {/* Fractal Type */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Fractal Type</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <ToggleButtonGroup
              value={config.fractalType}
              exclusive
              onChange={(_, value) => value && onChange({ fractalType: value as FractalType })}
              size="small"
              fullWidth
              sx={{ flexWrap: 'wrap' }}
            >
              {fractalTypes.map((type) => (
                <ToggleButton key={type} value={type} sx={{ flex: '1 1 45%', fontSize: '0.75rem' }}>
                  {fractalTypeLabels[type]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {config.fractalType === 'julia' && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Julia Real (c): {config.juliaReal.toFixed(4)}
                  </Typography>
                  <Slider
                    value={config.juliaReal}
                    onChange={(_, value) => onChange({ juliaReal: value as number })}
                    min={-2}
                    max={2}
                    step={0.001}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Julia Imaginary (c): {config.juliaImaginary.toFixed(4)}
                  </Typography>
                  <Slider
                    value={config.juliaImaginary}
                    onChange={(_, value) => onChange({ juliaImaginary: value as number })}
                    min={-2}
                    max={2}
                    step={0.001}
                    size="small"
                  />
                </Box>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* View Controls */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">View</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ZoomInIcon />}
                onClick={handleZoomIn}
                sx={{ flex: 1 }}
              >
                Zoom In
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ZoomOutIcon />}
                onClick={handleZoomOut}
                sx={{ flex: 1 }}
              >
                Zoom Out
              </Button>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CenterFocusStrongIcon />}
              onClick={handleReset}
              fullWidth
            >
              Reset View
            </Button>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Zoom: {config.zoom.toFixed(2)}x
              </Typography>
              <Slider
                value={Math.log10(config.zoom)}
                onChange={(_, value) => onChange({ zoom: Math.pow(10, value as number) })}
                min={-1}
                max={6}
                step={0.1}
                size="small"
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Center X: {config.centerX.toFixed(6)}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => onChange({ centerX: config.centerX - 1 / config.zoom })}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onChange({ centerX: config.centerX + 1 / config.zoom })}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Slider
                value={config.centerX}
                onChange={(_, value) => onChange({ centerX: value as number })}
                min={-2.5}
                max={1.5}
                step={0.001}
                size="small"
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Center Y: {config.centerY.toFixed(6)}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => onChange({ centerY: config.centerY - 1 / config.zoom })}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onChange({ centerY: config.centerY + 1 / config.zoom })}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Slider
                value={config.centerY}
                onChange={(_, value) => onChange({ centerY: value as number })}
                min={-1.5}
                max={1.5}
                step={0.001}
                size="small"
              />
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Iteration Controls */}
      <Accordion disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Quality</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Max Iterations: {config.maxIterations}
              </Typography>
              <Slider
                value={config.maxIterations}
                onChange={(_, value) => onChange({ maxIterations: value as number })}
                min={10}
                max={1000}
                step={10}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Escape Radius: {config.escapeRadius}
              </Typography>
              <Slider
                value={config.escapeRadius}
                onChange={(_, value) => onChange({ escapeRadius: value as number })}
                min={2}
                max={20}
                step={1}
                size="small"
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={config.smoothColoring}
                  onChange={(e) => onChange({ smoothColoring: e.target.checked })}
                />
              }
              label={<Typography variant="body2">Smooth Coloring</Typography>}
            />
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
                Color Scheme
              </Typography>
              <ToggleButtonGroup
                value={config.colorScheme}
                exclusive
                onChange={(_, value) => value && onChange({ colorScheme: value as FractalColorScheme })}
                size="small"
                fullWidth
                sx={{ flexWrap: 'wrap' }}
              >
                {fractalColorSchemes.map((scheme) => (
                  <ToggleButton key={scheme} value={scheme} sx={{ flex: '1 1 30%', fontSize: '0.7rem', px: 0.5 }}>
                    {colorSchemeLabels[scheme]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Color Cycles: {config.colorCycles.toFixed(1)}
              </Typography>
              <Slider
                value={config.colorCycles}
                onChange={(_, value) => onChange({ colorCycles: value as number })}
                min={0.1}
                max={10}
                step={0.1}
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Color Offset: {(config.colorOffset * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={config.colorOffset}
                onChange={(_, value) => onChange({ colorOffset: value as number })}
                min={0}
                max={1}
                step={0.01}
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Interior Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="color"
                  value={rgbToHex(config.interiorColor)}
                  onChange={(e) => onChange({ interiorColor: hexToRgb(e.target.value) })}
                  style={{
                    width: 36,
                    height: 36,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  RGB({config.interiorColor.r}, {config.interiorColor.g}, {config.interiorColor.b})
                </Typography>
              </Box>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
