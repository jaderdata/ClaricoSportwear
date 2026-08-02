'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Redo2, Type, Undo2, Upload, Wand2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { DesignCanvas, PRINT_ZONES } from '@/components/design-lab/DesignCanvas';
import { LayersPanel } from '@/components/design-lab/LayersPanel';
import { applyToSide, DesignAction, SidesState } from '@/lib/design-lab/designReducer';
import { useHistoryState } from '@/lib/design-lab/useHistoryState';
import { ImageLayer, LayerTransform, PrintPlacement, PrintSide, TEXT_FONT_OPTIONS, TextLayer } from '@/lib/design-lab/types';
import { deriveShirtTokens } from '@/lib/design-lab/color-utils';
import { GarmentColor, GarmentId, GARMENTS, getGarment } from '@/lib/design-lab/garments';

interface CustomizerSectionProps {
  onOpenQuote: (productName?: string, customNotes?: string) => void;
}

const SAMPLE_LOGOS = [
  { name: 'Shield Crest', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200' },
  { name: 'BJJ Team', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200' },
  { name: 'Golden Tiger Crest', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200' },
];

const createLayerId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const CustomizerSection: React.FC<CustomizerSectionProps> = ({ onOpenQuote }) => {
  const [selectedGarmentId, setSelectedGarmentId] = useState<GarmentId>('adult-3600');
  const selectedGarment = getGarment(selectedGarmentId);
  const [selectedColor, setSelectedColor] = useState<GarmentColor>(selectedGarment.colors[0]);
  const [activeSide, setActiveSide] = useState<PrintSide>('front');
  const [frontPlacement, setFrontPlacement] = useState<'chest' | 'sleeve'>('chest');
  const zoneKey: PrintPlacement = activeSide === 'back' ? 'back' : frontPlacement;

  const EMPTY_SIDES: SidesState = { front: [], back: [] };
  const { present: sides, set: setSides, undo, redo, canUndo, canRedo, reset: resetSides } = useHistoryState<SidesState>(EMPTY_SIDES);
  const layers = sides[activeSide];
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ id: string; transform: Partial<LayerTransform> } | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = (action: DesignAction) => setSides(applyToSide(sides, activeSide, action));

  const displayLayers = draft ? layers.map((l) => (l.id === draft.id ? { ...l, ...draft.transform } : l)) : layers;
  const selectedLayer = displayLayers.find((l) => l.id === selectedLayerId) ?? null;

  const handleSideChange = (side: PrintSide) => {
    setActiveSide(side);
    setSelectedLayerId(null);
    setDraft(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const nextZIndex = () => layers.reduce((max, l) => Math.max(max, l.zIndex), 0) + 1;

  const addImageLayer = (src: string) => {
    const zone = PRINT_ZONES[zoneKey];
    const layer: ImageLayer = {
      id: createLayerId(),
      type: 'image',
      src,
      zIndex: nextZIndex(),
      x: zone.cx,
      y: zone.cy,
      scale: 100,
      rotation: 0,
      baseSize: zone.size,
    };
    dispatch({ type: 'ADD_LAYER', layer });
    setSelectedLayerId(layer.id);
  };

  const addTextLayer = () => {
    const zone = PRINT_ZONES[zoneKey];
    const layer: TextLayer = {
      id: createLayerId(),
      type: 'text',
      text: 'YOUR TEXT',
      fontFamily: TEXT_FONT_OPTIONS[0],
      fill: selectedColor.textColor,
      fontWeight: 700,
      zIndex: nextZIndex(),
      x: zone.cx,
      y: zone.cy + zone.size / 2 + 28,
      scale: 100,
      rotation: 0,
      baseSize: 30,
    };
    dispatch({ type: 'ADD_LAYER', layer });
    setSelectedLayerId(layer.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => addImageLayer(event.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleTransformPreview = (id: string, transform: Partial<LayerTransform>) => {
    setDraft((prev) => ({ id, transform: prev && prev.id === id ? { ...prev.transform, ...transform } : transform }));
  };

  const handleTransformCommit = () => {
    if (draft) {
      dispatch({ type: 'UPDATE_LAYER_TRANSFORM', id: draft.id, transform: draft.transform });
      setDraft(null);
    }
  };

  const handleDeleteLayer = (id: string) => {
    dispatch({ type: 'DELETE_LAYER', id });
    if (selectedLayerId === id) setSelectedLayerId(null);
    if (draft?.id === id) setDraft(null);
  };

  const handleDuplicateLayer = (id: string) => {
    const newId = createLayerId();
    dispatch({ type: 'DUPLICATE_LAYER', id, newId });
    setSelectedLayerId(newId);
  };

  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    dispatch({ type: 'REORDER_LAYER', id, direction });
  };

  const handleRemoveBackground = async () => {
    if (!selectedLayer || selectedLayer.type !== 'image' || isRemovingBg) return;
    setIsRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const resultBlob = await removeBackground(selectedLayer.src);
      dispatch({ type: 'UPDATE_LAYER_CONTENT', id: selectedLayer.id, content: { src: URL.createObjectURL(resultBlob) } });
    } catch (error) {
      console.error('Background removal failed:', error);
      alert('Could not remove the background from this image. Try a different file.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleGarmentChange = (id: GarmentId) => {
    const garment = getGarment(id);
    setSelectedGarmentId(id);
    setSelectedColor(garment.colors.find((c) => c.name === selectedColor.name) ?? garment.colors[0]);
  };

  const handleReset = () => {
    setSelectedGarmentId('adult-3600');
    setSelectedColor(GARMENTS[0].colors[0]);
    setFrontPlacement('chest');
    setActiveSide('front');
    resetSides(EMPTY_SIDES);
    setSelectedLayerId(null);
    setDraft(null);
  };

  const handleQuoteCustomizer = () => {
    const allLayers = [...sides.front, ...sides.back];
    const imageCount = allLayers.filter((l) => l.type === 'image').length;
    const textLayers = allLayers.filter((l): l is TextLayer => l.type === 'text');
    const textSummary = textLayers.length > 0 ? ` | Texts: ${textLayers.map((t) => `"${t.text}"`).join(', ')}` : '';
    const customNotes = `[Custom Simulator Mockup]: Garment Model: ${selectedGarment.modelName} | Color: ${selectedColor.name} | Front Layers: ${sides.front.length} | Back Layers: ${sides.back.length} (${imageCount} image, ${textLayers.length} text total)${textSummary}`;
    onOpenQuote(selectedGarment.modelName, customNotes);
  };

  return (
    <Section id="customizer-simulator" border="top">
      <Container>
        <div className="max-w-2xl mb-16">
          <p className="eyebrow mb-4">Interactive Mockup Studio</p>
          <h2 className="font-display text-h1 text-ink">Preview Your Academy Shirts, Live.</h2>
          <p className="mt-4 text-body text-ink-muted">
            Upload your logo, add text, and stack as many layers as you need. Select your color, garment, and print placement — then request your quote directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT PANEL: Controls */}
          <div className="lg:col-span-5 space-y-7">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-[15px] font-medium text-ink">Customizer Controls</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo"
                  className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Undo2 className="size-3.5" strokeWidth={1.75} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo"
                  className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Redo2 className="size-3.5" strokeWidth={1.75} />
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.75} />
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">Garment</label>
              <div className="grid grid-cols-2 gap-2">
                {GARMENTS.map((garment) => (
                  <button
                    key={garment.id}
                    onClick={() => handleGarmentChange(garment.id)}
                    className={`py-2.5 px-3 rounded-control text-sm transition-all cursor-pointer border text-left ${
                      selectedGarmentId === garment.id ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink-muted border-border-strong hover:text-ink'
                    }`}
                  >
                    <span className="block font-medium">{garment.label}</span>
                    <span className={`block text-xs ${selectedGarmentId === garment.id ? 'text-paper/70' : 'text-ink-faint'}`}>
                      {garment.modelName} · {garment.sizes[0].label}–{garment.sizes[garment.sizes.length - 1].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-ink">Color</label>
                <span className="text-sm text-ink-muted">{selectedColor.name}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {selectedGarment.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`h-11 rounded-control transition-all relative flex items-center justify-center cursor-pointer border ${
                      selectedColor.name === color.name ? 'border-ink ring-2 ring-accent/40' : 'border-border-strong hover:border-ink'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColor.name === color.name && (
                      <span className="text-[11px]" style={{ color: color.textColor }}>
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">Side</label>
              <div className="grid grid-cols-2 gap-2">
                {(['front', 'back'] as PrintSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => handleSideChange(side)}
                    className={`py-2.5 px-3 rounded-control text-sm transition-all cursor-pointer border ${
                      activeSide === side ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink-muted border-border-strong hover:text-ink'
                    }`}
                  >
                    {side === 'front' ? 'Front' : 'Back'}
                    {sides[side].length > 0 && <span className="opacity-70"> ({sides[side].length})</span>}
                  </button>
                ))}
              </div>
            </div>

            {activeSide === 'front' ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-ink">Print placement</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'chest', label: 'Chest' },
                    { id: 'sleeve', label: 'Sleeve' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setFrontPlacement(loc.id as 'chest' | 'sleeve')}
                      className={`py-2.5 px-3 rounded-control text-sm transition-all cursor-pointer border ${
                        frontPlacement === loc.id ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink-muted border-border-strong hover:text-ink'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ink-faint">Sets where new layers are added — drag them anywhere afterward.</p>
              </div>
            ) : (
              <p className="text-xs text-ink-faint">New layers land in the center of the full back print area — drag them anywhere afterward.</p>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-ink">Add to your design</label>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="touch-target py-3 rounded-control border border-dashed border-border-strong hover:border-accent text-ink text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="size-4" strokeWidth={1.75} />
                  Upload image
                </button>
                <button
                  onClick={addTextLayer}
                  className="touch-target py-3 rounded-control border border-dashed border-border-strong hover:border-accent text-ink text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Type className="size-4" strokeWidth={1.75} />
                  Add text
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-sm text-ink-muted shrink-0">Samples:</span>
                {SAMPLE_LOGOS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => addImageLayer(sample.url)}
                    className="px-2.5 py-1 rounded-full border border-border-strong text-sm text-ink-muted hover:text-ink hover:border-ink shrink-0 cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelect={setSelectedLayerId}
              onReorder={handleReorderLayer}
              onDuplicate={handleDuplicateLayer}
              onDelete={handleDeleteLayer}
            />

            {selectedLayer && selectedLayer.type === 'image' && (
              <button
                onClick={handleRemoveBackground}
                disabled={isRemovingBg}
                className="w-full touch-target py-2.5 rounded-control border border-border-strong hover:border-accent text-ink text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                {isRemovingBg ? (
                  <>
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
                    Removing background…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" strokeWidth={1.75} />
                    Remove background
                  </>
                )}
              </button>
            )}

            {selectedLayer && selectedLayer.type === 'text' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="block text-sm font-medium text-ink">Edit text</label>
                <input
                  type="text"
                  value={selectedLayer.text}
                  onChange={(e) => dispatch({ type: 'UPDATE_LAYER_CONTENT', id: selectedLayer.id, content: { text: e.target.value } })}
                  className="w-full touch-target px-4 py-3 rounded-control border border-border-strong bg-paper-raised text-ink text-[15px] focus:outline-none focus:border-accent"
                  placeholder="Team name, motto, number..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedLayer.fontFamily}
                    onChange={(e) => dispatch({ type: 'UPDATE_LAYER_CONTENT', id: selectedLayer.id, content: { fontFamily: e.target.value } })}
                    className="touch-target px-3 py-2.5 rounded-control border border-border-strong bg-paper-raised text-ink text-sm focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {TEXT_FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font.split(',')[0].replace(/"/g, '')}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.fill}
                      onChange={(e) => dispatch({ type: 'UPDATE_LAYER_CONTENT', id: selectedLayer.id, content: { fill: e.target.value } })}
                      className="h-10 w-12 rounded-control border border-border-strong cursor-pointer"
                      title="Text color"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'UPDATE_LAYER_CONTENT',
                          id: selectedLayer.id,
                          content: { fontWeight: selectedLayer.fontWeight === 700 ? 400 : 700 },
                        })
                      }
                      className={`flex-1 touch-target rounded-control border text-sm font-bold cursor-pointer ${
                        selectedLayer.fontWeight === 700 ? 'bg-ink text-paper border-ink' : 'border-border-strong text-ink-muted'
                      }`}
                    >
                      B
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-sm text-ink-muted leading-relaxed">
                Drag a layer to move it. Use the top handle to rotate, the corner handle to resize, and the × to remove it. Ctrl+Z / Ctrl+Shift+Z to undo/redo.
              </p>
            </div>

            <Button onClick={handleQuoteCustomizer} className="w-full" size="lg" withArrow>
              Request Quote For This Custom Mockup
            </Button>
          </div>

          {/* RIGHT PANEL: Shirt Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-start">
            <div className="relative w-full max-w-md rounded-panel bg-[#EEECE5] p-8">
              <div className="absolute top-5 left-5 z-20 flex flex-col gap-1.5 text-xs text-ink-muted">
                <span>Color: {selectedColor.name}</span>
                <span>{activeSide === 'back' ? 'Full Back' : frontPlacement === 'chest' ? 'Front Chest' : 'Left Sleeve'}</span>
              </div>

              <div className="w-full">
                <DesignCanvas
                  colorTokens={deriveShirtTokens(selectedColor.hex)}
                  layers={displayLayers}
                  selectedLayerId={selectedLayerId}
                  printPlacement={zoneKey}
                  side={activeSide}
                  onSelectLayer={setSelectedLayerId}
                  onTransformPreview={handleTransformPreview}
                  onTransformCommit={handleTransformCommit}
                  onDeleteLayer={handleDeleteLayer}
                  onRequestUpload={() => fileInputRef.current?.click()}
                />
              </div>

              <div className="text-center mt-2">
                <span className="text-xs text-ink-muted">{selectedGarment.modelName} ({selectedGarment.label})</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
              <span>High-res DTF print</span>
              <span>Preshrunk cotton</span>
              <span>3–5 day production</span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};
