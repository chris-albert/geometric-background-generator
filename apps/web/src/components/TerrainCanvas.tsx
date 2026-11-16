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

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
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

// Unit vector pointing towards the light: from the upper left, slightly behind the camera
const LIGHT_X = -0.608;
const LIGHT_Y = 0.355;
const LIGHT_Z = -0.71;

function terrainHeightAt(x: number, z: number, config: TerrainConfig, seed: number): number {
  const { terrainHeight, roughness, showValley, valleyWidth } = config;
  const height = terrainHeight * fbm(x * roughness, z * roughness, seed);
  if (!showValley) return height;
  const edge = Math.min(1, Math.max(0, (Math.abs(x) - valleyWidth) / VALLEY_RAMP));
  return height * smooth(edge);
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
    lineColor, lineWidth, glow, fog, surfaceColor, shading, skyTopColor, skyHorizonColor, showSun,
  } = config;

  // Keep line weight and glow proportional when exporting at other resolutions
  const scale = width / 1920;
  const horizonY = height * horizon;
  const focal = width * 0.6;
  // Camera height is clearance above the ground beneath it: the valley floor, or with no
  // valley the tallest possible peak, so the camera never ends up inside the terrain
  const cameraY = cameraHeight + (config.showValley ? 0 : config.terrainHeight);

  // The camera sits at (0, cameraY, 0) looking along +z, tilted down by cameraAngle
  const pitch = (config.cameraAngle * Math.PI) / 180;
  const sinP = Math.sin(pitch);
  const cosP = Math.cos(pitch);

  // z at which the view ray through a given canvas row hits a horizontal plane `clearance`
  // below the camera (Infinity if that ray never comes down)
  const rayHitZ = (screenY: number, clearance: number): number => {
    const rayY = (horizonY - screenY) / focal;
    const down = sinP - rayY * cosP;
    return down > 1e-6 ? (clearance / down) * (rayY * sinP + cosP) : Infinity;
  };

  // Grid extents: start in front of the bottom edge of the canvas, stop at the draw distance
  // or where the top edge of the canvas meets the terrain, and span the full view width
  let zNear = Math.min(rayHitZ(height, cameraHeight), rayHitZ(height, cameraY));
  if (!isFinite(zNear)) zNear = 1;
  zNear -= Math.max(cellSize, Math.abs(zNear) * 0.5);
  const peakClearance = cameraY - config.terrainHeight;
  const zTop = Math.max(rayHitZ(0, cameraY), peakClearance > 0 ? rayHitZ(0, peakClearance) : Infinity);
  const rows = Math.max(1, Math.ceil(Math.min(drawDistance, zTop + cellSize - zNear) / cellSize));
  const zFar = zNear + rows * cellSize;
  const maxViewDepth = cameraY * sinP + Math.max(zNear * cosP, zFar * cosP);
  const halfCols = Math.ceil(((width / 2 / focal) * maxViewDepth) / cellSize) + 1;
  const cols = halfCols * 2;
  const stride = cols + 1;

  // Screen position of world point (x, y, z)
  const projectY = (y: number, z: number, viewDepth: number): number =>
    horizonY - (focal * ((y - cameraY) * cosP + z * sinP)) / viewDepth;
  const viewDepthOf = (y: number, z: number): number =>
    Math.max(0.01, (cameraY - y) * sinP + z * cosP);

  // The sky runs down to the far edge of the grid, which sits slightly below the true horizon
  const groundY = Math.min(height, projectY(0, zFar, viewDepthOf(0, zFar)));
  if (groundY > 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, rgb(skyTopColor));
    sky.addColorStop(1, rgb(skyHorizonColor));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, groundY);

    if (showSun) drawSun(ctx, config, groundY, scale);
  }

  // Ground
  ctx.fillStyle = rgb(surfaceColor);
  ctx.fillRect(0, Math.max(0, groundY), width, height);

  // Project every vertex to screen space
  const sx = new Float32Array((rows + 1) * stride);
  const sy = new Float32Array((rows + 1) * stride);
  const hs = new Float32Array((rows + 1) * stride);
  for (let j = 0; j <= rows; j++) {
    const z = zNear + j * cellSize;
    for (let i = 0; i <= cols; i++) {
      const x = (i - halfCols) * cellSize;
      const y = terrainHeightAt(x, z, config, seed);
      const viewDepth = viewDepthOf(y, z);
      const idx = j * stride + i;
      hs[idx] = y;
      sx[idx] = width / 2 + (focal * x) / viewDepth;
      sy[idx] = projectY(y, z, viewDepth);
    }
  }

  ctx.lineJoin = 'round';

  // Line and surface colours run from their near colour at the front row to their far
  // colour at the last row
  const lineColorAt = (row: number) => mix(lineColor, config.lineColorFar, row / rows);
  const surfaceColorAt = (row: number) => mix(surfaceColor, config.surfaceColorFar, row / rows);

  const setLineStyle = (row: number) => {
    const depth = Math.min(1, (row * cellSize) / drawDistance);
    const color = lineColorAt(row);
    ctx.shadowColor = rgb(color);
    ctx.shadowBlur = glow * 20 * scale;
    ctx.strokeStyle = rgb(color, 1 - fog * Math.pow(depth, 1.5));
    ctx.lineWidth = Math.max(0.5, lineWidth * scale * (1 - 0.6 * depth));
  };

  const traceRow = (row: number) => {
    const start = row * stride;
    ctx.moveTo(sx[start], sy[start]);
    for (let i = 1; i <= cols; i++) ctx.lineTo(sx[start + i], sy[start + i]);
  };

  // Fill the strip between rows j and j + 1, then draw its lines plus one of its two edge rows
  const drawStrip = (j: number, edgeRow: number) => {
    const back = (j + 1) * stride;
    const front = j * stride;

    const surface = surfaceColorAt(j);
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgb(surface);
    ctx.beginPath();
    traceRow(j + 1);
    for (let i = cols; i >= 0; i--) ctx.lineTo(sx[front + i], sy[front + i]);
    ctx.closePath();
    ctx.fill();

    if (shading > 0) {
      const depth = Math.min(1, (j * cellSize) / drawDistance);
      const strength = shading * 0.5 * (1 - fog * Math.pow(depth, 1.5));
      const line = lineColorAt(j);
      // Fill one face, tinted towards the line colour by how directly it faces the light.
      // dhdx / dhdz are the face's slope to the right and away from the camera.
      const fillFace = (dhdx: number, dhdz: number, a: number, b: number, c: number, d: number) => {
        const lit = (LIGHT_X * -dhdx + LIGHT_Y + LIGHT_Z * -dhdz) / Math.sqrt(dhdx * dhdx + 1 + dhdz * dhdz);
        const t = Math.max(0, lit) * strength;
        ctx.fillStyle = rgb(mix(surface, line, t));
        ctx.beginPath();
        ctx.moveTo(sx[a], sy[a]);
        ctx.lineTo(sx[b], sy[b]);
        ctx.lineTo(sx[c], sy[c]);
        if (d >= 0) ctx.lineTo(sx[d], sy[d]);
        ctx.closePath();
        ctx.fill();
      };
      for (let i = 0; i < cols; i++) {
        const b0 = back + i;
        const b1 = b0 + 1;
        const f0 = front + i;
        const f1 = f0 + 1;
        if (meshStyle === 'triangles') {
          // Two flat triangles per cell, split along the same diagonal as the lines
          fillFace((hs[b1] - hs[b0]) / cellSize, (hs[b1] - hs[f1]) / cellSize, b0, b1, f1, -1);
          fillFace((hs[f1] - hs[f0]) / cellSize, (hs[b0] - hs[f0]) / cellSize, b0, f1, f0, -1);
        } else {
          fillFace(
            (hs[b1] + hs[f1] - hs[b0] - hs[f0]) / (2 * cellSize),
            (hs[b0] + hs[b1] - hs[f0] - hs[f1]) / (2 * cellSize),
            b0, b1, f1, f0
          );
        }
      }
    }

    ctx.beginPath();
    traceRow(edgeRow);
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
    setLineStyle(edgeRow);
    ctx.stroke();
  };

  // Paint strips farthest-first so each strip's fill hides the lines behind it. When the
  // camera tilts far enough to see ground behind it (z < 0), those strips are painted
  // outside-in first, then the strips ahead of the camera from the far edge inwards.
  const firstRowAhead = Math.min(rows, Math.max(0, Math.ceil(-zNear / cellSize)));
  for (let j = 0; j < firstRowAhead; j++) drawStrip(j, j);
  for (let j = rows - 1; j >= firstRowAhead; j--) drawStrip(j, j + 1);

  // The row where the two passes meet is not drawn by either
  ctx.beginPath();
  traceRow(firstRowAhead);
  setLineStyle(firstRowAhead);
  ctx.stroke();
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
