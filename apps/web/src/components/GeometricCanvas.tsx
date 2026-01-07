import { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Paper, Box } from '@mui/material';
import type { BackgroundConfig, Point, RGB, GradientDirection } from '@geometric-bg/types';

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
  secondaryColor: RGB | undefined;
  secondaryColorBlend: number;
  colorVariation: number;
  saturationVariation: number;
  brightnessVariation: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  maxDist: number;
  vignetteStrength: number;
  gradientDirection: GradientDirection;
  accentColor: RGB | undefined;
  accentFrequency: number;
  accentStrength: number;
}

interface ShapeResult {
  svg: string;
  isAccent: boolean;
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function getGradientFactor(
  x: number,
  y: number,
  params: ColorParams
): number {
  const { gradientDirection, centerX, centerY, width, height, maxDist } = params;

  switch (gradientDirection) {
    case 'horizontal':
      return x / width;
    case 'vertical':
      return y / height;
    case 'diagonal':
      return (x / width + y / height) / 2;
    case 'radial':
    default: {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return dist / maxDist;
    }
  }
}

function computeShapeColor(
  centroidX: number,
  centroidY: number,
  params: ColorParams,
  random: () => number
): { color: string; isAccent: boolean; opacity: number } {
  const {
    baseColor,
    secondaryColor,
    secondaryColorBlend,
    colorVariation,
    saturationVariation,
    brightnessVariation,
    vignetteStrength,
    accentColor,
    accentFrequency,
    accentStrength,
  } = params;

  const gradientFactor = getGradientFactor(centroidX, centroidY, params);
  const vignette = 1 - gradientFactor * vignetteStrength;

  const isAccent = accentColor && random() < accentFrequency;

  // Start with base color, blend with secondary if present
  let useColor = { ...baseColor };
  if (secondaryColor && secondaryColorBlend > 0) {
    const blend = gradientFactor * secondaryColorBlend;
    useColor = {
      r: baseColor.r + (secondaryColor.r - baseColor.r) * blend,
      g: baseColor.g + (secondaryColor.g - baseColor.g) * blend,
      b: baseColor.b + (secondaryColor.b - baseColor.b) * blend,
    };
  }

  // Apply accent color
  if (isAccent && accentColor) {
    useColor = {
      r: useColor.r + (accentColor.r - useColor.r) * accentStrength,
      g: useColor.g + (accentColor.g - useColor.g) * accentStrength,
      b: useColor.b + (accentColor.b - useColor.b) * accentStrength,
    };
  }

  // Convert to HSL for saturation/brightness variation
  let [h, s, l] = rgbToHsl(useColor.r, useColor.g, useColor.b);

  // Apply saturation variation
  if (saturationVariation > 0) {
    s = Math.max(0, Math.min(100, s + (random() - 0.5) * saturationVariation * 2));
  }

  // Apply brightness variation
  if (brightnessVariation > 0) {
    l = Math.max(0, Math.min(100, l + (random() - 0.5) * brightnessVariation * 2));
  }

  // Convert back to RGB
  useColor = hslToRgb(h, s, l);

  // Apply color variation
  const variation = (random() - 0.5) * colorVariation * 2;
  const r = Math.max(0, Math.min(255, Math.round((useColor.r + variation) * vignette)));
  const g = Math.max(0, Math.min(255, Math.round((useColor.g + variation) * vignette)));
  const b = Math.max(0, Math.min(255, Math.round((useColor.b + variation) * vignette)));

  return { color: `rgb(${r},${g},${b})`, isAccent: !!isAccent, opacity: 1 };
}

function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function scalePoint(point: Point, center: Point, scale: number): Point {
  return {
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  };
}

function createPolygonSvg(
  vertices: Point[],
  fillColor: string,
  opacity: number,
  config: BackgroundConfig,
  isAccent: boolean,
  random: () => number
): string {
  const { strokeWidth, strokeColor, rotation, sizeVariation, opacityVariation, minOpacity, glowStrength } = config;

  // Calculate centroid
  const centroidX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const centroidY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
  const center = { x: centroidX, y: centroidY };

  // Apply size variation
  let transformedVertices = vertices;
  if (sizeVariation > 0) {
    const scale = 1 - random() * sizeVariation;
    transformedVertices = transformedVertices.map((v) => scalePoint(v, center, scale));
  }

  // Apply rotation
  if (rotation > 0) {
    const angle = (random() - 0.5) * rotation * Math.PI * 2;
    transformedVertices = transformedVertices.map((v) => rotatePoint(v, center, angle));
  }

  // Apply opacity variation
  let finalOpacity = opacity;
  if (opacityVariation > 0) {
    finalOpacity = minOpacity + random() * (1 - minOpacity) * (1 - opacityVariation) + random() * opacityVariation * (1 - minOpacity);
    finalOpacity = Math.max(minOpacity, Math.min(1, finalOpacity));
  }

  const pointsStr = transformedVertices.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');

  const stroke = strokeWidth > 0
    ? `stroke="${strokeColor ? `rgb(${strokeColor.r},${strokeColor.g},${strokeColor.b})` : fillColor}" stroke-width="${strokeWidth}"`
    : `stroke="${fillColor}" stroke-width="0.5"`;

  const opacityAttr = finalOpacity < 1 ? ` opacity="${finalOpacity.toFixed(2)}"` : '';
  const filterAttr = isAccent && glowStrength > 0 ? ' filter="url(#glow)"' : '';

  return `<polygon points="${pointsStr}" fill="${fillColor}" ${stroke}${opacityAttr}${filterAttr}/>`;
}

function generateTriangles(config: BackgroundConfig, random: () => number, colorParams: ColorParams): ShapeResult[] {
  const { width, height, shapeSize, uniformity, density } = config;

  const adjustedSize = shapeSize / density;
  const jitterAmount = (1 - uniformity) * 0.5;
  const cols = Math.ceil(width / adjustedSize) + 2;
  const rows = Math.ceil(height / (adjustedSize * 0.866)) + 2;
  const points: Point[][] = [];

  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const xOffset = row % 2 === 0 ? 0 : adjustedSize / 2;
      const jitterX = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      points[row][col] = {
        x: col * adjustedSize + xOffset + jitterX,
        y: row * adjustedSize * 0.866 + jitterY,
      };
    }
  }

  const shapes: ShapeResult[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const topLeft = points[row][col];
      const topRight = points[row][col + 1];
      const bottomLeft = points[row + 1][col];
      const bottomRight = points[row + 1][col + 1];

      if (row % 2 === 0) {
        const centroid1X = (topLeft.x + topRight.x + bottomLeft.x) / 3;
        const centroid1Y = (topLeft.y + topRight.y + bottomLeft.y) / 3;
        const { color: color1, isAccent: isAccent1, opacity: opacity1 } = computeShapeColor(centroid1X, centroid1Y, colorParams, random);
        shapes.push({
          svg: createPolygonSvg([topLeft, topRight, bottomLeft], color1, opacity1, config, isAccent1, random),
          isAccent: isAccent1,
        });

        const centroid2X = (topRight.x + bottomRight.x + bottomLeft.x) / 3;
        const centroid2Y = (topRight.y + bottomRight.y + bottomLeft.y) / 3;
        const { color: color2, isAccent: isAccent2, opacity: opacity2 } = computeShapeColor(centroid2X, centroid2Y, colorParams, random);
        shapes.push({
          svg: createPolygonSvg([topRight, bottomRight, bottomLeft], color2, opacity2, config, isAccent2, random),
          isAccent: isAccent2,
        });
      } else {
        const centroid1X = (topLeft.x + topRight.x + bottomRight.x) / 3;
        const centroid1Y = (topLeft.y + topRight.y + bottomRight.y) / 3;
        const { color: color1, isAccent: isAccent1, opacity: opacity1 } = computeShapeColor(centroid1X, centroid1Y, colorParams, random);
        shapes.push({
          svg: createPolygonSvg([topLeft, topRight, bottomRight], color1, opacity1, config, isAccent1, random),
          isAccent: isAccent1,
        });

        const centroid2X = (topLeft.x + bottomRight.x + bottomLeft.x) / 3;
        const centroid2Y = (topLeft.y + bottomRight.y + bottomLeft.y) / 3;
        const { color: color2, isAccent: isAccent2, opacity: opacity2 } = computeShapeColor(centroid2X, centroid2Y, colorParams, random);
        shapes.push({
          svg: createPolygonSvg([topLeft, bottomRight, bottomLeft], color2, opacity2, config, isAccent2, random),
          isAccent: isAccent2,
        });
      }
    }
  }

  return shapes;
}

