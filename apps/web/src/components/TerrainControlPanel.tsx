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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { TerrainConfig, RGB, TerrainMeshStyle } from '@geometric-bg/types';
import { terrainMeshStyles } from '@geometric-bg/types';

interface TerrainControlPanelProps {
  config: TerrainConfig;
  onChange: (config: Partial<TerrainConfig>) => void;
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

const meshStyleLabels: Record<TerrainMeshStyle, string> = {
  grid: 'Grid',
  triangles: 'Triangles',
  ridges: 'Ridges',
};

function ColorField({ label, value, onChange }: { label: string; value: RGB; onChange: (value: RGB) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <input
        type="color"
        value={rgbToHex(value)}
        onChange={(e) => onChange(hexToRgb(e.target.value))}
        style={{
          width: 36,
          height: 36,
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Slider
        value={value}
        onChange={(_, v) => onChange(v as number)}
        min={min}
        max={max}
        step={step}
        size="small"
      />
    </Box>
  );
}

export function TerrainControlPanel({ config, onChange, onRegenerate }: TerrainControlPanelProps) {
  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Terrain Parameters
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

      {/* Mesh */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Mesh</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <ToggleButtonGroup
              value={config.meshStyle}
              exclusive
              onChange={(_, value) => value && onChange({ meshStyle: value as TerrainMeshStyle })}
              size="small"
              fullWidth
            >
              {terrainMeshStyles.map((style) => (
                <ToggleButton key={style} value={style} sx={{ fontSize: '0.75rem' }}>
                  {meshStyleLabels[style]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <SliderField
              label={`Cell Size: ${config.cellSize.toFixed(2)}`}
              value={config.cellSize}
              onChange={(cellSize) => onChange({ cellSize })}
              min={0.5}
              max={3}
              step={0.05}
            />
            <SliderField
              label={`Draw Distance: ${config.drawDistance}`}
              value={config.drawDistance}
              onChange={(drawDistance) => onChange({ drawDistance })}
              min={20}
              max={120}
              step={5}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Terrain */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Terrain</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <SliderField
              label={`Height: ${config.terrainHeight.toFixed(1)}`}
              value={config.terrainHeight}
              onChange={(terrainHeight) => onChange({ terrainHeight })}
              min={0}
              max={20}
              step={0.5}
            />
            <SliderField
              label={`Roughness: ${config.roughness.toFixed(2)}`}
              value={config.roughness}
              onChange={(roughness) => onChange({ roughness })}
              min={0.02}
              max={0.5}
              step={0.01}
            />
            <SliderField
              label={`Valley Width: ${config.valleyWidth}`}
              value={config.valleyWidth}
              onChange={(valleyWidth) => onChange({ valleyWidth })}
              min={0}
              max={30}
              step={1}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Camera */}
      <Accordion disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Camera</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <SliderField
              label={`Camera Height: ${config.cameraHeight.toFixed(1)}`}
              value={config.cameraHeight}
              onChange={(cameraHeight) => onChange({ cameraHeight })}
              min={0.5}
              max={10}
              step={0.1}
            />
            <SliderField
              label={`Horizon: ${(config.horizon * 100).toFixed(0)}%`}
              value={config.horizon}
              onChange={(horizon) => onChange({ horizon })}
              min={0.1}
              max={0.9}
              step={0.01}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Lines */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Lines</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <ColorField
              label="Line Color"
              value={config.lineColor}
              onChange={(lineColor) => onChange({ lineColor })}
            />
            <ColorField
              label="Surface Color"
              value={config.surfaceColor}
              onChange={(surfaceColor) => onChange({ surfaceColor })}
            />
            <SliderField
              label={`Line Width: ${config.lineWidth.toFixed(1)}`}
              value={config.lineWidth}
              onChange={(lineWidth) => onChange({ lineWidth })}
              min={0.5}
              max={6}
              step={0.5}
            />
            <SliderField
              label={`Glow: ${(config.glow * 100).toFixed(0)}%`}
              value={config.glow}
              onChange={(glow) => onChange({ glow })}
              min={0}
              max={1}
              step={0.05}
            />
            <SliderField
              label={`Distance Fade: ${(config.fog * 100).toFixed(0)}%`}
              value={config.fog}
              onChange={(fog) => onChange({ fog })}
              min={0}
              max={1}
              step={0.05}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Sky */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={accordionSummarySx}>
          <Typography variant="body2" fontWeight="medium">Sky</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Stack spacing={1.5}>
            <ColorField
              label="Sky Top"
              value={config.skyTopColor}
              onChange={(skyTopColor) => onChange({ skyTopColor })}
            />
            <ColorField
              label="Sky Horizon"
              value={config.skyHorizonColor}
              onChange={(skyHorizonColor) => onChange({ skyHorizonColor })}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={config.showSun}
                  onChange={(e) => onChange({ showSun: e.target.checked })}
                />
              }
              label={<Typography variant="body2">Sun</Typography>}
            />
            {config.showSun && (
              <>
                <SliderField
                  label={`Sun Size: ${(config.sunSize * 100).toFixed(0)}%`}
                  value={config.sunSize}
                  onChange={(sunSize) => onChange({ sunSize })}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                />
                <ColorField
                  label="Sun Top"
                  value={config.sunTopColor}
                  onChange={(sunTopColor) => onChange({ sunTopColor })}
                />
                <ColorField
                  label="Sun Bottom"
                  value={config.sunBottomColor}
                  onChange={(sunBottomColor) => onChange({ sunBottomColor })}
                />
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
