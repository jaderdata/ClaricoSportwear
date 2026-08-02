'use client';

import React, { useRef, useState } from 'react';
import {
  angleAt,
  computeMove,
  computeResizeScale,
  computeRotation,
  distanceBetween,
  Point,
} from '@/lib/design-lab/layer-transform';
import { DesignLayer, LayerTransform, MAX_LAYER_SCALE, MIN_LAYER_SCALE, PrintPlacement, PrintSide } from '@/lib/design-lab/types';
import { DragMode, SelectableLayer } from './SelectableLayer';

export interface ShirtColorTokens {
  base: string;
  shadow: string;
  highlight: string;
  midtone: string;
}

export const PRINT_ZONES: Record<PrintPlacement, { cx: number; cy: number; size: number }> = {
  chest: { cx: 250, cy: 230, size: 90 },
  back: { cx: 250, cy: 250, size: 130 },
  sleeve: { cx: 115, cy: 185, size: 55 },
};

interface DragState {
  id: string;
  mode: DragMode;
  startPoint: Point;
  startTransform: LayerTransform;
  startDistance: number;
  startAngle: number;
}

interface DesignCanvasProps {
  colorTokens: ShirtColorTokens;
  layers: DesignLayer[];
  selectedLayerId: string | null;
  printPlacement: PrintPlacement;
  side: PrintSide;
  onSelectLayer: (id: string | null) => void;
  onTransformPreview: (id: string, transform: Partial<LayerTransform>) => void;
  onTransformCommit: () => void;
  onDeleteLayer: (id: string) => void;
  onRequestUpload: () => void;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({
  colorTokens,
  layers,
  selectedLayerId,
  printPlacement,
  side,
  onSelectLayer,
  onTransformPreview,
  onTransformCommit,
  onDeleteLayer,
  onRequestUpload,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const getSvgPoint = (clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const handleStartDrag = (layer: DesignLayer, mode: DragMode, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = getSvgPoint(e.clientX, e.clientY);
    const center: Point = { x: layer.x, y: layer.y };
    dragRef.current = {
      id: layer.id,
      mode,
      startPoint: p,
      startTransform: { x: layer.x, y: layer.y, scale: layer.scale, rotation: layer.rotation },
      startDistance: mode === 'resize' ? distanceBetween(center, p) || 1 : 0,
      startAngle: mode === 'rotate' ? angleAt(center, p) : 0,
    };
    setDraggingId(layer.id);
    onSelectLayer(layer.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = getSvgPoint(e.clientX, e.clientY);
    const center: Point = { x: drag.startTransform.x, y: drag.startTransform.y };

    if (drag.mode === 'move') {
      onTransformPreview(drag.id, computeMove(drag.startPoint, p, center));
    } else if (drag.mode === 'resize') {
      const scale = computeResizeScale(center, p, drag.startDistance, drag.startTransform.scale, MIN_LAYER_SCALE, MAX_LAYER_SCALE);
      onTransformPreview(drag.id, { scale });
    } else if (drag.mode === 'rotate') {
      const rotation = computeRotation(center, p, drag.startAngle, drag.startTransform.rotation);
      onTransformPreview(drag.id, { rotation });
    }
  };

  const endDrag = () => {
    if (dragRef.current) onTransformCommit();
    dragRef.current = null;
    setDraggingId(null);
  };

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const zone = PRINT_ZONES[printPlacement];

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 500 560"
      className="w-full h-full drop-shadow-xl select-none touch-none"
      xmlns="http://www.w3.org/2000/svg"
      onPointerDown={() => onSelectLayer(null)}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <defs>
        <filter id="fabric" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" result="noiseOut" />
          <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise" />
          <feComponentTransfer in="grayNoise" result="softNoise">
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id="bodyShading" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorTokens.highlight} />
          <stop offset="40%" stopColor={colorTokens.base} />
          <stop offset="100%" stopColor={colorTokens.shadow} />
        </linearGradient>
        <linearGradient id="sleeveLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorTokens.highlight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colorTokens.shadow} />
        </linearGradient>
        <linearGradient id="sleeveRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorTokens.highlight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colorTokens.shadow} />
        </linearGradient>
        <radialGradient id="centerLight" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor={colorTokens.highlight} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colorTokens.shadow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sideVignette" cx="50%" cy="50%" r="58%">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor={colorTokens.shadow} stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id="collarInner" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor={colorTokens.shadow} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colorTokens.shadow} stopOpacity="0" />
        </radialGradient>
        <clipPath id="shirtBodyClip">
          <path d="
            M 175 68
            C 200 68 215 82 250 88
            C 285 82 300 68 325 68
            L 388 95
            L 440 130
            L 420 175
            L 390 162
            L 385 195
            L 385 490
            C 310 502 190 502 115 490
            L 115 195
            L 110 162
            L 80 175
            L 60 130
            L 112 95
            Z
          " />
        </clipPath>
      </defs>

      {/* ── LEFT SLEEVE ── */}
      <path
        d="M 175 68 L 112 95 L 60 130 L 80 175 L 110 162 L 130 150 L 145 130 L 160 108 L 175 90 Z"
        fill="url(#sleeveLeftGrad)"
        filter="url(#fabric)"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M 115 160 L 100 135 L 75 118" fill="none" stroke={colorTokens.shadow} strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 110 162 L 130 150 L 145 130" fill="none" stroke={colorTokens.shadow} strokeWidth="2" strokeOpacity="0.4" />

      {/* ── RIGHT SLEEVE ── */}
      <path
        d="M 325 68 L 388 95 L 440 130 L 420 175 L 390 162 L 370 150 L 355 130 L 340 108 L 325 90 Z"
        fill="url(#sleeveRightGrad)"
        filter="url(#fabric)"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M 385 160 L 400 135 L 425 118" fill="none" stroke={colorTokens.shadow} strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 390 162 L 370 150 L 355 130" fill="none" stroke={colorTokens.shadow} strokeWidth="2" strokeOpacity="0.4" />

      {/* ── MAIN BODY ── */}
      <path
        d="
          M 175 68
          C 200 68 215 82 250 88
          C 285 82 300 68 325 68
          L 388 95
          L 440 130
          L 420 175
          L 390 162
          L 385 195
          L 385 490
          C 310 502 190 502 115 490
          L 115 195
          L 110 162
          L 80 175
          L 60 130
          L 112 95
          Z
        "
        fill="url(#bodyShading)"
        filter="url(#fabric)"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M 175 68 C 200 68 215 82 250 88 C 285 82 300 68 325 68 L 385 195 L 385 490 C 310 502 190 502 115 490 L 115 195 Z"
        fill="url(#centerLight)"
      />
      <path
        d="M 175 68 C 200 68 215 82 250 88 C 285 82 300 68 325 68 L 385 195 L 385 490 C 310 502 190 502 115 490 L 115 195 Z"
        fill="url(#sideVignette)"
      />

      {/* ── SHOULDER SEAM LINES ── */}
      <path d="M 175 68 L 135 90" fill="none" stroke={colorTokens.shadow} strokeWidth="2" strokeOpacity="0.6" />
      <path d="M 325 68 L 365 90" fill="none" stroke={colorTokens.shadow} strokeWidth="2" strokeOpacity="0.6" />

      {/* ── SIDE SEAM LINES ── */}
      <line x1="115" y1="200" x2="115" y2="488" stroke="rgba(15,23,42,0.22)" strokeWidth="1.5" strokeDasharray="4,6" />
      <line x1="385" y1="200" x2="385" y2="488" stroke="rgba(15,23,42,0.22)" strokeWidth="1.5" strokeDasharray="4,6" />

      {/* ── COLLAR ── */}
      {side === 'front' ? (
        <>
          <ellipse cx="250" cy="76" rx="50" ry="18" fill={colorTokens.shadow} fillOpacity="0.9" stroke="rgba(15,23,42,0.18)" strokeWidth="1" />
          <path d="M 200 68 Q 250 95 300 68" fill="none" stroke={colorTokens.highlight} strokeWidth="5" strokeLinecap="round" strokeOpacity="0.4" />
          <path d="M 200 68 Q 250 91 300 68" fill="none" stroke={colorTokens.base} strokeWidth="8" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M 205 66 Q 250 84 295 66" fill="none" stroke={colorTokens.highlight} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
          <path d="M 200 70 Q 250 100 300 70" fill="url(#collarInner)" fillOpacity="0.4" />
        </>
      ) : (
        <>
          {/* Back neckline sits shallower than the front crew opening */}
          <ellipse cx="250" cy="74" rx="48" ry="13" fill={colorTokens.shadow} fillOpacity="0.85" stroke="rgba(15,23,42,0.18)" strokeWidth="1" />
          <path d="M 206 70 Q 250 82 294 70" fill="none" stroke={colorTokens.highlight} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
          {/* Back yoke seam */}
          <path d="M 150 112 Q 250 124 350 112" fill="none" stroke={colorTokens.shadow} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="3,5" />
        </>
      )}

      {/* ── BOTTOM HEM ── */}
      <path d="M 115 488 Q 250 506 385 488" fill="none" stroke={colorTokens.highlight} strokeWidth="3" strokeOpacity="0.35" strokeLinecap="round" />
      <path d="M 115 492 Q 250 510 385 492" fill="none" stroke={colorTokens.shadow} strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />

      {/* ── SLEEVE HEM BANDS ── */}
      <path d="M 60 128 L 80 174" fill="none" stroke={colorTokens.highlight} strokeWidth="3.5" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M 440 128 L 420 174" fill="none" stroke={colorTokens.highlight} strokeWidth="3.5" strokeOpacity="0.5" strokeLinecap="round" />

      {/* ── FABRIC FOLD ── */}
      <path d="M 210 200 Q 220 310 215 420" fill="none" stroke={colorTokens.shadow} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M 290 200 Q 280 310 285 420" fill="none" stroke={colorTokens.shadow} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />

      {/* ── DESIGN LAYERS (clipped to shirt body) ── */}
      <g clipPath="url(#shirtBodyClip)">
        {layers.length === 0 ? (
          <g onPointerDown={(e) => { e.stopPropagation(); onRequestUpload(); }} style={{ cursor: 'pointer' }}>
            <rect
              x={zone.cx - zone.size / 2}
              y={zone.cy - zone.size / 2}
              width={zone.size}
              height={zone.size}
              rx="6"
              fill="rgba(255,255,255,0.08)"
              stroke="#C1222E"
              strokeWidth="2"
              strokeDasharray="6,4"
              strokeOpacity="0.75"
            />
            <text x={zone.cx} y={zone.cy - 6} textAnchor="middle" dominantBaseline="middle" fill="#C1222E" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="1.5">
              YOUR DESIGN
            </text>
            <text x={zone.cx} y={zone.cy + 10} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="8" fontWeight="500" fontFamily="sans-serif" letterSpacing="1">
              CLICK TO UPLOAD
            </text>
          </g>
        ) : (
          sortedLayers.map((layer) => {
            const size = layer.baseSize * (layer.scale / 100);
            return (
              <SelectableLayer
                key={layer.id}
                transform={layer}
                size={size}
                isSelected={selectedLayerId === layer.id}
                isDragging={draggingId === layer.id}
                onStartDrag={(mode, e) => handleStartDrag(layer, mode, e)}
                onDelete={() => onDeleteLayer(layer.id)}
              >
                {layer.type === 'image' ? (
                  <image
                    href={layer.src}
                    x={-size / 2}
                    y={-size / 2}
                    width={size}
                    height={size}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
                  />
                ) : (
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={size}
                    fontFamily={layer.fontFamily}
                    fill={layer.fill}
                    fontWeight={layer.fontWeight}
                  >
                    {layer.text}
                  </text>
                )}
              </SelectableLayer>
            );
          })
        )}
      </g>
    </svg>
  );
};