function generateSquares(config: BackgroundConfig, random: () => number, colorParams: ColorParams): ShapeResult[] {
  const { width, height, shapeSize, uniformity, density } = config;

  const adjustedSize = shapeSize / density;
  const jitterAmount = (1 - uniformity) * 0.5;
  const cols = Math.ceil(width / adjustedSize) + 2;
  const rows = Math.ceil(height / adjustedSize) + 2;

  const points: Point[][] = [];
  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const jitterX = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      points[row][col] = {
        x: col * adjustedSize + jitterX,
        y: row * adjustedSize + jitterY,
      };
    }
  }

  const shapes: ShapeResult[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tl = points[row][col];
      const tr = points[row][col + 1];
      const bl = points[row + 1][col];
      const br = points[row + 1][col + 1];

      const centroidX = (tl.x + tr.x + bl.x + br.x) / 4;
      const centroidY = (tl.y + tr.y + bl.y + br.y) / 4;
      const { color, isAccent, opacity } = computeShapeColor(centroidX, centroidY, colorParams, random);

      shapes.push({
        svg: createPolygonSvg([tl, tr, br, bl], color, opacity, config, isAccent, random),
        isAccent,
      });
    }
  }

  return shapes;
}

function generateDiamonds(config: BackgroundConfig, random: () => number, colorParams: ColorParams): ShapeResult[] {
  const { width, height, shapeSize, uniformity, density } = config;

  const adjustedSize = shapeSize / density;
  const jitterAmount = (1 - uniformity) * 0.5;
  const halfSize = adjustedSize / 2;

  const cols = Math.ceil(width / halfSize) + 3;
  const rows = Math.ceil(height / halfSize) + 3;

  const points: Point[][] = [];
  for (let row = 0; row <= rows; row++) {
    points[row] = [];
    for (let col = 0; col <= cols; col++) {
      const jitterX = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      points[row][col] = {
        x: col * halfSize + jitterX,
        y: row * halfSize + jitterY,
      };
    }
  }

  const shapes: ShapeResult[] = [];

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      if ((row + col) % 2 === 0) {
        const top = points[row - 1][col];
        const right = points[row][col + 1];
        const bottom = points[row + 1][col];
        const left = points[row][col - 1];

        const centroidX = (top.x + right.x + bottom.x + left.x) / 4;
        const centroidY = (top.y + right.y + bottom.y + left.y) / 4;
        const { color, isAccent, opacity } = computeShapeColor(centroidX, centroidY, colorParams, random);

        shapes.push({
          svg: createPolygonSvg([top, right, bottom, left], color, opacity, config, isAccent, random),
          isAccent,
        });
      }
    }
  }

  return shapes;
}

