'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, RotateCcw, Wand2, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

interface CustomizerSectionProps {
  onOpenQuote: (productName?: string, customNotes?: string) => void;
}

interface ShirtColorOption {
  name: string;
  hex: string;
  textColor: string;
  svgBase: string;
  svgShadow: string;
  svgHighlight: string;
  svgMidtone: string;
}

const SHIRT_COLORS: ShirtColorOption[] = [
  {
    name: 'Pitch Black',
    hex: '#121318',
    textColor: '#ffffff',
    svgBase: '#161820',
    svgShadow: '#0a0b0e',
    svgHighlight: '#252830',
    svgMidtone: '#1c1f28',
  },
  {
    name: 'Crisp White',
    hex: '#f8fafc',
    textColor: '#0f172a',
    svgBase: '#f1f5f9',
    svgShadow: '#cbd5e1',
    svgHighlight: '#ffffff',
    svgMidtone: '#e2e8f0',
  },
  {
    name: 'Navy Blue',
    hex: '#1b2838',
    textColor: '#ffffff',
    svgBase: '#1e3a5f',
    svgShadow: '#0f1f35',
    svgHighlight: '#2d4f7c',
    svgMidtone: '#1a3050',
  },
  {
    name: 'Charcoal Grey',
    hex: '#334155',
    textColor: '#ffffff',
    svgBase: '#3f4f63',
    svgShadow: '#1e2a38',
    svgHighlight: '#546070',
    svgMidtone: '#374555',
  },
  {
    name: 'Sport Grey',
    hex: '#64748b',
    textColor: '#ffffff',
    svgBase: '#7a8fa8',
    svgShadow: '#4a5c72',
    svgHighlight: '#9ab0c8',
    svgMidtone: '#6b7f98',
  },
  {
    name: 'Crimson Red',
    hex: '#881337',
    textColor: '#ffffff',
    svgBase: '#9b1239',
    svgShadow: '#5c0a22',
    svgHighlight: '#c41b4a',
    svgMidtone: '#8a102f',
  },
];

