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

interface ColorParams {
  baseColor: RGB;
  colorVariation: number;
  centerX: number;
  centerY: number;
  maxDist: number;
  vignetteStrength: number;
  accentColor: RGB | undefined;
  accentFrequency: number;
  accentStrength: number;
}

function computeShapeColor(
  centroidX: number,
  centroidY: number,
  params: ColorParams,
  random: () => number
): string {
  const { baseColor, colorVariation, centerX, centerY, maxDist, vignetteStrength, accentColor, accentFrequency, accentStrength } = params;

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

  return `rgb(${r},${g},${b})`;
}

function generateTriangles(config: BackgroundConfig, random: () => number, colorParams: ColorParams): string[] {
  const { width, height, shapeSize, uniformity } = config;

  const jitterAmount = (1 - uniformity) * 0.5;
  const cols = Math.ceil(width / shapeSize) + 2;
  const rows = Math.ceil(height / (shapeSize * 0.866)) + 2;
  const points: Point[][] = [];

  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const xOffset = row % 2 === 0 ? 0 : shapeSize / 2;
      const jitterX = (random() - 0.5) * shapeSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * shapeSize * jitterAmount * 2;
      points[row][col] = {
        x: col * shapeSize + xOffset + jitterX,
        y: row * shapeSize * 0.866 + jitterY,
      };
    }
  }

  const shapes: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const topLeft = points[row][col];
      const topRight = points[row][col + 1];
      const bottomLeft = points[row + 1][col];
      const bottomRight = points[row + 1][col + 1];

      if (row % 2 === 0) {
        const centroid1X = (topLeft.x + topRight.x + bottomLeft.x) / 3;
        const centroid1Y = (topLeft.y + topRight.y + bottomLeft.y) / 3;
        const color1 = computeShapeColor(centroid1X, centroid1Y, colorParams, random);
        shapes.push(`<polygon points="${topLeft.x.toFixed(2)},${topLeft.y.toFixed(2)} ${topRight.x.toFixed(2)},${topRight.y.toFixed(2)} ${bottomLeft.x.toFixed(2)},${bottomLeft.y.toFixed(2)}" fill="${color1}" stroke="${color1}" stroke-width="0.5"/>`);

        const centroid2X = (topRight.x + bottomRight.x + bottomLeft.x) / 3;
        const centroid2Y = (topRight.y + bottomRight.y + bottomLeft.y) / 3;
        const color2 = computeShapeColor(centroid2X, centroid2Y, colorParams, random);
        shapes.push(`<polygon points="${topRight.x.toFixed(2)},${topRight.y.toFixed(2)} ${bottomRight.x.toFixed(2)},${bottomRight.y.toFixed(2)} ${bottomLeft.x.toFixed(2)},${bottomLeft.y.toFixed(2)}" fill="${color2}" stroke="${color2}" stroke-width="0.5"/>`);
      } else {
        const centroid1X = (topLeft.x + topRight.x + bottomRight.x) / 3;
        const centroid1Y = (topLeft.y + topRight.y + bottomRight.y) / 3;
        const color1 = computeShapeColor(centroid1X, centroid1Y, colorParams, random);
        shapes.push(`<polygon points="${topLeft.x.toFixed(2)},${topLeft.y.toFixed(2)} ${topRight.x.toFixed(2)},${topRight.y.toFixed(2)} ${bottomRight.x.toFixed(2)},${bottomRight.y.toFixed(2)}" fill="${color1}" stroke="${color1}" stroke-width="0.5"/>`);

        const centroid2X = (topLeft.x + bottomRight.x + bottomLeft.x) / 3;
        const centroid2Y = (topLeft.y + bottomRight.y + bottomLeft.y) / 3;
        const color2 = computeShapeColor(centroid2X, centroid2Y, colorParams, random);
        shapes.push(`<polygon points="${topLeft.x.toFixed(2)},${topLeft.y.toFixed(2)} ${bottomRight.x.toFixed(2)},${bottomRight.y.toFixed(2)} ${bottomLeft.x.toFixed(2)},${bottomLeft.y.toFixed(2)}" fill="${color2}" stroke="${color2}" stroke-width="0.5"/>`);
      }
    }
  }

  return shapes;
}

