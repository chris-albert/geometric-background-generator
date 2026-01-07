import { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Paper, Box } from '@mui/material';
import type { FractalConfig, RGB, FractalColorScheme } from '@geometric-bg/types';

interface FractalCanvasProps {
  config: FractalConfig;
  seed: number;
}

export interface FractalCanvasHandle {
  exportPNG: () => Promise<Blob>;
  exportJPEG: () => Promise<Blob>;
  exportSVG: () => string;
}

// Color scheme palettes
function getColorPalette(scheme: FractalColorScheme): RGB[] {
  switch (scheme) {
    case 'fire':
      return [
        { r: 0, g: 0, b: 0 },
        { r: 128, g: 0, b: 0 },
        { r: 255, g: 0, b: 0 },
        { r: 255, g: 128, b: 0 },
        { r: 255, g: 255, b: 0 },
        { r: 255, g: 255, b: 255 },
      ];
    case 'ocean':
      return [
        { r: 0, g: 0, b: 32 },
        { r: 0, g: 32, b: 64 },
        { r: 0, g: 64, b: 128 },
        { r: 0, g: 128, b: 192 },
        { r: 64, g: 192, b: 255 },
        { r: 192, g: 255, b: 255 },
      ];
    case 'forest':
      return [
        { r: 0, g: 16, b: 0 },
        { r: 0, g: 48, b: 16 },
        { r: 16, g: 96, b: 32 },
        { r: 48, g: 144, b: 48 },
        { r: 96, g: 192, b: 64 },
        { r: 192, g: 255, b: 128 },
      ];
    case 'sunset':
      return [
        { r: 32, g: 0, b: 64 },
        { r: 128, g: 0, b: 128 },
        { r: 255, g: 64, b: 64 },
        { r: 255, g: 128, b: 0 },
        { r: 255, g: 200, b: 64 },
        { r: 255, g: 255, b: 192 },
      ];
    case 'neon':
      return [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 0, b: 128 },
        { r: 0, g: 255, b: 255 },
        { r: 255, g: 255, b: 0 },
        { r: 128, g: 0, b: 255 },
        { r: 0, g: 255, b: 128 },
      ];
    case 'grayscale':
      return [
        { r: 0, g: 0, b: 0 },
        { r: 64, g: 64, b: 64 },
        { r: 128, g: 128, b: 128 },
        { r: 192, g: 192, b: 192 },
        { r: 255, g: 255, b: 255 },
      ];
    case 'classic':
    default:
      return [
        { r: 0, g: 0, b: 128 },
        { r: 0, g: 128, b: 255 },
        { r: 128, g: 255, b: 255 },
        { r: 255, g: 255, b: 128 },
        { r: 255, g: 128, b: 0 },
        { r: 128, g: 0, b: 0 },
      ];
  }
}

function interpolateColor(palette: RGB[], t: number): RGB {
  const n = palette.length - 1;
  const i = Math.floor(t * n);
  const f = t * n - i;

  if (i >= n) return palette[n];
  if (i < 0) return palette[0];

  const c1 = palette[i];
  const c2 = palette[i + 1];

  return {
    r: Math.round(c1.r + (c2.r - c1.r) * f),
    g: Math.round(c1.g + (c2.g - c1.g) * f),
    b: Math.round(c1.b + (c2.b - c1.b) * f),
  };
}

function computeFractal(config: FractalConfig): ImageData {
  const { width, height, fractalType, centerX, centerY, zoom, maxIterations, escapeRadius, juliaReal, juliaImaginary, colorScheme, colorCycles, colorOffset, smoothColoring, interiorColor } = config;

  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const palette = getColorPalette(colorScheme);

  const scale = 3.5 / (zoom * Math.min(width, height));
  const escapeRadius2 = escapeRadius * escapeRadius;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const x0 = (px - width / 2) * scale + centerX;
      const y0 = (py - height / 2) * scale + centerY;

      let x: number, y: number, cx: number, cy: number;

      // Set up based on fractal type
      switch (fractalType) {
        case 'julia':
          x = x0;
          y = y0;
          cx = juliaReal;
          cy = juliaImaginary;
          break;
        case 'burningShip':
        case 'tricorn':
        case 'mandelbrot':
        default:
          x = 0;
          y = 0;
          cx = x0;
          cy = y0;
          break;
      }

      let iteration = 0;
      let x2 = x * x;
      let y2 = y * y;

      while (x2 + y2 <= escapeRadius2 && iteration < maxIterations) {
        let xNew: number, yNew: number;

        switch (fractalType) {
          case 'burningShip':
            xNew = x2 - y2 + cx;
            yNew = 2 * Math.abs(x * y) + cy;
            break;
          case 'tricorn':
            xNew = x2 - y2 + cx;
            yNew = -2 * x * y + cy;
            break;
          case 'julia':
          case 'mandelbrot':
          default:
            xNew = x2 - y2 + cx;
            yNew = 2 * x * y + cy;
            break;
        }

        x = xNew;
        y = yNew;
        x2 = x * x;
        y2 = y * y;
        iteration++;
      }

      const idx = (py * width + px) * 4;

      if (iteration === maxIterations) {
        // Interior - use interior color
        data[idx] = interiorColor.r;
        data[idx + 1] = interiorColor.g;
        data[idx + 2] = interiorColor.b;
        data[idx + 3] = 255;
      } else {
        // Escaped - compute color
        let t: number;

        if (smoothColoring && iteration > 0) {
          // Smooth coloring using continuous potential
          const log_zn = Math.log(x2 + y2) / 2;
          const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
          t = (iteration + 1 - nu) / maxIterations;
        } else {
          t = iteration / maxIterations;
        }

        // Apply color cycles and offset
        t = (t * colorCycles + colorOffset) % 1;
        if (t < 0) t += 1;

        const color = interpolateColor(palette, t);
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
    }
  }

  return imageData;
}

export const FractalCanvas = forwardRef<FractalCanvasHandle, FractalCanvasProps>(
  function FractalCanvas({ config, seed }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const imageData = useMemo(() => {
      return computeFractal(config);
    }, [config, seed]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = config.width;
      canvas.height = config.height;
      ctx.putImageData(imageData, 0, 0);
    }, [imageData, config.width, config.height]);

    useImperativeHandle(ref, () => ({
      exportPNG: async () => {
        const canvas = canvasRef.current!;
        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
      },
      exportJPEG: async () => {
        const canvas = canvasRef.current!;
        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
        });
      },
      exportSVG: () => {
        // For fractals, we'll export as a data URL embedded in SVG
        const canvas = canvasRef.current!;
        const dataUrl = canvas.toDataURL('image/png');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.height}">
          <image href="${dataUrl}" width="${config.width}" height="${config.height}"/>
        </svg>`;
      },
    }));

    const aspectRatio = config.width / config.height;

    return (
      <Paper
        ref={containerRef}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: `${aspectRatio}`,
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        </Box>
      </Paper>
    );
  }
);
