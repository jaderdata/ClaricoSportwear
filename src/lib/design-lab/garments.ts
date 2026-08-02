import { contrastTextColor } from './color-utils';

export interface GarmentColor {
  name: string;
  hex: string;
  textColor: string;
}

export interface GarmentSize {
  label: string;
  bodyLengthIn: number;
  chestWidthIn: number;
}

export type GarmentId = 'adult-3600' | 'youth-3310';

export interface GarmentDefinition {
  id: GarmentId;
  label: string;
  modelName: string;
  fabricDetails: string;
  colors: GarmentColor[];
  sizes: GarmentSize[];
}

/**
 * The 5 core colors carried by both the adult and youth line, chosen for team-uniform
 * consistency (an academy ordering adult + youth kits wants matching options). All five
 * are confirmed available on the real Next Level 3600 and 3310 color charts.
 */
function coreColors(): GarmentColor[] {
  return [
    { name: 'Black', hex: '#0d0d0d' },
    { name: 'White', hex: '#f5f5f0' },
    { name: 'Royal', hex: '#1f4e9c' },
    { name: 'Heavy Metal', hex: '#4a4a4d' },
    { name: 'Red', hex: '#c8102e' },
  ].map((c) => ({ ...c, textColor: contrastTextColor(c.hex) }));
}

// Body length / chest width (inches, garment measured flat) sourced from the Next Level
// spec sheet for each style.
export const GARMENTS: GarmentDefinition[] = [
  {
    id: 'adult-3600',
    label: 'Adult Unisex',
    modelName: 'Next Level 3600',
    fabricDetails: '100% Combed Ring-Spun Cotton • 4.3 oz/yd²',
    colors: coreColors(),
    sizes: [
      { label: 'S', bodyLengthIn: 28, chestWidthIn: 19 },
      { label: 'M', bodyLengthIn: 29, chestWidthIn: 20.5 },
      { label: 'L', bodyLengthIn: 30, chestWidthIn: 22 },
      { label: 'XL', bodyLengthIn: 31, chestWidthIn: 24 },
      { label: '2XL', bodyLengthIn: 32, chestWidthIn: 26 },
    ],
  },
  {
    id: 'youth-3310',
    label: 'Youth',
    modelName: 'Next Level 3310',
    fabricDetails: '100% Combed Ring-Spun Cotton Jersey • 4.3 oz/yd²',
    colors: coreColors(),
    sizes: [
      { label: 'XS', bodyLengthIn: 19, chestWidthIn: 14 },
      { label: 'S', bodyLengthIn: 20.5, chestWidthIn: 15.5 },
      { label: 'M', bodyLengthIn: 22, chestWidthIn: 17 },
      { label: 'L', bodyLengthIn: 23.5, chestWidthIn: 18.5 },
      { label: 'XL', bodyLengthIn: 25, chestWidthIn: 20 },
    ],
  },
];

export function getGarment(id: GarmentId): GarmentDefinition {
  return GARMENTS.find((g) => g.id === id) ?? GARMENTS[0];
}
