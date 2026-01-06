import { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Paper, Box } from '@mui/material';
import type { BackgroundConfig, Point, RGB } from '@geometric-bg/types';

interface GeometricCanvasProps {
  config: BackgroundConfig;
  seed: number;
}

export interface GeometricCanvasHandle {
  exportPNG: () => Promise<Blob>;
  exportJPEG: () => Promise<Blob>;
  exportSVG: () => string;
}

// Seeded random number generator for reproducible results
function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function generateTriangles(config: BackgroundConfig, random: () => number): string[] {
  const {
    width,
    height,
    triangleSize,
    baseColor,
    colorVariation,
    vignetteStrength,
    uniformity,
    accentColor,
    accentFrequency,
    accentStrength,
  } = config;

  const jitterAmount = (1 - uniformity) * 0.5;
  const cols = Math.ceil(width / triangleSize) + 2;
  const rows = Math.ceil(height / (triangleSize * 0.866)) + 2;
  const points: Point[][] = [];

  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const xOffset = row % 2 === 0 ? 0 : triangleSize / 2;
      const jitterX = (random() - 0.5) * triangleSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * triangleSize * jitterAmount * 2;
      points[row][col] = {
        x: col * triangleSize + xOffset + jitterX,
        y: row * triangleSize * 0.866 + jitterY,
      };
    }
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const triangles: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const topLeft = points[row][col];
      const topRight = points[row][col + 1];
      const bottomLeft = points[row + 1][col];
      const bottomRight = points[row + 1][col + 1];

      if (row % 2 === 0) {
        triangles.push(
          createTriangleSvg(
            topLeft, topRight, bottomLeft,
            baseColor, colorVariation, centerX, centerY, maxDist,
            vignetteStrength, accentColor, accentFrequency, accentStrength, random
          )
        );
        triangles.push(
          createTriangleSvg(
            topRight, bottomRight, bottomLeft,
            baseColor, colorVariation, centerX, centerY, maxDist,
            vignetteStrength, accentColor, accentFrequency, accentStrength, random
          )
        );
      } else {
        triangles.push(
          createTriangleSvg(
            topLeft, topRight, bottomRight,
            baseColor, colorVariation, centerX, centerY, maxDist,
            vignetteStrength, accentColor, accentFrequency, accentStrength, random
          )
        );
        triangles.push(
          createTriangleSvg(
            topLeft, bottomRight, bottomLeft,
            baseColor, colorVariation, centerX, centerY, maxDist,
            vignetteStrength, accentColor, accentFrequency, accentStrength, random
          )
        );
      }
    }
  }

  return triangles;
}

function createTriangleSvg(
  p1: Point,
  p2: Point,
  p3: Point,
  baseColor: RGB,
  colorVariation: number,
  centerX: number,
  centerY: number,
  maxDist: number,
  vignetteStrength: number,
  accentColor: RGB | undefined,
  accentFrequency: number,
  accentStrength: number,
  random: () => number
): string {
  const centroidX = (p1.x + p2.x + p3.x) / 3;
  const centroidY = (p1.y + p2.y + p3.y) / 3;

  const dist = Math.sqrt((centroidX - centerX) ** 2 + (centroidY - centerY) ** 2);
  const vignette = 1 - (dist / maxDist) * vignetteStrength;

  const isAccent = accentColor && random() < accentFrequency;

  let useColor = baseColor;
  if (isAccent && accentColor) {
    useColor = {
      r: baseColor.r + (accentColor.r - baseColor.r) * accentStrength,
      g: baseColor.g + (accentColor.g - baseColor.g) * accentStrength,
      b: baseColor.b + (accentColor.b - baseColor.b) * accentStrength,
    };
  }

  const variation = (random() - 0.5) * colorVariation * 2;
  const r = Math.max(0, Math.min(255, Math.round((useColor.r + variation) * vignette)));
  const g = Math.max(0, Math.min(255, Math.round((useColor.g + variation) * vignette)));
  const b = Math.max(0, Math.min(255, Math.round((useColor.b + variation) * vignette)));

  const color = `rgb(${r},${g},${b})`;
  return `<polygon points="${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} ${p3.x.toFixed(2)},${p3.y.toFixed(2)}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`;
}

export const GeometricCanvas = forwardRef<GeometricCanvasHandle, GeometricCanvasProps>(
  function GeometricCanvas({ config, seed }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const svgContent = useMemo(() => {
      const random = createSeededRandom(seed);
      const triangles = generateTriangles(config, random);
      const { width, height, baseColor } = config;

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="rgb(${baseColor.r},${baseColor.g},${baseColor.b})"/>
        ${triangles.join('\n')}
      </svg>`;
    }, [config, seed]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        canvas.width = config.width;
        canvas.height = config.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    }, [svgContent, config.width, config.height]);

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
      exportSVG: () => svgContent,
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
