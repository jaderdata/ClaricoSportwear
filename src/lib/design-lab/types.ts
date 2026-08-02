export type PrintPlacement = 'chest' | 'back' | 'sleeve';
export type PrintSide = 'front' | 'back';

export const MIN_LAYER_SCALE = 30;
export const MAX_LAYER_SCALE = 300;

export type LayerTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

interface BaseLayer extends LayerTransform {
  id: string;
  zIndex: number;
  /** Bounding box side length (in SVG viewBox units) at scale = 100. */
  baseSize: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fill: string;
  fontWeight: 400 | 700;
}

export type DesignLayer = ImageLayer | TextLayer;

export const TEXT_FONT_OPTIONS = [
  'Arial, sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
  'Impact, sans-serif',
  '"Comic Sans MS", sans-serif',
] as const;
