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

// Generator style types for navigation
export type GeneratorStyle = 'geometric' | 'fractal';

export interface GeneratorInfo {
  id: GeneratorStyle;
  name: string;
  description: string;
  path: string;
}
