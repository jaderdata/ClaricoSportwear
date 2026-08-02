'use client';

import React from 'react';
import { LayerTransform } from '@/lib/design-lab/types';

export type DragMode = 'move' | 'resize' | 'rotate';

interface SelectableLayerProps {
  transform: LayerTransform;
  /** Bounding box side length, in SVG viewBox units, already resolved for the current scale. */
  size: number;
  isSelected: boolean;
  isDragging: boolean;
  onStartDrag: (mode: DragMode, e: React.PointerEvent) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Generic move/resize/rotate/delete selection chrome for a single design layer.
 * Pointer capture + the actual transform math live in the parent canvas (DesignCanvas),
 * so this component just forwards raw pointer events for whichever handle was grabbed.
 */
export const SelectableLayer: React.FC<SelectableLayerProps> = ({
  transform,
  size,
  isSelected,
  isDragging,
  onStartDrag,
  onDelete,
  children,
}) => {
  return (
    <g transform={`translate(${transform.x} ${transform.y}) rotate(${transform.rotation})`}>
      <g onPointerDown={(e) => onStartDrag('move', e)} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        {children}
      </g>

      {isSelected && (
        <>
          <rect
            x={-size / 2}
            y={-size / 2}
            width={size}
            height={size}
            fill="transparent"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => onStartDrag('move', e)}
          />
          {/* rotate handle */}
          <line x1="0" y1={-size / 2} x2="0" y2={-size / 2 - 26} stroke="#ffffff" strokeWidth="1.5" />
          <circle
            cx="0"
            cy={-size / 2 - 26}
            r="7.5"
            fill="#ffffff"
            stroke="#C1222E"
            strokeWidth="2"
            style={{ cursor: 'grab' }}
            onPointerDown={(e) => onStartDrag('rotate', e)}
          />
          {/* resize handle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="7.5"
            fill="#ffffff"
            stroke="#C1222E"
            strokeWidth="2"
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={(e) => onStartDrag('resize', e)}
          />
          {/* delete handle */}
          <circle
            cx={-size / 2}
            cy={-size / 2}
            r="7.5"
            fill="#ffffff"
            stroke="#C1222E"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
          <text x={-size / 2} y={-size / 2 + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#C1222E" pointerEvents="none">
            ×
          </text>
        </>
      )}
    </g>
  );
};
