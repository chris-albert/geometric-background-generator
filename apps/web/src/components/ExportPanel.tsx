import { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { ExportFormat } from '@geometric-bg/types';
import type { GeometricCanvasHandle } from './GeometricCanvas';

interface ExportPanelProps {
  canvasRef: React.RefObject<GeometricCanvasHandle | null>;
  width: number;
  height: number;
}

export function ExportPanel({ canvasRef, width, height }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!canvasRef.current) {
      setError('Canvas not ready');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'png':
          blob = await canvasRef.current.exportPNG();
          filename = `geometric-background-${width}x${height}.png`;
          break;
        case 'jpeg':
          blob = await canvasRef.current.exportJPEG();
          filename = `geometric-background-${width}x${height}.jpg`;
          break;
        case 'svg':
          const svgContent = canvasRef.current.exportSVG();
          blob = new Blob([svgContent], { type: 'image/svg+xml' });
          filename = `geometric-background-${width}x${height}.svg`;
          break;
        default:
          throw new Error('Unknown format');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Export
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1, py: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={1}>
        <ToggleButtonGroup
          value={format}
          exclusive
          onChange={(_, value) => value && setFormat(value)}
          fullWidth
          size="small"
        >
          <ToggleButton value="png">PNG</ToggleButton>
          <ToggleButton value="jpeg">JPEG</ToggleButton>
          <ToggleButton value="svg">SVG</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : `Download ${format.toUpperCase()}`}
        </Button>

        <Typography variant="caption" color="text.secondary">
          {width} x {height}px
        </Typography>
      </Stack>
    </Paper>
  );
}
