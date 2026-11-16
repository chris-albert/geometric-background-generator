import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Paper, Box } from '@mui/material';
import type { TerrainConfig, RGB } from '@geometric-bg/types';

interface TerrainCanvasProps {
  config: TerrainConfig;
  seed: number;
}

export interface TerrainCanvasHandle {
  exportPNG: () => Promise<Blob>;
  exportJPEG: () => Promise<Blob>;
  exportSVG: () => string;
}

function rgb(c: RGB, alpha = 1): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

// Deterministic pseudo-random value in [0, 1) for an integer lattice point
function hash2(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

// Fractal noise in [0, 1)
function fbm(x: number, z: number, seed: number): number {
  let sum = 0;
  let amplitude = 0.5;
  for (let octave = 0; octave < 4; octave++) {
    sum += amplitude * valueNoise(x, z, seed + octave);
    x *= 2;
    z *= 2;
    amplitude *= 0.5;
  }
  return sum / 0.9375;
}

// Distance over which the flat valley floor ramps up into full-height terrain
const VALLEY_RAMP = 10;

function terrainHeightAt(x: number, z: number, config: TerrainConfig, seed: number): number {
  const { terrainHeight, roughness, valleyWidth } = config;
  const edge = Math.min(1, Math.max(0, (Math.abs(x) - valleyWidth) / VALLEY_RAMP));
  return terrainHeight * fbm(x * roughness, z * roughness, seed) * smooth(edge);
}

function drawSun(ctx: CanvasRenderingContext2D, config: TerrainConfig, groundY: number, scale: number) {
  const { width, height, sunSize, sunTopColor, sunBottomColor } = config;
  const r = sunSize * height;
  const cx = width / 2;
  const cy = groundY - r * 0.7;

  const gradient = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  gradient.addColorStop(0, rgb(sunTopColor));
  gradient.addColorStop(1, rgb(sunBottomColor));

  ctx.save();
  // Clip to horizontal bands so the lower half gets the classic sliced look
  ctx.beginPath();
  ctx.rect(cx - r * 2, cy - r * 2, r * 4, r * 2.15);
  const bands = 6;
  const bandHeight = (r * 0.85) / bands;
  for (let i = 0; i < bands; i++) {
    const gap = bandHeight * (0.2 + 0.1 * i);
    ctx.rect(cx - r * 2, cy + r * 0.15 + i * bandHeight + gap, r * 4, bandHeight - gap);
  }
  ctx.clip();

  ctx.shadowColor = rgb(sunBottomColor);
  ctx.shadowBlur = 40 * scale;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTerrain(ctx: CanvasRenderingContext2D, config: TerrainConfig, seed: number) {
  const {
    width, height, meshStyle, cellSize, drawDistance, cameraHeight, horizon,
    lineColor, lineWidth, glow, fog, surfaceColor, skyTopColor, skyHorizonColor, showSun,
  } = config;

  // Keep line weight and glow proportional when exporting at other resolutions
  const scale = width / 1920;
  const horizonY = height * horizon;
  const focal = width * 0.6;

  // Grid extents: start just in front of the bottom edge of the canvas and make the
  // far edge wide enough to span the whole view
  const zNear = Math.max(0.5, ((focal * cameraHeight) / (height - horizonY)) * 0.5);
  const rows = Math.ceil(drawDistance / cellSize);
  const zFar = zNear + rows * cellSize;
  const halfCols = Math.ceil(((width / 2 / focal) * zFar) / cellSize) + 1;
  const cols = halfCols * 2;
  const stride = cols + 1;

  // The far edge of the grid sits slightly below the true horizon, so the sky runs down to it
  const groundY = horizonY + (focal * cameraHeight) / zFar;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, rgb(skyTopColor));
  sky.addColorStop(1, rgb(skyHorizonColor));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  if (showSun) drawSun(ctx, config, groundY, scale);

  // Ground
  ctx.fillStyle = rgb(surfaceColor);
  ctx.fillRect(0, groundY, width, height - groundY);

  // Project every vertex to screen space
  const sx = new Float32Array((rows + 1) * stride);
  const sy = new Float32Array((rows + 1) * stride);
  for (let j = 0; j <= rows; j++) {
    const z = zNear + j * cellSize;
    for (let i = 0; i <= cols; i++) {
      const x = (i - halfCols) * cellSize;
      const y = terrainHeightAt(x, z, config, seed);
      const idx = j * stride + i;
      sx[idx] = width / 2 + (focal * x) / z;
      sy[idx] = horizonY + (focal * (cameraHeight - y)) / z;
    }
  }

  // Paint strips back to front; each strip's fill hides the lines behind it
  ctx.lineJoin = 'round';
  ctx.shadowColor = rgb(lineColor);
  for (let j = rows - 1; j >= 0; j--) {
    const back = (j + 1) * stride;
    const front = j * stride;
    const depth = (j + 1) / rows;

    ctx.shadowBlur = 0;
    ctx.fillStyle = rgb(surfaceColor);
    ctx.beginPath();
    ctx.moveTo(sx[back], sy[back]);
    for (let i = 1; i <= cols; i++) ctx.lineTo(sx[back + i], sy[back + i]);
    for (let i = cols; i >= 0; i--) ctx.lineTo(sx[front + i], sy[front + i]);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx[back], sy[back]);
    for (let i = 1; i <= cols; i++) ctx.lineTo(sx[back + i], sy[back + i]);
    if (meshStyle !== 'ridges') {
      for (let i = 0; i <= cols; i++) {
        ctx.moveTo(sx[back + i], sy[back + i]);
        ctx.lineTo(sx[front + i], sy[front + i]);
      }
    }
    if (meshStyle === 'triangles') {
      for (let i = 0; i < cols; i++) {
        ctx.moveTo(sx[back + i], sy[back + i]);
        ctx.lineTo(sx[front + i + 1], sy[front + i + 1]);
      }
    }
    ctx.shadowBlur = glow * 20 * scale;
    ctx.strokeStyle = rgb(lineColor, 1 - fog * Math.pow(depth, 1.5));
    ctx.lineWidth = Math.max(0.5, lineWidth * scale * (1 - 0.6 * depth));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

export const TerrainCanvas = forwardRef<TerrainCanvasHandle, TerrainCanvasProps>(
  function TerrainCanvas({ config, seed }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = config.width;
      canvas.height = config.height;
      drawTerrain(ctx, config, seed);
    }, [config, seed]);

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
        // Same approach as the fractal generator: embed the raster in an SVG wrapper
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
