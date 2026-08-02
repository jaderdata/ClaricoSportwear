import { describe, expect, it } from 'vitest';
import { applyToSide, designReducer } from './designReducer';
import { DesignLayer, ImageLayer, TextLayer } from './types';

function makeImageLayer(overrides: Partial<ImageLayer> = {}): ImageLayer {
  return {
    id: 'img-1',
    type: 'image',
    src: 'data:image/png;base64,abc',
    zIndex: 1,
    x: 250,
    y: 230,
    scale: 100,
    rotation: 0,
    baseSize: 90,
    ...overrides,
  };
}

function makeTextLayer(overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    id: 'text-1',
    type: 'text',
    text: 'Team Name',
    fontFamily: 'Arial, sans-serif',
    fill: '#ffffff',
    fontWeight: 700,
    zIndex: 2,
    x: 250,
    y: 320,
    scale: 100,
    rotation: 0,
    baseSize: 32,
    ...overrides,
  };
}

describe('designReducer', () => {
  it('adds a new layer', () => {
    const result = designReducer([], { type: 'ADD_LAYER', layer: makeImageLayer() });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('img-1');
  });

  it('updates only the transform fields of the targeted layer', () => {
    const layers: DesignLayer[] = [makeImageLayer(), makeTextLayer()];
    const result = designReducer(layers, {
      type: 'UPDATE_LAYER_TRANSFORM',
      id: 'img-1',
      transform: { x: 300, scale: 150 },
    });
    expect(result[0]).toMatchObject({ x: 300, scale: 150, y: 230, rotation: 0 });
    expect(result[1]).toEqual(layers[1]);
  });

  it('updates content fields (e.g. text copy) without touching transform', () => {
    const layers: DesignLayer[] = [makeTextLayer()];
    const result = designReducer(layers, {
      type: 'UPDATE_LAYER_CONTENT',
      id: 'text-1',
      content: { text: 'New Copy', fill: '#000000' },
    });
    expect(result[0]).toMatchObject({ text: 'New Copy', fill: '#000000', x: 250, y: 320 });
  });

  it('deletes a layer by id', () => {
    const layers: DesignLayer[] = [makeImageLayer(), makeTextLayer()];
    const result = designReducer(layers, { type: 'DELETE_LAYER', id: 'img-1' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('text-1');
  });

  it('duplicates a layer with a new id, offset position, and top z-index', () => {
    const layers: DesignLayer[] = [makeImageLayer({ zIndex: 1 }), makeTextLayer({ zIndex: 2 })];
    const result = designReducer(layers, { type: 'DUPLICATE_LAYER', id: 'img-1', newId: 'img-2' });
    expect(result).toHaveLength(3);
    const copy = result.find((l) => l.id === 'img-2');
    expect(copy).toMatchObject({ x: 266, y: 246, zIndex: 3 });
  });

  it('is a no-op when duplicating an id that does not exist', () => {
    const layers: DesignLayer[] = [makeImageLayer()];
    const result = designReducer(layers, { type: 'DUPLICATE_LAYER', id: 'missing', newId: 'new' });
    expect(result).toEqual(layers);
  });

  it('reorders a layer forward, swapping z-index with the next layer up', () => {
    const layers: DesignLayer[] = [makeImageLayer({ id: 'a', zIndex: 1 }), makeTextLayer({ id: 'b', zIndex: 2 })];
    const result = designReducer(layers, { type: 'REORDER_LAYER', id: 'a', direction: 'up' });
    expect(result.find((l) => l.id === 'a')?.zIndex).toBe(2);
    expect(result.find((l) => l.id === 'b')?.zIndex).toBe(1);
  });

  it('does nothing when reordering the topmost layer further up', () => {
    const layers: DesignLayer[] = [makeImageLayer({ id: 'a', zIndex: 1 }), makeTextLayer({ id: 'b', zIndex: 2 })];
    const result = designReducer(layers, { type: 'REORDER_LAYER', id: 'b', direction: 'up' });
    expect(result).toEqual(layers);
  });
});

describe('applyToSide', () => {
  it('routes the action to only the targeted side, leaving the other side untouched', () => {
    const front = [makeImageLayer({ id: 'front-1' })];
    const back = [makeTextLayer({ id: 'back-1' })];
    const result = applyToSide({ front, back }, 'front', { type: 'DELETE_LAYER', id: 'front-1' });
    expect(result.front).toEqual([]);
    expect(result.back).toBe(back);
  });

  it('adds a new layer only to the back side', () => {
    const front: DesignLayer[] = [];
    const back: DesignLayer[] = [];
    const newLayer = makeTextLayer({ id: 'back-new' });
    const result = applyToSide({ front, back }, 'back', { type: 'ADD_LAYER', layer: newLayer });
    expect(result.front).toEqual([]);
    expect(result.back).toEqual([newLayer]);
  });
});
