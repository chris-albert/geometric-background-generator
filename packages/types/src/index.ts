export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ShapeType = 'triangle' | 'square' | 'diamond' | 'hexagon';

export const shapeTypes: ShapeType[] = ['triangle', 'square', 'diamond', 'hexagon'];

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
};

export interface Point {
  x: number;
  y: number;
}

export type ExportFormat = 'png' | 'svg' | 'jpeg';
