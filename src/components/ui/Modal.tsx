'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, maxWidth = 'max-w-2xl', ariaLabel }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start sm:items-center justify-center overflow-y-auto bg-ink/50 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} my-auto min-h-full sm:min-h-0 bg-paper-raised sm:rounded-panel shadow-[0_30px_80px_-24px_rgba(23,20,15,0.35)] border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="touch-target absolute top-3 right-3 sm:top-5 sm:right-5 z-10 inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="size-5" strokeWidth={1.75} />
        </button>
        {children}
      </div>
    </div>
  );
};