function generateSquares(config: BackgroundConfig, random: () => number, colorParams: ColorParams): string[] {
  const { width, height, shapeSize, uniformity } = config;

  const jitterAmount = (1 - uniformity) * 0.5;
  const cols = Math.ceil(width / shapeSize) + 2;
  const rows = Math.ceil(height / shapeSize) + 2;

  // Generate shared vertex grid
  const points: Point[][] = [];
  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const jitterX = (random() - 0.5) * shapeSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * shapeSize * jitterAmount * 2;
      points[row][col] = {
        x: col * shapeSize + jitterX,
        y: row * shapeSize + jitterY,
      };
    }
  }

  const shapes: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tl = points[row][col];
      const tr = points[row][col + 1];
      const bl = points[row + 1][col];
      const br = points[row + 1][col + 1];

      const centroidX = (tl.x + tr.x + bl.x + br.x) / 4;
      const centroidY = (tl.y + tr.y + bl.y + br.y) / 4;
      const color = computeShapeColor(centroidX, centroidY, colorParams, random);

      shapes.push(`<polygon points="${tl.x.toFixed(2)},${tl.y.toFixed(2)} ${tr.x.toFixed(2)},${tr.y.toFixed(2)} ${br.x.toFixed(2)},${br.y.toFixed(2)} ${bl.x.toFixed(2)},${bl.y.toFixed(2)}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`);
    }
  }

  return shapes;
}

function generateDiamonds(config: BackgroundConfig, random: () => number, colorParams: ColorParams): string[] {
  const { width, height, shapeSize, uniformity } = config;

  const jitterAmount = (1 - uniformity) * 0.5;
  const halfSize = shapeSize / 2;

  // Diamonds tile in a grid where each diamond center alternates
  // We need points at every half-step in both directions
  const cols = Math.ceil(width / halfSize) + 3;
  const rows = Math.ceil(height / halfSize) + 3;

  // Generate shared vertex grid (checkerboard pattern of diamond centers and corners)
  const points: Point[][] = [];
  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const jitterX = (random() - 0.5) * shapeSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * shapeSize * jitterAmount * 2;
      points[row][col] = {
        x: col * halfSize + jitterX,
        y: row * halfSize + jitterY,
      };
    }
  }

  const shapes: string[] = [];

  // Create diamonds - each diamond uses 4 points in a + pattern
  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      // Only create diamond if row+col is even (checkerboard pattern)
      if ((row + col) % 2 === 0) {
        const top = points[row - 1][col];
        const right = points[row][col + 1];
        const bottom = points[row + 1][col];
        const left = points[row][col - 1];

        const centroidX = (top.x + right.x + bottom.x + left.x) / 4;
        const centroidY = (top.y + right.y + bottom.y + left.y) / 4;
        const color = computeShapeColor(centroidX, centroidY, colorParams, random);

        shapes.push(`<polygon points="${top.x.toFixed(2)},${top.y.toFixed(2)} ${right.x.toFixed(2)},${right.y.toFixed(2)} ${bottom.x.toFixed(2)},${bottom.y.toFixed(2)} ${left.x.toFixed(2)},${left.y.toFixed(2)}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`);
      }
    }
  }

  return shapes;
}

