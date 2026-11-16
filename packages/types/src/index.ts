export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ShapeType = 'triangle' | 'square' | 'diamond' | 'hexagon';

export const shapeTypes: ShapeType[] = ['triangle', 'square', 'diamond', 'hexagon'];

export type GradientDirection = 'radial' | 'horizontal' | 'vertical' | 'diagonal';

export const gradientDirections: GradientDirection[] = ['radial', 'horizontal', 'vertical', 'diagonal'];

export interface BackgroundConfig {
  width: number;
  height: number;
  shapeType: ShapeType;
  shapeSize: number;
  baseColor: RGB;
  colorVariation: number;
  vignetteStrength: number;
  uniformity: number;
  accentColor?: RGB;
  accentFrequency: number;
  accentStrength: number;
  // New shape variation controls
  sizeVariation: number; // 0-1, how much size can vary
  rotation: number; // 0-1, how much random rotation (0 = none, 1 = full 360)
  opacityVariation: number; // 0-1, how much opacity can vary
  minOpacity: number; // 0-1, minimum opacity when variation is applied
  // Color enhancements
  gradientDirection: GradientDirection;
  secondaryColor?: RGB;
  secondaryColorBlend: number; // 0-1, how much secondary color blends in
  saturationVariation: number; // 0-100
  brightnessVariation: number; // 0-100
  // Pattern controls
  density: number; // 0.5-2, multiplier for shape count
  strokeWidth: number; // 0-5, border width
  strokeColor?: RGB;
  // Effects
  glowStrength: number; // 0-1, glow on accent shapes
  glowSize: number; // 0-20, blur radius for glow
}

export const defaultConfig: BackgroundConfig = {
  width: 1920,
  height: 1080,
  shapeType: 'triangle',
  shapeSize: 30,
  baseColor: { r: 35, g: 35, b: 40 },
  colorVariation: 25,
  vignetteStrength: 0,
  uniformity: 0.7,
  accentColor: undefined,
  accentFrequency: 0,
  accentStrength: 1,
  // New defaults
  sizeVariation: 0,
  rotation: 0,
  opacityVariation: 0,
  minOpacity: 0.3,
  gradientDirection: 'radial',
  secondaryColor: undefined,
  secondaryColorBlend: 0.5,
  saturationVariation: 0,
  brightnessVariation: 0,
  density: 1,
  strokeWidth: 0,
  strokeColor: undefined,
  glowStrength: 0,
  glowSize: 10,
};

export interface Point {
  x: number;
  y: number;
}

export type ExportFormat = 'png' | 'svg' | 'jpeg';

// Fractal types
export type FractalType = 'mandelbrot' | 'julia' | 'burningShip' | 'tricorn';

export const fractalTypes: FractalType[] = ['mandelbrot', 'julia', 'burningShip', 'tricorn'];

export type FractalColorScheme = 'classic' | 'fire' | 'ocean' | 'forest' | 'sunset' | 'neon' | 'grayscale';

export const fractalColorSchemes: FractalColorScheme[] = ['classic', 'fire', 'ocean', 'forest', 'sunset', 'neon', 'grayscale'];

export interface FractalConfig {
  width: number;
  height: number;
  fractalType: FractalType;
  // View controls
  centerX: number;
  centerY: number;
  zoom: number;
  // Iteration controls
  maxIterations: number;
  escapeRadius: number;
  // Julia set specific
  juliaReal: number;
  juliaImaginary: number;
  // Color controls
  colorScheme: FractalColorScheme;
  baseColor: RGB;
  colorVariation: number;
  colorCycles: number;
  colorOffset: number;
  // Effects
  smoothColoring: boolean;
  interiorColor: RGB;
}

export const defaultFractalConfig: FractalConfig = {
  width: 1920,
  height: 1080,
  fractalType: 'mandelbrot',
  centerX: -0.5,
  centerY: 0,
  zoom: 1,
  maxIterations: 100,
  escapeRadius: 4,
  juliaReal: -0.7,
  juliaImaginary: 0.27015,
  colorScheme: 'classic',
  baseColor: { r: 0, g: 0, b: 0 },
  colorVariation: 50,
  colorCycles: 1,
  colorOffset: 0,
  smoothColoring: true,
  interiorColor: { r: 0, g: 0, b: 0 },
};

// 3D terrain types
export type TerrainMeshStyle = 'grid' | 'triangles' | 'ridges';

export const terrainMeshStyles: TerrainMeshStyle[] = ['grid', 'triangles', 'ridges'];

export interface TerrainConfig {
  width: number;
  height: number;
  // Mesh
  meshStyle: TerrainMeshStyle;
  cellSize: number; // world units per grid cell
  drawDistance: number; // world units from camera to far edge
  // Terrain shape
  terrainHeight: number; // peak height in world units
  roughness: number; // noise frequency
  showValley: boolean; // flat strip down the middle; when off the camera flies over open terrain
  valleyWidth: number; // half-width of the flat strip down the middle, world units
  // Camera
  cameraHeight: number; // world units above the ground
  cameraAngle: number; // degrees tilted down from level; 90 looks straight down
  horizon: number; // 0-1, horizon position from the top of the canvas
  // Lines
  lineColor: RGB;
  lineWidth: number;
  glow: number; // 0-1
  fog: number; // 0-1, how much lines fade towards the horizon
  surfaceColor: RGB;
  // Sky
  skyTopColor: RGB;
  skyHorizonColor: RGB;
  showSun: boolean;
  sunSize: number; // radius as a fraction of canvas height
  sunTopColor: RGB;
  sunBottomColor: RGB;
}

export const defaultTerrainConfig: TerrainConfig = {
  width: 1920,
  height: 1080,
  meshStyle: 'grid',
  cellSize: 1,
  drawDistance: 60,
  terrainHeight: 7,
  roughness: 0.12,
  showValley: false,
  valleyWidth: 4,
  cameraHeight: 2,
  cameraAngle: 0,
  horizon: 0.5,
  lineColor: { r: 255, g: 45, b: 200 },
  lineWidth: 2,
  glow: 0.6,
  fog: 0.85,
  surfaceColor: { r: 12, g: 4, b: 32 },
  skyTopColor: { r: 10, g: 2, b: 35 },
  skyHorizonColor: { r: 120, g: 20, b: 110 },
  showSun: false,
  sunSize: 0.22,
  sunTopColor: { r: 255, g: 220, b: 80 },
  sunBottomColor: { r: 255, g: 40, b: 140 },
};

// Generator style types for navigation
export type GeneratorStyle = 'geometric' | 'fractal' | 'terrain';

export interface GeneratorInfo {
  id: GeneratorStyle;
  name: string;
  description: string;
  path: string;
}