const SAMPLE_LOGOS = [
  { name: 'Shield Crest', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200' },
  { name: 'BJJ Team', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200' },
  { name: 'Golden Tiger Crest', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200' },
];

interface LogoTransformChange {
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotation?: number;
}

const MIN_LOGO_SCALE = 40;
const MAX_LOGO_SCALE = 220;

// Realistic T-Shirt SVG with a directly-draggable logo layer (Amazon-style customizer)
const TShirtSVG = ({
  color,
  logoImage,
  logoScale,
  logoOffsetX,
  logoOffsetY,
  logoRotation,
  printPlacement,
  onLogoChange,
  onDeleteLogo,
  onRequestUpload,
}: {
  color: ShirtColorOption;
  logoImage: string | null;
  logoScale: number;
  logoOffsetX: number;
  logoOffsetY: number;
  logoRotation: number;
  printPlacement: 'chest' | 'back' | 'sleeve';
  onLogoChange: (change: LogoTransformChange) => void;
  onDeleteLogo: () => void;
  onRequestUpload: () => void;
}) => {
  // Print zone centers (in SVG 0-500 space)
  const printZones = {
    chest:  { cx: 250, cy: 230 },
    back:   { cx: 250, cy: 250 },
    sleeve: { cx: 115, cy: 185 },
  };
  const zone = printZones[printPlacement];
  const logoSize = (printPlacement === 'chest' ? 90 : printPlacement === 'back' ? 130 : 55) * (logoScale / 100);
  const centerX = zone.cx + logoOffsetX;
  const centerY = zone.cy + logoOffsetY;

  const svgRef = useRef<SVGSVGElement>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prevLogoImage, setPrevLogoImage] = useState(logoImage);

  // Re-select (and re-reveal handles) whenever a new design is dropped in.
  // Adjusted during render (not an effect) to avoid an extra commit.
  if (logoImage !== prevLogoImage) {
    setPrevLogoImage(logoImage);
    if (logoImage) setIsSelected(true);
  }

  const dragRef = useRef<{
    mode: 'move' | 'resize' | 'rotate';
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    startScale: number;
    startRotation: number;
    startDistance: number;
    startAngle: number;
  } | null>(null);

  const getSvgPoint = (clientX: number, clientY: number) => {
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

  const capturePointer = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const startMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    capturePointer(e);
    setIsSelected(true);
    setIsDragging(true);
    const p = getSvgPoint(e.clientX, e.clientY);
    dragRef.current = {
      mode: 'move',
      startX: p.x,
      startY: p.y,
      startOffsetX: logoOffsetX,
      startOffsetY: logoOffsetY,
      startScale: logoScale,
      startRotation: logoRotation,
      startDistance: 0,
      startAngle: 0,
    };
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    capturePointer(e);
    setIsDragging(true);
    const p = getSvgPoint(e.clientX, e.clientY);
    dragRef.current = {
      mode: 'resize',
      startX: p.x,
      startY: p.y,
      startOffsetX: logoOffsetX,
      startOffsetY: logoOffsetY,
      startScale: logoScale,
      startRotation: logoRotation,
      startDistance: Math.hypot(p.x - centerX, p.y - centerY) || 1,
      startAngle: 0,
    };
  };

  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    capturePointer(e);
    setIsDragging(true);
    const p = getSvgPoint(e.clientX, e.clientY);
    dragRef.current = {
      mode: 'rotate',
      startX: p.x,
      startY: p.y,
      startOffsetX: logoOffsetX,
      startOffsetY: logoOffsetY,
      startScale: logoScale,
      startRotation: logoRotation,
      startDistance: 0,
      startAngle: Math.atan2(p.y - centerY, p.x - centerX),
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = getSvgPoint(e.clientX, e.clientY);

    if (drag.mode === 'move') {
      onLogoChange({
        offsetX: drag.startOffsetX + (p.x - drag.startX),
        offsetY: drag.startOffsetY + (p.y - drag.startY),
      });
    } else if (drag.mode === 'resize') {
      const dist = Math.hypot(p.x - centerX, p.y - centerY);
      const nextScale = Math.min(MAX_LOGO_SCALE, Math.max(MIN_LOGO_SCALE, drag.startScale * (dist / drag.startDistance)));
      onLogoChange({ scale: nextScale });
    } else if (drag.mode === 'rotate') {
      const angle = Math.atan2(p.y - centerY, p.x - centerX);
      const deltaDeg = (angle - drag.startAngle) * (180 / Math.PI);
      onLogoChange({ rotation: drag.startRotation + deltaDeg });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 500 560"
      className="w-full h-full drop-shadow-xl select-none touch-none"
      xmlns="http://www.w3.org/2000/svg"
      onPointerDown={() => setIsSelected(false)}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <defs>
        {/* Fabric texture grain (subtle) */}
        <filter id="fabric" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" result="noiseOut" />
          <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise" />
          <feComponentTransfer in="grayNoise" result="softNoise">
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        {/* Shirt body shadow gradient */}
        <linearGradient id="bodyShading" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.svgHighlight} />
          <stop offset="40%" stopColor={color.svgBase} />
          <stop offset="100%" stopColor={color.svgShadow} />
        </linearGradient>
        {/* Sleeve left gradient */}
        <linearGradient id="sleeveLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.svgHighlight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color.svgShadow} />
        </linearGradient>
        {/* Sleeve right gradient */}
        <linearGradient id="sleeveRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color.svgHighlight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color.svgShadow} />
        </linearGradient>
        {/* Center body lighting */}
        <radialGradient id="centerLight" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor={color.svgHighlight} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color.svgShadow} stopOpacity="0" />
        </radialGradient>
        {/* Side shadow vignette (kept tight to the edges so it reads as fabric falloff, not a blob) */}
        <radialGradient id="sideVignette" cx="50%" cy="50%" r="58%">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor={color.svgShadow} stopOpacity="0.18" />
        </radialGradient>
        {/* Collar inner shadow */}
        <radialGradient id="collarInner" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor={color.svgShadow} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color.svgShadow} stopOpacity="0" />
        </radialGradient>
        {/* Clip path for shirt body (logo stays inside) */}
        <clipPath id="shirtBodyClip">
          {/* Same path as the main body */}
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
      <path d="M 115 160 L 100 135 L 75 118" fill="none" stroke={color.svgShadow} strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 110 162 L 130 150 L 145 130" fill="none" stroke={color.svgShadow} strokeWidth="2" strokeOpacity="0.4" />

      {/* ── RIGHT SLEEVE ── */}
      <path
        d="M 325 68 L 388 95 L 440 130 L 420 175 L 390 162 L 370 150 L 355 130 L 340 108 L 325 90 Z"
        fill="url(#sleeveRightGrad)"
        filter="url(#fabric)"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M 385 160 L 400 135 L 425 118" fill="none" stroke={color.svgShadow} strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M 390 162 L 370 150 L 355 130" fill="none" stroke={color.svgShadow} strokeWidth="2" strokeOpacity="0.4" />

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
      <path d="M 175 68 L 135 90" fill="none" stroke={color.svgShadow} strokeWidth="2" strokeOpacity="0.6" />
      <path d="M 325 68 L 365 90" fill="none" stroke={color.svgShadow} strokeWidth="2" strokeOpacity="0.6" />

      {/* ── SIDE SEAM LINES (subtle) ── */}
      <line x1="115" y1="200" x2="115" y2="488" stroke="rgba(15,23,42,0.22)" strokeWidth="1.5" strokeDasharray="4,6" />
      <line x1="385" y1="200" x2="385" y2="488" stroke="rgba(15,23,42,0.22)" strokeWidth="1.5" strokeDasharray="4,6" />

      {/* ── COLLAR ── */}
      <ellipse cx="250" cy="76" rx="50" ry="18" fill={color.svgShadow} fillOpacity="0.9" stroke="rgba(15,23,42,0.18)" strokeWidth="1" />
      <path d="M 200 68 Q 250 95 300 68" fill="none" stroke={color.svgHighlight} strokeWidth="5" strokeLinecap="round" strokeOpacity="0.4" />
      <path d="M 200 68 Q 250 91 300 68" fill="none" stroke={color.svgBase} strokeWidth="8" strokeLinecap="round" strokeOpacity="0.7" />
      <path d="M 205 66 Q 250 84 295 66" fill="none" stroke={color.svgHighlight} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
      <path d="M 200 70 Q 250 100 300 70" fill="url(#collarInner)" fillOpacity="0.4" />

      {/* ── BOTTOM HEM ── */}
      <path d="M 115 488 Q 250 506 385 488" fill="none" stroke={color.svgHighlight} strokeWidth="3" strokeOpacity="0.35" strokeLinecap="round" />
      <path d="M 115 492 Q 250 510 385 492" fill="none" stroke={color.svgShadow} strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />

      {/* ── SLEEVE HEM BANDS ── */}
      <path d="M 60 128 L 80 174" fill="none" stroke={color.svgHighlight} strokeWidth="3.5" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M 440 128 L 420 174" fill="none" stroke={color.svgHighlight} strokeWidth="3.5" strokeOpacity="0.5" strokeLinecap="round" />

      {/* ── FABRIC FOLD (natural drape lines on body) ── */}
      <path d="M 210 200 Q 220 310 215 420" fill="none" stroke={color.svgShadow} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M 290 200 Q 280 310 285 420" fill="none" stroke={color.svgShadow} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />

      {/* ── LOGO / PRINT LAYER (clipped to shirt body) ── */}
      <g clipPath="url(#shirtBodyClip)">
        {logoImage ? (
          <g transform={`translate(${centerX} ${centerY}) rotate(${logoRotation})`}>
            <image
              href={logoImage}
              x={-logoSize / 2}
              y={-logoSize / 2}
              width={logoSize}
              height={logoSize}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))', cursor: isDragging ? 'grabbing' : 'grab' }}
              onPointerDown={startMove}
            />
            <foreignObject width="1" height="1" x="0" y="0" style={{ overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
              <img src={logoImage} alt="Custom Print Logo" />
            </foreignObject>
          </g>
        ) : (
          <g
            onPointerDown={(e) => {
              e.stopPropagation();
              onRequestUpload();
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={zone.cx - logoSize / 2}
              y={zone.cy - logoSize / 2}
              width={logoSize}
              height={logoSize}
              rx="6"
              fill="rgba(255,255,255,0.08)"
              stroke="#C1222E"
              strokeWidth="2"
              strokeDasharray="6,4"
              strokeOpacity="0.75"
            />
            <text
              x={zone.cx}
              y={zone.cy - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#C1222E"
              fontSize="11"
              fontWeight="700"
              fontFamily="sans-serif"
              letterSpacing="1.5"
            >
              YOUR LOGO
            </text>
            <text
              x={zone.cx}
              y={zone.cy + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.65)"
              fontSize="8"
              fontWeight="500"
              fontFamily="sans-serif"
              letterSpacing="1"
            >
              CLICK TO UPLOAD
            </text>
          </g>
        )}
      </g>

      {/* ── SELECTION HANDLES (drag to move / resize / rotate, not clipped so handles stay visible) ── */}
      {logoImage && isSelected && (
        <g transform={`translate(${centerX} ${centerY}) rotate(${logoRotation})`}>
          <rect
            x={-logoSize / 2}
            y={-logoSize / 2}
            width={logoSize}
            height={logoSize}
            fill="transparent"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={startMove}
          />
          {/* rotate handle */}
          <line x1="0" y1={-logoSize / 2} x2="0" y2={-logoSize / 2 - 26} stroke="#ffffff" strokeWidth="1.5" />
          <circle
            cx="0"
            cy={-logoSize / 2 - 26}
            r="7.5"
            fill="#ffffff"
            stroke="#C1222E"
            strokeWidth="2"
            style={{ cursor: 'grab' }}
            onPointerDown={startRotate}
          />
          {/* resize handle */}
          <circle
            cx={logoSize / 2}
            cy={logoSize / 2}
            r="7.5"
            fill="#ffffff"
            stroke="#C1222E"
            strokeWidth="2"
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={startResize}
          />
          {/* delete handle */}
          <circle
            cx={-logoSize / 2}
            cy={-logoSize / 2}
            r="7.5"
            fill="#ffffff"
            stroke="#C1222E"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onDeleteLogo();
            }}
          />
          <text
            x={-logoSize / 2}
            y={-logoSize / 2 + 3.5}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#C1222E"
            pointerEvents="none"
          >
            ×
          </text>
        </g>
      )}
    </svg>
  );
};

export const CustomizerSection: React.FC<CustomizerSectionProps> = ({ onOpenQuote }) => {
  const [selectedColor, setSelectedColor] = useState<ShirtColorOption>(SHIRT_COLORS[0]);
  const [selectedModel, setSelectedModel] = useState<string>('Gildan 3600 Classic Crew');
  const [printPlacement, setPrintPlacement] = useState<'chest' | 'back' | 'sleeve'>('chest');

  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(100);
  const [logoOffsetY, setLogoOffsetY] = useState<number>(0);
  const [logoOffsetX, setLogoOffsetX] = useState<number>(0);
  const [logoRotation, setLogoRotation] = useState<number>(0);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetLogoTransform = () => {
    setLogoScale(100);
    setLogoOffsetX(0);
    setLogoOffsetY(0);
    setLogoRotation(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        resetLogoTransform();
        setLogoImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (url: string) => {
    resetLogoTransform();
    setLogoImage(url);
  };

  const handlePlacementChange = (id: 'chest' | 'back' | 'sleeve') => {
    setPrintPlacement(id);
    resetLogoTransform();
  };

  const handleLogoTransformChange = (change: LogoTransformChange) => {
    if (change.offsetX !== undefined) setLogoOffsetX(change.offsetX);
    if (change.offsetY !== undefined) setLogoOffsetY(change.offsetY);
    if (change.scale !== undefined) setLogoScale(change.scale);
    if (change.rotation !== undefined) setLogoRotation(change.rotation);
  };

  const handleRemoveBackground = async () => {
    if (!logoImage || isRemovingBg) return;
    setIsRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const resultBlob = await removeBackground(logoImage);
      setLogoImage(URL.createObjectURL(resultBlob));
    } catch (error) {
      console.error('Background removal failed:', error);
      alert('Could not remove the background from this image. Try a different file.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleReset = () => {
    setSelectedColor(SHIRT_COLORS[0]);
    setSelectedModel('Gildan 3600 Classic Crew');
    setPrintPlacement('chest');
    setLogoImage(null);
    resetLogoTransform();
  };

  const handleQuoteCustomizer = () => {
    const customNotes = `[Custom Simulator Mockup]: Garment Model: ${selectedModel} | Color: ${selectedColor.name} | Print Location: ${printPlacement.toUpperCase()} | Logo Scale: ${Math.round(logoScale)}% | Logo Rotation: ${Math.round(logoRotation)}°`;
    onOpenQuote(selectedModel, customNotes);
  };

  return (
    <Section id="customizer-simulator" border="top">
      <Container>
        <div className="max-w-2xl mb-16">
          <p className="eyebrow mb-4">Interactive Mockup Studio</p>
          <h2 className="font-display text-h1 text-ink">Preview Your Academy Shirts, Live.</h2>
          <p className="mt-4 text-body text-ink-muted">
            Upload your logo or choose a sample. Select your color, garment, and print placement — then request your quote directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT PANEL: Controls */}
          <div className="lg:col-span-5 space-y-7">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-[15px] font-medium text-ink">Customizer Controls</h3>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.75} />
                Reset
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">Garment model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full touch-target px-4 py-3 rounded-control border border-border-strong bg-paper-raised text-ink text-[15px] focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="Gildan 3600 Classic Crew">Gildan 3600 Classic Crew (6.0 oz)</option>
                <option value="Gildan 64000 Softstyle">Gildan 64000 Softstyle Tee (4.5 oz)</option>
                <option value="Heavyweight Oversized Street Tee">Heavyweight Oversized Street Tee (7.5 oz)</option>
                <option value="Custom Academy Fleece Hoodie">Gildan 18000 Heavy Fleece Hoodie</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-ink">Color</label>
                <span className="text-sm text-ink-muted">{selectedColor.name}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SHIRT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`h-11 rounded-control transition-all relative flex items-center justify-center cursor-pointer border ${
                      selectedColor.name === color.name
                        ? 'border-ink ring-2 ring-accent/40'
                        : 'border-border-strong hover:border-ink'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColor.name === color.name && (
                      <span
                        className="text-[11px]"
                        style={{ color: color.name === 'Crisp White' ? '#000' : '#fff' }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">Print placement</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'chest', label: 'Front Chest' },
                  { id: 'back', label: 'Full Back' },
                  { id: 'sleeve', label: 'Sleeve' },
                ].map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handlePlacementChange(loc.id as 'chest' | 'back' | 'sleeve')}
                    className={`py-2.5 px-3 rounded-control text-sm transition-all cursor-pointer border ${
                      printPlacement === loc.id
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-transparent text-ink-muted border-border-strong hover:text-ink'
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-ink">Upload logo</label>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full touch-target py-3 rounded-control border border-dashed border-border-strong hover:border-accent text-ink text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="size-4" strokeWidth={1.75} />
                Upload logo (PNG / SVG)
              </button>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-sm text-ink-muted shrink-0">Samples:</span>
                {SAMPLE_LOGOS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sample.url)}
                    className="px-2.5 py-1 rounded-full border border-border-strong text-sm text-ink-muted hover:text-ink hover:border-ink shrink-0 cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
                {logoImage && (
                  <button
                    onClick={() => setLogoImage(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-accent/40 text-sm text-accent shrink-0 cursor-pointer"
                  >
                    <X className="size-3.5" strokeWidth={2} />
                    Clear
                  </button>
                )}
              </div>
              {logoImage && (
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
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-sm text-ink-muted leading-relaxed">
                Drag your design on the shirt to move it. Use the top handle to rotate and the corner handle to resize. Tap the × to remove it.
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
                <span>{printPlacement === 'chest' ? 'Front Chest' : printPlacement === 'back' ? 'Full Back' : 'Left Sleeve'}</span>
              </div>

              <div className="w-full">
                <TShirtSVG
                  color={selectedColor}
                  logoImage={logoImage}
                  logoScale={logoScale}
                  logoOffsetX={logoOffsetX}
                  logoOffsetY={logoOffsetY}
                  logoRotation={logoRotation}
                  printPlacement={printPlacement}
                  onLogoChange={handleLogoTransformChange}
                  onDeleteLogo={() => setLogoImage(null)}
                  onRequestUpload={() => fileInputRef.current?.click()}
                />
              </div>

              <div className="text-center mt-2">
                <span className="text-xs text-ink-muted">{selectedModel}</span>
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