function generateHexagons(config: BackgroundConfig, random: () => number, colorParams: ColorParams): string[] {
  const { width, height, shapeSize, uniformity } = config;

  const jitterAmount = (1 - uniformity) * 0.5;

  // Hexagon geometry (flat-top orientation for easier vertex sharing)
  const r = shapeSize / 2; // radius (center to vertex)
  const hexWidth = r * 2; // width of flat-top hexagon
  const hexHeight = r * Math.sqrt(3); // height of flat-top hexagon
  const horizSpacing = hexWidth * 0.75; // horizontal distance between hex centers
  const vertSpacing = hexHeight; // vertical distance between hex centers

  const cols = Math.ceil(width / horizSpacing) + 3;
  const rows = Math.ceil(height / vertSpacing) + 3;

  // Generate a grid of unique vertices that hexagons will share
  // For flat-top hexagons, vertices fall on a specific pattern
  // Each vertex is shared by up to 3 hexagons
  const vertexMap = new Map<string, Point>();

  const getVertex = (key: string, baseX: number, baseY: number): Point => {
    if (!vertexMap.has(key)) {
      const jitterX = (random() - 0.5) * shapeSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * shapeSize * jitterAmount * 2;
      vertexMap.set(key, {
        x: baseX + jitterX,
        y: baseY + jitterY,
      });
    }
    return vertexMap.get(key)!;
  };

  const shapes: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const yOffset = col % 2 === 0 ? 0 : vertSpacing / 2;
      const cx = col * horizSpacing;
      const cy = row * vertSpacing + yOffset;

      // Get the 6 vertices for this hexagon using shared vertex keys
      // Flat-top hexagon vertices (starting from right, going counter-clockwise):
      // 0: right (+r, 0)
      // 1: top-right (+r/2, -h/2)
      // 2: top-left (-r/2, -h/2)
      // 3: left (-r, 0)
      // 4: bottom-left (-r/2, +h/2)
      // 5: bottom-right (+r/2, +h/2)

      const h2 = hexHeight / 2;
      const r2 = r / 2;

      // Create unique keys for each vertex based on its absolute position
      // Round to avoid floating point issues
      const round = (n: number) => Math.round(n * 100);

      const vertices: Point[] = [
        getVertex(`${round(cx + r)},${round(cy)}`, cx + r, cy),
        getVertex(`${round(cx + r2)},${round(cy - h2)}`, cx + r2, cy - h2),
        getVertex(`${round(cx - r2)},${round(cy - h2)}`, cx - r2, cy - h2),
        getVertex(`${round(cx - r)},${round(cy)}`, cx - r, cy),
        getVertex(`${round(cx - r2)},${round(cy + h2)}`, cx - r2, cy + h2),
        getVertex(`${round(cx + r2)},${round(cy + h2)}`, cx + r2, cy + h2),
      ];

      const centroidX = vertices.reduce((sum, v) => sum + v.x, 0) / 6;
      const centroidY = vertices.reduce((sum, v) => sum + v.y, 0) / 6;
      const color = computeShapeColor(centroidX, centroidY, colorParams, random);

      const pointsStr = vertices.map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');
      shapes.push(`<polygon points="${pointsStr}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`);
    }
  }

  return shapes;
}

function generateShapes(config: BackgroundConfig, random: () => number): string[] {
  const { width, height, baseColor, colorVariation, vignetteStrength, accentColor, accentFrequency, accentStrength } = config;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const colorParams: ColorParams = {
    baseColor,
    colorVariation,
    centerX,
    centerY,
    maxDist,
    vignetteStrength,
    accentColor,
    accentFrequency,
    accentStrength,
  };

  switch (config.shapeType) {
    case 'square':
      return generateSquares(config, random, colorParams);
    case 'diamond':
      return generateDiamonds(config, random, colorParams);
    case 'hexagon':
      return generateHexagons(config, random, colorParams);
    case 'triangle':
    default:
      return generateTriangles(config, random, colorParams);
  }
}

export const GeometricCanvas = forwardRef<GeometricCanvasHandle, GeometricCanvasProps>(
  function GeometricCanvas({ config, seed }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const svgContent = useMemo(() => {
      const random = createSeededRandom(seed);
      const shapes = generateShapes(config, random);
      const { width, height, baseColor } = config;

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="rgb(${baseColor.r},${baseColor.g},${baseColor.b})"/>
        ${shapes.join('\n')}
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