function generateHexagons(config: BackgroundConfig, random: () => number, colorParams: ColorParams): ShapeResult[] {
  const { width, height, shapeSize, uniformity, density } = config;

  const adjustedSize = shapeSize / density;
  const jitterAmount = (1 - uniformity) * 0.5;

  const r = adjustedSize / 2;
  const hexWidth = r * 2;
  const hexHeight = r * Math.sqrt(3);
  const horizSpacing = hexWidth * 0.75;
  const vertSpacing = hexHeight;

  const cols = Math.ceil(width / horizSpacing) + 3;
  const rows = Math.ceil(height / vertSpacing) + 3;

  const vertexMap = new Map<string, Point>();

  const getVertex = (key: string, baseX: number, baseY: number): Point => {
    if (!vertexMap.has(key)) {
      const jitterX = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      const jitterY = (random() - 0.5) * adjustedSize * jitterAmount * 2;
      vertexMap.set(key, {
        x: baseX + jitterX,
        y: baseY + jitterY,
      });
    }
    return vertexMap.get(key)!;
  };

  const shapes: ShapeResult[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const yOffset = col % 2 === 0 ? 0 : vertSpacing / 2;
      const cx = col * horizSpacing;
      const cy = row * vertSpacing + yOffset;

      const h2 = hexHeight / 2;
      const r2 = r / 2;

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
      const { color, isAccent, opacity } = computeShapeColor(centroidX, centroidY, colorParams, random);

      shapes.push({
        svg: createPolygonSvg(vertices, color, opacity, config, isAccent, random),
        isAccent,
      });
    }
  }

  return shapes;
}

function generateShapes(config: BackgroundConfig, random: () => number): ShapeResult[] {
  const {
    width,
    height,
    baseColor,
    secondaryColor,
    secondaryColorBlend,
    colorVariation,
    saturationVariation,
    brightnessVariation,
    vignetteStrength,
    gradientDirection,
    accentColor,
    accentFrequency,
    accentStrength,
  } = config;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const colorParams: ColorParams = {
    baseColor,
    secondaryColor,
    secondaryColorBlend,
    colorVariation,
    saturationVariation,
    brightnessVariation,
    centerX,
    centerY,
    width,
    height,
    maxDist,
    vignetteStrength,
    gradientDirection,
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
      const shapeResults = generateShapes(config, random);
      const { width, height, baseColor, glowStrength, glowSize, accentColor } = config;

      // Separate accent and non-accent shapes for layering
      const normalShapes = shapeResults.filter((s) => !s.isAccent).map((s) => s.svg);
      const accentShapes = shapeResults.filter((s) => s.isAccent).map((s) => s.svg);

      // Create glow filter if needed
      const glowFilter =
        glowStrength > 0 && accentColor
          ? `<defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="${glowSize}" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>`
          : '';

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        ${glowFilter}
        <rect width="100%" height="100%" fill="rgb(${baseColor.r},${baseColor.g},${baseColor.b})"/>
        ${normalShapes.join('\n')}
        ${accentShapes.join('\n')}
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
