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
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Export
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <ToggleButtonGroup
          value={format}
          exclusive
          onChange={(_, value) => value && setFormat(value)}
          fullWidth
        >
          <ToggleButton value="png">PNG</ToggleButton>
          <ToggleButton value="jpeg">JPEG</ToggleButton>
          <ToggleButton value="svg">SVG</ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="caption" color="text.secondary">
          {format === 'png' && 'Lossless format with transparency support'}
          {format === 'jpeg' && 'Compressed format, smaller file size'}
          {format === 'svg' && 'Vector format, infinitely scalable'}
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : `Download ${format.toUpperCase()}`}
        </Button>

        <Typography variant="body2" color="text.secondary">
          Output size: {width} x {height} pixels
        </Typography>
      </Stack>
    </Paper>
  );
}
