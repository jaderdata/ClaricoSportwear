'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Copy, Image as ImageIcon, Trash2, Type } from 'lucide-react';
import { DesignLayer } from '@/lib/design-lab/types';

interface LayersPanelProps {
  layers: DesignLayer[];
  selectedLayerId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ layers, selectedLayerId, onSelect, onReorder, onDuplicate, onDelete }) => {
  if (layers.length === 0) return null;

  // Topmost layer (highest zIndex) listed first, matching common design-tool conventions.
  const rows = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink">Layers ({layers.length})</label>
      <ul className="space-y-1.5">
        {rows.map((layer) => {
          const isSelected = layer.id === selectedLayerId;
          const label = layer.type === 'text' ? layer.text || 'Text' : 'Image';
          return (
            <li
              key={layer.id}
              className={`flex items-center gap-2 rounded-control border px-2.5 py-2 cursor-pointer transition-colors ${
                isSelected ? 'border-ink bg-paper-raised' : 'border-border-strong hover:border-ink'
              }`}
              onClick={() => onSelect(layer.id)}
            >
              {layer.type === 'text' ? (
                <Type className="size-4 text-ink-muted shrink-0" strokeWidth={1.75} />
              ) : (
                <ImageIcon className="size-4 text-ink-muted shrink-0" strokeWidth={1.75} />
              )}
              <span className="flex-1 truncate text-sm text-ink">{label}</span>
              <button
                type="button"
                title="Bring forward"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(layer.id, 'up');
                }}
                className="p-1 text-ink-muted hover:text-ink cursor-pointer"
              >
                <ArrowUp className="size-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                title="Send backward"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(layer.id, 'down');
                }}
                className="p-1 text-ink-muted hover:text-ink cursor-pointer"
              >
                <ArrowDown className="size-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                title="Duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(layer.id);
                }}
                className="p-1 text-ink-muted hover:text-ink cursor-pointer"
              >
                <Copy className="size-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(layer.id);
                }}
                className="p-1 text-ink-muted hover:text-accent cursor-pointer"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
