import { DesignLayer, ImageLayer, LayerTransform, PrintSide, TextLayer } from './types';

export type DesignAction =
  | { type: 'ADD_LAYER'; layer: DesignLayer }
  | { type: 'UPDATE_LAYER_TRANSFORM'; id: string; transform: Partial<LayerTransform> }
  | { type: 'UPDATE_LAYER_CONTENT'; id: string; content: Partial<ImageLayer> | Partial<TextLayer> }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'DUPLICATE_LAYER'; id: string; newId: string }
  | { type: 'REORDER_LAYER'; id: string; direction: 'up' | 'down' };

export function designReducer(layers: DesignLayer[], action: DesignAction): DesignLayer[] {
  switch (action.type) {
    case 'ADD_LAYER':
      return [...layers, action.layer];

    case 'UPDATE_LAYER_TRANSFORM':
      return layers.map((layer) => (layer.id === action.id ? { ...layer, ...action.transform } : layer));

    case 'UPDATE_LAYER_CONTENT':
      return layers.map((layer) => (layer.id === action.id ? ({ ...layer, ...action.content } as DesignLayer) : layer));

    case 'DELETE_LAYER':
      return layers.filter((layer) => layer.id !== action.id);

    case 'DUPLICATE_LAYER': {
      const source = layers.find((layer) => layer.id === action.id);
      if (!source) return layers;
      const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), 0);
      const copy: DesignLayer = { ...source, id: action.newId, x: source.x + 16, y: source.y + 16, zIndex: maxZIndex + 1 };
      return [...layers, copy];
    }

    case 'REORDER_LAYER': {
      const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
      const index = sorted.findIndex((layer) => layer.id === action.id);
      if (index === -1) return layers;
      const swapIndex = action.direction === 'up' ? index + 1 : index - 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return layers;

      const current = sorted[index];
      const swapWith = sorted[swapIndex];
      return layers.map((layer) => {
        if (layer.id === current.id) return { ...layer, zIndex: swapWith.zIndex };
        if (layer.id === swapWith.id) return { ...layer, zIndex: current.zIndex };
        return layer;
      });
    }

    default:
      return layers;
  }
}

export type SidesState = Record<PrintSide, DesignLayer[]>;

/** Routes a design action to only the given side's layer array, leaving the other side untouched. */
export function applyToSide(sides: SidesState, side: PrintSide, action: DesignAction): SidesState {
  return { ...sides, [side]: designReducer(sides[side], action) };
}
